---
name: k-parent-field-trip
description: 대한민국 초등 부모가 아이가 학교에서 배우는 단원(2022 개정 성취기준)과 이어지는 박물관 전시·교육프로그램·문화유산 체험을 찾는 교과 연계 체험학습 스킬. 문화공공데이터광장 5개 API(국립 박물관·미술관 전시 통합, 국립지방박물관 교육·행사, 문화재정보, 대한민국역사박물관 교육프로그램, 국립한글박물관 행사)를 packages/k-parent-source-culture searchExperiences로 조회해 학년·지역·시대로 거른다. "4학년 우리 지역 문화유산 단원인데 주말에 갈 곳", "6학년 고려 시대 배우는데 관련 전시 있어?", "독립운동 단원이랑 연결되는 박물관 교육" 같은 요청에 사용. 단원과 무관한 놀거리는 k-parent-play-finder, 축제는 k-parent-festival-finder, 접수형 강좌 전반은 k-parent-culture-center-events.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: p0
---

# 교과 연계 체험학습

## 핵심 동작

아이가 지금 배우는 단원을 성취기준으로 확정하고, 그 단원과 이어지는 박물관 전시·교육프로그램·문화유산을 찾아 "왜 이 단원과 연결되는지"와 함께 추천한다.
결정형 구현은 `packages/k-parent-source-culture`의 `searchExperiences`다. 성취기준 → 검색 조건 매핑은 `references/standards-map.md`에 있다.

## 사용 시점

- "4학년 우리 지역 문화유산 단원인데 주말에 갈 만한 곳"
- "6학년 고려 시대 배우는데 관련 전시 있어?"
- "독립운동 단원이랑 연결되는 박물관 교육 프로그램"
- "아이가 한글 배우는데 한글박물관 행사 뭐 있어?"

## 준비 사항

- 문화공공데이터광장 서비스키: `KSKILL_CULTURE_KEY` (API별로 다르면 `KSKILL_CULTURE_KEY_598`, `_540`, `_84`, `_495`, `_639`)
  - 키 없이는 조회되지 않는다(401). 키 신청은 부모가 직접 한다: culture.go.kr 각 API 상세 → 활용신청 → 이메일 발급. 개발계정은 하루 1,000건.
- 성취기준 데이터: `skills/k-parent-quiz-maker/references/achievement-standards-elementary.json` (2022 개정 초등, 국어·수학·사회·과학·영어)

## 전형적 흐름

### 1. 단원 확정

- 아이 학년, 지역(시·도), 지금 배우는 단원이나 주제를 묻는다. 없으면 추측하지 않는다.
- 단원을 성취기준 코드로 바꾼다. 예: "우리 지역 문화유산" → `4사06-02`. quiz-dev MCP의 `search_standards`나 성취기준 JSON을 검색한다.
- 매핑표(`references/standards-map.md`)에 없는 단원이면 "이 단원은 연결할 체험 데이터가 없다"고 말한다. 과학관 데이터는 이 소스에 없다.

### 2. 체험 검색

```js
const { searchExperiences } = require("k-parent-source-culture");

const result = await searchExperiences({
  sido: "서울",              // 학교·집 시도. "서울특별시"도 된다
  gradeLevel: "초등",
  grade: 6,
  eras: ["고려"],            // 매핑표의 eras
  datasets: ["598", "540", "84", "495"], // 매핑표의 datasets
  numOfRows: 100,
});
// result.items[]: title, institution, sido, place, startDate, endDate, status,
//   grades, charge, eras, eraSource, application(495), designation(84), url, source
// result.datasets[]: dataset별 ok / fetched / totalCount / partial
```

- 기본으로 끝난 전시·프로그램(`status: "ended"`)은 뺀다. 날짜가 없는 항목(`unknown`: 문화재, 한글박물관 행사)은 남기고 "일정 확인 필요"라고 적는다.
- 학년 표기가 없는 항목은 통과시킨다. 표기가 있으면 맞는 학년만 남는다.
- `partial: true`면 그 데이터셋 전체가 아니라 가져온 페이지 안에서만 찾은 것이다. 문화재(84)는 15,000건이 넘어 한 번에 다 볼 수 없다고 알린다.

