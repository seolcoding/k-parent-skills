---
name: k-parent-meal-planner
description: 대한민국 부모가 아이 식단을 챙길 때 쓰는 스킬. NEIS 학교 급식·유치원 식단·가정 식단 후보를 아이 알레르기(1~19번) 기준으로 정리한다(packages/k-parent-source-neis, packages/k-parent-brief). "이번 주 급식 뭐야", "알레르기 빼고 식단 짜줘", "유치원 식단표 확인해줘" 같은 요청에 사용. 학교 공지·학사일정 전반은 k-parent-school-info.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: p0
---

# 식단 확인과 계획

## 핵심 동작

대한민국 부모가 아이의 식단을 확인하거나 계획할 때 쓴다. 학교 급식은 NEIS 공개 데이터로 확정하고, 알레르기·일정·시간표와 함께 부모용 요약으로 합친다. 결정형 구현은 `packages/k-parent-source-neis`와 `packages/k-parent-brief`를 사용한다.

## 사용 시점

- "이번 주 아이 식단 정리해줘"
- "오늘 급식 뭐야?"
- "알레르기 피해서 저녁 메뉴 추천해줘"
- "유치원 식단이랑 집밥 겹치지 않게 짜줘"

## 전형적 흐름

### 1. 입력값 수집

확인할 값을 짧게 모은다.

- 아이 나이 또는 학년
- 지역, 학교명 또는 유치원명
- 날짜 범위
- 알레르기, 못 먹는 음식, 선호 음식
- 집밥 추천까지 필요한지 여부

### 2. 교육청과 학교 코드 확정

급식을 조회하기 전에 NEIS 코드 두 개를 확정한다: `ATPT_OFCDC_SC_CODE`(교육청), `SD_SCHUL_CODE`(학교).

```js
const { resolveSchool } = require("k-parent-source-neis");

const resolved = await resolveSchool({
  schoolName: "서울미래초등학교",
  region: "서울",          // 또는 educationOfficeCode: "B10"
  schoolLevel: "초등학교",
});
// resolved.ok 가 false 이고 status === "ambiguous" 이면 후보를 사용자에게 확인받는다.
```

### 3. 급식 조회와 요약 생성

```js
const { getMeals, getSchedule, getTimetable } = require("k-parent-source-neis");
const { composeTodayBrief } = require("k-parent-brief");

const office = resolved.school.atptOfcdcScCode;
const code = resolved.school.schoolCode;

const meals = await getMeals({ educationOfficeCode: office, schoolCode: code, date: "2026-05-01" });
const schedule = await getSchedule({ educationOfficeCode: office, schoolCode: code, startDate: "2026-05-01", endDate: "2026-05-01" });
const timetable = await getTimetable({ educationOfficeCode: office, schoolCode: code, schoolLevel: "초등학교", date: "2026-05-01" });

const brief = composeTodayBrief({
  date: "2026-05-01",
  childProfile: { stage: "lower_elementary", allergyNumbers: [10] }, // 10 = 돼지고기
  school: resolved.school,
  meals: meals.ok ? meals.meals : [],
  scheduleItems: schedule.ok ? schedule.scheduleItems : [],
  timetable: timetable.ok ? timetable.timetable : [],
});
// brief.warnings 의 type === "allergy" 항목으로 아이 알레르기 매칭을 부모에게 알린다.
```

각 급식 항목은 `menuItems`, `allergens`(라벨), `allergyNumbers`(1~19), `origin`, `calories`, `nutrition`, `source`를 포함한다. 알레르기 번호 전체 코드표는 `references/allergen-codes.md`를 본다.

### 3-1. 데이터 계약 봉투

- 성공: `{ ok: true, status: "ok", meals: [...] }`
- 실패: `{ ok: false, status: <ERROR_STATUS>, message }` — `ambiguous` / `not_found`(급식 없음) / `stale` / `upstream_error` / `missing_config`.
- 모든 항목에 `source` 메타데이터(`sourceName`, `sourceUrl`, `fetchedAt`, `freshness.status`)가 붙는다.

실제 답변에서는 현재 날짜 기준으로 공식/공개 출처를 확인한다.

- 학교 급식은 NEIS 흐름을 우선 검토한다.
- 유치원 식단은 기관 공지, 알림장, 홈페이지, 지역 교육청 공개 자료를 확인한다.
- 출처가 불명확하면 "확인된 식단"과 "추천 식단"을 분리한다.

### 3. 누락·중복·오래된 데이터 처리

- 학교 후보가 여러 개면 임의 선택하지 말고 후보 이름, 주소, 교육청을 제시해 확인을 요청한다.
- 방학, 공휴일, 재량휴업일, 미등록 데이터로 급식이 없으면 `not_found` 상태와 함께 "확인된 급식 없음"으로 답한다.
- API 키가 없거나 상류가 실패하면 `missing_config` 또는 `upstream_error`를 숨기지 말고 대체 확인 경로를 안내한다.
- 출처 freshness가 `stale` 또는 `unknown`이면 `fetchedAt`(확인 기준일)을 표시하고 최신 확인 필요 경고를 함께 출력한다. `composeTodayBrief`가 `source_freshness` 경고를 자동 생성한다.

### 4. 부모용 요약 정리

부모가 바로 쓸 수 있게 아래 형식으로 정리한다.

- 날짜별 메뉴
- 알레르기·주의 재료
- 집에서 보완하면 좋은 음식
- 준비물 또는 도시락 필요 여부

## 출력 형식

- 아이 나이/학년과 알레르기 번호
- 학교/유치원명, 지역, 교육청/기관 코드
- 날짜 범위와 확인 기준일
- 공식 출처 URL, source freshness, 수집 시각
- 메뉴, 원산지, 칼로리, 영양정보, 알레르기
- 비용 또는 도시락/준비물 필요 여부
- 집밥 보완 후보와 추정/추천 구분
- 부모의 다음 행동

## 완료 조건

- 날짜 범위와 대상 아이 조건을 반영했다.
- 확인된 식단과 추천 식단을 구분했다.
- 출처와 확인 기준일을 함께 적었다.

## 실패 모드

- 기관 식단표가 비공개이거나 로그인 뒤에 있음
- 학교·유치원명이 중복됨
- 급식 데이터가 방학, 재량휴업일, 공휴일로 비어 있음

## 참고

- 아이 알레르기 정보는 저장하지 않는다. `childProfile`은 호출 단위로만 사용한다.
- 건강·의학 판단처럼 말하지 말고, 필요하면 보호자와 의료진 확인을 권한다.
- 로그인, 신청 제출, 취소, 결제, 아이 개인정보 입력은 사용자의 명시적 승인 없이 실행하지 않는다.
- 캘린더 등록 후보(`calendarCandidates`)는 `packages/k-parent-core` guardrail로 `requiresConfirmation: true`, `executable: false` 상태이며 부모 확인 전 실행하지 않는다.
- NEIS 인증키는 `KEDU_INFO_KEY` 환경변수로 주입한다. 키가 없으면 `missing_config`로 실패한다.

## 관련 문서

- `docs/features/k-parent-meal-planner.md`
