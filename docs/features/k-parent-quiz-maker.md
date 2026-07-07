# 오늘 배운 것 퀴즈 컨셉 문서

`k-parent-quiz-maker`는 아이가 그날 학교에서 배운 과목을 나이스 시간표로 확인하고, 학년·과목·교육과정 성취기준에 맞는 복습 퀴즈를 생성하는 스킬이다. 안드로이드 앱의 1차 제품 표면으로 설계하며, 관련 조사는 `docs/research/parent-education-api-quiz-2026-07-07.md`에 있다.

## 현재 범위

- `SKILL.md`-only 컨셉 단계
- 학교·학년·반 온보딩과 일자별 시간표 확인 흐름 정의
- 과목→학습 내용(성취기준/평가계획) 매핑 전략 정의
- 퀴즈 출력 계약(문항, 정답, 해설, 난이도, 재출제 후보) 정의

## 데이터 소스 계획

| 소스 | 역할 | 상태 |
| --- | --- | --- |
| 나이스 개방 포털 (`packages/k-parent-source-neis`) | 학교 검색, 학급, 일자별 시간표, 학사일정 | 라이브 검증 완료 (`docs/neis_api_ref.md`) |
| 학교알리미 Open API | 35종 공시, 교과별 평가계획 첨부(HWP/HWPX/PDF) | 키 발급 필요 (`SCHOOLINFO_API_KEY`) |
| schoolinfo-mcp (MIT, chrisryugj) | 학교알리미+나이스+평가계획 파싱 참고 구현. `find_school`, `get_evaluation_plan`, `parse_evaluation_file` 등 | 채택 검토 — 평가계획 파싱이 단원 수준 퀴즈의 핵심 |
| 2022 개정 성취기준 번들 | 과목×학년(군)→학습 내용 매핑 | **수집 완료** — `references/achievement-standards-elementary.json`, 초등 5개 교과 399건, 현행 고시(국교위 2026-1호) 기준 |
| KERIS 교과주제별 학습자료 | 퀴즈 주제·키워드 시드 | **사용 가능** — data.go.kr CSV/오픈API, 이용허락 제한 없음(상업 가능), 과학 467행 검증 |
| 에듀넷 티클리어(교육부 PDF/신청폼) | 원본 게시물 | 교육부 PDF는 제4유형(상업 금지), 콘텐츠 API 신청 폼은 교사 전용 — 링크 안내만 |

## 안드로이드 앱 표면 계획

- Kotlin + Jetpack Compose 단일 모듈로 별도 저장소에서 부트스트랩한다.
- 화면 흐름: 온보딩(학교 검색 → 학년/반 선택) → 오늘 화면(과목 카드, 휴업일 안내) → 퀴즈 화면(5문항) → 결과/재출제.
- 아이 식별정보(학교/학년/반)는 기기 로컬(DataStore)에만 저장하고 서버에 남기지 않는다.
- 클라이언트에는 어떤 API 키도 넣지 않는다. 모든 원천 호출은 `packages/k-skill-proxy`의 allowlist 라우트를 경유한다.

## 제안 proxy 계약

```text
GET  /api/neis/school-search?name=<학교명>
GET  /api/neis/classes?ofcdc=<교육청>&school=<학교코드>&year=<학년도>
GET  /api/neis/timetable?ofcdc=<교육청>&school=<학교코드>&level=<els|mis|his|sps>&grade=<학년>&classNm=<반>&date=<YYYYMMDD>
GET  /api/neis/schedule?ofcdc=<교육청>&school=<학교코드>&from=<YYYYMMDD>&to=<YYYYMMDD>
POST /api/quiz/generate   본문: 과목 목록, 학년, 문항 수, 이전 오답 성취기준
```

- 시간표/학사일정 응답은 일 단위 캐시를 적용한다.
- 퀴즈 생성 라우트는 LLM 키를 서버에서만 사용하고, 과목·학년·성취기준 외의 개인정보를 받지 않는다.

## 다음 구현 후보

- `packages/k-skill-proxy`에 나이스 학교검색/학급/시간표/학사일정 allowlist 라우트와 일 단위 캐시 추가
- [x] 2022 개정 성취기준 과목×학년 JSON 번들 1차 수집(초등 5교과 399건, `references/achievement-standards-elementary.json`)
- 통합교과·도덕·실과 등 미포함 교과와 중학교로 성취기준 커버리지 확장
- 안드로이드 저장소 부트스트랩: 온보딩/오늘/퀴즈 3화면과 proxy 연동
- 학교알리미 평가계획 문서 파싱 연동(schoolinfo-mcp 패턴, 단원 수준 정밀화)
- 오답 기록 기반 재출제와 주간 복습 요약
