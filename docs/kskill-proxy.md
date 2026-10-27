# k-skill 공개 프록시 사용 규칙

일부 부모 스킬은 [`NomaDamas/k-skill`](https://github.com/NomaDamas/k-skill)이 운영하는 공개 프록시를 호출해, 부모가 API 키 없이도 공공 무료 API를 조회할 수 있게 한다.
프록시 운영자가 공식 API 키를 서버에만 두고, 스킬은 HTTP GET 요청만 보낸다.

## 주소 정하기

```bash
BASE="${KSKILL_PROXY_BASE_URL:-https://k-skill-proxy.nomadamas.org}"
BASE="${BASE%/}"
```

- `KSKILL_PROXY_BASE_URL`이 비어 있으면 k-skill 공개 프록시를 쓴다.
- 직접 띄운 프록시나 다른 프록시를 쓰려면 이 변수에 주소를 넣는다.
- 부모 전용 NEIS 라우트(`/v1/neis/school-search`, `classes`, `timetable`, `schedule`)는 우리 `k-parent-proxy`(`KPARENT_PROXY_BASE_URL`)가 따로 있다. 급식(`/v1/neis/school-meal`)은 아직 우리 프록시에 없어 k-skill 프록시를 쓴다.

## 이 저장소가 쓰는 라우트

| 라우트 | 원천 | 쓰는 스킬 | 2026-10-27 키 없이 확인 |
| --- | --- | --- | --- |
| `/v1/neis/school-search`, `/v1/neis/school-meal` | NEIS | `k-parent-meal-planner` | 200 |
| `/v1/korea-weather/forecast` | 기상청 단기예보 | `k-parent-outdoor-check` | 200 |
| `/v1/fine-dust/report` | 에어코리아 | `k-parent-outdoor-check` | 500 (원천 429, 일시 한도 초과) |
| `/v1/korean-holiday/calendar` | 한국천문연구원 특일 정보 | `k-parent-schedule-manager` | 200 (XML) |
| `/v1/data4library/*` | 도서관 정보나루 | `k-parent-library-finder` | 200 |
| `/v1/mfds/drug-safety/lookup` | 식약처 e약은요·안전상비의약품 | `k-parent-child-health` | 200 |
| `/v1/mfds/food-safety/*` | 식약처·식품안전나라 | `k-parent-child-health` | 200 |

## 지켜야 할 것

- **조회만 한다.** 로그인, 예약, 신청, 결제는 이 경로로 하지 않는다.
- **아이 개인정보를 보내지 않는다.** 이름, 생년월일, 주민번호, 정확한 집 주소를 쿼리에 넣지 않는다. 지역은 구·동 단위, 학교는 학교명까지만 쓴다.
- **대량 호출하지 않는다.** k-skill README는 개인적·비조직적 용도만 허용하고 대량 크롤링을 금지한다. 공개 프록시는 클라이언트당 분당 60회 제한이 있다.
- **실패를 숨기지 않는다.** `503 upstream_not_configured`, `429`, `5xx`가 나오면 그대로 알리고 공식 사이트 확인 경로를 안내한다.
- **확인 날짜를 붙인다.** 답변에는 조회 시각(KST)과 원천 이름을 적는다.

## 아직 정하지 않은 것

- k-skill 공개 프록시를 다른 프로젝트가 **제품 기본값**으로 써도 되는지는 약관에 명시돼 있지 않다. 개발·개인 사용은 괜찮지만, 앱으로 배포하기 전에는 NomaDamas에 문의하거나 같은 라우트를 우리 `k-parent-proxy`로 옮긴다.
- k-skill 프록시 코드는 AGPL-3.0이라 복사하지 않는다. 옮길 때는 우리 코드로 새로 짠다.
