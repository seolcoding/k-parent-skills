#!/usr/bin/env python3
"""Probe NEIS OpenAPI endpoints and compare live response fields.

This script is intentionally documentation-oriented: it records status,
row counts, observed fields, missing documented fields, extra live fields,
and compact sample rows without printing the API key.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


BASE_URL = "https://open.neis.go.kr/hub"


@dataclass(frozen=True)
class EndpointCase:
    dataset: str
    label: str
    params: dict[str, str]
    expected_fields: tuple[str, ...]
    variants: tuple[dict[str, str], ...] = ()


COMMON_SCHOOL_FIELDS = (
    "ATPT_OFCDC_SC_CODE",
    "ATPT_OFCDC_SC_NM",
    "SD_SCHUL_CODE",
    "SCHUL_NM",
)

TIMETABLE_FIELDS = COMMON_SCHOOL_FIELDS + (
    "AY",
    "SEM",
    "ALL_TI_YMD",
    "GRADE",
    "CLASS_NM",
    "PERIO",
    "ITRT_CNTNT",
    "LOAD_DTM",
)

CASES: tuple[EndpointCase, ...] = (
    EndpointCase(
        dataset="schoolInfo",
        label="학교기본정보",
        params={"SCHUL_NM": "서울고등학교"},
        variants=(
            {"ATPT_OFCDC_SC_CODE": "B10", "SCHUL_NM": "서울고등학교"},
            {"SCHUL_KND_SC_NM": "초등학교", "LCTN_SC_NM": "서울특별시"},
            {"SD_SCHUL_CODE": "7010057"},
        ),
        expected_fields=(
            "ATPT_OFCDC_SC_CODE",
            "ATPT_OFCDC_SC_NM",
            "SD_SCHUL_CODE",
            "SCHUL_NM",
            "ENG_SCHUL_NM",
            "SCHUL_KND_SC_NM",
            "LCTN_SC_NM",
            "JU_ORG_NM",
            "FOND_SC_NM",
            "ORG_RDNZC",
            "ORG_RDNMA",
            "ORG_RDNDA",
            "ORG_TELNO",
            "HMPG_ADRES",
            "COEDU_SC_NM",
            "ORG_FAXNO",
            "HS_SC_NM",
            "INDST_SPECL_CCCCL_EXST_YN",
            "HS_GNRL_BUSNS_SC_NM",
            "SPCLY_PURPS_HS_ORD_NM",
            "ENE_BFE_SEHF_SC_NM",
            "DGHT_SC_NM",
            "FOND_YMD",
            "FOAS_MEMRD",
            "LOAD_DTM",
        ),
    ),
    EndpointCase(
        dataset="schulAflcoinfo",
        label="학교계열정보",
        params={"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057"},
        variants=({"ATPT_OFCDC_SC_CODE": "B10"},),
        expected_fields=COMMON_SCHOOL_FIELDS + ("DGHT_CRSE_SC_NM", "ORD_SC_NM", "LOAD_DTM"),
    ),
    EndpointCase(
        dataset="schoolMajorinfo",
        label="학교학과정보",
        params={"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057"},
        variants=({"ATPT_OFCDC_SC_CODE": "B10"},),
        expected_fields=COMMON_SCHOOL_FIELDS + ("DGHT_CRSE_SC_NM", "ORD_SC_NM", "DDDEP_NM", "LOAD_DTM"),
    ),
    EndpointCase(
        dataset="classInfo",
        label="학급정보",
        params={"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026"},
        variants=(
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "GRADE": "1"},
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2025"},
        ),
        expected_fields=COMMON_SCHOOL_FIELDS + (
            "AY",
            "GRADE",
            "DGHT_CRSE_SC_NM",
            "SCHUL_CRSE_SC_NM",
            "ORD_SC_NM",
            "DDDEP_NM",
            "CLASS_NM",
            "LOAD_DTM",
        ),
    ),
    EndpointCase(
        dataset="elsTimetable",
        label="초등학교시간표",
        params={"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130110", "AY": "2026", "SEM": "1", "TI_FROM_YMD": "20260302", "TI_TO_YMD": "20260306"},
        variants=(
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130110", "AY": "2026", "SEM": "1", "ALL_TI_YMD": "20260302"},
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130110", "AY": "2026", "SEM": "1", "GRADE": "1", "CLASS_NM": "1"},
        ),
        expected_fields=TIMETABLE_FIELDS,
    ),
    EndpointCase(
        dataset="misTimetable",
        label="중학교시간표",
        params={"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130165", "AY": "2026", "SEM": "1"},
        variants=(
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130165", "AY": "2026", "SEM": "1", "ALL_TI_YMD": "20260303"},
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130165", "AY": "2026", "SEM": "1", "GRADE": "1", "CLASS_NM": "1"},
        ),
        expected_fields=TIMETABLE_FIELDS + ("DGHT_CRSE_SC_NM",),
    ),
    EndpointCase(
        dataset="hisTimetable",
        label="고등학교시간표",
        params={"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "SEM": "1", "TI_FROM_YMD": "20260302", "TI_TO_YMD": "20260306"},
        variants=(
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "SEM": "1", "ALL_TI_YMD": "20260302"},
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "SEM": "1", "GRADE": "1", "CLASS_NM": "1"},
        ),
        expected_fields=TIMETABLE_FIELDS + ("DGHT_CRSE_SC_NM", "ORD_SC_NM", "DDDEP_NM", "CLRM_NM"),
    ),
    EndpointCase(
        dataset="SchoolSchedule",
        label="학사일정",
        params={"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AA_FROM_YMD": "20260301", "AA_TO_YMD": "20260331"},
        variants=(
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AA_YMD": "20260302"},
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AA_FROM_YMD": "20260501", "AA_TO_YMD": "20260531"},
        ),
        expected_fields=COMMON_SCHOOL_FIELDS + (
            "AY",
            "DGHT_CRSE_SC_NM",
            "SCHUL_CRSE_SC_NM",
            "SBTR_DD_SC_NM",
            "AA_YMD",
            "EVENT_NM",
            "EVENT_CNTNT",
            "ONE_GRADE_EVENT_YN",
            "TW_GRADE_EVENT_YN",
            "THREE_GRADE_EVENT_YN",
            "FR_GRADE_EVENT_YN",
            "FIV_GRADE_EVENT_YN",
            "SIX_GRADE_EVENT_YN",
            "LOAD_DTM",
        ),
    ),
    EndpointCase(
        dataset="mealServiceDietInfo",
        label="급식식단정보",
        params={"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "MLSV_FROM_YMD": "20260501", "MLSV_TO_YMD": "20260531"},
        variants=(
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "MLSV_YMD": "20260501"},
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "MLSV_FROM_YMD": "20260501", "MLSV_TO_YMD": "20260531", "MMEAL_SC_CODE": "2"},
        ),
        expected_fields=COMMON_SCHOOL_FIELDS + (
            "MMEAL_SC_CODE",
            "MMEAL_SC_NM",
            "MLSV_YMD",
            "MLSV_FGR",
            "DDISH_NM",
            "ORPLC_INFO",
            "CAL_INFO",
            "NTR_INFO",
            "MLSV_FROM_YMD",
            "MLSV_TO_YMD",
            "LOAD_DTM",
        ),
    ),
    EndpointCase(
        dataset="spsTimetable",
        label="특수학교시간표",
        params={"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010575", "AY": "2026", "SEM": "1"},
        variants=(
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010575", "AY": "2026", "SEM": "1", "ALL_TI_YMD": "20260302"},
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010575", "AY": "2026", "SEM": "1", "GRADE": "1"},
        ),
        expected_fields=TIMETABLE_FIELDS + ("SCHUL_CRSE_SC_NM", "CLRM_NM"),
    ),
    EndpointCase(
        dataset="acaInsTiInfo",
        label="학원교습소정보",
        params={"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "수학"},
        variants=(
            {"ATPT_OFCDC_SC_CODE": "B10", "ADMST_ZONE_NM": "강남서초교육지원청", "REALM_SC_NM": "입시.검정 및 보습"},
            {"ATPT_OFCDC_SC_CODE": "B10", "LE_CRSE_NM": "보습"},
        ),
        expected_fields=(
            "ATPT_OFCDC_SC_CODE",
            "ATPT_OFCDC_SC_NM",
            "ADMST_ZONE_NM",
            "ACA_INSTI_SC_NM",
            "ACA_ASNUM",
            "ACA_NM",
            "ESTBL_YMD",
            "REG_YMD",
            "REG_STTUS_NM",
            "CAA_BEGIN_YMD",
            "CAA_END_YMD",
            "TOFOR_SMTOT",
            "DTM_RCPTN_ABLTY_NMPR_SMTOT",
            "REALM_SC_NM",
            "LE_ORD_NM",
            "LE_CRSE_LIST_NM",
            "LE_CRSE_NM",
            "PSNBY_THCC_CNTNT",
            "THCC_OTHBC_YN",
            "BRHS_ACA_YN",
            "FA_RDNMA",
            "FA_RDNDA",
            "FA_RDNZC",
            "FA_TELNO",
            "LOAD_DTM",
        ),
    ),
    EndpointCase(
        dataset="tiClrminfo",
        label="시간표강의실정보",
        params={"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026"},
        variants=(
            {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "SEM": "1", "GRADE": "1"},
        ),
        expected_fields=COMMON_SCHOOL_FIELDS + (
            "AY",
            "GRADE",
            "SEM",
            "SCHUL_CRSE_SC_NM",
            "DGHT_CRSE_SC_NM",
            "ORD_SC_NM",
            "DDDEP_NM",
            "CLRM_NM",
            "LOAD_DTM",
        ),
    ),
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="tmp/neis_live_probe.json")
    parser.add_argument("--page-size", type=int, default=20)
    parser.add_argument("--sleep", type=float, default=0.15)
    parser.add_argument("--sample-limit", type=int, default=2)
    args = parser.parse_args()

    api_key = os.environ.get("KEDU_INFO_KEY")
    if not api_key:
        print("KEDU_INFO_KEY is required. Source .env first.", file=sys.stderr)
        return 2

    started_at = datetime.now(timezone.utc).isoformat()
    results: list[dict[str, Any]] = []
    for case in CASES:
        attempts = [case.params, *case.variants]
        endpoint_results = []
        print(f"Probing {case.dataset} ({case.label})...", file=sys.stderr)
        for index, params in enumerate(attempts, start=1):
            result = probe(case, params, api_key, args.page_size, args.sample_limit)
            result["variantIndex"] = index
            endpoint_results.append(result)
            time.sleep(args.sleep)
        results.append({
            "dataset": case.dataset,
            "label": case.label,
            "expectedFields": list(case.expected_fields),
            "attempts": endpoint_results,
            "bestAttempt": choose_best_attempt(endpoint_results),
        })

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "startedAt": started_at,
        "baseUrl": BASE_URL,
        "pageSize": args.page_size,
        "results": results,
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output}", file=sys.stderr)
    print(summary_markdown(report))
    return 0


def probe(case: EndpointCase, params: dict[str, str], api_key: str, page_size: int, sample_limit: int) -> dict[str, Any]:
    query = {
        "KEY": api_key,
        "Type": "json",
        "pIndex": "1",
        "pSize": str(page_size),
        **params,
    }
    url = f"{BASE_URL}/{case.dataset}?{urllib.parse.urlencode(query)}"
    safe_url = redact_key(url)
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            body = response.read().decode("utf-8", errors="replace")
            status_code = response.status
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        return {
            "ok": False,
            "httpStatus": error.code,
            "url": safe_url,
            "params": params,
            "error": body[:500],
        }
    except Exception as error:  # noqa: BLE001 - report network errors in probe output.
        return {
            "ok": False,
            "httpStatus": None,
            "url": safe_url,
            "params": params,
            "error": repr(error),
        }

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return {
            "ok": False,
            "httpStatus": status_code,
            "url": safe_url,
            "params": params,
            "error": "non-json response",
            "bodyPrefix": body[:500],
        }

    rows = extract_rows(payload, case.dataset)
    head = extract_head(payload, case.dataset)
    fields = sorted({field for row in rows for field in row})
    expected = set(case.expected_fields)
    live = set(fields)
    result_code = extract_result_code(payload, case.dataset)
    return {
        "ok": status_code == 200 and result_code.get("code") not in {"ERROR-290", "ERROR-300", "ERROR-333", "INFO-200"},
        "httpStatus": status_code,
        "url": safe_url,
        "params": params,
        "result": result_code,
        "listTotalCount": extract_total_count(head),
        "rowCount": len(rows),
        "observedFields": fields,
        "missingDocumentedFields": sorted(expected - live),
        "extraLiveFields": sorted(live - expected),
        "sampleRows": rows[:sample_limit],
    }


def extract_rows(payload: dict[str, Any], dataset: str) -> list[dict[str, Any]]:
    block = payload.get(dataset)
    if not isinstance(block, list):
        return []
    for item in block:
        rows = item.get("row") if isinstance(item, dict) else None
        if isinstance(rows, list):
            return [row for row in rows if isinstance(row, dict)]
    return []


def extract_head(payload: dict[str, Any], dataset: str) -> list[Any]:
    block = payload.get(dataset)
    if not isinstance(block, list):
        return []
    for item in block:
        head = item.get("head") if isinstance(item, dict) else None
        if isinstance(head, list):
            return head
    return []


def extract_total_count(head: list[Any]) -> int | None:
    for item in head:
        if isinstance(item, dict) and ("LIST_TOTAL_COUNT" in item or "list_total_count" in item):
            try:
                return int(item.get("LIST_TOTAL_COUNT", item.get("list_total_count")))
            except (TypeError, ValueError):
                return None
    return None


def extract_result_code(payload: dict[str, Any], dataset: str) -> dict[str, str | None]:
    candidates: list[Any] = []
    if isinstance(payload.get("RESULT"), dict):
        candidates.append(payload["RESULT"])
    for item in extract_head(payload, dataset):
        if isinstance(item, dict) and isinstance(item.get("RESULT"), dict):
            candidates.append(item["RESULT"])
    for candidate in candidates:
        return {
            "code": candidate.get("CODE"),
            "message": candidate.get("MESSAGE"),
        }
    return {"code": None, "message": None}


def choose_best_attempt(attempts: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not attempts:
        return None
    return max(
        attempts,
        key=lambda item: (
            1 if item.get("ok") else 0,
            int(item.get("rowCount") or 0),
            int(item.get("listTotalCount") or 0),
        ),
    )


def redact_key(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    query = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    redacted = [(key, "***" if key == "KEY" else value) for key, value in query]
    return urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(redacted)))


def summary_markdown(report: dict[str, Any]) -> str:
    lines = [
        "| Endpoint | OK | Rows | Total | Missing documented fields | Extra live fields |",
        "|---|---:|---:|---:|---|---|",
    ]
    for result in report["results"]:
        best = result["bestAttempt"] or {}
        lines.append(
            "| {dataset} | {ok} | {rows} | {total} | {missing} | {extra} |".format(
                dataset=result["dataset"],
                ok="yes" if best.get("ok") else "no",
                rows=best.get("rowCount", 0),
                total=best.get("listTotalCount", ""),
                missing=", ".join(best.get("missingDocumentedFields") or []) or "-",
                extra=", ".join(best.get("extraLiveFields") or []) or "-",
            )
        )
    return "\n".join(lines)


if __name__ == "__main__":
    raise SystemExit(main())
