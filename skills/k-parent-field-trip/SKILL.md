---
name: k-parent-field-trip
description: 대한민국 초등 부모가 아이가 학교에서 배우는 단원(2022 개정 성취기준)과 이어지는 박물관 전시·교육프로그램·문화유산 체험을 찾는 교과 연계 체험학습 스킬. 문화공공데이터광장 API(국립 박물관·미술관 전시 통합, 국립지방박물관 교육·행사, 대한민국역사박물관 교육프로그램, 국립한글박물관 행사)와 국가유산청 국가유산 검색 API를 packages/k-parent-source-culture searchExperiences로 매번 실시간 조회해 학년·지역·시대로 거른다. "4학년 우리 지역 문화유산 단원인데 주말에 갈 곳", "6학년 고려 시대 배우는데 관련 전시 있어?", "독립운동 단원이랑 연결되는 박물관 교육" 같은 요청에 사용. 단원과 무관한 놀거리는 k-parent-play-finder, 축제는 k-parent-festival-finder, 접수형 강좌 전반은 k-parent-culture-center-events.
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

- 문화공공데이터광장 서비스키는 **API별로 따로 발급된다**(598 키로 다른 API를 부르면 401, 2026-10-28 확인). `KSKILL_CULTURE_KEY_598`, `_540`, `_84`, `_495`, `_639`에 각각 넣는다. `KSKILL_CULTURE_KEY`는 공통 기본값.
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
  datasets: ["598", "540", "khs", "495"], // 매핑표의 datasets (기본: 598, 540, khs, 495, 639)
  detailLimit: 15,           // khs: 시대 확인용 상세를 몇 건까지 받을지
});
// result.items[]: title, institution, sido, place, startDate, endDate, status,
//   grades, charge, eras, eraSource, application(495), designation(84), url, source
// result.datasets[]: dataset별 ok / fetched / totalCount / partial
```

- **캐시 없이 매번 실시간으로 조회한다.** 데이터셋끼리는 동시에, 페이지는 정해진 계획(`PAGE_PLANS`)만큼만 부른다. 한 번 조회에 20초 안팎 걸릴 수 있다.
- 끝난 항목(`ended`)과 기간이 없는 전시·행사(`unknown`)는 기본으로 뺀다. 한글박물관 행사는 등록일이 90일 안이면 `recent`로 남기고 "일정은 원문 확인"이라고 적는다. 문화재는 원래 기간이 없어 남긴다.
- 학년 표기가 없는 항목은 통과시킨다. 표기가 있으면 맞는 학년만 남는다.
- `partial: true`면 그 데이터셋 전체가 아니라 계획한 페이지 안에서만 찾은 것이다. 540은 29만 건 중 최근 쪽 100건만 본다고 알린다.
- 문화재(`khs`)는 시도가 있어야 조회한다. 시대 조건이 있으면 상세를 `detailLimit`건까지 받아 시대 필드로 거른다. 국가유산청은 요청이 몰리면 연결을 끊으므로 상세 사이에 간격을 둔다.

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
| khs | 국가유산청 국가유산 검색 (키 없음, XML) | `https://www.khs.go.kr/cha/SearchKindOpenapiList.do`, `SearchKindOpenapiDt.do` | ccbaCtcd(시도, 서버 필터), ccmaName(종목), 상세 ccceName(시대), 좌표 |
| 84 | 문화재청_문화재정보 (기본 목록에서 제외) | `/service/rest/meta/CHAheri` | 서버 필터가 없어 실시간 지역 검색에 부적합 |
| 495 | 대한민국역사박물관 교육프로그램 | `/service/rest/meta2020/getMCHBedu` | grade, temporalCoverage, 접수기간·정원 |
| 639 | 국립한글박물관 문화행사 | `/API_CCA_164/request` | AUDIENCE, CHARGE |

함수: `searchExperiences(options)`, `fetchExperienceDataset(dataset, options)`, `parseExperiences(dataset, payload, options)`, `fetchHeritageList`, `fetchHeritageDetail`, `parseHeritageList`, `detectEras(text)`, `parseGrades(text)`.
옵션: `sido`, `gradeLevel`, `grade`, `eras`, `keyword`, `datasets`, `detailLimit`, `includeEnded`, `includeUndated`, `pagePlans`.
환경변수: `KSKILL_CULTURE_KEY_<598|540|495|639>` (API별 키), `KSKILL_CULTURE_KEY`(기본값). 국가유산청은 키가 없다.

## 참고

- 아이 이름·학교명은 검색에 쓰지 않는다. 학년과 시도만 쓴다.
- 체험 예약·교육 신청·결제는 하지 않는다. 링크만 준다.
- 음악·미술은 성취기준 데이터에 없어 단원 단위로 연결하지 않는다. 과학관은 이 소스에 없다.
- 출처: 문화공공데이터광장(culture.go.kr), 공공누리 제1유형 출처표시.

## 관련 문서

- `docs/features/k-parent-field-trip.md`
- `docs/research/education-culture-data-sources-2026-10-27.md`
