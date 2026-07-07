#!/usr/bin/env python3
"""Probe 학교알리미(schoolinfo.go.kr) OpenAPI endpoints and compare live response fields.

This script is intentionally documentation-oriented: it records HTTP status,
resultCode/resultMsg, list counts, observed fields, missing documented fields,
extra live fields, and compact sample rows without printing the API key.

Call budget: one GET per case (14 cases), network-error retry is limited to
1 per case, and a hard MAX_CALLS guard protects the development-account quota.
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

BASE_URL = "https://www.schoolinfo.go.kr/openApi.do"
MAX_CALLS = 40  # hard guard for the development-account quota

# 모든 공시 항목이 공유하는 학교 식별 prefix (포털 출력값 명세 공통부)
COMMON_SCHOOL_FIELDS = (
    "ATPT_OFCDC_ORG_NM",
    "ATPT_OFCDC_ORG_CODE",
    "JU_ORG_NM",
    "JU_ORG_CODE",
    "ADRCD_NM",
    "ADRCD_CD",
    "LCTN_SC_CODE",
    "SCHUL_CODE",
    "SCHUL_NM",
    "SCHUL_KND_SC_CODE",
    "FOND_SC_CODE",
    "BNHH_YN",
)

PBAN_FIELDS = ("PBAN_EXCP_YN", "PBAN_EXCP_RSN")


@dataclass(frozen=True)
class ApiCase:
    api_type: str
    label: str
    params: dict[str, str]
    expected_fields: tuple[str, ...]
    expect_fail: bool = False
    use_key: bool = True
    note: str = ""


# 서울 종로구(sidoCode=11, sggCode=11110)를 seed로 사용해 응답 크기를 제한한다.
SEED_REGION = {"sidoCode": "11", "sggCode": "11110"}

CASES: tuple[ApiCase, ...] = (
    ApiCase(
        api_type="0",
        label="학교기본정보",
        params={**SEED_REGION, "schulKndCode": "02"},
        expected_fields=COMMON_SCHOOL_FIELDS + (
            "SHL_IDF_CD", "HS_KND_SC_NM", "SCHUL_FOND_TYP_CODE", "DGHT_SC_CODE",
            "FOAS_MEMRD", "FOND_YMD", "ADRCD_ID", "ADRES_BRKDN", "DTLAD_BRKDN",
            "ZIP_CODE", "SCHUL_RDNZC", "SCHUL_RDNMA", "SCHUL_RDNDA", "LTTUD",
            "LGTUD", "USER_TELNO", "USER_TELNO_SW", "USER_TELNO_GA", "PERC_FAXNO",
            "HMPG_ADRES", "COEDU_SC_CODE", "ABSCH_YN", "ABSCH_YMD", "CLOSE_YN",
            "SCHUL_CRSE_SC_VALUE", "SCHUL_CRSE_SC_VALUE_NM",
        ),
    ),
    ApiCase(
        api_type="08",
        label="수업일수 및 수업시수 현황",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "02"},
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "HS_KND_SC_NM", "COL_1", "COL_2", "COL_3", "COL_4", "COL_5", "COL_6",
            "PER_STUDAY_DAY", "WEEK_TOT_ITRT_HR_FGR", "ITRT_TCR_TOT_FGR",
            "SCHUL_CRSE_SC_CODE_P", "COL_1_P", "COL_2_P", "COL_3_P", "COL_4_P",
            "COL_5_P", "COL_6_P", "SCHUL_CRSE_SC_CODE_M", "COL_1_M", "COL_2_M",
            "COL_3_M", "SCHUL_CRSE_SC_CODE_H", "COL_1_H", "COL_2_H", "COL_3_H",
        ),
    ),
    ApiCase(
        api_type="62",
        label="학교 현황",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "02"},
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "HS_KND_SC_NM", "COL_1", "COL_2", "COL_3", "COL_4", "COL_5", "COL_6",
            "COL_7", "COL_8", "COL_SUM", "COL_FGR_SUM", "AVG_FGR_SUM", "SP_SUM",
            "SP_FGR_SUM", "COL_S1", "COL_S2", "COL_SUM_1", "COL_SUM_FGR1",
            "AVG_SUM_FGR1", "COL_9", "COL_10", "COL_S3", "COL_SUM_2",
            "COL_SUM_FGR2", "AVG_SUM_FGR2", "COL_11", "COL_12", "COL_13",
            "COL_S4", "COL_SUM_3", "COL_SUM_FGR3", "AVG_SUM_FGR3", "COL_14",
            "COL_SUM_4", "COL_SUM_FGR4", "AVG_SUM_FGR4", "COL_15", "COL_16",
            "COL_17", "COL_18", "SCHUL_CRSE_SC_VALUE", "SCHUL_CRSE_SC_VALUE_NM",
        ),
    ),
    ApiCase(
        api_type="63",
        label="성별 학생수",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "02"},
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "HS_KND_SC_NM", "COL_M1", "COL_W1", "COL_MSUM", "COL_WSUM", "SUM",
            "SCHUL_CRSE_SC_VALUE", "SCHUL_CRSE_SC_VALUE_NM",
        ),
        note="포털 명세는 학교급별 반복 COL_M*/COL_W* 필드를 나열; 대표 필드만 비교",
    ),
    ApiCase(
        api_type="09",
        label="학년별·학급별 학생수",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "02"},
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "HS_KND_SC_NM", "COL_C1", "COL_S1", "COL_1", "COL_C_SUM", "COL_S_SUM",
            "COL_SUM", "TEACH_CNT", "TEACH_CAL",
            "SCHUL_CRSE_SC_VALUE", "SCHUL_CRSE_SC_VALUE_NM",
        ),
        note="포털 명세는 학교급별 반복 COL_C*/COL_S* 필드를 나열; 대표 필드만 비교",
    ),
    ApiCase(
        api_type="22",
        label="직위별 교원 현황",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "02"},
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "HS_KND_SC_NM", "COL_M1", "COL_W1", "COL_R1", "COL_1", "COL_SM",
            "COL_SW", "COL_SR", "COL_S", "COL_M14", "COL_W14", "COL_14",
            "COL_R_SUM", "SCHUL_CRSE_SC_VALUE", "SCHUL_CRSE_SC_VALUE_NM",
        ),
        note="포털 명세는 직위별 반복 COL_M*/COL_W*/COL_R* 필드를 나열; 대표 필드만 비교",
    ),
    ApiCase(
        api_type="51",
        label="입학생 현황",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "04"},
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "HS_KND_SC_NM", "BEAGE_BOY_FGR", "BEAGE_GIR_FGR", "TOTAL_1",
            "TOTAL_2", "TOT_SUM",
        ),
        note="고등학교(04) seed. 명세의 졸업/검정고시/특수교육 필드는 학교급에 따라 달라짐",
    ),
    ApiCase(
        api_type="04",
        label="자유학기제 운영에 관한 사항",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "03", "depthNo": "10"},
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "LBRTY_SEM_SC_CODE", "COL_P", "COL_3", "COL_4", "COL_5", "COL_6",
            "COL_7", "COL_8",
        ),
        note="중학교(03) 전용. depthNo 10:1학기 20:2학기",
    ),
    ApiCase(
        api_type="24",
        label="표시과목별 교원 현황",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "03", "depthNo": "10"},
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "HS_KND_SC_NM", "COL1_M1", "COL1_W1", "COL1_1", "COL_M1", "COL_W1",
            "COL_1", "FMTCD", "PJ_CHASU", "UPPER_ORGA_NM", "ORGA_NM",
            "SBJT_CODE", "SBJT_NM", "ML_TCHER_FGR", "FML_TCHER_FGR", "SUM_CNT",
        ),
        note="depthNo 10:교과별 20:과목별",
    ),
    ApiCase(
        api_type="27",
        label="학교회계 예·결산서(국공립)",
        params={
            "pbanYr": "2025", **SEED_REGION, "schulKndCode": "02",
            "depthNo": "10", "depthNo2": "1",
        },
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "HS_KND_SC_NM", "CLSDR_YN", "FAS_DTN_SC_CODE", "PBAN_REV_EX_SC_CODE",
            "AMT1", "AMT2", "AMT3", "AMT4", "AMT5", "AMT6",
            "SCHUL_CRSE_SC_VALUE", "SCHUL_CRSE_SC_VALUE_NM",
        ),
        note="depthNo 10:예산 20:결산, depthNo2 1:세입(예산) 2:세출(예산) 3:세입(결산) 4:세출(결산)",
    ),
    ApiCase(
        api_type="34",
        label="급식 실시 현황",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "02"},
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "HS_KND_SC_NM", "OPER_MET_CODE", "COL_1", "COL_2", "COL_3",
            "HAKSAENGSU_TOT", "MLSV_STDNT_FGR", "KS_RATE", "NTRST_FGR",
            "COOK_FGR", "COOAS_FGR", "COL_4", "COL_5", "COL_6", "COL_7",
            "SCHUL_CRSE_SC_VALUE", "SCHUL_CRSE_SC_VALUE_NM",
        ),
    ),
    ApiCase(
        api_type="58",
        label="학교도서관 현황",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "02", "depthNo": "10"},
        expected_fields=COMMON_SCHOOL_FIELDS + PBAN_FIELDS + (
            "HS_KND_SC_NM", "GNRL_BOKS_FGR", "NN_BOS_DTA_FGR", "SUMCNT",
            "PBAN_YR_ALL_STDNT_FGR", "RATIO",
            "SCHUL_CRSE_SC_VALUE", "SCHUL_CRSE_SC_VALUE_NM",
        ),
        note="depthNo 10:자료보유 20:운영현황 30:이용현황",
    ),
    # ---- 에러/경계 케이스 (문서화 목적) ----
    ApiCase(
        api_type="0",
        label="에러: schulKndCode 누락",
        params=dict(SEED_REGION),
        expected_fields=(),
        expect_fail=True,
        note="필수 파라미터 누락 시 응답 형태 기록",
    ),
    ApiCase(
        api_type="42",
        label="에러: 제공 중단 항목(환경위생관리)",
        params={"pbanYr": "2025", **SEED_REGION, "schulKndCode": "02"},
        expected_fields=(),
        expect_fail=True,
        note="환경위생관리 현황은 2024년부터 API 제공 중단 공지; 실제 응답 기록",
    ),
    ApiCase(
        api_type="0",
        label="에러: 잘못된 인증키",
        params={**SEED_REGION, "schulKndCode": "02"},
        expected_fields=(),
        expect_fail=True,
        use_key=False,
        note="인증 실패 시 응답 형태 기록 (더미 키 사용)",
    ),
)

_call_count = 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="tmp/schoolinfo_live_probe.json")
    parser.add_argument("--sleep", type=float, default=0.4)
    parser.add_argument("--sample-limit", type=int, default=1)
    parser.add_argument("--value-trunc", type=int, default=80)
    args = parser.parse_args()

    api_key = os.environ.get("SCHOOLINFO_API_KEY")
    if not api_key:
        print("SCHOOLINFO_API_KEY is required. Source .env first.", file=sys.stderr)
        return 2

    started_at = datetime.now(timezone.utc).isoformat()
    results: list[dict[str, Any]] = []
    for case in CASES:
        print(f"Probing apiType={case.api_type} ({case.label})...", file=sys.stderr)
        result = probe(case, api_key, args.sample_limit, args.value_trunc)
        results.append(result)
        time.sleep(args.sleep)

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "startedAt": started_at,
        "baseUrl": BASE_URL,
        "totalHttpCalls": _call_count,
        "results": results,
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output} ({_call_count} HTTP calls)", file=sys.stderr)
    print(summary_markdown(report))
    return 0


def probe(case: ApiCase, api_key: str, sample_limit: int, value_trunc: int) -> dict[str, Any]:
    global _call_count
    query = {
        "apiKey": api_key if case.use_key else "INVALID-KEY-PROBE",
        "apiType": case.api_type,
        **case.params,
    }
    url = f"{BASE_URL}?{urllib.parse.urlencode(query)}"
    safe_url = redact_key(url)
    base: dict[str, Any] = {
        "apiType": case.api_type,
        "label": case.label,
        "expectFail": case.expect_fail,
        "note": case.note,
        "url": safe_url,
        "params": case.params,
    }

    body: str | None = None
    status_code: int | None = None
    last_error: str | None = None
    for attempt in (1, 2):  # 네트워크 오류에 한해 재시도 1회
        if _call_count >= MAX_CALLS:
            return {**base, "ok": False, "error": f"MAX_CALLS({MAX_CALLS}) exceeded, call skipped"}
        _call_count += 1
        try:
            with urllib.request.urlopen(url, timeout=40) as response:
                raw = response.read()
                status_code = response.status
                body = decode_body(raw, response.headers.get_content_charset())
            break
        except urllib.error.HTTPError as error:
            body = decode_body(error.read(), None)
            return {
                **base,
                "ok": False,
                "httpStatus": error.code,
                "error": (body or "")[:500],
            }
        except Exception as error:  # noqa: BLE001 - report network errors in probe output.
            last_error = repr(error)
            if attempt == 2:
                return {**base, "ok": False, "httpStatus": None, "error": last_error}
            time.sleep(1.0)

    if body is None:
        return {**base, "ok": False, "httpStatus": status_code, "error": last_error or "empty body"}

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return {
            **base,
            "ok": False,
            "httpStatus": status_code,
            "error": "non-json response",
            "bodyPrefix": body[:500],
        }

    result_code = payload.get("resultCode")
    result_msg = payload.get("resultMsg")
    rows = payload.get("list") if isinstance(payload.get("list"), list) else []
    rows = [row for row in rows if isinstance(row, dict)]
    fields = sorted({field for row in rows for field in row})
    expected = set(case.expected_fields)
    live = set(fields)
    return {
        **base,
        "ok": status_code == 200 and result_code == "success",
        "httpStatus": status_code,
        "resultCode": result_code,
        "resultMsg": result_msg,
        "otherTopLevelKeys": sorted(set(payload) - {"resultCode", "resultMsg", "list"}),
        "listCount": len(rows),
        "observedFields": fields,
        "missingDocumentedFields": sorted(expected - live) if rows else [],
        "extraLiveFields": sorted(live - expected) if rows else [],
        "sampleRows": [truncate_row(row, value_trunc) for row in rows[:sample_limit]],
    }


def decode_body(raw: bytes, charset: str | None) -> str:
    encodings = [charset] if charset else []
    encodings += ["utf-8", "euc-kr", "cp949"]
    for encoding in encodings:
        try:
            return raw.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            continue
    return raw.decode("utf-8", errors="replace")


def truncate_row(row: dict[str, Any], value_trunc: int) -> dict[str, Any]:
    compact: dict[str, Any] = {}
    for key, value in row.items():
        if isinstance(value, str) and len(value) > value_trunc:
            compact[key] = value[:value_trunc] + "…"
        else:
            compact[key] = value
    return compact


def redact_key(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    query = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    redacted = [(key, "***" if key == "apiKey" else value) for key, value in query]
    return urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(redacted)))


def summary_markdown(report: dict[str, Any]) -> str:
    lines = [
        "| apiType | 항목 | OK | resultCode | Rows | Missing documented | Extra live |",
        "|---|---|---:|---|---:|---|---|",
    ]
    for result in report["results"]:
        missing = result.get("missingDocumentedFields") or []
        extra = result.get("extraLiveFields") or []
        lines.append(
            "| {api_type} | {label} | {ok} | {code} | {rows} | {missing} | {extra} |".format(
                api_type=result["apiType"],
                label=result["label"],
                ok="yes" if result.get("ok") else "no",
                code=result.get("resultCode") or result.get("error", "")[:40],
                rows=result.get("listCount", 0),
                missing=summarize_fields(missing),
                extra=summarize_fields(extra),
            )
        )
    return "\n".join(lines)


def summarize_fields(fields: list[str], head: int = 6) -> str:
    if not fields:
        return "-"
    shown = ", ".join(fields[:head])
    return f"{shown} 외 {len(fields) - head}건" if len(fields) > head else shown


if __name__ == "__main__":
    raise SystemExit(main())
