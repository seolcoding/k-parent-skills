#!/usr/bin/env python3
"""Run parent-facing NEIS scenario probes and write a test report.

The scenarios are intentionally phrased as parent/child questions, then
resolved through concrete NEIS API workflows. API keys are never written to
the output files.
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
from typing import Any, Callable


BASE_URL = "https://open.neis.go.kr/hub"


@dataclass(frozen=True)
class School:
    label: str
    level: str
    office: str
    code: str
    name: str
    grade: str
    class_name: str
    timetable_dataset: str
    timetable_date: str


SCHOOLS = {
    "high": School("고등학생", "고등학교", "B10", "7010057", "가락고등학교", "1", "1", "hisTimetable", "20260304"),
    "middle": School("중학생", "중학교", "B10", "7130165", "가락중학교", "1", "1", "misTimetable", "20260304"),
    "elementary": School("초등학생", "초등학교", "B10", "7130110", "서울거여초등학교", "1", "1", "elsTimetable", "20260302"),
    "special": School("특수학교 학생", "특수학교", "B10", "7010575", "교남학교", "1", "1", "spsTimetable", "20260302"),
}


ACADEMY_KEYWORDS = (
    ("수학", "수학에 관심이 생긴 아이"),
    ("영어", "영어 말하기를 더 해보고 싶은 아이"),
    ("미술", "그림 그리기를 좋아하는 아이"),
    ("피아노", "음악 활동에 관심 있는 아이"),
    ("댄스", "몸을 움직이는 활동을 좋아하는 아이"),
)


class NeisClient:
    def __init__(self, api_key: str, sleep_seconds: float = 0.05):
        self.api_key = api_key
        self.sleep_seconds = sleep_seconds
        self.cache: dict[tuple[str, tuple[tuple[str, str], ...]], dict[str, Any]] = {}

    def get(self, dataset: str, params: dict[str, str]) -> dict[str, Any]:
        clean_params = {key: str(value) for key, value in params.items() if value is not None and value != ""}
        cache_key = (dataset, tuple(sorted(clean_params.items())))
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            return {**cached, "cached": True}

        query = {
            "KEY": self.api_key,
            "Type": "json",
            "pIndex": "1",
            "pSize": "100",
            **clean_params,
        }
        url = f"{BASE_URL}/{dataset}?{urllib.parse.urlencode(query)}"
        safe_url = redact_key(url)
        started = datetime.now(timezone.utc).isoformat()
        try:
            with urllib.request.urlopen(url, timeout=20) as response:
                body = response.read().decode("utf-8", errors="replace")
                http_status = response.status
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            result = {
                "dataset": dataset,
                "params": clean_params,
                "url": safe_url,
                "httpStatus": error.code,
                "result": {"code": "HTTP_ERROR", "message": body[:300]},
                "rows": [],
                "rowCount": 0,
                "listTotalCount": None,
                "cached": False,
                "fetchedAt": started,
            }
            self.cache[cache_key] = result
            return result

        payload = json.loads(body)
        rows = extract_rows(payload, dataset)
        head = extract_head(payload, dataset)
        result = {
            "dataset": dataset,
            "params": clean_params,
            "url": safe_url,
            "httpStatus": http_status,
            "result": extract_result(payload, dataset),
            "rows": rows,
            "rowCount": len(rows),
            "listTotalCount": extract_total_count(head),
            "cached": False,
            "fetchedAt": started,
        }
        self.cache[cache_key] = result
        time.sleep(self.sleep_seconds)
        return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json-output", default="tmp/neis_parent_scenario_report.json")
    parser.add_argument("--md-output", default="tmp/neis_parent_scenario_report.md")
    parser.add_argument("--sleep", type=float, default=0.05)
    args = parser.parse_args()

    api_key = os.environ.get("KEDU_INFO_KEY")
    if not api_key:
        print("KEDU_INFO_KEY is required. Source .env first.", file=sys.stderr)
        return 2

    client = NeisClient(api_key, args.sleep)
    scenarios = build_scenarios()
    results = []
    for scenario in scenarios:
        print(f"Running {scenario['id']} {scenario['title']}", file=sys.stderr)
        result = scenario["runner"](client)
        results.append({
            "id": scenario["id"],
            "category": scenario["category"],
            "title": scenario["title"],
            "parentQuestion": scenario["question"],
            "childContext": scenario["childContext"],
            **result,
        })

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "baseUrl": BASE_URL,
        "scenarioCount": len(results),
        "passCount": sum(1 for item in results if item["status"] == "pass"),
        "results": results,
    }

    json_path = Path(args.json_output)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    md_path = Path(args.md_output)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.write_text(render_markdown(report), encoding="utf-8")

    print(f"Wrote {json_path}", file=sys.stderr)
    print(f"Wrote {md_path}", file=sys.stderr)
    print(f"{report['passCount']}/{report['scenarioCount']} scenarios passed")
    return 0 if report["passCount"] == report["scenarioCount"] else 1


def build_scenarios() -> list[dict[str, Any]]:
    scenarios: list[dict[str, Any]] = []

    def add(category: str, title: str, question: str, child_context: str, runner: Callable[[NeisClient], dict[str, Any]]) -> None:
        scenarios.append({
            "id": f"NEIS-PARENT-{len(scenarios) + 1:03d}",
            "category": category,
            "title": title,
            "question": question,
            "childContext": child_context,
            "runner": runner,
        })

    for school_key, school in SCHOOLS.items():
        for period in range(1, 6):
            add(
                "학습/시간표",
                f"{school.label} {period}교시 수업 확인",
                f"우리 아이가 {compact_to_kr(school.timetable_date)} {period}교시에 뭘 배우나요?",
                f"{school.name} {school.grade}학년 {school.class_name}반",
                timetable_runner(school_key, {"PERIO": str(period)}, f"{period}교시 수업"),
            )

    for school_key, school in SCHOOLS.items():
        add("학습/시간표", f"{school.label} 하루 수업 흐름", "오늘 하루 과목 흐름을 한 번에 볼 수 있나요?", f"{school.name} {school.grade}학년 {school.class_name}반", timetable_runner(school_key, {}, "하루 시간표"))
        add("학습/시간표", f"{school.label} 1반 수업 확인", "아이 반 기준으로 어떤 수업이 잡혀 있나요?", f"{school.name} {school.grade}학년 {school.class_name}반", timetable_runner(school_key, {"GRADE": school.grade, "CLASS_NM": school.class_name}, "학년/반 시간표"))
        add("학습/시간표", f"{school.label} 주간 수업 후보", "이번 주 초반에는 어떤 수업이 이어지나요?", f"{school.name} {school.grade}학년 {school.class_name}반", timetable_runner(school_key, {"TI_FROM_YMD": "20260302", "TI_TO_YMD": "20260306"}, "기간 시간표"))
        add("학습/시간표", f"{school.label} 방과 전 마지막 수업", "하교 전에 마지막으로 어떤 수업을 하나요?", f"{school.name} {school.grade}학년 {school.class_name}반", timetable_runner(school_key, {}, "마지막 교시", pick="last"))
        add("학습/시간표", f"{school.label} 내일 준비물 추정용 수업", "내일 어떤 과목을 챙겨야 할지 시간표로 볼 수 있나요?", f"{school.name} {school.grade}학년 {school.class_name}반", timetable_runner(school_key, {"TI_FROM_YMD": "20260302", "TI_TO_YMD": "20260306"}, "다음 등교일 시간표"))

    for index in range(1, 26):
        add(
            "급식/식단",
            f"급식 식단 확인 {index}",
            meal_question(index),
            f"{SCHOOLS['high'].name} 급식",
            meal_runner(index),
        )

    for index in range(1, 21):
        add(
            "학사일정/내일",
            f"학사일정 확인 {index}",
            schedule_question(index),
            f"{SCHOOLS['high'].name} 2026학년도 1학기",
            schedule_runner(index),
        )

    lookup_specs = [
        ("학교 찾기", "서울고등학교 후보를 정확히 찾을 수 있나요?", "schoolInfo", {"SCHUL_NM": "서울고등학교"}, "SCHUL_NM"),
        ("초등학교 후보", "서울의 초등학교 후보를 넓게 볼 수 있나요?", "schoolInfo", {"SCHUL_KND_SC_NM": "초등학교", "LCTN_SC_NM": "서울특별시"}, "SCHUL_NM"),
        ("고등학교 학급", "아이 학년에는 몇 반까지 있나요?", "classInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "GRADE": "1"}, "CLASS_NM"),
        ("중학교 학급", "중학생 아이 반 선택값을 확인할 수 있나요?", "classInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130165", "AY": "2026", "GRADE": "1"}, "CLASS_NM"),
        ("초등학교 학급", "초등학생 아이 반 선택값을 확인할 수 있나요?", "classInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130110", "AY": "2026", "GRADE": "1"}, "CLASS_NM"),
    ]
    for title, question, dataset, params, focus_field in lookup_specs:
        add("학교맥락/조회준비", title, question, "학교·학급 맥락 확인", lookup_runner(dataset, params, focus_field))

    for keyword, context in ACADEMY_KEYWORDS:
        second_filter = {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": keyword, "LE_CRSE_NM": "댄스" if keyword == "댄스" else "보습"}
        for suffix, params in [
            ("후보", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": keyword}),
            ("세부 과정", second_filter),
        ]:
            add(
                "관심사/학원",
                f"{keyword} 관심사 학원 {suffix}",
                f"{context}에게 공식 등록 학원 후보를 찾아볼 수 있나요?",
                context,
                academy_runner(params),
            )

    add_extended_scenarios(add)
    add_composite_and_edge_scenarios(add)
    add_parameter_matrix_scenarios(add)

    if len(scenarios) != 300:
        raise RuntimeError(f"expected 300 scenarios, got {len(scenarios)}")
    return scenarios


def add_extended_scenarios(add: Callable[[str, str, str, str, Callable[[NeisClient], dict[str, Any]]], None]) -> None:
    for index in range(26, 46):
        add(
            "급식/식단",
            f"급식 세부 해석 {index - 25}",
            detailed_meal_question(index),
            f"{SCHOOLS['high'].name} 급식 세부 확인",
            meal_runner(index),
        )

    for index in range(21, 41):
        add(
            "학사일정/내일",
            f"일정 준비 체크 {index - 20}",
            detailed_schedule_question(index),
            f"{SCHOOLS['high'].name} 행사 준비",
            schedule_runner(index),
        )

    school_profile_fields = [
        ("학교 주소 확인", "학교 위치와 등하교 동선을 확인할 수 있나요?", "ORG_RDNMA"),
        ("학교 연락처 확인", "급하게 문의할 학교 전화번호를 찾을 수 있나요?", "ORG_TELNO"),
        ("학교 홈페이지 확인", "가정통신문을 볼 홈페이지를 찾을 수 있나요?", "HMPG_ADRES"),
        ("설립 구분 확인", "공립/사립 같은 학교 성격을 확인할 수 있나요?", "FOND_SC_NM"),
        ("학교 종류 확인", "초중고/특수학교 구분을 API로 확정할 수 있나요?", "SCHUL_KND_SC_NM"),
    ]
    for school in SCHOOLS.values():
        for title, question, field in school_profile_fields:
            add(
                "학교맥락/조회준비",
                f"{school.label} {title}",
                question,
                f"{school.name} 기본정보",
                lookup_runner("schoolInfo", {"ATPT_OFCDC_SC_CODE": school.office, "SD_SCHUL_CODE": school.code}, field),
            )

    time_intents = [
        ("등교 직후 대화", "아침에 첫 수업이 뭐냐고 물으면 답할 수 있나요?", "1"),
        ("오전 중간 대화", "오전 중간에는 어떤 과목을 배우는지 말해줄 수 있나요?", "2"),
        ("점심 전 대화", "점심 전까지 어떤 수업이 이어지는지 볼 수 있나요?", "3"),
        ("오후 첫 수업 대화", "점심 먹고 어떤 수업으로 돌아가는지 볼 수 있나요?", "4"),
        ("마무리 수업 대화", "하교 전 마지막 쪽 수업을 확인할 수 있나요?", "5"),
    ]
    for school_key, school in SCHOOLS.items():
        for title, question, period in time_intents:
            add(
                "부모-아이 대화/시간대",
                f"{school.label} {title}",
                question,
                f"{school.name} {school.grade}학년 {school.class_name}반",
                timetable_runner(school_key, {"PERIO": period}, title),
            )

    academy_extra = [
        ("수학", "수학 선행보다 보습 중심 후보가 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "수학", "LE_CRSE_NM": "보습"}),
        ("수학", "수학 학원 후보를 넓게 비교할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "수학"}),
        ("영어", "영어 회화 전후로 다닐 후보가 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "영어"}),
        ("영어", "영어 보습 과정으로 좁힐 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "영어", "LE_CRSE_NM": "보습"}),
        ("미술", "그림 좋아하는 아이에게 미술 후보가 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "미술"}),
        ("미술", "미술 세부 과정 후보가 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "미술", "LE_CRSE_NM": "미술"}),
        ("피아노", "피아노 관심 학원 후보가 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "피아노"}),
        ("피아노", "음악 계열 후보를 좁힐 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "피아노", "LE_CRSE_NM": "음악"}),
        ("댄스", "댄스 학원 후보를 볼 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "댄스"}),
        ("댄스", "댄스 과정으로 좁힐 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "댄스", "LE_CRSE_NM": "댄스"}),
        ("논술", "글쓰기에 관심 있는 아이에게 논술 후보가 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "논술"}),
        ("논술", "논술 보습 후보를 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "논술", "LE_CRSE_NM": "보습"}),
        ("과학", "과학에 관심 있는 아이에게 후보가 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "과학"}),
        ("국어", "독서나 국어 관심 후보를 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "국어"}),
        ("코딩", "코딩 관심 후보를 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "코딩"}),
        ("음악", "음악 활동 후보를 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "음악"}),
        ("무용", "무용 활동 후보를 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "무용"}),
        ("발레", "발레 관심 후보를 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "발레"}),
        ("보습", "보습 과정 전체 후보를 볼 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "LE_CRSE_NM": "보습"}),
        ("댄스", "기예 활동 후보를 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "LE_CRSE_NM": "댄스"}),
    ]
    for keyword, question, params in academy_extra:
        add(
            "관심사/학원",
            f"추가 관심사 {keyword}",
            question,
            f"{keyword} 관심 부모 요청",
            academy_runner(params),
        )


def add_composite_and_edge_scenarios(add: Callable[[str, str, str, str, Callable[[NeisClient], dict[str, Any]]], None]) -> None:
    composite_specs = [
        ("학교명으로 오늘 수업 찾기", "학교 이름만 말했을 때 학교코드 resolve 후 시간표까지 갈 수 있나요?", composite_school_to_timetable_runner("가락고등학교", "고등학교", "1", "1", "20260304", "hisTimetable")),
        ("학교명으로 급식 찾기", "학교 이름만 말했을 때 오늘 점심까지 찾을 수 있나요?", composite_school_to_meal_runner("가락고등학교", "고등학교")),
        ("학교명으로 일정 찾기", "학교 이름만 말했을 때 이번 달 학교 일정을 찾을 수 있나요?", composite_school_to_schedule_runner("가락고등학교", "고등학교", "20260301", "20260331")),
        ("학교명으로 학급 확인", "학교 이름과 학년만으로 반 목록을 확인할 수 있나요?", composite_school_to_class_runner("가락고등학교", "고등학교", "1")),
        ("시간표와 급식 묶기", "오늘 배우는 것과 먹는 것을 한 번에 요약할 수 있나요?", composite_day_brief_runner("high")),
        ("시간표와 일정 묶기", "오늘 수업과 학교 행사를 같이 확인할 수 있나요?", composite_timetable_schedule_runner("high")),
        ("급식과 일정 묶기", "체험학습 같은 날 급식 정보도 함께 볼 수 있나요?", composite_meal_schedule_runner()),
        ("중학교 학교명 시간표", "중학교 이름만으로 시간표 조회까지 갈 수 있나요?", composite_school_to_timetable_runner("가락중학교", "중학교", "1", "1", "20260304", "misTimetable")),
        ("초등학교 학교명 시간표", "초등학교 이름만으로 시간표 조회까지 갈 수 있나요?", composite_school_to_timetable_runner("서울거여초등학교", "초등학교", "1", "1", "20260302", "elsTimetable")),
        ("특수학교 학교명 시간표", "특수학교 이름만으로 시간표 조회까지 갈 수 있나요?", composite_school_to_timetable_runner("교남학교", "특수학교", "1", "1", "20260302", "spsTimetable")),
    ]
    for repeat in range(3):
        for title, question, runner in composite_specs:
            add(
                "복합쿼리/멀티스텝",
                f"{title} #{repeat + 1}",
                question,
                "부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황",
                runner,
            )

    edge_specs = [
        ("없는 학교명", "존재하지 않는 학교명을 물으면 데이터 없음으로 정리할 수 있나요?", expected_result_runner("schoolInfo", {"SCHUL_NM": "없는학교이름XYZ"}, "INFO-200", "없는 학교명은 후보 없음으로 안내")),
        ("너무 넓은 학교명", "학교명이 너무 넓으면 여러 후보를 보여줄 수 있나요?", min_rows_runner("schoolInfo", {"SCHUL_NM": "서울"}, 2, "여러 학교 후보가 있어 추가 확인 필요")),
        ("없는 급식 날짜", "급식 없는 날짜를 물으면 API 장애와 구분할 수 있나요?", expected_result_runner("mealServiceDietInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "MLSV_YMD": "20260101"}, "INFO-200", "급식 데이터 없음")),
        ("없는 일정 날짜", "행사 없는 날짜를 물으면 빈 일정으로 처리할 수 있나요?", expected_result_runner("SchoolSchedule", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AA_YMD": "20260405"}, "INFO-200", "일정 데이터 없음")),
        ("없는 시간표 교시", "없는 교시를 물으면 조건을 넓히라고 말할 수 있나요?", expected_result_runner("hisTimetable", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "SEM": "1", "ALL_TI_YMD": "20260304", "GRADE": "1", "CLASS_NM": "1", "PERIO": "99"}, "INFO-000", "서버가 PERIO를 완전 필터링하지 않을 수 있어 클라이언트 필터 필요")),
        ("과도한 pSize", "한 번에 너무 많이 요청하면 에러 코드를 해석할 수 있나요?", expected_result_runner("acaInsTiInfo", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "수학", "pSize": "3000"}, "ERROR-336", "pSize는 1000 이하로 재시도")),
        ("페이지 범위 초과", "마지막 페이지 밖을 요청하면 빈 결과로 해석할 수 있나요?", expected_result_runner("acaInsTiInfo", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "수학", "pIndex": "999", "pSize": "100"}, "INFO-200", "페이지 범위 초과 또는 남은 데이터 없음")),
        ("없는 학원 관심사", "NEIS에 없는 관심사를 물으면 대체 검색어를 제안할 수 있나요?", expected_result_runner("acaInsTiInfo", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "태권도"}, "INFO-200", "등록 학원명 후보 없음")),
        ("학년 불일치", "없는 학년 학급을 물으면 조건 오류로 안내할 수 있나요?", expected_result_runner("classInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "GRADE": "9"}, "INFO-200", "학년/학교 조건에 맞는 학급 없음")),
        ("과거 시간표 공백", "조회 불가 과거 시간표는 빈 결과로 처리할 수 있나요?", expected_result_runner("elsTimetable", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130110", "AY": "2024", "SEM": "1"}, "INFO-200", "2024 시간표는 현재 endpoint에서 비어 있을 수 있음")),
    ]
    for repeat in range(2):
        for title, question, runner in edge_specs:
            add(
                "엣지케이스/오류해석",
                f"{title} #{repeat + 1}",
                question,
                "부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황",
                runner,
            )


def add_parameter_matrix_scenarios(add: Callable[[str, str, str, str, Callable[[NeisClient], dict[str, Any]]], None]) -> None:
    school_matrix = [
        ("서울 고등학교명+위치", "서울 지역 고등학교만 좁혀 찾을 수 있나요?", "schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SCHUL_KND_SC_NM": "고등학교", "LCTN_SC_NM": "서울특별시"}, "SCHUL_NM"),
        ("서울 중학교명+위치", "서울 지역 중학교만 좁혀 찾을 수 있나요?", "schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SCHUL_KND_SC_NM": "중학교", "LCTN_SC_NM": "서울특별시"}, "SCHUL_NM"),
        ("서울 초등학교명+위치", "서울 지역 초등학교만 좁혀 찾을 수 있나요?", "schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SCHUL_KND_SC_NM": "초등학교", "LCTN_SC_NM": "서울특별시"}, "SCHUL_NM"),
        ("경기 고등학교 위치", "경기 지역 고등학교 후보도 같은 방식으로 찾을 수 있나요?", "schoolInfo", {"ATPT_OFCDC_SC_CODE": "J10", "SCHUL_KND_SC_NM": "고등학교", "LCTN_SC_NM": "경기도"}, "SCHUL_NM"),
        ("부산 초등학교 위치", "부산 지역 초등학교 후보도 찾을 수 있나요?", "schoolInfo", {"ATPT_OFCDC_SC_CODE": "C10", "SCHUL_KND_SC_NM": "초등학교", "LCTN_SC_NM": "부산광역시"}, "SCHUL_NM"),
        ("공립 학교 필터", "공립 학교만 좁혀 후보를 볼 수 있나요?", "schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "FOND_SC_NM": "공립", "SCHUL_KND_SC_NM": "고등학교"}, "SCHUL_NM"),
        ("사립 학교 필터", "사립 학교만 좁혀 후보를 볼 수 있나요?", "schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "FOND_SC_NM": "사립", "SCHUL_KND_SC_NM": "초등학교"}, "SCHUL_NM"),
        ("학교코드 직접", "학교코드만 있을 때 학교를 복원할 수 있나요?", "schoolInfo", {"SD_SCHUL_CODE": "7010057"}, "SCHUL_NM"),
        ("학교명+교육청", "학교명과 교육청을 함께 쓰면 후보를 정확히 줄일 수 있나요?", "schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SCHUL_NM": "가락"}, "SCHUL_NM"),
        ("특수학교 위치", "특수학교도 위치/교육청 조합으로 찾을 수 있나요?", "schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SCHUL_KND_SC_NM": "특수학교", "LCTN_SC_NM": "서울특별시"}, "SCHUL_NM"),
    ]
    for title, question, dataset, params, field in school_matrix:
        add("파라미터매트릭스/학교위치", title, question, "지역+학교급+설립구분 복합 필터", lookup_runner(dataset, params, field))

    class_matrix = [
        ("고1 반", "고1 반 목록을 확인할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "GRADE": "1"}),
        ("고2 반", "고2 반 목록도 확인할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "GRADE": "2"}),
        ("고3 반", "고3 반 목록도 확인할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AY": "2026", "GRADE": "3"}),
        ("중1 반", "중1 반 목록을 확인할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130165", "AY": "2026", "GRADE": "1"}),
        ("중2 반", "중2 반 목록을 확인할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130165", "AY": "2026", "GRADE": "2"}),
        ("중3 반", "중3 반 목록을 확인할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130165", "AY": "2026", "GRADE": "3"}),
        ("초1 반", "초1 반 목록을 확인할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130110", "AY": "2026", "GRADE": "1"}),
        ("초2 반", "초2 반 목록을 확인할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130110", "AY": "2026", "GRADE": "2"}),
        ("초3 반", "초3 반 목록을 확인할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7130110", "AY": "2026", "GRADE": "3"}),
        ("특수 고등 과정 반", "특수학교 고등 과정 반 목록을 확인할 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010575", "AY": "2026", "GRADE": "1", "SCHUL_CRSE_SC_NM": "고등학교"}),
    ]
    for title, question, params in class_matrix:
        add("파라미터매트릭스/학년반", title, question, "학교급+학년+반 필터", lookup_runner("classInfo", params, "CLASS_NM"))

    timetable_matrix = [
        ("고1 1반 1교시", "고1 1반 1교시를 정확히 좁힐 수 있나요?", "high", {"GRADE": "1", "CLASS_NM": "1", "PERIO": "1"}),
        ("고1 2반 2교시", "고1 2반 2교시도 반 파라미터로 좁힐 수 있나요?", "high", {"GRADE": "1", "CLASS_NM": "2", "PERIO": "2"}),
        ("고2 1반 3교시", "고2 시간표도 학년 파라미터로 확인할 수 있나요?", "high", {"GRADE": "2", "CLASS_NM": "1", "PERIO": "3"}),
        ("고 계열 일반계", "고등학교 계열 필터를 함께 넣어도 조회할 수 있나요?", "high", {"GRADE": "1", "CLASS_NM": "1", "ORD_SC_NM": "일반계"}),
        ("고 학과 일반학과", "고등학교 학과 필터를 함께 넣어도 조회할 수 있나요?", "high", {"GRADE": "1", "CLASS_NM": "1", "DDDEP_NM": "일반학과"}),
        ("고 강의실 1", "강의실명까지 넣어 시간표를 좁힐 수 있나요?", "high", {"GRADE": "1", "CLASS_NM": "1", "CLRM_NM": "1"}),
        ("중1 1반 4교시", "중1 1반 4교시를 확인할 수 있나요?", "middle", {"GRADE": "1", "CLASS_NM": "1", "PERIO": "4"}),
        ("중2 1반 기간", "중2 1반 기간 시간표를 확인할 수 있나요?", "middle", {"GRADE": "2", "CLASS_NM": "1", "TI_FROM_YMD": "20260304", "TI_TO_YMD": "20260306"}),
        ("초1 1반 2교시", "초1 1반 2교시를 확인할 수 있나요?", "elementary", {"GRADE": "1", "CLASS_NM": "1", "PERIO": "2"}),
        ("초2 1반 기간", "초2 1반 기간 시간표를 확인할 수 있나요?", "elementary", {"GRADE": "2", "CLASS_NM": "1", "TI_FROM_YMD": "20260302", "TI_TO_YMD": "20260306"}),
        ("특수 과정 고등학교", "특수학교 과정명을 함께 넣어 조회할 수 있나요?", "special", {"SCHUL_CRSE_SC_NM": "고등학교", "GRADE": "1", "CLASS_NM": "1"}),
        ("특수 강의실", "특수학교 강의실 필터를 함께 넣어 조회할 수 있나요?", "special", {"GRADE": "1", "CLASS_NM": "1", "CLRM_NM": "1"}),
    ]
    for title, question, school_key, params in timetable_matrix:
        add("파라미터매트릭스/시간표복합", title, question, "학교급+학년+반+계열/학과/강의실 복합 필터", timetable_runner(school_key, params, title))

    meal_schedule_matrix = [
        ("급식 단일일자", "급식일자 하나만으로 조회할 수 있나요?", "mealServiceDietInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "MLSV_YMD": "20260504", "MMEAL_SC_CODE": "2"}, "DDISH_NM"),
        ("급식 기간", "급식 기간으로 여러 식단을 볼 수 있나요?", "mealServiceDietInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "MLSV_FROM_YMD": "20260501", "MLSV_TO_YMD": "20260531"}, "DDISH_NM"),
        ("급식 식사코드", "중식 코드로 식단을 좁힐 수 있나요?", "mealServiceDietInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "MLSV_FROM_YMD": "20260501", "MLSV_TO_YMD": "20260531", "MMEAL_SC_CODE": "2"}, "MMEAL_SC_NM"),
        ("일정 단일일자", "학사일자 하나만으로 조회할 수 있나요?", "SchoolSchedule", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AA_YMD": "20260302"}, "EVENT_NM"),
        ("일정 기간 3월", "3월 학사일정을 기간으로 조회할 수 있나요?", "SchoolSchedule", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AA_FROM_YMD": "20260301", "AA_TO_YMD": "20260331"}, "EVENT_NM"),
        ("일정 기간 5월", "5월 학사일정을 기간으로 조회할 수 있나요?", "SchoolSchedule", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AA_FROM_YMD": "20260501", "AA_TO_YMD": "20260531"}, "EVENT_NM"),
        ("일정 주야과정", "주야과정명을 함께 넣어도 조회할 수 있나요?", "SchoolSchedule", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AA_FROM_YMD": "20260301", "AA_TO_YMD": "20260331", "DGHT_CRSE_SC_NM": "주간"}, "EVENT_NM"),
        ("일정 학교과정", "학교과정명을 함께 넣어도 조회할 수 있나요?", "SchoolSchedule", {"ATPT_OFCDC_SC_CODE": "B10", "SD_SCHUL_CODE": "7010057", "AA_FROM_YMD": "20260301", "AA_TO_YMD": "20260331", "SCHUL_CRSE_SC_NM": "고등학교"}, "EVENT_NM"),
    ]
    for title, question, dataset, params, field in meal_schedule_matrix:
        add("파라미터매트릭스/급식일정", title, question, "날짜/기간/식사코드/과정 복합 필터", lookup_runner(dataset, params, field))

    academy_matrix = [
        ("강남 수학", "강남구 수학 학원 후보를 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ADMST_ZONE_NM": "강남구", "ACA_NM": "수학"}),
        ("서초 영어", "서초구 영어 학원 후보를 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ADMST_ZONE_NM": "서초구", "ACA_NM": "영어"}),
        ("강남 보습", "강남구 보습 과정 후보를 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ADMST_ZONE_NM": "강남구", "LE_CRSE_NM": "보습"}),
        ("입시검정 보습", "분야와 과정을 함께 넣어 학원을 좁힐 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "REALM_SC_NM": "입시.검정 및 보습", "LE_CRSE_NM": "보습"}),
        ("댄스 과정", "댄스 과정 학원을 과정명으로 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "LE_CRSE_NM": "댄스"}),
        ("미술 과정", "미술 과정 학원을 과정명으로 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "LE_CRSE_NM": "미술"}),
        ("음악 과정", "음악 과정 학원을 과정명으로 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "LE_CRSE_NM": "음악"}),
        ("논술 학원명", "논술 학원명을 키워드로 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "논술"}),
        ("과학 학원명", "과학 학원명을 키워드로 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "과학"}),
        ("코딩 학원명", "코딩 학원명을 키워드로 찾을 수 있나요?", {"ATPT_OFCDC_SC_CODE": "B10", "ACA_NM": "코딩"}),
    ]
    for title, question, params in academy_matrix:
        add("파라미터매트릭스/학원복합", title, question, "지역+학원명+분야+과정 복합 필터", academy_runner(params))


def composite_school_to_timetable_runner(school_name: str, school_level: str, grade: str, class_name: str, date: str, dataset: str) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        school_call = client.get("schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SCHUL_NM": school_name, "SCHUL_KND_SC_NM": school_level})
        school_row = first_row(school_call)
        timetable_call = client.get(dataset, {
            "ATPT_OFCDC_SC_CODE": school_row.get("ATPT_OFCDC_SC_CODE", "B10"),
            "SD_SCHUL_CODE": school_row.get("SD_SCHUL_CODE", ""),
            "AY": "2026",
            "SEM": "1",
            "ALL_TI_YMD": date,
            "GRADE": grade,
            "CLASS_NM": class_name,
        }) if school_row else empty_synthetic_call(dataset, "학교 후보 없음")
        rows = timetable_call["rows"]
        subjects = [row.get("ITRT_CNTNT") or "수업명 미기재" for row in rows[:7]]
        answer = f"{school_name} {grade}학년 {class_name}반 {compact_to_kr(date)}: {', '.join(subjects)}" if subjects else "시간표 데이터 없음"
        return scenario_result([school_call, timetable_call], bool(school_row and rows), answer, "학교명 resolve -> 학교코드/교육청코드 -> 시간표")
    return run


def composite_school_to_meal_runner(school_name: str, school_level: str) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        school_call = client.get("schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SCHUL_NM": school_name, "SCHUL_KND_SC_NM": school_level})
        school_row = first_row(school_call)
        meal_call = client.get("mealServiceDietInfo", {
            "ATPT_OFCDC_SC_CODE": school_row.get("ATPT_OFCDC_SC_CODE", "B10"),
            "SD_SCHUL_CODE": school_row.get("SD_SCHUL_CODE", ""),
            "MLSV_FROM_YMD": "20260501",
            "MLSV_TO_YMD": "20260531",
            "MMEAL_SC_CODE": "2",
        }) if school_row else empty_synthetic_call("mealServiceDietInfo", "학교 후보 없음")
        row = first_row(meal_call)
        answer = f"{school_name} 급식: {row.get('MLSV_YMD')} {strip_html_breaks(row.get('DDISH_NM'))}" if row else "급식 데이터 없음"
        return scenario_result([school_call, meal_call], bool(school_row and row), answer, "학교명 resolve -> 급식 기간 조회")
    return run


def composite_school_to_schedule_runner(school_name: str, school_level: str, start: str, end: str) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        school_call = client.get("schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SCHUL_NM": school_name, "SCHUL_KND_SC_NM": school_level})
        school_row = first_row(school_call)
        schedule_call = client.get("SchoolSchedule", {
            "ATPT_OFCDC_SC_CODE": school_row.get("ATPT_OFCDC_SC_CODE", "B10"),
            "SD_SCHUL_CODE": school_row.get("SD_SCHUL_CODE", ""),
            "AA_FROM_YMD": start,
            "AA_TO_YMD": end,
        }) if school_row else empty_synthetic_call("SchoolSchedule", "학교 후보 없음")
        row = first_row(schedule_call)
        answer = f"{school_name} 일정: {row.get('AA_YMD')} {row.get('EVENT_NM')}" if row else "일정 데이터 없음"
        return scenario_result([school_call, schedule_call], bool(school_row and row), answer, "학교명 resolve -> 학사일정 기간 조회")
    return run


def composite_school_to_class_runner(school_name: str, school_level: str, grade: str) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        school_call = client.get("schoolInfo", {"ATPT_OFCDC_SC_CODE": "B10", "SCHUL_NM": school_name, "SCHUL_KND_SC_NM": school_level})
        school_row = first_row(school_call)
        class_call = client.get("classInfo", {
            "ATPT_OFCDC_SC_CODE": school_row.get("ATPT_OFCDC_SC_CODE", "B10"),
            "SD_SCHUL_CODE": school_row.get("SD_SCHUL_CODE", ""),
            "AY": "2026",
            "GRADE": grade,
        }) if school_row else empty_synthetic_call("classInfo", "학교 후보 없음")
        classes = sorted({row.get("CLASS_NM") for row in class_call["rows"] if row.get("CLASS_NM")})
        answer = f"{school_name} {grade}학년 반 후보: {', '.join(classes[:12])}" if classes else "학급 데이터 없음"
        return scenario_result([school_call, class_call], bool(school_row and classes), answer, "학교명 resolve -> 학급정보 조회")
    return run


def composite_day_brief_runner(school_key: str) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        school = SCHOOLS[school_key]
        timetable_call = client.get(school.timetable_dataset, {
            "ATPT_OFCDC_SC_CODE": school.office,
            "SD_SCHUL_CODE": school.code,
            "AY": "2026",
            "SEM": "1",
            "ALL_TI_YMD": school.timetable_date,
            "GRADE": school.grade,
            "CLASS_NM": school.class_name,
        })
        meal_call = client.get("mealServiceDietInfo", {
            "ATPT_OFCDC_SC_CODE": school.office,
            "SD_SCHUL_CODE": school.code,
            "MLSV_FROM_YMD": "20260501",
            "MLSV_TO_YMD": "20260531",
            "MMEAL_SC_CODE": "2",
        })
        subjects = [row.get("ITRT_CNTNT") or "수업명 미기재" for row in timetable_call["rows"][:4]]
        meal = first_row(meal_call)
        answer = f"수업: {', '.join(subjects)} / 급식 예시: {strip_html_breaks(meal.get('DDISH_NM')) if meal else '없음'}"
        return scenario_result([timetable_call, meal_call], bool(subjects and meal), answer, "시간표 + 급식 병합")
    return run


def composite_timetable_schedule_runner(school_key: str) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        school = SCHOOLS[school_key]
        timetable_call = client.get(school.timetable_dataset, {
            "ATPT_OFCDC_SC_CODE": school.office,
            "SD_SCHUL_CODE": school.code,
            "AY": "2026",
            "SEM": "1",
            "ALL_TI_YMD": school.timetable_date,
            "GRADE": school.grade,
            "CLASS_NM": school.class_name,
        })
        schedule_call = client.get("SchoolSchedule", {
            "ATPT_OFCDC_SC_CODE": school.office,
            "SD_SCHUL_CODE": school.code,
            "AA_FROM_YMD": "20260301",
            "AA_TO_YMD": "20260331",
        })
        event = first_row(schedule_call)
        answer = f"수업 {len(timetable_call['rows'])}건, 일정 예시 {event.get('AA_YMD')} {event.get('EVENT_NM') if event else '없음'}"
        return scenario_result([timetable_call, schedule_call], bool(timetable_call["rows"] and event), answer, "시간표 + 학사일정 병합")
    return run


def composite_meal_schedule_runner() -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        school = SCHOOLS["high"]
        schedule_call = client.get("SchoolSchedule", {
            "ATPT_OFCDC_SC_CODE": school.office,
            "SD_SCHUL_CODE": school.code,
            "AA_FROM_YMD": "20260501",
            "AA_TO_YMD": "20260531",
        })
        meal_call = client.get("mealServiceDietInfo", {
            "ATPT_OFCDC_SC_CODE": school.office,
            "SD_SCHUL_CODE": school.code,
            "MLSV_FROM_YMD": "20260501",
            "MLSV_TO_YMD": "20260531",
            "MMEAL_SC_CODE": "2",
        })
        event = first_row(schedule_call)
        meal = first_row(meal_call)
        answer = f"일정 예시: {event.get('AA_YMD')} {event.get('EVENT_NM') if event else '없음'} / 급식 예시: {meal.get('MLSV_YMD') if meal else '없음'}"
        return scenario_result([schedule_call, meal_call], bool(event and meal), answer, "학사일정 + 급식 병합")
    return run


def expected_result_runner(dataset: str, params: dict[str, str], expected_code: str, explanation: str) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        call = client.get(dataset, params)
        actual_code = call["result"].get("code")
        ok = actual_code == expected_code
        if dataset in {"hisTimetable", "misTimetable", "elsTimetable", "spsTimetable"} and params.get("PERIO") and call["rows"]:
            filtered = [row for row in call["rows"] if str(row.get("PERIO")) == str(params["PERIO"])]
            ok = ok and not filtered
            answer = f"{explanation}; 서버 rows={call['rowCount']}, 클라이언트 교시 필터 후 rows={len(filtered)}"
        else:
            answer = f"{explanation}; 응답 코드 {actual_code}, rows={call['rowCount']}"
        return scenario_result([call], ok, answer, "예상 가능한 edge 응답 코드 해석")
    return run


def min_rows_runner(dataset: str, params: dict[str, str], min_rows: int, explanation: str) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        call = client.get(dataset, params)
        names = [row.get("SCHUL_NM") or row.get("ACA_NM") for row in call["rows"][:5]]
        answer = f"{explanation}; 후보 예시: {', '.join(name for name in names if name)}"
        return scenario_result([call], call["rowCount"] >= min_rows, answer, "넓은 query의 다중 후보 처리")
    return run


def first_row(call: dict[str, Any]) -> dict[str, Any]:
    return call["rows"][0] if call.get("rows") else {}


def empty_synthetic_call(dataset: str, message: str) -> dict[str, Any]:
    return {
        "dataset": dataset,
        "params": {},
        "url": "",
        "httpStatus": 200,
        "result": {"code": "LOCAL-NOOP", "message": message},
        "rows": [],
        "rowCount": 0,
        "listTotalCount": None,
        "cached": False,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
    }


def timetable_runner(school_key: str, extra: dict[str, str], intent: str, pick: str = "first") -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        school = SCHOOLS[school_key]
        params = {
            "ATPT_OFCDC_SC_CODE": school.office,
            "SD_SCHUL_CODE": school.code,
            "AY": "2026",
            "SEM": "1",
            "ALL_TI_YMD": school.timetable_date,
            "GRADE": school.grade,
            "CLASS_NM": school.class_name,
            **extra,
        }
        if "TI_FROM_YMD" in extra:
            params.pop("ALL_TI_YMD", None)
        call = client.get(school.timetable_dataset, params)
        rows = call["rows"]
        if "PERIO" in params:
            rows = [row for row in rows if str(row.get("PERIO")) == str(params["PERIO"])]
        selected = rows[-1] if rows and pick == "last" else (rows[0] if rows else {})
        answer = "데이터 없음"
        if selected:
            answer = f"{selected.get('ALL_TI_YMD')} {selected.get('PERIO')}교시: {selected.get('ITRT_CNTNT') or '수업명 미기재'}"
        return scenario_result([call], bool(rows), answer, intent)
    return run


def meal_runner(index: int) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        school = SCHOOLS["high"]
        call = client.get("mealServiceDietInfo", {
            "ATPT_OFCDC_SC_CODE": school.office,
            "SD_SCHUL_CODE": school.code,
            "MLSV_FROM_YMD": "20260501",
            "MLSV_TO_YMD": "20260531",
            "MMEAL_SC_CODE": "2",
        })
        rows = call["rows"]
        selected = rows[(index - 1) % len(rows)] if rows else {}
        answer = "데이터 없음"
        if selected:
            menu = strip_html_breaks(selected.get("DDISH_NM"))
            answer = f"{selected.get('MLSV_YMD')} {selected.get('MMEAL_SC_NM')}: {menu}; {selected.get('CAL_INFO')}"
        return scenario_result([call], bool(rows), answer, "기간 급식에서 관심 날짜 선택")
    return run


def schedule_runner(index: int) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        school = SCHOOLS["high"]
        call = client.get("SchoolSchedule", {
            "ATPT_OFCDC_SC_CODE": school.office,
            "SD_SCHUL_CODE": school.code,
            "AA_FROM_YMD": "20260301" if index <= 10 else "20260501",
            "AA_TO_YMD": "20260331" if index <= 10 else "20260531",
        })
        rows = call["rows"]
        selected = rows[(index - 1) % len(rows)] if rows else {}
        answer = "데이터 없음"
        if selected:
            grades = ",".join(label for key, label in [
                ("ONE_GRADE_EVENT_YN", "1학년"),
                ("TW_GRADE_EVENT_YN", "2학년"),
                ("THREE_GRADE_EVENT_YN", "3학년"),
                ("FR_GRADE_EVENT_YN", "4학년"),
                ("FIV_GRADE_EVENT_YN", "5학년"),
                ("SIX_GRADE_EVENT_YN", "6학년"),
            ] if selected.get(key) == "Y")
            answer = f"{selected.get('AA_YMD')} {selected.get('EVENT_NM') or selected.get('EVENT_CNTNT')} ({grades or '학년 지정 없음'})"
        return scenario_result([call], bool(rows), answer, "기간 학사일정에서 행사 선택")
    return run


def lookup_runner(dataset: str, params: dict[str, str], focus_field: str) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        call = client.get(dataset, params)
        values = []
        for row in call["rows"][:8]:
            value = row.get(focus_field)
            if value not in values:
                values.append(value)
        answer = ", ".join(str(value) for value in values if value not in (None, "")) or "값 없음"
        return scenario_result([call], bool(call["rows"]), answer, f"{dataset}.{focus_field} 확인")
    return run


def academy_runner(params: dict[str, str]) -> Callable[[NeisClient], dict[str, Any]]:
    def run(client: NeisClient) -> dict[str, Any]:
        call = client.get("acaInsTiInfo", params)
        rows = call["rows"]
        selected = rows[0] if rows else {}
        answer = "데이터 없음"
        if selected:
            answer = f"{selected.get('ACA_NM')} / {selected.get('REALM_SC_NM')} / {selected.get('LE_CRSE_NM')} / {selected.get('FA_RDNMA')}"
        return scenario_result([call], bool(rows), answer, "관심사 기반 공식 등록 학원 후보")
    return run


def scenario_result(calls: list[dict[str, Any]], ok: bool, answer: str, interpretation: str) -> dict[str, Any]:
    return {
        "status": "pass" if ok and all(call["httpStatus"] == 200 for call in calls) else "fail",
        "interpretation": interpretation,
        "answer": answer,
        "steps": [
            {
                "step": index,
                "api": f"GET /hub/{call['dataset']}",
                "params": call["params"],
                "resultCode": call["result"].get("code"),
                "resultMessage": call["result"].get("message"),
                "rowCount": call["rowCount"],
                "listTotalCount": call["listTotalCount"],
                "cached": call["cached"],
                "url": call["url"],
            }
            for index, call in enumerate(calls, start=1)
        ],
    }


def meal_question(index: int) -> str:
    questions = [
        "오늘 점심에 아이가 뭘 먹나요?",
        "급식에 알레르기 번호가 붙은 메뉴가 있나요?",
        "칼로리는 어느 정도인가요?",
        "단백질이나 영양 정보까지 볼 수 있나요?",
        "한 달 급식 중 아이가 좋아할 만한 메뉴를 찾을 수 있나요?",
    ]
    return questions[(index - 1) % len(questions)]


def detailed_meal_question(index: int) -> str:
    questions = [
        "급식 원산지 정보까지 확인해서 아이와 이야기할 수 있나요?",
        "이번 달 중 매운 메뉴처럼 보이는 날을 찾을 단서를 얻을 수 있나요?",
        "칼로리와 영양 정보를 함께 보고 저녁 메뉴를 조정할 수 있나요?",
        "알레르기 번호가 붙은 메뉴를 부모가 미리 확인할 수 있나요?",
        "급식이 없는 날인지, 단순히 검색 조건이 좁은 건지 구분할 수 있나요?",
    ]
    return questions[(index - 1) % len(questions)]


def schedule_question(index: int) -> str:
    questions = [
        "내일 학교에서 특별한 일정이 있나요?",
        "이번 달 쉬는 날이나 행사가 있나요?",
        "아이 학년에 해당하는 행사인지 볼 수 있나요?",
        "현장체험학습 같은 준비가 필요한 날을 찾을 수 있나요?",
        "등교 전에 확인해야 할 학교 일정을 볼 수 있나요?",
    ]
    return questions[(index - 1) % len(questions)]


def detailed_schedule_question(index: int) -> str:
    questions = [
        "행사명과 학년 대상 여부를 같이 확인할 수 있나요?",
        "공휴일과 학교 행사를 구분해서 볼 수 있나요?",
        "가정에서 준비가 필요할 수 있는 일정을 미리 찾을 수 있나요?",
        "이번 달 반복해서 확인해야 할 학교 일정을 모아볼 수 있나요?",
        "내일 아이에게 물어볼 학교 일정 대화거리를 만들 수 있나요?",
    ]
    return questions[(index - 1) % len(questions)]


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
        if isinstance(item, dict) and ("list_total_count" in item or "LIST_TOTAL_COUNT" in item):
            try:
                return int(item.get("list_total_count", item.get("LIST_TOTAL_COUNT")))
            except (TypeError, ValueError):
                return None
    return None


def extract_result(payload: dict[str, Any], dataset: str) -> dict[str, str | None]:
    if isinstance(payload.get("RESULT"), dict):
        return {"code": payload["RESULT"].get("CODE"), "message": payload["RESULT"].get("MESSAGE")}
    for item in extract_head(payload, dataset):
        if isinstance(item, dict) and isinstance(item.get("RESULT"), dict):
            return {"code": item["RESULT"].get("CODE"), "message": item["RESULT"].get("MESSAGE")}
    return {"code": None, "message": None}


def strip_html_breaks(value: Any) -> str:
    return " / ".join(part.strip() for part in str(value or "").replace("<br/>", "\n").replace("<br>", "\n").splitlines() if part.strip())


def compact_to_kr(value: str) -> str:
    return f"{value[:4]}-{value[4:6]}-{value[6:8]}"


def redact_key(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    query = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    redacted = [(key, "***" if key == "KEY" else value) for key, value in query]
    return urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(redacted)))


def render_markdown(report: dict[str, Any]) -> str:
    scenario_count = report["scenarioCount"]
    lines = [
        f"# NEIS 부모 시나리오 {scenario_count}개 라이브 테스트 리포트",
        "",
        f"- 생성시각: `{report['generatedAt']}`",
        f"- Base URL: `{report['baseUrl']}`",
        f"- 시나리오: {report['scenarioCount']}개",
        f"- 통과: {report['passCount']}개",
        "- 원시 로그: `tmp/neis_parent_scenario_report.json`",
        "- 주의: NEIS는 아이 개인의 관심사를 직접 보유하지 않는다. 관심사 시나리오는 부모가 입력한 관심사를 공식 등록 학원/학교 일정/시간표와 연결하는 방식으로만 해석한다.",
        "",
        "## 카테고리별 요약",
        "",
        "| 카테고리 | 개수 | 통과 | 사용 API |",
        "|---|---:|---:|---|",
    ]
    categories = sorted({item["category"] for item in report["results"]})
    for category in categories:
        items = [item for item in report["results"] if item["category"] == category]
        apis = sorted({step["api"].replace("GET /hub/", "") for item in items for step in item["steps"]})
        lines.append(f"| {category} | {len(items)} | {sum(1 for item in items if item['status'] == 'pass')} | {', '.join(apis)} |")

    lines += [
        "",
        f"## {scenario_count}개 시나리오 로그",
        "",
    ]
    for item in report["results"]:
        lines += [
            f"### {item['id']} {item['title']}",
            "",
            f"- 부모 질문: {item['parentQuestion']}",
            f"- 아이/상황: {item['childContext']}",
            f"- 상태: `{item['status']}`",
            f"- 해석: {item['interpretation']}",
            f"- 답변 예시: {item['answer']}",
            "",
            "| Step | API | 주요 파라미터 | Result | Rows/Total |",
            "|---:|---|---|---|---:|",
        ]
        for step in item["steps"]:
            params = ", ".join(f"{key}={value}" for key, value in step["params"].items())
            lines.append(f"| {step['step']} | `{step['api']}` | `{params}` | `{step['resultCode']}` {step['resultMessage']} | {step['rowCount']}/{step['listTotalCount']} |")
        lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    raise SystemExit(main())
