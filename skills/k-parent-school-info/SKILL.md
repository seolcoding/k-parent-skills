---
name: k-parent-school-info
description: 대한민국 초·중·고 학부모가 학교 정보를 확인할 때 쓰는 스킬. NEIS 공개데이터로 학교 기본정보·학사일정·시간표·급식을 확정해 부모 실행 단위로 정리한다(packages/k-parent-source-neis, packages/k-parent-brief, packages/k-parent-source-traffic-safety). "이번 달 학교 일정 정리해줘", "○○초 공지 확인해줘", "방과후 신청 언제까지야" 같은 요청에 사용. 급식만 따로면 k-parent-meal-planner, 종이 안내문 사진 처리는 k-parent-school-doc-capture.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: p0
---

# 학교 정보 확인

## 핵심 동작

대한민국 초·중·고 학부모가 학교 기본정보, 학사일정, 시간표, 급식, 통학 안전 보강 정보를 공식 공개 데이터로 확정해 부모 실행 단위로 정리한다. 결정형 구현은 `packages/k-parent-source-neis`, `packages/k-parent-source-traffic-safety`, `packages/k-parent-brief`를 사용한다.

## 사용 시점

- "우리 아이 학교 이번 달 일정 정리해줘"
- "○○초 공지사항 확인해줘"
- "방과후 신청 언제까지야?"
- "전학 전에 학교 정보 비교해줘"

## 전형적 흐름

### 1. 입력값 수집

- 학교명과 지역
- 아이 학년
- 확인할 정보 유형: 공지, 일정, 방과후, 급식, 통학, 시설, 돌봄
- 날짜 범위

### 2. 교육청과 학교 코드 확정

학교를 조회하기 전에 반드시 NEIS 코드 두 개를 확정한다: `ATPT_OFCDC_SC_CODE`(교육청)와 `SD_SCHUL_CODE`(학교).

```js
const { resolveSchool } = require("k-parent-source-neis");

const resolved = await resolveSchool({
  schoolName: "서울미래초등학교",
  region: "서울",          // 또는 educationOfficeCode: "B10"
  schoolLevel: "초등학교",  // 동명 학교 구분에 사용
});
// resolved.ok === true 일 때 resolved.school.schoolCode / school.atptOfcdcScCode 사용
```

`resolveSchool`이 `ambiguous`를 반환하면 임의로 하나를 고르지 않고 `candidates`(이름, 주소, 학교급)를 사용자에게 보여주고 재확인한다. 시도교육청 코드 참조표는 `references/neis-office-codes.md`를 본다.

### 3. 공식 데이터 조회와 요약 생성

학교 코드를 확정한 뒤 NEIS 함수를 호출한다. 모두 `educationOfficeCode`(또는 `atptOfcdcScCode`)와 `schoolCode`가 필요하다.

```js
const { getMeals, getSchedule, getTimetable } = require("k-parent-source-neis");
const { composeTodayBrief } = require("k-parent-brief");

const office = resolved.school.atptOfcdcScCode;
const code = resolved.school.schoolCode;

const meals = await getMeals({ educationOfficeCode: office, schoolCode: code, date: "2026-05-01" });
const schedule = await getSchedule({ educationOfficeCode: office, schoolCode: code, startDate: "2026-05-01", endDate: "2026-05-31" });
const timetable = await getTimetable({ educationOfficeCode: office, schoolCode: code, schoolLevel: "초등학교", date: "2026-05-01" });
// getTimetable는 schoolLevel(초/중/고) 또는 dataset(els/mis/his)로 elsTimetable/misTimetable/hisTimetable를 선택한다.

const brief = composeTodayBrief({
  date: "2026-05-01",
  childProfile: { stage: "lower_elementary" },
  school: resolved.school,
  meals: meals.ok ? meals.meals : [],
  scheduleItems: schedule.ok ? schedule.scheduleItems : [],
  timetable: timetable.ok ? timetable.timetable : [],
  applications: [/* 방과후·돌봄 신청 마감 {title, dueAt, source} */],
  outings: [/* 추천 나들이 {title, location, source} */],
});
```