### 3. 연결 이유와 함께 정리

- 항목마다 어떤 성취기준과 왜 이어지는지 한 줄로 쓴다. 예: "`6사04-03` 고려 시대 생활 — 고려 불교 미술품 전시".
- 시대를 설명문에서만 찾은 항목(`eraSource: "description"`)은 "설명문 기준, 연관성 확인 필요"라고 적는다.
- 문화재는 장소만 있고 운영 시간이 없다. 방문 전 관할 지자체·문화재 안내를 확인하라고 적는다.
- 교육프로그램(495)은 접수기간·정원·선정방법을 보여 준다. 신청은 부모가 박물관 사이트에서 직접 한다.

## 출력 형식

- 아이 학년, 지역, 단원(성취기준 코드와 문장)
- 체험 3~5개: 이름, 기관, 장소, 기간·상태, 대상 학년, 요금, 연결 이유, 원문 URL
- 교육프로그램이면 접수기간·정원·선정방법
- 출처: "문화공공데이터광장 <API 이름>, 공공누리 제1유형(출처표시)" + 조회 시각
- 부모의 다음 행동: 일정 확인, 예약·신청 링크, 캘린더 후보(`k-parent-schedule-manager`)

## 완료 조건

- 단원을 성취기준 코드로 확정했다(또는 매핑 불가를 알렸다).
- 끝난 행사를 추천하지 않았다.
- 항목마다 연결 이유와 출처를 적었다.
- 예약·신청은 실행하지 않았다.

## 실패 모드

- 키 없음: `searchExperiences`가 `missing_config`로 실패한다. 키 신청 안내를 한다.
- 일부 데이터셋 실패: `result.datasets`의 `ok: false` 항목을 알리고 나머지로 답한다.
- 결과 없음: 조건을 넓힌다(학년 → 시대만, 지역 → 인접 시도). 그래도 없으면 없다고 말한다.
- 지난 데이터가 많다: 전시 통합(598)·박물관 행사(540)는 과거 기록이 섞여 있다. 현재 진행 중인 것이 적을 수 있다.

## 데이터 소스

| 데이터셋 | API | 요청 경로 (`https://api.kcisa.kr/openapi`) | 쓰는 필드 |
| --- | --- | --- | --- |
| 598 | 전시정보(통합), 국립 박물관·미술관 등 23개 기관 | `/API_CCA_145/request` | 기관→시도, PERIOD, AUDIENCE, CHARGE, 제목·설명 시대 |
| 540 | 국립지방박물관 문화행사 통합 | `/service/CNV/API_CNV_043/request` | 기관→시도, period, 설명 속 학년·시대 |
| 84 | 문화재청_문화재정보 | `/service/rest/meta/CHAheri` | spatial→시도, extent(시대), subjectKeyword(지정종목) |
| 495 | 대한민국역사박물관 교육프로그램 | `/service/rest/meta2020/getMCHBedu` | grade, temporalCoverage, 접수기간·정원 |
| 639 | 국립한글박물관 문화행사 | `/API_CCA_164/request` | AUDIENCE, CHARGE |

함수: `searchExperiences(options)`, `fetchExperienceDataset(dataset, options)`, `parseExperiences(dataset, payload, options)`, `detectEras(text)`, `parseGrades(text)`.
환경변수: `KSKILL_CULTURE_KEY`, `KSKILL_CULTURE_KEY_<dataset>`.

## 참고

- 아이 이름·학교명은 검색에 쓰지 않는다. 학년과 시도만 쓴다.
- 체험 예약·교육 신청·결제는 하지 않는다. 링크만 준다.
- 음악·미술은 성취기준 데이터에 없어 단원 단위로 연결하지 않는다. 과학관은 이 소스에 없다.
- 출처: 문화공공데이터광장(culture.go.kr), 공공누리 제1유형 출처표시.

## 관련 문서

- `docs/features/k-parent-field-trip.md`
- `docs/research/education-culture-data-sources-2026-10-27.md`
