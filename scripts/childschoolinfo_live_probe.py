#!/usr/bin/env python3
"""Probe 유치원알리미 (e-childschoolinfo) OpenAPI endpoints and compare live response fields.

This script is intentionally documentation-oriented: it records HTTP status,
API status (SUCCESS/DENIED/ERROR), row counts, observed fields, missing
documented fields, extra live fields, case-only field-name mismatches, and
compact sample rows without printing the API key.

Requires CHILDSCHOOLINFO_API_KEY in the environment (repo root `.env`):

    set -a; source .env; set +a
    python3 scripts/childschoolinfo_live_probe.py
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
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE_URL = "https://e-childschoolinfo.moe.go.kr/api/notice"

# 서울특별시 종로구 (시도시군구코드.xlsx: /openApi/sidoSigunguCode.do)
DEFAULT_REGION = {"sidoCode": "11", "sggCode": "11110"}
# 교차 검증용 지역: 부산광역시 동구
CROSS_REGION = {"sidoCode": "26", "sggCode": "26170"}


@dataclass(frozen=True)
class EndpointCase:
    endpoint: str
    label: str
    expected_fields: tuple[str, ...]
    variants: tuple[dict[str, str], ...] = ()
    note: str = ""


# 출력항목 명세 출처: https://e-childschoolinfo.moe.go.kr/openApi/history/<endpoint>.do
EXPECTED_FIELDS: dict[str, tuple[str, ...]] = {
    "basicInfo2": (  # 일반현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "establish", "rppnname", "ldgrname",
        "edate", "odate", "addr", "telno", "faxno", "hpaddr", "opertime", "clcnt3", "clcnt4", "clcnt5",
        "mixclcnt", "shclcnt", "prmstfcnt", "ag3fpcnt", "ag4fpcnt", "ag5fpcnt", "mixfpcnt", "spcnfpcnt",
        "ppcnt3", "ppcnt4", "ppcnt5", "mixppcnt", "shppcnt", "pbnttmng", "rpstYn", "lttdcdnt", "lngtcdnt",
    ),
    "building": (  # 건물현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "establish", "archyy", "floorcnt",
        "bldgprusarea", "grottar", "pbntTmng",
    ),
    "classArea": (  # 교실면적현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "establish", "crcnt", "clsrarea",
        "phgrindrarea", "hlsparea", "ktchmssparea", "otsparea", "pbntTmng",
    ),
    "teachersInfo": (  # 직위·자격별교직원현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "establish", "drcnt", "adcnt", "hdst_thcnt",
        "asps_thcnt", "gnrl_thcnt", "spcn_thcnt", "ntcnt", "ntrt_thcnt", "shcnt_thcnt", "owcnt", "hdst_tchr_qacnt",
        "rgth_gd1_qacnt", "rgth_gd2_qacnt", "asth_qacnt", "spsc_tchr_qacnt", "nth_qacnt", "ntth_qacnt",
        "pbntTmng", "gen_tcr_cnt", "shtm_gen_tcr_cnt", "shtm_spn_gen_tcr_cnt", "spy_tcr_cnt", "shtm_spy_tcr_cnt",
        "shtm_spn_spy_tcr_cnt", "hlt_tcr_cnt", "shtm_hlt_tcr_cnt", "shtm_spn_hlt_tcr_cnt", "ntr_tcr_cnt",
        "shtm_ntr_tcr_cnt", "shtm_spn_ntr_tcr_cnt", "insr_cnt", "nur_cnt", "nuast_cnt", "ntrst_cnt",
        "etc_emp_cnt", "hlt_wrk_hlt_tcr_cnt", "hlt_wrk_shtm_hlt_tcr_cnt", "hlt_wrk_adp_tcr_cnt", "hlt_wrk_tou_hlt_tcr_cnt",
        "hlt_wrk_doctr_cnt", "hlt_wrk_nur_cnt", "hlt_wrk_nuast_cnt", "hlt_wrk_etc_emp_cnt",
    ),
    "lessonDay": (  # 수업일수현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "establish", "ag3_lsn_dcnt", "ag4_lsn_dcnt",
        "ag5_lsn_dcnt", "mix_age_lsn_dcnt", "spcl_lsn_dcnt", "afsc_pros_lsn_dcnt", "ldnum_blw_yn",
        "pbntTmng",
    ),
    "schoolMeal": (  # 급식운영현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "establish", "mlsr_oprn_way_tp_cd",
        "cons_ents_nm", "al_kpcnt", "mlsr_kpcnt", "ntrt_tchr_agmt_yn", "snge_agmt_ntrt_thcnt", "cprt_agmt_ntrt_thcnt",
        "cprt_agmt_itt_nm", "ckcnt", "cmcnt", "mas_mspl_dclr_yn", "pbntTmng", "sgl_agmt_ntrt_thcnt",
        "sgl_asn_shtm_ntr_tcr_cnt", "sgl_asn_shtm_spn_ntr_tcr_cnt", "sgl_asn_ntrst_cnt", "copr_agmt_ntrt_thcnt",
        "copr_asn_shtm_ntr_tcr_cnt", "copr_asn_shtm_spn_ntr_tcr_cnt", "copr_asn_ntrst_cnt",
    ),
    "schoolBus": (  # 통학차량현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "establish", "vhcl_oprn_yn", "opra_vhcnt",
        "dclr_vhcnt", "psg9_dclr_vhcnt", "psg12_dclr_vhcnt", "psg15_dclr_vhcnt", "pbntTmng",
    ),
    "yearOfWork": (  # 근속연수현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "establish", "yy1_undr_thcnt", "yy1_abv_yy2_undr_thcnt",
        "yy2_abv_yy4_undr_thcnt", "yy4_abv_yy6_undr_thcnt", "yy6_abv_thcnt", "pbntTmng",
    ),
    "environmentHygiene": (  # 환경위생관리 현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "estb_pt", "arql_chk_dt", "arql_chk_rslt_tp_cd",
        "fxtm_dsnf_trgt_yn", "fxtm_dsnf_chk_dt", "fxtm_dsnf_chk_rslt_tp_cd", "tp_01", "tp_02", "tp_03",
        "tp_04", "unwt_qlwt_insc_yn", "qlwt_insc_dt", "qlwt_insc_stby_yn", "mdst_chk_dt", "mdst_chk_rslt_cd",
        "ilmn_chk_dt", "ilmn_chk_rslt_cd", "pbntTmng",
    ),
    "safetyEdu": (  # 안전점검 현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "estb_pt", "fire_avd_yn", "fire_avd_dt",
        "gas_ck_yn", "gas_ck_dt", "fire_safe_yn", "fire_safe_dt", "elect_ck_yn", "elect_ck_dt", "plyg_ck_yn",
        "plyg_ck_dt", "plyg_ck_rs_cd", "cctv_ist_yn", "cctv_ist_total", "cctv_ist_in", "cctv_ist_out",
        "pbntTmng",
    ),
    "safetyInstruct": (  # 안전교육 현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "estb_pt", "pbnt_sem_sc_cd", "safe_tp_cd1",
        "safe_tp_cd2", "safe_tp_cd3", "safe_tp_cd4", "safe_tp_cd5", "safe_tp_cd6", "safe_tp_cd7", "safe_tp_cd8",
        "pbntTmng",
    ),
    "deductionSociety": (  # 공제회 가입 현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "estb_pt", "school_ds_yn", "school_ds_en",
        "educate_ds_yn", "ducate_ds_en", "pbntTmng",
    ),
    "insurance": (  # 보험별 가입 현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "estb_pt", "insurance_nm", "insurance_en",
        "insurance_yn", "company1", "company2", "company3", "pbntTmng",
    ),
    "afterSchoolPresent": (  # 방과후과정현황
        "kinderCode", "officeedu", "subofficeedu", "kindername", "establish", "inor_clcnt", "pm_rrgn_clcnt",
        "oper_time", "inor_ptcn_kpcnt", "pm_rrgn_ptcn_kpcnt", "fxrl_thcnt", "shcnt_thcnt", "incnt",
        "pbntTmng", "cce_tcr_cnt", "etc_thts_cnt",
    ),
}

CASES: tuple[EndpointCase, ...] = (
    EndpointCase(
        endpoint="basicInfo",
        label="기본현황(레거시)",
        # 공식 명세 페이지(/openApi/history/basicInfo.do)는 404로 제거됨.
        # 개발자 가이드 PDF 예제가 여전히 basicInfo.do를 사용하므로 basicInfo2 명세와 비교한다.
        expected_fields=EXPECTED_FIELDS["basicInfo2"],
        note="공식 명세 탭에서 제거된 레거시 엔드포인트. basicInfo2 출력항목 기준으로 비교.",
    ),
    EndpointCase(
        endpoint="basicInfo2",
        label="일반현황(기본현황 신규)",
        expected_fields=EXPECTED_FIELDS["basicInfo2"],
        variants=(CROSS_REGION,),
    ),
    EndpointCase(endpoint="building", label="건물현황", expected_fields=EXPECTED_FIELDS["building"]),
    EndpointCase(endpoint="classArea", label="교실면적현황", expected_fields=EXPECTED_FIELDS["classArea"]),
    EndpointCase(endpoint="teachersInfo", label="직위·자격별 교직원현황", expected_fields=EXPECTED_FIELDS["teachersInfo"]),
    EndpointCase(endpoint="lessonDay", label="수업일수현황", expected_fields=EXPECTED_FIELDS["lessonDay"]),
    EndpointCase(
        endpoint="schoolMeal",
        label="급식운영현황",
        expected_fields=EXPECTED_FIELDS["schoolMeal"],
        variants=(CROSS_REGION,),
    ),
    EndpointCase(endpoint="schoolBus", label="통학차량현황", expected_fields=EXPECTED_FIELDS["schoolBus"]),
    EndpointCase(endpoint="yearOfWork", label="근속연수현황", expected_fields=EXPECTED_FIELDS["yearOfWork"]),
    EndpointCase(endpoint="environmentHygiene", label="환경위생 관리현황", expected_fields=EXPECTED_FIELDS["environmentHygiene"]),
    EndpointCase(endpoint="safetyEdu", label="안전점검 현황", expected_fields=EXPECTED_FIELDS["safetyEdu"]),
    EndpointCase(
        endpoint="safetyInstruct",
        label="안전교육 현황",
        expected_fields=EXPECTED_FIELDS["safetyInstruct"],
        note="공식 API 제공목록 탭에는 있으나 승인 안내문 14종 목록에는 없던 엔드포인트. 동일 인증키 사용 가능 여부 확인용.",
    ),
    EndpointCase(endpoint="deductionSociety", label="공제회 가입현황", expected_fields=EXPECTED_FIELDS["deductionSociety"]),
    EndpointCase(endpoint="insurance", label="보험별 가입현황", expected_fields=EXPECTED_FIELDS["insurance"]),
    EndpointCase(endpoint="afterSchoolPresent", label="방과후 과정 편성 운영 현황", expected_fields=EXPECTED_FIELDS["afterSchoolPresent"]),
)


class CallBudget:
    """Hard cap on live HTTP calls so a probe run stays polite."""

    def __init__(self, limit: int) -> None:
        self.limit = limit
        self.used = 0

    def take(self) -> bool:
        if self.used >= self.limit:
            return False
        self.used += 1
        return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="tmp/childschoolinfo_live_probe.json")
    parser.add_argument("--sleep", type=float, default=0.3)
    parser.add_argument("--sample-limit", type=int, default=1)
    parser.add_argument("--max-retries", type=int, default=1, help="failed call당 재시도 횟수")
    parser.add_argument("--max-calls", type=int, default=25, help="총 라이브 호출 상한")
    args = parser.parse_args()

    api_key = os.environ.get("CHILDSCHOOLINFO_API_KEY")
    if not api_key:
        print("CHILDSCHOOLINFO_API_KEY is required. Source .env first: set -a; source .env; set +a", file=sys.stderr)
        return 2

    budget = CallBudget(args.max_calls)
    started_at = datetime.now(timezone.utc).isoformat()
    results: list[dict[str, Any]] = []
    for case in CASES:
        attempts_params = [dict(DEFAULT_REGION), *[dict(v) for v in case.variants]]
        endpoint_results: list[dict[str, Any]] = []
        print(f"Probing {case.endpoint} ({case.label})...", file=sys.stderr)
        for index, params in enumerate(attempts_params, start=1):
            result: dict[str, Any] = {"ok": False, "error": "call budget exhausted"}
            for retry in range(args.max_retries + 1):
                if not budget.take():
                    print(f"  call budget ({budget.limit}) exhausted; skipping", file=sys.stderr)
                    break
                result = probe(case, params, api_key, args.sample_limit)
                result["retry"] = retry
                if result.get("ok"):
                    break
                time.sleep(args.sleep)
            result["variantIndex"] = index
            endpoint_results.append(result)
            time.sleep(args.sleep)
        results.append({
            "endpoint": case.endpoint,
            "label": case.label,
            "note": case.note,
            "expectedFields": list(case.expected_fields),
            "attempts": endpoint_results,
            "bestAttempt": choose_best_attempt(endpoint_results),
        })

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "startedAt": started_at,
        "baseUrl": BASE_URL,
        "defaultRegion": DEFAULT_REGION,
        "crossRegion": CROSS_REGION,
        "totalLiveCalls": budget.used,
        "results": results,
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output} (live calls: {budget.used})", file=sys.stderr)
    print(summary_markdown(report))
    return 0


def probe(case: EndpointCase, params: dict[str, str], api_key: str, sample_limit: int) -> dict[str, Any]:
    query = {"key": api_key, **params}
    url = f"{BASE_URL}/{case.endpoint}.do?{urllib.parse.urlencode(query)}"
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
            "error": redact_value(body[:500], api_key),
        }
    except Exception as error:  # noqa: BLE001 - report network errors in probe output.
        return {
            "ok": False,
            "httpStatus": None,
            "url": safe_url,
            "params": params,
            "error": redact_value(repr(error), api_key),
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
            "bodyPrefix": redact_value(body[:500], api_key),
        }

    status = payload.get("status")
    rows = [row for row in payload.get("kinderInfo") or [] if isinstance(row, dict)]
    fields = sorted({field_name for row in rows for field_name in row})
    comparison = compare_fields(case.expected_fields, fields)
    return {
        "ok": status_code == 200 and status == "SUCCESS",
        "httpStatus": status_code,
        "url": safe_url,
        "params": params,
        "status": status,
        "message": payload.get("message"),
        "rowCount": len(rows),
        "observedFields": fields,
        **comparison,
        "sampleRows": rows[:sample_limit],
    }


def compare_fields(expected: tuple[str, ...], observed: list[str]) -> dict[str, Any]:
    """공식 출력항목 표와 라이브 field를 비교한다. 명세는 camelCase(kinderCode 등)로
    표기돼 있으나 라이브 JSON은 소문자(kindercode)로 내려오는 항목이 있어
    대소문자 무시 매칭 + 대소문자 불일치 목록을 함께 기록한다."""
    observed_by_lower = {name.lower(): name for name in observed}
    missing: list[str] = []
    case_mismatch: dict[str, str] = {}
    for name in expected:
        live = observed_by_lower.get(name.lower())
        if live is None:
            missing.append(name)
        elif live != name:
            case_mismatch[name] = live
    expected_lower = {name.lower() for name in expected}
    extra = sorted(name for name in observed if name.lower() not in expected_lower)
    return {
        "missingDocumentedFields": missing,
        "extraLiveFields": extra,
        "caseMismatchedFields": case_mismatch,
    }


def choose_best_attempt(attempts: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not attempts:
        return None
    return max(
        attempts,
        key=lambda item: (1 if item.get("ok") else 0, int(item.get("rowCount") or 0)),
    )


def redact_key(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    query = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    redacted = [(key, "***" if key == "key" else value) for key, value in query]
    return urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(redacted)))


def redact_value(text: str, secret: str) -> str:
    return text.replace(secret, "***") if secret else text


def summary_markdown(report: dict[str, Any]) -> str:
    lines = [
        "| Endpoint | OK | status | Rows | Missing documented fields | Extra live fields |",
        "|---|---|---|---:|---|---|",
    ]
    for result in report["results"]:
        best = result["bestAttempt"] or {}
        lines.append(
            "| {endpoint} | {ok} | {status} | {rows} | {missing} | {extra} |".format(
                endpoint=result["endpoint"],
                ok="yes" if best.get("ok") else "no",
                status=best.get("status") or best.get("error", "-"),
                rows=best.get("rowCount", 0),
                missing=", ".join(best.get("missingDocumentedFields") or []) or "-",
                extra=", ".join(best.get("extraLiveFields") or []) or "-",
            )
        )
    return "\n".join(lines)


if __name__ == "__main__":
    raise SystemExit(main())