`composeTodayBrief`는 `summary`, `warnings`, `todayTasks`, `timetable`, `upcomingDeadlines`, `suggestedOutings`, `calendarCandidates`, `sources`를 반환한다.

통학 안전을 함께 볼 때는 data.go.kr 기반 보강 source를 사용한다.

```js
const {
  fetchSchoolZoneChildAccidentHotspots,
  fetchGyeongbukChildProtectionZones,
} = require("k-parent-source-traffic-safety");

const hotspots = await fetchSchoolZoneChildAccidentHotspots({
  sido: "서울특별시",
  sigungu: "성동구",
});
const zones = await fetchGyeongbukChildProtectionZones({
  sigungu: "영천시",
});
```

### 3-1. 데이터 계약 봉투

모든 source 함수는 동일한 봉투를 따른다.

- 성공: `{ ok: true, status: "ok", ... }`
- 실패: `{ ok: false, status: <ERROR_STATUS>, message, ... }`
  - `ERROR_STATUS`: `ambiguous`, `not_found`, `stale`, `upstream_error`, `missing_config`
- 정규화된 항목(meal/schedule/timetable)에는 항상 `source` 메타데이터가 붙는다: `sourceName`, `sourceUrl`, `fetchedAt`, `freshness.status`(`fresh`/`stale`/`unknown`).

이미지/PDF 공지처럼 NEIS에 없는 출처는 공식 홈페이지로 분리해 안내한다.

### 4. 누락·중복·오래된 데이터 처리

- `ambiguous`: 후보 학교를 모두 보여주고 주소나 학교급으로 재확인한다.
- `not_found`: 공식 데이터가 없다는 점과 대체 확인 경로를 함께 안내한다.
- `missing_config`: API 키나 서버 설정이 빠진 상태로 표시하고 수동 확인 링크를 제공한다.
- `upstream_error`: 상류 장애로 분리하고 사용자의 입력 오류처럼 말하지 않는다.
- `stale` 또는 `unknown`: `source.freshness.status`와 `fetchedAt`(확인 기준일)을 함께 표시하고 최신 확인 필요성을 알린다. `composeTodayBrief`는 이 경우 `source_freshness` 경고를 자동 생성한다.

### 5. 부모용 요약 생성

- 핵심 일정
- 마감일
- 준비물
- 신청/문의 링크
- 부모가 확인해야 할 리스크

## 출력 형식

응답은 부모가 바로 판단할 수 있도록 아래 필드를 포함한다.

- 아이 나이/학년 또는 대상 학년
- 학교명, 지역, 교육청 코드, 학교 코드
- 날짜 범위와 확인 기준일
- 공식 출처 URL, source freshness, 수집/확인 시각
- 일정, 마감일, 비용, 준비물, 필요 서류
- 신청/예약/문의 상태와 로그인 필요 여부
- 부모의 다음 행동
- 캘린더 후보 여부와 사용자 확인 필요 상태

## 완료 조건

- 학교를 명확히 식별했다.
- 현재 기준으로 확인 가능한 출처를 적었다.
- 일정과 신청 항목을 부모 실행 단위로 정리했다.

## 실패 모드

- 같은 이름의 학교가 여러 개 있음
- 공지가 이미지/PDF로만 제공됨
- 가정통신문이 로그인 또는 앱 안에만 있음

## 참고

- 학교 생활기록, 성적, 학생 개인정보는 사용자가 직접 제공한 범위 안에서만 다룬다.
- 로그인, 신청 제출, 취소, 결제, 아이 개인정보 입력은 사용자의 명시적 승인 없이 실행하지 않는다.
- `composeTodayBrief`의 `calendarCandidates`는 `packages/k-parent-core` guardrail에 의해 `requiresConfirmation: true`, `executable: false`로 표시된다. 실제 캘린더 쓰기는 사용자 확인 후에만 한다.
- NEIS 인증키는 `KEDU_INFO_KEY`, data.go.kr 인증키는 `KSKILL_DATAGOKR_KEY` 환경변수로 주입한다. 키가 없으면 함수는 `missing_config`로 실패하므로 수동 확인 경로를 안내한다.

## 관련 문서

- `docs/features/k-parent-school-info.md`
