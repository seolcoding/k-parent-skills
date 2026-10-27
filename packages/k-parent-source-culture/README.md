# k-parent-source-culture

문화포털(culture.go.kr) 공연전시정보 source adapter for k-parent-skills.

## Usage

```js
const { fetchCultureEvents, parseCultureEvents } = require("k-parent-source-culture");
```

`fetchCultureEvents({ from, to, area, rows })` calls the culture portal
공연전시정보 endpoint and returns `response.msgBody.perforList`.

## 교과 연계 체험 데이터 (api.kcisa.kr)

`k-parent-field-trip` 스킬이 쓰는 문화공공데이터광장 5개 API를 하나의 experience 형태로 정규화한다.

```js
const { searchExperiences, parseExperiences, EXPERIENCE_DATASETS } = require("k-parent-source-culture");

const result = await searchExperiences({ sido: "서울", gradeLevel: "초등", grade: 6, eras: ["고려"] });
```

| dataset | API | path |
| --- | --- | --- |
| 598 | 전시정보(통합) | `/openapi/API_CCA_145/request` |
| 540 | 국립지방박물관 문화행사 통합 | `/openapi/service/CNV/API_CNV_043/request` |
| 84 | 문화재청_문화재정보 | `/openapi/service/rest/meta/CHAheri` |
| 495 | 대한민국역사박물관 교육프로그램 | `/openapi/service/rest/meta2020/getMCHBedu` |
| 639 | 국립한글박물관 문화행사 | `/openapi/API_CCA_164/request` |

Fixtures(`test/fixtures/experience-*.json`) are real responses captured from the culture.go.kr API preview on 2026-10-27. Live calls are not verified yet.

```bash
KSKILL_CULTURE_KEY=... npm run refresh:experience-fixtures
```

## Configuration

- `KSKILL_CULTURE_KEY` — 문화포털 서비스키 (https://www.culture.go.kr).
- `KSKILL_CULTURE_KEY_<dataset>` — 교과 연계 체험 API별 키가 다를 때 덮어쓰기.
- 알려진 문제: 공연전시정보 `publicperformancedisplays/area`는 키 없이 호출하면 문화포털 오류 페이지로 리다이렉트된다(2026-10-27). 키를 넣은 호출은 미확인.

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

Tests run fully offline from `test/fixtures/`.

## Fixtures refresh

Run this command only when you are ready to call the live API and overwrite local fixtures.

```bash
KSKILL_CULTURE_KEY=... npm run refresh:fixtures
```
