#!/usr/bin/env python3
"""Recover rendered school notice pages for sites that require browser JS."""

from __future__ import annotations

import argparse
import asyncio
import importlib.util
import json
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from playwright.async_api import async_playwright
from scrapling.parser import Adaptor


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json-output", default="tmp/neis_homepage_notice_all_schools_probe.json")
    parser.add_argument("--office", action="append", default=[])
    parser.add_argument("--school", action="append", default=[])
    parser.add_argument("--status", action="append", default=[])
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--max-notice-pages", type=int, default=2)
    parser.add_argument("--timeout-ms", type=int, default=20000)
    parser.add_argument("--checkpoint-every", type=int, default=25)
    args = parser.parse_args()

    asyncio.run(recover(args))
    return 0


async def recover(args: argparse.Namespace) -> None:
    probe = load_probe_module()
    json_path = Path(args.json_output)
    report = json.loads(json_path.read_text(encoding="utf-8"))
    results = report["results"]
    target_offices = set(args.office or [])
    target_schools = set(args.school or [])
    target_statuses = set(args.status or ["no_notice_candidates", "found_notice_page"])
    target_indexes = [
        index for index, item in enumerate(results)
        if (not target_offices or item.get("officeCode") in target_offices)
        and (not target_schools or item.get("schoolName") in target_schools)
        and item.get("status") in target_statuses
    ]
    print(f"Playwright recovery targets: {len(target_indexes)}", file=sys.stderr)

    completed = 0
    lock = asyncio.Lock()
    semaphore = asyncio.Semaphore(args.workers)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        async def run_one(index: int) -> None:
            nonlocal completed
            async with semaphore:
                original = results[index]
                recovered = await recover_one(browser, probe, original, args)
                async with lock:
                    if recovered is not None:
                        results[index] = recovered
                    completed += 1
                    print(
                        f"[{completed}/{len(target_indexes)}] {original.get('schoolName')} "
                        f"{original.get('status')} -> {results[index].get('status')}",
                        file=sys.stderr,
                    )
                    if args.checkpoint_every and completed % args.checkpoint_every == 0:
                        write_report(json_path, report, probe)

        await asyncio.gather(*(run_one(index) for index in target_indexes))
        await browser.close()

    write_report(json_path, report, probe)


async def recover_one(browser: Any, probe: Any, item: dict[str, Any], args: argparse.Namespace) -> dict[str, Any] | None:
    page = await browser.new_page(ignore_https_errors=True, viewport={"width": 1280, "height": 900})
    try:
        response = await page.goto(item.get("homepage") or "", wait_until="domcontentloaded", timeout=args.timeout_ms)
        await settle_page(page, args.timeout_ms)
        final_url = page.url
        html = await page_content_after_navigation(page)
        rendered = Adaptor(html, url=final_url)
        links = probe.extract_links(rendered, final_url)
        notice_candidates = probe.rank_notice_candidates(links)
        notices = probe.extract_notice_items(rendered, final_url)
        notices.extend(probe.extract_dated_board_row_notice_items(rendered, final_url))
        fetched_notice_pages = []
        for candidate in notice_candidates[: args.max_notice_pages]:
            try:
                notice_response = await page.goto(candidate["url"], wait_until="domcontentloaded", timeout=args.timeout_ms)
                await settle_page(page, args.timeout_ms, delay_ms=1000)
                notice_url = page.url
                notice_page = Adaptor(await page_content_after_navigation(page), url=notice_url)
                fetched_notice_pages.append({**candidate, "status": notice_response.status if notice_response else None})
                notices.extend(probe.extract_notice_items(notice_page, notice_url))
                notices.extend(probe.extract_select_ntt_notice_items(notice_page, notice_url))
                notices.extend(probe.extract_cne_go_view_notice_items(notice_page, notice_url))
                notices.extend(probe.extract_dated_board_row_notice_items(notice_page, notice_url))
            except Exception as exc:  # noqa: BLE001 - record and continue with next candidate.
                fetched_notice_pages.append({**candidate, "status": "browser_fetch_error", "error": repr(exc)})
        deduped = probe.dedupe_notices(notices)[:10]
        status = "parsed_notices" if deduped else ("found_notice_page" if notice_candidates else item.get("status"))
        return {
            **item,
            "status": status,
            "homepageStatus": response.status if response else item.get("homepageStatus"),
            "resolvedHomepage": final_url,
            "linkCount": len(links),
            "noticeCandidates": notice_candidates[:10],
            "fetchedNoticePages": fetched_notice_pages,
            "notices": deduped,
            "browserRecovered": True,
            "browserRecoveryError": None,
        }
    except Exception as exc:  # noqa: BLE001
        return {**item, "browserRecoveryError": repr(exc)}
    finally:
        await page.close()


async def settle_page(page: Any, timeout_ms: int, delay_ms: int = 3000) -> None:
    await page.wait_for_timeout(delay_ms)
    parsed = urllib.parse.urlparse(page.url)
    query = urllib.parse.parse_qs(parsed.query)
    net_ret_url = (query.get("netRetUrl") or [""])[0]
    if "index.do" in parsed.path and net_ret_url:
        target = urllib.parse.urljoin(page.url, net_ret_url)
        await page.goto(target, wait_until="domcontentloaded", timeout=timeout_ms)
        await page.wait_for_timeout(delay_ms)


async def page_content_after_navigation(page: Any) -> str:
    for attempt in range(4):
        try:
            return await page.content()
        except Exception:
            if attempt == 3:
                raise
            await page.wait_for_timeout(1500)
    raise RuntimeError("unreachable")


def load_probe_module() -> Any:
    script_path = Path(__file__).with_name("neis_homepage_notice_probe.py")
    spec = importlib.util.spec_from_file_location("neis_homepage_notice_probe", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {script_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules["neis_homepage_notice_probe"] = module
    spec.loader.exec_module(module)
    return module


def write_report(json_path: Path, report: dict[str, Any], probe: Any) -> None:
    report["generatedAt"] = datetime.now(timezone.utc).isoformat()
    report["summary"] = probe.summarize(report["results"])
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md_output = report.get("query", {}).get("mdOutput") or "docs/neis_homepage_notice_all_schools_probe.md"
    Path(md_output).write_text(probe.render_markdown(report), encoding="utf-8")
    print(f"Wrote {json_path}", file=sys.stderr)
    print(f"Wrote {md_output}", file=sys.stderr)


if __name__ == "__main__":
    raise SystemExit(main())
