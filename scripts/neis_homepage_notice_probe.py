#!/usr/bin/env python3
"""Collect NEIS school homepages and probe notice parsing with Scrapling.

This is a coverage probe, not a promise that every school CMS has a stable
notice API. It records which schools have reachable homepages, which notice
candidate URLs were discovered, and whether recent-looking notice links could
be extracted from those candidate pages.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


NEIS_BASE_URL = "https://open.neis.go.kr/hub"
NEIS_OFFICE_CODES = (
    "B10",  # 서울특별시교육청
    "C10",  # 부산광역시교육청
    "D10",  # 대구광역시교육청
    "E10",  # 인천광역시교육청
    "F10",  # 광주광역시교육청
    "G10",  # 대전광역시교육청
    "H10",  # 울산광역시교육청
    "I10",  # 세종특별자치시교육청
    "J10",  # 경기도교육청
    "K10",  # 강원특별자치도교육청
    "M10",  # 충청북도교육청
    "N10",  # 충청남도교육청
    "P10",  # 전북특별자치도교육청
    "Q10",  # 전라남도교육청
    "R10",  # 경상북도교육청
    "S10",  # 경상남도교육청
    "T10",  # 제주특별자치도교육청
)
PRIMARY_NOTICE_TEXTS = ("공지사항", "학교공지", "알림사항", "학교소식", "새소식")
SECONDARY_NOTICE_TEXTS = (
    "가정통신문",
    "학부모회공지사항",
    "과학중점공지",
    "급식 공지사항",
    "급식게시판",
    "시간표",
    "학사일정",
    "일과운영",
    "게시판",
)
CONTAINER_NOTICE_TEXTS = ("알림마당", "소식마당", "학교마당", "열린마당")
NOTICE_KEYWORDS = PRIMARY_NOTICE_TEXTS + SECONDARY_NOTICE_TEXTS + CONTAINER_NOTICE_TEXTS + ("공지", "알림")
NOTICE_URL_HINTS = ("notice", "gongji", "bbs", "board", "bd", "alim", "noti")
STRUCTURED_NOTICE_URL_HINTS = (
    "selectnttlist.do",
    "selectnttinfo.do",
    "selectfoodmenuview.do",
    "selectschdulmainlist.do",
)
DETAIL_URL_HINTS = ("read", "view", "article", "ntt", "bbs", "board", "seq", "detail", "select")
MENU_NOISE_TERMS = (
    "학교장",
    "인사말",
    "학교교육목표",
    "교육목표",
    "학교상징",
    "학교연혁",
    "찾아오시는",
    "학교소개",
    "교직원",
    "학교현황",
    "시설현황",
    "오시는 길",
    "사이트맵",
    "전체메뉴",
)
NAV_ONLY_TITLES = set(PRIMARY_NOTICE_TEXTS + SECONDARY_NOTICE_TEXTS + CONTAINER_NOTICE_TEXTS + ("공지", "알림", "게시판"))
STRONG_NOTICE_TITLE_TERMS = (
    "안내",
    "공지",
    "공고",
    "모집",
    "신청",
    "운영",
    "가정통신문",
    "학부모",
    "교육",
    "시험",
    "평가",
    "일정",
    "수업",
    "방과후",
    "급식",
    "시간표",
    "학사일정",
    "일과",
    "체험",
    "설명회",
    "참가",
)
SKIP_LINK_PATTERNS = ("javascript:", "#", "mailto:", "tel:")
DATE_RE = re.compile(r"(20\d{2})[.\-/년 ]\s*(\d{1,2})[.\-/월 ]\s*(\d{1,2})")
SHORT_DATE_RE = re.compile(r"\b(\d{2})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})\b")


@dataclass(frozen=True)
class SchoolHomepage:
    office_code: str
    office_name: str
    school_code: str
    school_name: str
    school_kind: str
    location: str
    homepage: str


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--office", action="append", default=[], help="NEIS office code, repeatable. Default: B10")
    parser.add_argument("--all-offices", action="store_true", help="Probe every NEIS office code.")
    parser.add_argument("--school-kind", default="", help="학교종류명 filter, e.g. 초등학교/중학교/고등학교/특수학교")
    parser.add_argument("--limit", type=int, default=20, help="Max homepages to probe after NEIS collection. 0 means all collected.")
    parser.add_argument("--max-notice-pages", type=int, default=2, help="Max notice candidate pages to fetch per school.")
    parser.add_argument("--fetch-timeout", type=float, default=20, help="HTTP timeout in seconds per homepage or notice fetch.")
    parser.add_argument("--sleep", type=float, default=0.2)
    parser.add_argument("--json-output", default="tmp/neis_homepage_notice_probe.json")
    parser.add_argument("--md-output", default="docs/neis_homepage_notice_probe.md")
    parser.add_argument("--resume", action="store_true", help="Reuse existing json-output results by school code.")
    parser.add_argument("--checkpoint-every", type=int, default=1, help="Write outputs after this many newly probed schools.")
    parser.add_argument("--workers", type=int, default=1, help="Parallel school probes. Each worker creates its own Scrapling session.")
    parser.add_argument("--max-in-flight", type=int, default=0, help="Max submitted futures when workers > 1. Default: workers * 4.")
    parser.add_argument("--quiet-skips", action="store_true", help="Do not print every skipped school when --resume is used.")
    parser.add_argument("--stop-after-new", type=int, default=0, help="Stop after this many newly probed schools. 0 means no chunk limit.")
    parser.add_argument("--retry-status", action="append", default=[], help="When resuming, discard and retry existing results with this status.")
    parser.add_argument("--retry-office", action="append", default=[], help="Limit --retry-status to these office codes.")
    args = parser.parse_args()

    api_key = os.environ.get("KEDU_INFO_KEY")
    if not api_key:
        print("KEDU_INFO_KEY is required. Source .env first.", file=sys.stderr)
        return 2

    try:
        from scrapling.fetchers import FetcherSession
    except Exception as exc:  # noqa: BLE001 - user-facing dependency check.
        print("Scrapling fetchers are required. Run with: uv run --with 'scrapling[fetchers]' python3 scripts/neis_homepage_notice_probe.py", file=sys.stderr)
        print(f"Import error: {exc!r}", file=sys.stderr)
        return 2

    offices = list(NEIS_OFFICE_CODES) if args.all_offices else (args.office or ["B10"])
    schools = []
    for office in offices:
        schools.extend(collect_school_homepages(api_key, office, args.school_kind))
    if args.limit:
        schools = schools[:args.limit]

    results = load_existing_results(Path(args.json_output)) if args.resume else []
    retry_statuses = set(args.retry_status or [])
    if retry_statuses:
        retry_offices = set(args.retry_office or [])
        def should_retry_existing(item: dict[str, Any]) -> bool:
            if item.get("status") not in retry_statuses:
                return False
            return not retry_offices or item.get("officeCode") in retry_offices

        retry_count = sum(1 for item in results if should_retry_existing(item))
        results = [item for item in results if not should_retry_existing(item)]
        print(f"Retrying {retry_count} existing results with statuses: {sorted(retry_statuses)}", file=sys.stderr)
    done_school_keys = {school_identity_from_result(item) for item in results}
    pending_schools = []
    for index, school in enumerate(schools, start=1):
        if school_identity(school) in done_school_keys:
            if not args.quiet_skips:
                print(f"[{index}/{len(schools)}] skip {school.school_name} {school.homepage}", file=sys.stderr)
            continue
        pending_schools.append((index, school))

    completed_since_checkpoint = 0
    total_new_completed = 0
    if args.workers <= 1:
        with FetcherSession(impersonate="chrome") as session:
            for index, school in pending_schools:
                if args.stop_after_new and total_new_completed >= args.stop_after_new:
                    break
                print(f"[{index}/{len(schools)}] {school.school_name} {school.homepage}", file=sys.stderr)
                result = probe_school_homepage(session, school, args.max_notice_pages, args.fetch_timeout)
                results.append(result)
                done_school_keys.add(school_identity(school))
                completed_since_checkpoint += 1
                total_new_completed += 1
                if args.checkpoint_every and completed_since_checkpoint >= args.checkpoint_every:
                    write_report(args, offices, results, len(schools))
                    completed_since_checkpoint = 0
                time.sleep(args.sleep)
    else:
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=args.workers)
        max_in_flight = args.max_in_flight or args.workers * 4
        pending_iter = iter(pending_schools)
        future_to_school: dict[concurrent.futures.Future, tuple[int, SchoolHomepage]] = {}

        def submit_next() -> bool:
            if args.stop_after_new and total_new_completed + len(future_to_school) >= args.stop_after_new:
                return False
            try:
                index, school = next(pending_iter)
            except StopIteration:
                return False
            future = executor.submit(probe_school_homepage_in_new_session, school, args.max_notice_pages, args.fetch_timeout)
            future_to_school[future] = (index, school)
            return True

        for _ in range(max_in_flight):
            if not submit_next():
                break

        interrupted = False
        try:
            while future_to_school:
                done, _ = concurrent.futures.wait(
                    future_to_school,
                    return_when=concurrent.futures.FIRST_COMPLETED,
                )
                for future in done:
                    index, school = future_to_school.pop(future)
                    try:
                        result = future.result()
                    except Exception as exc:  # noqa: BLE001 - one school must not stop all-school probe.
                        result = {
                            "officeCode": school.office_code,
                            "officeName": school.office_name,
                            "schoolCode": school.school_code,
                            "schoolName": school.school_name,
                            "schoolKind": school.school_kind,
                            "location": school.location,
                            "homepage": school.homepage,
                            "status": "probe_error",
                            "error": repr(exc),
                            "noticeCandidates": [],
                            "notices": [],
                        }
                    print(f"[{index}/{len(schools)}] done {school.school_name} status={result.get('status')}", file=sys.stderr)
                    results.append(result)
                    done_school_keys.add(school_identity(school))
                    completed_since_checkpoint += 1
                    total_new_completed += 1
                    if args.checkpoint_every and completed_since_checkpoint >= args.checkpoint_every:
                        write_report(args, offices, results, len(schools))
                        completed_since_checkpoint = 0
                    if args.sleep:
                        time.sleep(args.sleep)
                    submit_next()
        except KeyboardInterrupt:
            interrupted = True
            for future in future_to_school:
                future.cancel()
            write_report(args, offices, results, len(schools))
            executor.shutdown(wait=False, cancel_futures=True)
            raise
        finally:
            if not interrupted:
                executor.shutdown(wait=True, cancel_futures=True)

    write_report(args, offices, results, len(schools))
    print(json.dumps(summarize(results), ensure_ascii=False))
    return 0


def build_report(
    args: argparse.Namespace,
    offices: list[str],
    results: list[dict[str, Any]],
    target_school_count: int | None = None,
) -> dict[str, Any]:
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "query": {
            "offices": offices,
            "allOffices": args.all_offices,
            "schoolKind": args.school_kind or None,
            "limit": args.limit,
            "targetSchoolCount": target_school_count,
            "maxNoticePages": args.max_notice_pages,
            "fetchTimeout": args.fetch_timeout,
            "workers": args.workers,
            "stopAfterNew": args.stop_after_new,
            "maxInFlight": args.max_in_flight,
            "retryStatus": args.retry_status,
            "retryOffice": args.retry_office,
        },
        "summary": summarize(results),
        "results": results,
    }


def write_report(
    args: argparse.Namespace,
    offices: list[str],
    results: list[dict[str, Any]],
    target_school_count: int | None = None,
) -> None:
    report = build_report(args, offices, results, target_school_count)
    json_path = Path(args.json_output)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    md_path = Path(args.md_output)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.write_text(render_markdown(report), encoding="utf-8")

    print(f"Wrote {json_path}", file=sys.stderr)
    print(f"Wrote {md_path}", file=sys.stderr)


def load_existing_results(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return []
    results = payload.get("results")
    return results if isinstance(results, list) else []


def school_identity(school: SchoolHomepage) -> tuple[str, str, str, str, str]:
    return (
        school.office_code.strip(),
        school.school_code.strip(),
        school.school_name.strip(),
        school.school_kind.strip(),
        school.homepage.strip(),
    )


def school_identity_from_result(item: dict[str, Any]) -> tuple[str, str, str, str, str]:
    return (
        str(item.get("officeCode") or "").strip(),
        str(item.get("schoolCode") or "").strip(),
        str(item.get("schoolName") or "").strip(),
        str(item.get("schoolKind") or "").strip(),
        str(item.get("homepage") or "").strip(),
    )


def probe_school_homepage_in_new_session(school: SchoolHomepage, max_notice_pages: int, fetch_timeout: float) -> dict[str, Any]:
    from scrapling.fetchers import FetcherSession

    with FetcherSession(impersonate="chrome") as session:
        return probe_school_homepage(session, school, max_notice_pages, fetch_timeout)


def collect_school_homepages(api_key: str, office_code: str, school_kind: str = "") -> list[SchoolHomepage]:
    page_index = 1
    page_size = 1000
    schools: list[SchoolHomepage] = []
    while True:
        params = {
            "KEY": api_key,
            "Type": "json",
            "pIndex": str(page_index),
            "pSize": str(page_size),
            "ATPT_OFCDC_SC_CODE": office_code,
        }
        if school_kind:
            params["SCHUL_KND_SC_NM"] = school_kind
        payload = neis_get("schoolInfo", params)
        rows = extract_neis_rows(payload, "schoolInfo")
        for row in rows:
            homepage = normalize_homepage(row.get("HMPG_ADRES"))
            if not homepage:
                continue
            schools.append(SchoolHomepage(
                office_code=row.get("ATPT_OFCDC_SC_CODE") or "",
                office_name=row.get("ATPT_OFCDC_SC_NM") or "",
                school_code=row.get("SD_SCHUL_CODE") or "",
                school_name=row.get("SCHUL_NM") or "",
                school_kind=row.get("SCHUL_KND_SC_NM") or "",
                location=row.get("LCTN_SC_NM") or "",
                homepage=homepage,
            ))
        total = extract_total_count(payload, "schoolInfo")
        if not rows or total is None or page_index * page_size >= total:
            break
        page_index += 1
    return schools


def probe_school_homepage(session: Any, school: SchoolHomepage, max_notice_pages: int, fetch_timeout: float = 20) -> dict[str, Any]:
    base = {
        "officeCode": school.office_code,
        "officeName": school.office_name,
        "schoolCode": school.school_code,
        "schoolName": school.school_name,
        "schoolKind": school.school_kind,
        "location": school.location,
        "homepage": school.homepage,
    }
    page, homepage_error = fetch_with_http_fallback(session, school.homepage, fetch_timeout)
    if page is None:
        return {**base, "status": "homepage_fetch_error", "error": homepage_error, "noticeCandidates": [], "notices": []}

    homepage_status = getattr(page, "status", None)
    links = extract_links(page, school.homepage)
    resolved_homepage = str(getattr(page, "url", "") or school.homepage)
    if not links:
        variant_queue = [
            *homepage_redirect_urls(page, resolved_homepage),
            *homepage_variant_urls(resolved_homepage),
        ]
        seen_variants = set()
        for variant_url in variant_queue:
            if variant_url in seen_variants:
                continue
            seen_variants.add(variant_url)
            variant_page, _ = fetch_with_http_fallback(session, variant_url, fetch_timeout)
            if variant_page is None:
                continue
            variant_links = extract_links(variant_page, variant_url)
            if not variant_links:
                for nested_url in homepage_redirect_urls(variant_page, variant_url):
                    if nested_url not in seen_variants:
                        variant_queue.append(nested_url)
                for nested_url in homepage_variant_urls(variant_url):
                    if nested_url not in seen_variants:
                        variant_queue.append(nested_url)
                continue
            page = variant_page
            links = variant_links
            resolved_homepage = str(getattr(variant_page, "url", "") or variant_url)
            break
    notice_candidates = rank_notice_candidates(links)
    notices: list[dict[str, Any]] = extract_notice_items(page, resolved_homepage)
    notices.extend(extract_dated_board_row_notice_items(page, resolved_homepage))
    fetched_notice_pages = []
    candidate_queue = [dict(candidate) for candidate in notice_candidates]
    fetched_urls = set()
    for candidate in candidate_queue:
        if len(fetched_notice_pages) >= max_notice_pages:
            break
        if candidate["url"] in fetched_urls:
            continue
        fetched_urls.add(candidate["url"])
        notice_page, notice_error = fetch_with_http_fallback(session, candidate["url"], fetch_timeout)
        if notice_page is None:
            fetched_notice_pages.append({**candidate, "status": "fetch_error", "error": notice_error})
            continue
        fetched_notice_pages.append({**candidate, "status": getattr(notice_page, "status", None)})
        notices.extend(extract_notice_items(notice_page, candidate["url"]))
        notices.extend(extract_select_ntt_notice_items(notice_page, candidate["url"]))
        notices.extend(extract_cne_go_view_notice_items(notice_page, candidate["url"]))
        notices.extend(extract_dggb_ajax_notice_items(notice_page, candidate["url"], fetch_timeout))
        notices.extend(extract_dated_board_row_notice_items(notice_page, candidate["url"]))
        nested_candidates = rank_notice_candidates(extract_links(notice_page, candidate["url"]))
        known_urls = {item["url"] for item in candidate_queue}
        for nested in nested_candidates:
            if nested["url"] not in known_urls and nested["url"] not in fetched_urls:
                candidate_queue.append({**nested, "discoveredFrom": candidate["url"]})
                known_urls.add(nested["url"])

    deduped_notices = dedupe_notices(notices)[:10]
    status = "parsed_notices" if deduped_notices else ("found_notice_page" if notice_candidates else "no_notice_candidates")
    return {
        **base,
        "status": status,
        "homepageStatus": homepage_status,
        "resolvedHomepage": resolved_homepage,
        "linkCount": len(links),
        "noticeCandidates": notice_candidates[:10],
        "fetchedNoticePages": fetched_notice_pages,
        "notices": deduped_notices,
    }


def fetch_with_http_fallback(session: Any, url: str, fetch_timeout: float) -> tuple[Any | None, str | None]:
    errors = []
    fallback_url = https_to_http(url)
    if prefers_urllib_fetch(url):
        urllib_page, urllib_error = fetch_with_urllib(url, fetch_timeout)
        if urllib_page is not None:
            return urllib_page, None
        errors.append(f"urllib_preferred={urllib_error}")
        if fallback_url != url:
            urllib_page, urllib_error = fetch_with_urllib(fallback_url, fetch_timeout)
            if urllib_page is not None:
                return urllib_page, None
            errors.append(f"urllib_preferred_http_fallback={urllib_error}")

    try:
        return session.get(url, stealthy_headers=True, timeout=fetch_timeout), None
    except Exception as exc:  # noqa: BLE001 - fallback and record the final failure.
        first_error = repr(exc)
        errors.append(first_error)
    if fallback_url != url:
        try:
            return session.get(fallback_url, stealthy_headers=True, timeout=fetch_timeout), None
        except Exception as exc:  # noqa: BLE001
            errors.append(f"http_fallback={repr(exc)}")

    urllib_page, urllib_error = fetch_with_urllib(url, fetch_timeout)
    if urllib_page is not None:
        return urllib_page, None
    errors.append(f"urllib_fallback={urllib_error}")

    if fallback_url != url:
        urllib_page, urllib_error = fetch_with_urllib(fallback_url, fetch_timeout)
        if urllib_page is not None:
            return urllib_page, None
        errors.append(f"urllib_http_fallback={urllib_error}")

    return None, "; ".join(error for error in errors if error)


def prefers_urllib_fetch(url: str) -> bool:
    host = (urllib.parse.urlparse(url).hostname or "").lower()
    urllib_first_suffixes = (
        ".gwe.go.kr",
        ".cnees.kr",
        ".cnems.kr",
        ".cnehs.kr",
        ".caees.kr",
        ".caems.kr",
        ".caehs.kr",
        ".caesc.kr",
        ".cnesc.kr",
        ".es.kr",
        ".ms.kr",
        ".hs.kr",
    )
    return ".gwe." in host or any(host.endswith(suffix) for suffix in urllib_first_suffixes)


def fetch_with_urllib(url: str, fetch_timeout: float) -> tuple[Any | None, str | None]:
    try:
        from scrapling.parser import Adaptor
    except Exception as exc:  # noqa: BLE001
        return None, repr(exc)

    try:
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/125.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            },
        )
        with urllib.request.urlopen(request, timeout=fetch_timeout) as response:
            content = response.read()
            final_url = response.geturl()
            content_type = response.headers.get_content_charset() or "utf-8"
    except Exception as exc:  # noqa: BLE001
        return None, repr(exc)

    try:
        return Adaptor(content, url=final_url, encoding=best_html_encoding(content, content_type)), None
    except Exception as exc:  # noqa: BLE001
        return None, repr(exc)


def best_html_encoding(content: bytes, declared_encoding: str) -> str:
    """Prefer declared charset, but recover Korean legacy pages mislabeled as UTF-8."""
    candidates = [declared_encoding or "utf-8", "utf-8", "cp949", "euc-kr"]
    best_encoding = candidates[0]
    best_badness: tuple[int, int] | None = None
    for encoding in dict.fromkeys(candidates):
        try:
            text = content.decode(encoding, errors="replace")
        except LookupError:
            continue
        badness = (text.count("\ufffd"), text.count("�"))
        if best_badness is None or badness < best_badness:
            best_badness = badness
            best_encoding = encoding
    return best_encoding


def https_to_http(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https":
        return url
    return urllib.parse.urlunparse(parsed._replace(scheme="http"))


def homepage_variant_urls(url: str) -> list[str]:
    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname or ""
    if parsed.path and parsed.path not in {"", "/"}:
        if host == "school.busanedu.net":
            base = urllib.parse.urlunparse(parsed._replace(path="", params="", query="", fragment="")).rstrip("/")
            path = parsed.path.rstrip("/")
            path_parts = [part for part in path.split("/") if part]
            if len(path_parts) != 1 or path_parts[0].endswith(".do"):
                return []
            return [f"{base}{path}/main.do", f"{base}{path}/intro.do"]
        return []
    if not host or host.startswith("www."):
        base = urllib.parse.urlunparse(parsed._replace(path="", params="", query="", fragment="")).rstrip("/")
        return [f"{base}/main.do"] if host else []
    slug = host.split(".", 1)[0]
    if not slug or slug in {"school", "cms"}:
        return []
    base = urllib.parse.urlunparse(parsed._replace(path="", params="", query="", fragment="")).rstrip("/")
    return [f"{base}/main.do", f"{base}/{slug}/main.do"]


def homepage_redirect_urls(page: Any, base_url: str) -> list[str]:
    html = str(getattr(page, "html_content", "") or "")
    redirects = []
    patterns = (
        r"(?:window\.)?location(?:\.href)?\s*=\s*['\"]([^'\"]+)['\"]",
        r"<meta[^>]+http-equiv=['\"]?refresh['\"]?[^>]+content=['\"][^'\"]*url=([^'\"]+)['\"]",
    )
    for pattern in patterns:
        for match in re.finditer(pattern, html, flags=re.IGNORECASE):
            target = match.group(1).strip()
            if target and not target.lower().startswith(("javascript:", "#")):
                redirects.append(urllib.parse.urljoin(base_url, target))
    return list(dict.fromkeys(redirects))


def neis_get(dataset: str, params: dict[str, str]) -> dict[str, Any]:
    url = f"{NEIS_BASE_URL}/{dataset}?{urllib.parse.urlencode(params)}"
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:  # noqa: BLE001 - public API occasionally closes keep-alive early.
            last_error = exc
            if attempt < 2:
                time.sleep(1 + attempt)
    assert last_error is not None
    raise last_error


def extract_neis_rows(payload: dict[str, Any], dataset: str) -> list[dict[str, Any]]:
    for item in payload.get(dataset, []):
        if isinstance(item, dict) and isinstance(item.get("row"), list):
            return item["row"]
    return []


def extract_total_count(payload: dict[str, Any], dataset: str) -> int | None:
    for item in payload.get(dataset, []):
        if isinstance(item, dict) and isinstance(item.get("head"), list):
            for head in item["head"]:
                if isinstance(head, dict) and "list_total_count" in head:
                    return int(head["list_total_count"])
    return None


def normalize_homepage(value: Any) -> str:
    text = str(value or "").replace("\ufeff", "").strip()
    if not text:
        return ""
    embedded_url = re.search(r"https?://.+", text)
    if embedded_url:
        text = embedded_url.group(0).strip()
    if not text.startswith(("http://", "https://")):
        text = f"https://{text}"
    return text


def extract_links(page: Any, base_url: str) -> list[dict[str, str]]:
    links = []
    try:
        anchors = page.css("a[href]")
    except Exception:
        return links
    for anchor in anchors:
        href = str(anchor.attrib.get("href") or "").strip()
        text = extract_anchor_text(anchor)
        if not href or any(href.lower().startswith(prefix) for prefix in SKIP_LINK_PATTERNS):
            continue
        url = urllib.parse.urljoin(base_url, href)
        links.append({"text": text, "url": url, "href": href})
    return links


def rank_notice_candidates(links: list[dict[str, str]]) -> list[dict[str, Any]]:
    candidates = []
    seen = set()
    for link in links:
        text = clean_text(link["text"])
        compact_text = re.sub(r"\s+", "", text)
        haystack = f"{text} {link['url']}".lower()
        score = score_notice_candidate(text, compact_text, haystack)
        if score <= 0 or link["url"] in seen:
            continue
        seen.add(link["url"])
        candidates.append({**link, "score": score})
    return sorted(candidates, key=lambda item: (-item["score"], len(item["url"])))


def score_notice_candidate(text: str, compact_text: str, haystack: str) -> int:
    score = 0
    if compact_text in PRIMARY_NOTICE_TEXTS:
        score += 80
    elif compact_text in SECONDARY_NOTICE_TEXTS:
        score += 55
    elif compact_text in CONTAINER_NOTICE_TEXTS:
        score += 15

    for keyword in PRIMARY_NOTICE_TEXTS:
        if keyword in compact_text:
            score += 30
    for keyword in SECONDARY_NOTICE_TEXTS:
        if keyword in compact_text:
            score += 20
    for keyword in CONTAINER_NOTICE_TEXTS:
        if keyword in compact_text:
            score += 5
    for keyword in ("공지", "알림"):
        if keyword in compact_text:
            score += 8
    for hint in NOTICE_URL_HINTS:
        if hint in haystack:
            score += 4
    for hint in STRUCTURED_NOTICE_URL_HINTS:
        if hint in haystack:
            score += 45
    if "selectfoodmenuview.do" in haystack:
        score += 20
    if "selectschdulmainlist.do" in haystack:
        score += 20
    if any(term in text for term in MENU_NOISE_TERMS):
        score -= 60
    if not text:
        score -= 10
    if len(text) > 80:
        score -= 10
    return score


def extract_notice_items(page: Any, source_url: str) -> list[dict[str, Any]]:
    items = []
    for link in extract_links(page, source_url):
        title = clean_text(link["text"])
        if not is_notice_like_title(title, link["url"]):
            continue
        items.append({
            "title": title,
            "url": link["url"],
            "date": extract_date(title),
            "sourceUrl": source_url,
        })
    return items


def extract_select_ntt_notice_items(page: Any, source_url: str) -> list[dict[str, Any]]:
    """Extract modern school portal rows whose title anchors carry data-id."""
    if "selectNttList.do" not in source_url:
        return []
    parsed = urllib.parse.urlparse(source_url)
    query = urllib.parse.parse_qs(parsed.query)
    mi = (query.get("mi") or [""])[0]
    bbs_id = (query.get("bbsId") or [""])[0]
    if not mi or not bbs_id:
        return []
    try:
        anchors = page.css("a[data-id]")
    except Exception:
        return []

    items = []
    for anchor in anchors:
        ntt_sn = str(anchor.attrib.get("data-id") or "").strip()
        title = extract_anchor_text(anchor)
        if not ntt_sn or not is_board_row_title(title):
            continue
        try:
            row = anchor.find_ancestor(lambda node: getattr(node, "tag", "") == "tr")
        except Exception:
            row = None
        if row is not None and hasattr(row, "get_all_text"):
            row_text = clean_text(row.get_all_text())
        else:
            row_text = title
        detail_query = {
            "mi": mi,
            "bbsId": bbs_id,
            "nttSn": ntt_sn,
        }
        detail_path = parsed.path.replace("selectNttList.do", "selectNttInfo.do")
        detail_url = urllib.parse.urlunparse(parsed._replace(path=detail_path, query=urllib.parse.urlencode(detail_query)))
        items.append({
            "title": title,
            "url": detail_url,
            "date": extract_date(row_text),
            "sourceUrl": source_url,
            "bbsId": bbs_id,
            "nttSn": ntt_sn,
            "extractor": "select_ntt_data_id",
        })
    return items


def extract_cne_go_view_notice_items(page: Any, source_url: str) -> list[dict[str, Any]]:
    """Extract old CNE/GWE boardCnts list rows that navigate via goView()."""
    if "boardCnts/list.do" not in source_url:
        return []
    try:
        anchors = page.css("a[onclick]")
    except Exception:
        return []

    items = []
    for anchor in anchors:
        title = extract_anchor_text(anchor)
        onclick = str(anchor.attrib.get("onclick") or "")
        match = re.search(r"\bgoViews?\(([^)]*)\)", onclick)
        if not match or not is_board_row_title(title):
            continue
        args = re.findall(r"'([^']*)'", match.group(1))
        if len(args) < 7:
            continue
        board_id, view_board_id, board_seq, lev, _sec_yn, status_yn, page_no = args[:7]
        if not board_id or not view_board_id or not board_seq:
            continue
        try:
            row = anchor.find_ancestor(lambda node: getattr(node, "tag", "") == "tr")
        except Exception:
            row = None
        if row is not None and hasattr(row, "get_all_text"):
            row_text = clean_text(row.get_all_text())
        else:
            row_text = clean_text(getattr(row, "text", ""))
        query = {
            "boardID": board_id,
            "viewBoardID": view_board_id,
            "boardSeq": board_seq,
            "lev": lev or "0",
            "action": "view",
            "statusYN": status_yn or "W",
            "page": page_no or "1",
        }
        site_code = urllib.parse.parse_qs(urllib.parse.urlparse(source_url).query).get("s", [""])[0]
        if site_code:
            query["s"] = site_code
        items.append({
            "title": title,
            "url": urllib.parse.urljoin(source_url, f"/boardCnts/updateCnt.do?{urllib.parse.urlencode(query)}"),
            "date": extract_date(row_text),
            "sourceUrl": source_url,
            "boardID": board_id,
            "boardSeq": board_seq,
            "extractor": "boardcnts_go_view",
        })
    return items


def extract_dggb_ajax_notice_items(page: Any, source_url: str, fetch_timeout: float = 20) -> list[dict[str, Any]]:
    form_data = extract_form_inputs(page, "form#boardFrm input[name]")
    if not form_data.get("bbsId") or not form_data.get("bbsTyCode"):
        return []
    try:
        from curl_cffi import requests
        from scrapling.parser import Adaptor
    except Exception:
        return []

    bbs_type = form_data.get("bbsTyCode", "")
    if bbs_type in {"image", "vido"}:
        ajax_path = "/dggb/module/board/boardMltmd/selectBoardListAjax.do"
    else:
        ajax_path = "/dggb/module/board/selectBoardListAjax.do"

    try:
        page_url = str(getattr(page, "url", "") or source_url)
        ajax_url = urllib.parse.urljoin(page_url, ajax_path)
        http = requests.Session(impersonate="chrome")
        host = urllib.parse.urlparse(page_url).hostname or ""
        for name, value in getattr(page, "cookies", {}).items():
            http.cookies.set(name, value, domain=host)
        if not getattr(page, "cookies", {}):
            http.get(page_url, headers={"Referer": urllib.parse.urljoin(page_url, "/")}, timeout=fetch_timeout)
        response = http.post(
            ajax_url,
            data=form_data,
            headers={"Referer": page_url, "X-Requested-With": "XMLHttpRequest"},
            timeout=fetch_timeout,
        )
    except Exception:
        return []

    root = Adaptor(response.text)
    items = []
    for anchor in root.css("a[onclick]"):
        title = clean_text(getattr(anchor, "text", ""))
        onclick = str(anchor.attrib.get("onclick") or "")
        match = re.search(r"fnView\('([^']+)'\s*,\s*'([^']+)'\)", onclick)
        if not match or not is_notice_like_ajax_title(title):
            continue
        bbs_id, ntt_id = match.groups()
        try:
            row = anchor.find_ancestor(lambda node: getattr(node, "tag", "") == "tr")
        except Exception:
            row = None
        if row is not None and hasattr(row, "get_all_text"):
            row_text = clean_text(row.get_all_text())
        else:
            row_text = clean_text(getattr(row, "text", ""))
        items.append({
            "title": title,
            "url": f"{source_url}#bbsId={urllib.parse.quote(bbs_id)}&nttId={urllib.parse.quote(ntt_id)}",
            "date": extract_date(row_text),
            "sourceUrl": source_url,
            "bbsId": bbs_id,
            "nttId": ntt_id,
            "extractor": "dggb_ajax",
        })
    return items


def extract_dated_board_row_notice_items(page: Any, source_url: str) -> list[dict[str, Any]]:
    """Extract generic dated rows from already-selected board/list pages."""
    if not is_high_confidence_board_page(source_url):
        return []
    try:
        rows = [*page.css("tr"), *page.css("li")]
    except Exception:
        return []

    items = []
    for row in rows:
        if not hasattr(row, "get_all_text"):
            continue
        row_text = clean_text(row.get_all_text())
        if len(row_text) > 500:
            continue
        date = extract_date(row_text)
        if not date:
            continue
        try:
            anchors = row.css("a")
        except Exception:
            anchors = []
        anchor = first_title_anchor(anchors)
        if anchor is None:
            continue
        title = extract_anchor_text(anchor)
        if not is_board_row_title(title):
            continue
        href = str(anchor.attrib.get("href") or "").strip()
        onclick = str(anchor.attrib.get("onclick") or "").strip()
        url = generic_board_detail_url(source_url, href, onclick)
        if not url:
            continue
        items.append({
            "title": title,
            "url": url,
            "date": date,
            "sourceUrl": source_url,
            "extractor": "dated_board_row",
        })
    return items


def is_high_confidence_board_page(source_url: str) -> bool:
    parsed = urllib.parse.urlparse(source_url)
    query = urllib.parse.parse_qs(parsed.query)
    url_lower = source_url.lower()
    if query.get("master") == ["bbs"] and query.get("act") == ["list"]:
        return True
    if query.get("c"):
        return True
    return any(hint in url_lower for hint in (
        "board.do",
        "board.php",
        "board_mode=",
        "cmn0101s.aspx",
        "/m010301/",
        "menu_no=",
    ))


def first_title_anchor(anchors: list[Any]) -> Any | None:
    for anchor in anchors:
        title = extract_anchor_text(anchor)
        if is_board_row_title(title) and re.search(r"[가-힣A-Za-z0-9]", title):
            return anchor
    return None


def generic_board_detail_url(source_url: str, href: str, onclick: str) -> str | None:
    if href and not any(href.lower().startswith(prefix) for prefix in SKIP_LINK_PATTERNS):
        return urllib.parse.urljoin(source_url, href)
    if onclick:
        board_detail = re.search(r"fn_board_detail\('([^']+)'\)", onclick)
        if board_detail:
            return f"{source_url}#boardNo={urllib.parse.quote(board_detail.group(1))}"
        quoted_args = re.findall(r"'([^']+)'", onclick)
        if quoted_args:
            return f"{source_url}#onclick={urllib.parse.quote('|'.join(quoted_args[:4]))}"
    return None


def extract_form_inputs(page: Any, selector: str) -> dict[str, str]:
    try:
        inputs = page.css(selector)
    except Exception:
        return {}
    data = {}
    for node in inputs:
        name = str(node.attrib.get("name") or "")
        if name:
            data[name] = str(node.attrib.get("value") or "")
    return data


def is_notice_like_ajax_title(title: str) -> bool:
    if len(title) < 5 or len(title) > 160:
        return False
    if any(term in title for term in MENU_NOISE_TERMS):
        return False
    low = title.lower()
    if any(word in low for word in ("로그인", "회원가입", "사이트맵", "개인정보", "저작권", "이메일")):
        return False
    return bool(extract_date(title) or any(keyword in title for keyword in STRONG_NOTICE_TITLE_TERMS))


def is_board_row_title(title: str) -> bool:
    if len(title) < 3 or len(title) > 180:
        return False
    compact_title = re.sub(r"\s+", "", title)
    if compact_title in NAV_ONLY_TITLES:
        return False
    low = title.lower()
    noisy = ("로그인", "회원가입", "사이트맵", "개인정보", "저작권", "이메일", "메뉴", "검색", "닫기")
    if any(word in low for word in noisy):
        return False
    return not any(term in title for term in MENU_NOISE_TERMS)


def is_notice_like_title(title: str, url: str) -> bool:
    if len(title) < 5 or len(title) > 160:
        return False
    compact_title = re.sub(r"\s+", "", title)
    if compact_title in NAV_ONLY_TITLES:
        return False
    low = title.lower()
    noisy = ("로그인", "회원가입", "사이트맵", "개인정보", "저작권", "이메일", "메뉴", "검색", "닫기")
    if any(word in low for word in noisy):
        return False
    if any(term in title for term in MENU_NOISE_TERMS):
        return False
    url_lower = url.lower()
    is_menu_url = any(hint in url_lower for hint in (
        "selectnttlist.do",
        "submenu.do",
        "menu",
        "list.action",
        "listajax.do",
        "iframebbslist",
    ))
    if extract_date(title):
        has_detail_identifier = any(identifier in url_lower for identifier in ("boardno=", "uid=", "bbs_seq=", "bno="))
        return not is_menu_url or has_detail_identifier
    has_strong_title = any(keyword in title for keyword in STRONG_NOTICE_TITLE_TERMS)
    has_detail_url = any(hint in url_lower for hint in DETAIL_URL_HINTS) and not is_menu_url
    return has_strong_title and has_detail_url


def extract_date(text: str) -> str | None:
    match = DATE_RE.search(text)
    if match:
        year, month, day = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
    match = SHORT_DATE_RE.search(text)
    if not match:
        return None
    short_year, month, day = match.groups()
    year = f"20{short_year}"
    return f"{year}-{int(month):02d}-{int(day):02d}"


def dedupe_notices(notices: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    result = []
    for notice in notices:
        key = notice.get("url") or (notice["title"], notice["sourceUrl"])
        if key in seen:
            continue
        seen.add(key)
        result.append(notice)
    return result


def clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def extract_anchor_text(anchor: Any) -> str:
    text = clean_text(getattr(anchor, "text", ""))
    if not text and hasattr(anchor, "get_all_text"):
        text = clean_text(anchor.get_all_text())
    if not text:
        title_attr = clean_text(getattr(anchor, "attrib", {}).get("title", ""))
        text = re.sub(r"(보기|새창열림)$", "", title_attr).strip()
    if not text:
        try:
            image = anchor.css("img[alt]")[0]
        except Exception:
            image = None
        if image is not None:
            text = re.sub(r"(사진|이미지)$", "", clean_text(image.attrib.get("alt", ""))).strip()
    return text


def summarize(results: list[dict[str, Any]]) -> dict[str, Any]:
    status_counts = Counter(item.get("status", "unknown") for item in results)
    office_counts = Counter(item.get("officeCode", "unknown") for item in results)
    kind_counts = Counter(item.get("schoolKind", "unknown") for item in results)
    extractor_counts = Counter(
        notice.get("extractor", "static_link")
        for item in results
        for notice in item.get("notices", [])
    )
    return {
        "schools": len(results),
        "homepageFetchErrors": sum(1 for item in results if item["status"] == "homepage_fetch_error"),
        "withNoticeCandidates": sum(1 for item in results if item.get("noticeCandidates")),
        "withParsedNotices": sum(1 for item in results if item.get("notices")),
        "parsedNoticeCount": sum(len(item.get("notices", [])) for item in results),
        "statusCounts": dict(status_counts),
        "officeCounts": dict(office_counts),
        "schoolKindCounts": dict(kind_counts),
        "extractorCounts": dict(extractor_counts),
    }


def render_markdown(report: dict[str, Any]) -> str:
    summary = report["summary"]
    target_school_count = report.get("query", {}).get("targetSchoolCount")
    if target_school_count and summary["schools"] <= target_school_count:
        progress_text = f"{summary['schools']} / {target_school_count}"
    elif target_school_count:
        progress_text = f"{summary['schools']} 누적 체크포인트 (이번 NEIS 대상 {target_school_count})"
    else:
        progress_text = f"{summary['schools']} / unknown"
    lines = [
        "# NEIS 학교 홈페이지 공지사항 Scrapling Probe",
        "",
        f"- 생성시각: `{report['generatedAt']}`",
        f"- 조건: `{report['query']}`",
        f"- 판정: NEIS `schoolInfo.HMPG_ADRES`로 학교 홈페이지 목록을 만들고, Scrapling으로 홈페이지/공지 후보를 탐색한 뒤, 서울교육청 `dggb` 게시판은 AJAX 목록까지 호출해 주요 공지 수집 가능",
        f"- 검증 진행률: {progress_text}",
        f"- 학교 수: {summary['schools']}",
        f"- 홈페이지 fetch 실패: {summary['homepageFetchErrors']}",
        f"- 공지 후보 URL 발견: {summary['withNoticeCandidates']}",
        f"- 공지 item 파싱 성공: {summary['withParsedNotices']}",
        f"- 파싱된 공지 item 수: {summary['parsedNoticeCount']}",
        f"- 상태별 집계: `{summary.get('statusCounts', {})}`",
        f"- 학교급별 집계: `{summary.get('schoolKindCounts', {})}`",
        f"- 추출기별 집계: `{summary.get('extractorCounts', {})}`",
        "",
        "## 수집 방식",
        "",
        "1. NEIS `schoolInfo`에서 `ATPT_OFCDC_SC_CODE`, `SCHUL_KND_SC_NM` 조건으로 학교와 `HMPG_ADRES`를 수집한다. 전국 실행은 `--all-offices --limit 0` 조합을 사용한다.",
        "2. Scrapling `FetcherSession`으로 각 홈페이지를 열고 `공지사항`, `알림사항`, `학교소식`, `가정통신문` 링크를 우선순위로 점수화한다.",
        "3. 정적 링크형 공지는 일반 anchor에서 제목/URL/date를 추출한다.",
        "4. 서울교육청 `dggb` 계열처럼 목록을 JS로 채우는 사이트는 `boardFrm`의 `bbsId`, `bbsTyCode`, `pageIndex`를 읽어 `/dggb/module/board/selectBoardListAjax.do`를 POST 호출한다.",
        "5. AJAX 목록의 `fnView(bbsId, nttId)` 게시글을 `원본메뉴URL#bbsId=...&nttId=...` 형태로 정규화한다.",
        "",
        "## 한계",
        "",
        "- 전국 모든 학교가 같은 CMS를 쓰지 않으므로 교육청/학교 CMS별 adapter가 필요하다.",
        "- 일부 `공지사항` 메뉴는 직접 접근 시 `authReadError.do`로 이동한다. 이 경우 같은 학교의 `가정통신문`, `학교소식` 등 공개 게시판은 수집 가능하지만 해당 메뉴는 별도 세션/경로 분석이 필요하다.",
        "- 로그인, 신청, 결제, 비공개 게시판 접근은 하지 않는다.",
        "- 대량 수집은 `--sleep`과 캐시/재시도/robots 준수 정책을 둬야 한다.",
        "",
        "## 결과",
        "",
        "| 학교 | 홈페이지 | 상태 | 후보 URL | 공지 수 | 예시 공지 |",
        "|---|---|---|---:|---:|---|",
    ]
    for item in report["results"]:
        example = item.get("notices", [{}])[0].get("title", "") if item.get("notices") else ""
        lines.append(
            f"| {item['schoolName']} | {item['homepage']} | {item['status']} | "
            f"{len(item.get('noticeCandidates', []))} | {len(item.get('notices', []))} | {example} |"
        )
    lines.extend(["", "## 예시 공지", ""])
    for item in report["results"]:
        lines.append(f"### {item['schoolName']}")
        notices = item.get("notices", [])[:5]
        if not notices:
            lines.append("- 수집된 게시글 없음")
            continue
        for notice in notices:
            date = notice.get("date") or "날짜 미확인"
            extractor = notice.get("extractor") or "static_link"
            lines.append(f"- `{date}` {notice['title']} ({extractor})")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    raise SystemExit(main())
