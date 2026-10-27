# 교과 연계 체험학습 기능 문서

`k-parent-field-trip`은 아이가 학교에서 배우는 단원(2022 개정 초등 성취기준)과 이어지는 박물관 전시·교육프로그램·문화유산 체험을 찾는 스킬이다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-source-culture` | `searchExperiences` — 문화공공데이터광장 5개 API 조회·정규화·필터 |
| `skills/k-parent-quiz-maker/references/achievement-standards-elementary.json` | 단원 → 성취기준 코드 |

## 데이터

| 데이터셋 | API | 강점 | 약점 |
| --- | --- | --- | --- |
| 598 | 전시정보(통합), 23개 기관 | 국립 박물관·미술관 전시를 한 번에 | 과거 전시가 많이 섞여 있음 |
| 540 | 국립지방박물관 문화행사 통합 | 체험·교육 행사 | 연령 필드 없음 |
| 84 | 문화재청_문화재정보 (15,324건) | 시대(`extent`)·주소(`spatial`) 필드 | 운영 시간 없음, 국가유산청 개편 후 갱신 여부 미확인 |
| 495 | 대한민국역사박물관 교육프로그램 | 학년·접수기간·정원 명시 | 기관 1곳 |
| 639 | 국립한글박물관 문화행사 | 국어(한글) 연계 | 기간 필드 없음, test 레코드 섞임(파서가 제거) |

## 정규화 결과

각 항목: `id`, `dataset`, `kind`(exhibition/program/heritage/event), `title`, `institution`, `sido`, `place`, `description`, `startDate`, `endDate`, `status`(ongoing/upcoming/ended/unknown, KST 기준), `grades[{level, from, to}]`, `charge{free, text}`, `eras[]`, `eraSource`(field/description), `application`(495: 접수기간·정원·선정방법·상태), `designation`(84), `url`, `source`.

처리 규칙:

- HTML 엔티티(`&#40;`)와 `"None"` 문자열을 지운다.
- 기간 형식 세 가지(`2018-10-23~2019-12-29`, `20210121~20210204`, `2021-05-05 ~ 2021-05-05 12시`)를 읽는다.
- 전시·행사는 기관명으로 시도를 정하고, 문화재는 주소 앞부분으로 정한다.
- 문화재 시대는 `extent`를 먼저 쓰고, 비어 있을 때만 설명문에서 찾는다(설명문의 부수 일화 오탐 방지).
- 시대 사전은 "선사합니다", "일제히", "가야금", 고조선의 "조선", 통일신라의 "신라" 같은 오탐을 막는다.
- 행사 기간이 없고 접수기간이 지났으면 `ended`로 본다.

## 환경변수

- `KSKILL_CULTURE_KEY` — 문화공공데이터광장 서비스키
- `KSKILL_CULTURE_KEY_<dataset>` — API별로 키가 다를 때 덮어쓰기 (598, 540, 84, 495, 639)

키 없이 호출하면 401이다(2026-10-27 확인). 개발계정은 하루 1,000건.

## 픽스처

`packages/k-parent-source-culture/test/fixtures/experience-<dataset>.json`은 culture.go.kr 상세 페이지 미리보기에서 받은 실제 응답이다(2026-10-27). 갱신:

```bash
KSKILL_CULTURE_KEY=... npm run refresh:experience-fixtures --workspace k-parent-source-culture
```

## 검증 상태

- 오프라인 테스트: 실제 응답 fixture로 다섯 데이터셋 파싱과 필터를 검증했다.
- 라이브: 키가 없어 실제 호출은 아직 확인하지 않았다. 요청 경로는 각 API 상세 페이지 기준이다.

## 가드레일

- 학년·시도만 쓰고 아이 이름·학교명은 검색에 쓰지 않는다.
- 예약·교육 신청·결제는 하지 않는다. 링크만 준다.
- 출처 "문화공공데이터광장, 공공누리 제1유형"과 조회 시각을 적는다.

## 남은 확장 후보

- 키 발급 후 라이브 검증과 fixture 갱신
- 문화재(15,324건) 로컬 스냅샷과 `services/k-parent-refresh` 정기 갱신
- 과학관 데이터 소스 찾기
- NEIS 시간표에서 이번 주 사회 단원 자동 추정
- 체험 후보를 `k-parent-schedule-manager` 캘린더 후보로 연결
