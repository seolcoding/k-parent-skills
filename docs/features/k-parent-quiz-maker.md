# 오늘 배운 것 퀴즈 기능 문서

`k-parent-quiz-maker`는 아이가 그날 학교에서 배운 과목을 나이스 시간표로 확인하고, 학년·과목·교육과정 성취기준에 맞는 복습 퀴즈를 생성하는 스킬이다. 제품 표면은 `apps/k-parent-quiz-app`(Flutter, 온보딩→오늘→퀴즈→결과)이고, 관련 조사는 `docs/research/parent-education-api-quiz-2026-07-07.md`에 있다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-quiz-core` | 2022 개정 성취기준 기반 결정적 템플릿 문항 생성(OX·3지선다·빈칸). 같은 인자·seed면 항상 같은 문항 |
| `packages/k-parent-source-neis` | NEIS 학교 검색, 학급, 일자별 시간표, 학사일정 조회 |

## 현재 범위

- 학교·학년·반 온보딩과 일자별 시간표 확인: proxy `/v1/neis/*` 라우트 4종으로 확정
- 과목×학년(군)→성취기준 매핑과 결정적 문항 생성: `packages/k-parent-quiz-core`의 `loadStandards`, `gradeToBand`, `filterStandards`, `generateQuiz`
- 문항 은행 전수 생성: `node packages/k-parent-quiz-core/scripts/generate-quiz-bank.mjs --out apps/k-parent-quiz-app/assets/data/quiz_bank.json` — 성취기준당 유형별 최대 3개 변형, 바이트 단위 재현이라 드리프트 검사 가능
- Flutter 앱 `apps/k-parent-quiz-app`: 온보딩(학교 검색→학년/반) → 오늘(과목 카드, 휴업일 안내) → 퀴즈(5문항) → 결과(재도전). fixture-first라 오프라인 데모가 항상 동작한다

## 데이터 소스

| 소스 | 역할 | 상태 |
| --- | --- | --- |
| 나이스 개방 포털 (`packages/k-parent-source-neis`) | 학교 검색, 학급, 일자별 시간표, 학사일정 | 구현 완료 — proxy `/v1/neis/*` 라우트와 일 단위 캐시 (`docs/neis_api_ref.md`) |
| 2022 개정 성취기준 번들 | 과목×학년(군)→학습 내용 매핑 | 수집 완료 — SSOT는 `skills/k-parent-quiz-maker/references/achievement-standards-elementary.json`(초등 5교과 399건, 국교위 고시 제2026-1호). `packages/k-parent-quiz-core`가 바이트 동일 미러를 동봉 |
| 학교알리미 Open API | 35종 공시, 교과별 평가계획 첨부(HWP/HWPX/PDF) | 키 발급·라이브 검증 완료(`SCHOOLINFO_API_KEY`), 평가계획 파싱은 미연동 |
| schoolinfo-mcp (MIT, chrisryugj) | 학교알리미+나이스+평가계획 파싱 참고 구현 | 채택 검토 — 단원 수준 정밀화의 핵심 후보 |
| KERIS 교과주제별 학습자료 | 퀴즈 주제·키워드 시드 | 사용 가능(이용허락 제한 없음) — 미연동 |
| 에듀넷 티클리어(교육부 PDF/신청폼) | 원본 게시물 | 교육부 PDF는 제4유형(상업 금지), 콘텐츠 API 신청 폼은 교사 전용 — 링크 안내만 |

## 앱 표면

- `apps/k-parent-quiz-app` — Flutter 단일 앱(안드로이드 1차 표면 + 웹 데모).
- 아이 식별정보(학교/학년/반)는 기기 로컬(SharedPreferences)에만 저장하고 서버에 남기지 않는다. 이름 등 개인정보는 받지 않는다.
- 클라이언트에는 어떤 API 키도 넣지 않는다. 네트워크 호출은 `packages/k-parent-proxy`의 allowlist 라우트만 쓰고, 기본은 번들 fixture 기반 오프라인 모드다.
- 문항은 기기에서 생성하지 않는다. 사전 생성 은행 `assets/data/quiz_bank.json`에서 과목+학년군 필터 → 날짜 seed 셔플 → 5문항 선별만 한다(재도전 시 attempt를 seed에 가산).

## proxy 계약

```text
GET /v1/neis/school-search?educationOffice=<교육청명|코드>&schoolName=<학교명>
GET /v1/neis/classes?educationOfficeCode=<교육청코드>&schoolCode=<학교코드>&year=<학년도>
GET /v1/neis/timetable?educationOfficeCode=<교육청코드>&schoolCode=<학교코드>&level=<els|mis|his|sps>&grade=<학년>&classNm=<반>&date=<YYYYMMDD>
GET /v1/neis/schedule?educationOfficeCode=<교육청코드>&schoolCode=<학교코드>&from=<YYYYMMDD>&to=<YYYYMMDD>
```

- 시간표·학급·학사일정 응답은 NEIS 원본 row를 소문자 스키마 `rows` 배열로 정규화하고, 조건에 맞는 데이터가 없으면(INFO-200) `rows: []`와 `info` 힌트를 담은 200을 준다.
- 빈 결과를 포함해 일 단위 TTL 캐시를 적용한다. 파라미터 상세는 `packages/k-parent-proxy/README.md` 참고.

## 환경변수

- 스킬·앱 클라이언트 쪽에는 필요한 API key가 없다. `KEDU_INFO_KEY`(나이스 인증키)는 proxy 서버 측 환경변수이고, `packages/k-parent-source-neis`를 proxy 없이 직접 쓸 때만 로컬에 설정한다.
- `SCHOOLINFO_API_KEY`(학교알리미)는 평가계획 파싱 확장용으로 발급해 두었고 아직 runtime 경로에서는 쓰지 않는다.

## 픽스처 갱신

```bash
KEDU_INFO_KEY=... npm run refresh:fixtures --workspace k-parent-source-neis
```

- 성취기준 번들은 API가 아니라 고시 원문 기반이라 자동 갱신 명령이 없다. 차기 개정 고시가 나오면 `skills/k-parent-quiz-maker/references/achievement-standards.md`의 재수집 절차(NCIC 사용자 브라우저 수동 다운로드 → 추출 → 3판 교차검증)로 수동 갱신하고, `npm run sync-standards --workspace k-parent-quiz-core`로 패키지 미러를 동기화한다.
- 문항 은행은 성취기준 번들 갱신 후 `generate-quiz-bank.mjs`로 재생성한다(같은 입력이면 바이트 동일).

## 남은 확장 후보

- 성취기준 커버리지 확장: 통합교과·도덕·실과·체육·예술 등 미포함 교과와 중학교
- LLM 문항 생성: 과목·학년·이전 오답 성취기준을 받아 서버 측 LLM 키로 생성하는 퀴즈 생성 라우트. 현재 proxy는 무료 공개 API 전용 정책이라 별도 표면·정책 결정이 필요하다
- 학교알리미 평가계획 문서 파싱 연동(schoolinfo-mcp 패턴, 단원 수준 정밀화)
- KERIS 교과주제별 학습자료를 퀴즈 주제 시드로 연동
- 오답 기록 기반 재출제와 주간 복습 요약
