# TODO

이 파일은 `k-parent-skill`의 장기 목표를 작은 실행 단위로 나누고, 각 항목의 달성조건을 추적하는 마스터 백로그다. 새 요구사항을 발견하면 먼저 이 파일에 추가한 뒤 구현한다.

## 운영 원칙

- 상태는 `[ ]` 대기, `[~]` 진행 중, `[x]` 완료로 표시한다.
- 각 목표는 독립적으로 검증 가능한 달성조건을 가져야 한다.
- 병렬화 가능한 작업은 서로 다른 파일·패키지·문서 표면을 건드리는 단위로 나눈다.
- 로그인, 신청 제출, 결제, 예약 확정, 취소, 아동 개인정보 입력은 사용자 승인 전 실행하지 않는다.
- 일정, 모집, 행사, 정책, API 동작처럼 변동 가능한 정보는 현재 공식/공개 출처 확인과 확인일을 남긴다.
- 검증은 기존 명령을 우선한다: `npm run lint`, `npm run typecheck`, `npm test`, `npm run pack:dry-run`, `npm run ci`.

## Goal 225. '오늘 배운 것 퀴즈' 안드로이드 앱 시작점

목표: 아이가 학교에서 그날 배운 과목을 기반으로 퀴즈를 생성하는 안드로이드 앱을 이 저장소 자산(NEIS 시간표 + 성취기준 번들 + proxy) 위에서 시작한다.

달성조건:

- [x] 부모 접근 가능 학교·학급·학습자료 API 인벤토리를 `docs/research/parent-education-api-quiz-2026-07-07.md`로 작성한다.
- [x] 신규 확인 출처(학교알리미/유치원알리미/NCIC/STAS/에듀넷)를 `docs/sources.md`에 반영한다.
- [x] `skills/k-parent-quiz-maker` concept `SKILL.md`를 저장소 authoring 규칙에 맞게 스캐폴딩한다.
- [x] 안드로이드 MVP 화면 흐름(온보딩 학교/학년/반 → 오늘 시간표 → 퀴즈 5문항)과 proxy 계약 초안을 `docs/features/k-parent-quiz-maker.md`에 확정한다.
- [x] `packages/k-skill-proxy`에 NEIS 학교검색/학급/시간표/학사일정 allowlist 라우트와 일 단위 캐시를 추가한다. (`/v1/neis/school-search·classes·timetable·schedule`, 빈 결과 포함 daily TTL 캐시)
- [x] 2022 개정 교육과정 성취기준 과목×학년 JSON 번들(초등 5교과 399건)을 수집하고 확인일을 기록한다. 소스는 국가교육위원회 고시 제2026-1호 원문(저작권법 제7조 자유이용)만 사용, NCIC는 사용자 브라우저 수동 다운로드(robots 금지 준수), KICE 공공누리 2유형 자료는 제외. 3판 교차검증 완료.
- [x] 결정적 템플릿 문항 생성 패키지 `packages/k-parent-quiz-core`(loadStandards/filterStandards/generateQuiz, OX·3지선다·빈칸)와 문항 은행 전수 생성 스크립트를 추가한다.
- [ ] 성취기준 커버리지를 통합교과·도덕·실과·체육·예술과 중학교로 확장한다.
- [ ] KERIS 교과주제별 학습자료(이용허락 제한없음)를 퀴즈 주제 시드로 연동한다.
- [x] 학교알리미 키(`SCHOOLINFO_API_KEY`)와 유치원알리미 키(`CHILDSCHOOLINFO_API_KEY`)를 발급받아 `.env`에 저장하고 라이브 검증한다.
- [ ] schoolinfo-mcp 평가계획 파싱 채택 여부를 확정한다.
- [x] 앱 시작점을 부트스트랩한다 — 별도 Kotlin+Compose 저장소 대신 인-레포 `apps/k-parent-quiz-app`(Flutter)으로 결정. 온보딩/오늘/퀴즈/결과 4화면, proxy 연동, fixture-first 오프라인 데모.

검증 기록:

- [x] 2026-07-07: NEIS 12종 라이브 검증 자산 확인(`docs/neis_api_ref.md`), 학교알리미·유치원알리미 Open API 및 NCIC/STAS 학습자료 표면 웹 확인, e학습터 2026-02-28 종료 확인.
- [x] 2026-07-07: schoolinfo-mcp(MIT, 학교알리미 35종+나이스+평가계획 kordoc 파싱) 확인, 에듀넷 파일데이터 제4유형(상업적 이용금지) 확인, `k-parent-quiz-maker` 컨셉 스킬 스캐폴딩.
- [x] 2026-07-07: 트랙 A/B/C 머지 마감 — `packages/k-parent-quiz-core` 테스트 그린, proxy `/v1/neis/timetable·classes·schedule` 라우트 추가, `apps/k-parent-quiz-app`(Flutter) analyze 0건·테스트 30개 그린, 문항 은행 2,668문항 전량 재생성(재실행 드리프트 0), `k-parent-quiz-maker` phase p0 승격과 문서 표면(README·roadmap·기능 문서·계약 테스트) 동기화.

## Goal 179. 구현된 parent feature doc 공통 표준 회귀 테스트

목표: runtime 패키지를 문서화한 `k-parent-*` feature docs가 공통 표준 섹션과 현재 구현 상태 표현을 유지하도록 일반 회귀 테스트를 추가한다.

달성조건:

- [x] 구현/p0 parent feature doc 목록을 공통 검사 대상으로 정의한다.
- [x] 각 문서가 `## 사용 패키지`, 환경변수/API key 상태, 픽스처 갱신/없음 고지, 현재 구현 상태 표현을 포함하는지 검증한다.
- [x] 문서에 언급된 `packages/k-parent-*` 경로가 실제 패키지 디렉터리와 일치하는지 검증한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'implemented parent feature docs keep shared package and runtime status sections'`
- [x] 2026-06-05: `npm run lint`

## Goal 180. parent SKILL.md backing package 경로 표준화

목표: parent skill description이 runtime backing package를 약칭이 아니라 실제 `packages/k-parent-*` 경로로 명시하도록 정리하고 회귀 테스트를 보강한다.

달성조건:

- [x] runtime backing package가 있는 parent skills의 expected package 목록을 테스트에 명시한다.
- [x] 각 `SKILL.md` description이 모든 backing package를 `packages/<package-name>` 형태로 포함하는지 검증한다.
- [x] 약칭 또는 합쳐 쓴 package 표현을 실제 패키지 경로로 수정한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skill descriptions are Korean, give trigger examples, and cite backing packages'`
- [x] 2026-06-05: `npm run lint`

## Goal 181. Goal 179-180 통합 CI 검증

목표: parent 문서 공통 표준 테스트와 `SKILL.md` backing package 경로 표준화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 223. README 루트 제목과 쇼핑 문구 정합성

목표: 루트 README의 사용자-facing 제목과 쇼핑 안전 문구를 한국어 제품 톤과 최신 표시명에 맞춘다.

달성조건:

- [x] README H1을 `# k-parent-skill`에서 한국어 제목으로 바꾼다.
- [x] README 안전 문구의 `상품 추천`을 `준비물 쇼핑 추천`으로 바꾼다.
- [x] 회귀 테스트와 focused README 테스트가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test --test-name-pattern='parent repository context documents the inherited architecture conventions|parent product skills are advertised and documented' scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: README 이전 H1/쇼핑 문구 재도입 스캔 0건

## Goal 224. Goal 223 통합 CI 검증

목표: README 루트 제목과 쇼핑 문구 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 221. README 제품 스킬 표시명 정합성 개선

목표: README 제품 스킬 표의 짧은 표시명을 SKILL/feature 문서의 한국어 제목과 맞춰 부모가 읽기 쉬운 라벨로 정리한다.

달성조건:

- [x] README 제품 표에서 `놀것`을 `놀거리`로, `상품 추천`을 `준비물 쇼핑`으로 바꾼다.
- [x] 회귀 테스트가 두 표시명을 확인하고 기존 라벨 재도입을 막는다.
- [x] focused README 문서 테스트와 lint가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test --test-name-pattern='parent product skills are advertised and documented' scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: 이전 README 표시명(`놀것`, `상품 추천`) 재도입 스캔 0건

## Goal 222. Goal 221 통합 CI 검증

목표: README 제품 표시명 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 218. 부모 SKILL 본문 H1 한국어화

목표: `skills/k-parent-*/SKILL.md` 본문 H1에서 영어 제품명과 slug 제목을 제거하고 한국어 사용자-facing 제목으로 통일한다.

달성조건:

- [x] 모든 parent `SKILL.md`의 `# ...` 제목을 한국어 제목으로 바꾼다.
- [x] 회귀 테스트가 parent `SKILL.md` H1에 ASCII 영문이 들어가지 않도록 확인한다.
- [x] focused parent skill 문서 테스트가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test --test-name-pattern='parent skill package references use packages paths' scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: parent `SKILL.md` H1 ASCII 영문 스캔 0건

## Goal 219. 부모 feature 문서 H1 한국어화

목표: `docs/features/k-parent-*.md`의 slug 기반 H1 제목을 한국어 사용자-facing 제목으로 통일한다.

달성조건:

- [x] slug H1로 남은 parent feature 문서 제목을 한국어 제목으로 바꾼다.
- [x] 회귀 테스트가 parent feature 문서 H1에 ASCII 영문이 들어가지 않도록 확인한다.
- [x] focused feature 문서 테스트와 lint가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test --test-name-pattern='parent feature docs do not expose source package fixture internals|implemented parent feature docs keep shared package and runtime status sections' scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: parent feature doc H1 ASCII 영문 스캔 0건

## Goal 220. Goal 218-219 통합 CI 검증

목표: parent SKILL/feature 문서 H1 한국어화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 214. 로드맵 섹션 제목 한국어화

목표: `docs/roadmap.md`의 주요 섹션 제목에서 상속 템플릿식 영어 제목을 제거하고 부모 제품 문서 톤에 맞춘 한국어 제목으로 정리한다.

달성조건:

- [x] `docs/roadmap.md`의 `Department roadmap`, `Product skill status`, `v1 implementation candidates`, `Later candidates` heading을 한국어로 바꾼다.
- [x] 회귀 테스트가 로드맵의 한국어 heading을 확인하고 기존 영어 heading 재도입을 막는다.
- [x] focused 문서 테스트가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test --test-name-pattern='parent repository context documents the inherited architecture conventions' scripts/skill-docs.test.js`
- [x] 2026-06-05: 영어 roadmap heading 재도입 스캔 0건

## Goal 215. 아키텍처 섹션 제목 한국어화

목표: `docs/architecture.md`의 주요 섹션 제목에서 영어 heading을 제거하고 한국어 아키텍처 문서 체계로 정리한다.

달성조건:

- [x] `docs/architecture.md`의 주요 `##` heading을 한국어로 바꾼다.
- [x] 회귀 테스트가 아키텍처 한국어 heading을 확인하고 기존 영어 heading 재도입을 막는다.
- [x] focused 문서 테스트와 lint가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test --test-name-pattern='parent repository context documents the inherited architecture conventions' scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: 영어 architecture heading 재도입 스캔 0건

## Goal 216. NEIS feature 문서 결정형 구현 제목 한국어화

목표: `k-parent-meal-planner`와 `k-parent-school-info` feature 문서의 `결정형 구현 (deterministic)` 혼합 heading을 한국어 제목으로 정리한다.

달성조건:

- [x] 두 feature 문서의 `## 결정형 구현 (deterministic)` heading을 `## 결정형 구현`으로 바꾼다.
- [x] 회귀 테스트가 한국어 heading을 확인하고 `(deterministic)` 재도입을 막는다.
- [x] focused NEIS 문서 테스트가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test --test-name-pattern='school info and meal planner docs document NEIS source packages' scripts/skill-docs.test.js`
- [x] 2026-06-05: `## 결정형 구현 (deterministic)` 재도입 스캔 0건

## Goal 217. Goal 214-216 통합 CI 검증

목표: roadmap/architecture/NEIS feature heading 정리 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 182. roadmap 구현 패키지 경로 표준화

목표: `docs/roadmap.md`의 department roadmap이 backing package를 축약명 대신 실제 `packages/k-parent-*` 경로로 기록하도록 정리하고 회귀 테스트를 추가한다.

달성조건:

- [x] roadmap department table의 구현 패키지 값을 `packages/<package-name>` 형태로 수정한다.
- [x] `-playground`, `-seoul` 같은 축약 package 표기를 제거한다.
- [x] roadmap에 언급된 `packages/k-parent-*` 경로가 실제 package directory와 일치하는지 검증한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'roadmap department package references use real package paths'`
- [x] 2026-06-05: `npm run lint`

## Goal 183. parent SKILL.md 본문 package 경로 표준화

목표: parent `SKILL.md` 본문에 남은 backtick package 약칭을 실제 `packages/k-parent-*` 경로로 정리하고 회귀 테스트를 추가한다.

달성조건:

- [x] parent `SKILL.md` 본문에서 backtick으로 감싼 package 약칭을 찾는다.
- [x] package 약칭을 `packages/<package-name>` 경로로 수정한다.
- [x] parent `SKILL.md`가 backtick package 약칭을 다시 쓰지 않도록 검증한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skill package references use packages paths'`
- [x] 2026-06-05: `npm run lint`

## Goal 184. parent feature doc 본문 package 경로 표준화

목표: parent feature docs 본문에 남은 backtick package 약칭을 실제 `packages/k-parent-*` 경로로 정리하고 공통 회귀 테스트에 포함한다.

달성조건:

- [x] parent feature docs에서 backtick으로 감싼 package 약칭을 찾는다.
- [x] package 약칭을 `packages/<package-name>` 경로로 수정한다.
- [x] implemented parent feature doc 공통 테스트가 backtick package 약칭을 금지하도록 보강된다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'implemented parent feature docs keep shared package and runtime status sections'`
- [x] 2026-06-05: `npm run lint`

## Goal 185. Goal 182-184 통합 CI 검증

목표: roadmap, parent `SKILL.md`, parent feature docs의 package 경로 표준화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 186. parent feature doc 환경/픽스처 섹션명 표준화

목표: runtime parent feature docs가 환경과 fixture 갱신 정보를 같은 섹션명(`## 환경변수`, `## 픽스처 갱신`)으로 제공하도록 정리하고 회귀 테스트를 보강한다.

달성조건:

- [x] runtime parent feature doc의 환경 섹션명을 `## 환경변수`로 통일한다.
- [x] runtime parent feature doc의 fixture 섹션명을 `## 픽스처 갱신`으로 통일한다.
- [x] data collector와 shopping recommender처럼 테스트/fixture가 섞인 문서를 분리해 명확히 한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'implemented parent feature docs keep shared package and runtime status sections'`
- [x] 2026-06-05: `npm run lint`

## Goal 187. Goal 186 통합 CI 검증

목표: parent feature doc 환경/픽스처 섹션명 표준화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 188. runtime parent feature doc 확장 후보 섹션 보강

목표: runtime parent feature docs가 모두 `## 남은 확장 후보` 섹션을 포함해 다음 개발 후보를 같은 위치에서 발견할 수 있도록 한다.

달성조건:

- [x] `남은 확장 후보`가 없는 runtime parent feature docs를 식별한다.
- [x] 누락 문서에 도메인별 다음 확장 후보를 추가한다.
- [x] implemented parent feature doc 공통 테스트가 `## 남은 확장 후보`를 요구하도록 보강된다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'implemented parent feature docs keep shared package and runtime status sections'`
- [x] 2026-06-05: `npm run lint`

## Goal 189. Goal 188 통합 CI 검증

목표: runtime parent feature doc 확장 후보 섹션 보강 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 190. parent SKILL.md 패키지/환경 섹션명 표준화

목표: parent `SKILL.md` 본문이 feature docs와 같은 `## 사용 패키지`, `## 환경변수` 섹션명을 쓰도록 정리하고 회귀 테스트를 추가한다.

달성조건:

- [x] parent `SKILL.md`에서 비표준 `## 사용하는 패키지`, `## 환경 변수` 섹션을 식별한다.
- [x] 비표준 섹션명을 표준 섹션명으로 수정한다.
- [x] parent `SKILL.md` 회귀 테스트가 비표준 섹션명을 금지한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skill package references use packages paths'`
- [x] 2026-06-05: `npm run lint`

## Goal 191. Goal 190 통합 CI 검증

목표: parent `SKILL.md` 섹션명 표준화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 192. parent feature doc 후보 섹션 phase 규칙 고정

목표: concept parent feature docs는 `## 다음 구현 후보`, p0/implemented parent feature docs는 `## 남은 확장 후보`를 사용하도록 phase 기반 회귀 테스트를 추가한다.

달성조건:

- [x] parent skill phase와 feature doc 후보 섹션의 현재 매핑을 확인한다.
- [x] phase metadata 테스트가 concept과 p0/implemented 후보 섹션명을 구분해 검증한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skill phase metadata distinguishes implemented and concept work'`
- [x] 2026-06-05: `npm run lint`

## Goal 193. Goal 192 통합 CI 검증

목표: parent feature doc 후보 섹션 phase 규칙 테스트 보강이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 194. parent SKILL.md 출력 섹션명 한국어 통일

목표: parent `SKILL.md` 본문의 출력 섹션명을 `## 출력 형식`으로 통일하고 영어 `## Output fields` 회귀를 막는다.

달성조건:

- [x] parent `SKILL.md`에서 영어 `## Output fields` 섹션을 식별한다.
- [x] 모든 parent `SKILL.md` 출력 섹션명이 `## 출력 형식`으로 통일된다.
- [x] parent skill output 회귀 테스트가 `## 출력 형식`을 요구하고 `## Output fields`를 금지한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skills publish practical parent-domain output fields'`
- [x] 2026-06-05: `npm run lint`

## Goal 195. Goal 194 통합 CI 검증

목표: parent `SKILL.md` 출력 섹션명 한국어 통일 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 196. parent SKILL.md 주요 섹션명 한국어 통일

목표: parent `SKILL.md` 본문에 남은 영어 주요 섹션명을 한국어 섹션명으로 정리하고 회귀 테스트를 추가한다.

달성조건:

- [x] parent `SKILL.md`에서 영어 주요 섹션명(`What this skill does`, `When to use`, `Workflow`, `Done when`, `Failure modes`, `Notes`, `Guardrails`, `Data sources & functions`)을 식별한다.
- [x] 영어 주요 섹션명을 한국어 섹션명으로 수정한다.
- [x] parent `SKILL.md` 회귀 테스트가 영어 주요 섹션명 재등장을 금지한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `rg -n '^## (What this skill does|When to use|Workflow|Done when|Failure modes|Notes|Guardrails|Data sources & functions)$' skills/k-parent-*/SKILL.md` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skill package references use packages paths'`
- [x] 2026-06-05: `npm run lint`

## Goal 197. Goal 196 통합 CI 검증

목표: parent `SKILL.md` 주요 섹션명 한국어 통일 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 198. parent SKILL.md 혼합 heading 정리

목표: parent `SKILL.md` 섹션명에 남은 영어 보조어와 `워크플로` 변형을 한국어 표준 heading으로 정리한다.

달성조건:

- [x] `deterministic package`, `approval`, `Generic runner`, `data contract`, `freshness`, `워크플로`가 포함된 parent `SKILL.md` heading을 식별한다.
- [x] 혼합 heading을 `## 데이터 소스`, `## 데이터 계약`, `## 신선도`, `## 전형적 흐름`, `## 가드레일`, `## 범용 러너`로 수정한다.
- [x] parent `SKILL.md` 회귀 테스트가 혼합 heading 재등장을 금지한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `rg -n '^## .*(deterministic packages?|approval|Generic runner|data contract|freshness|envelope|워크플로).*$' skills/k-parent-*/SKILL.md` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skill package references use packages paths'`
- [x] 2026-06-05: `npm run lint`

## Goal 199. Goal 198 통합 CI 검증

목표: parent `SKILL.md` 혼합 heading 정리 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 200. parent feature doc 혼합 heading 정리

목표: 구현된 parent feature docs에 남은 영어/혼합 heading을 한국어 표준 heading으로 정리하고 회귀 테스트로 재발을 막는다.

달성조건:

- [x] feature docs에서 `Generic runner` 등 혼합 heading을 식별한다.
- [x] 발견된 heading을 한국어 표준 heading으로 수정한다.
- [x] 구현된 parent feature doc 공통 테스트가 혼합 heading 재등장을 금지한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `rg -n '^## (Generic runner|What this skill does|When to use|Workflow|Done when|Failure modes|Notes|Output fields|Data sources & functions)$|^## .*(deterministic packages?|approval|data contract|freshness|envelope|워크플로).*$' docs/features/k-parent-*.md skills/k-parent-*/SKILL.md` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'implemented parent feature docs keep shared package and runtime status sections'`
- [x] 2026-06-05: `npm run lint`

## Goal 201. parent feature doc 신선도 heading 한국어화

목표: parent feature doc의 신선도/출처 기록 섹션에 남은 `Freshness` 혼합 heading을 한국어 표준 heading으로 정리한다.

달성조건:

- [x] parent feature docs에서 `Freshness` 혼합 heading을 식별한다.
- [x] `Freshness & 출처 기록`을 한국어 heading으로 수정한다.
- [x] 구현된 parent feature doc 공통 테스트가 `Freshness` 대소문자 변형 재등장을 금지한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `rg -n '^## (Generic runner|Freshness & 출처 기록|What this skill does|When to use|Workflow|Done when|Failure modes|Notes|Output fields|Data sources & functions|Guardrails|Data sources|Environment variables|Using package|사용하는 패키지|환경 변수)$|^## .*(deterministic packages?|approval|data contract|[Ff]reshness|envelope|워크플로).*$' docs/features/k-parent-*.md skills/k-parent-*/SKILL.md` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'implemented parent feature docs keep shared package and runtime status sections'`
- [x] 2026-06-05: `npm run lint`

## Goal 202. Goal 200-201 통합 CI 검증

목표: parent feature doc heading 정리와 회귀 테스트 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 203. 새 parent SKILL.md 템플릿 heading 표준화

목표: `docs/adding-a-skill.md`의 신규 스킬 작성 템플릿이 현재 parent `SKILL.md` 한국어 heading 표준을 안내하도록 정리한다.

달성조건:

- [x] 템플릿에 남은 영어 `SKILL.md` heading을 식별한다.
- [x] 템플릿 heading과 본문 설명을 한국어 표준 heading으로 수정한다.
- [x] 회귀 테스트가 신규 템플릿에 영어 legacy heading이 재등장하지 않도록 검증한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: legacy heading/search phrase scan in `docs/adding-a-skill.md` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent repository context documents the inherited architecture conventions'`
- [x] 2026-06-05: `npm run lint`

## Goal 204. 새 parent SKILL.md 템플릿 category 정합성

목표: `docs/adding-a-skill.md`의 신규 parent 제품 스킬 frontmatter 예시가 `metadata.category: parenting` 규칙을 직접 따르도록 정리한다.

달성조건:

- [x] 템플릿 frontmatter의 `category: utility` 드리프트를 식별한다.
- [x] 템플릿 예시와 필드 설명을 parent 제품 스킬 기준인 `parenting`으로 수정한다.
- [x] 회귀 테스트가 신규 템플릿의 `category: parenting`과 `category: utility` 미사용을 검증한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: legacy `utility` category scan in `docs/adding-a-skill.md` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent repository context documents the inherited architecture conventions'`
- [x] 2026-06-05: `npm run lint`

## Goal 205. AGENTS.md SKILL.md 데이터 소스 heading 표준화

목표: repo 지침의 `SKILL.md` authoring rule이 혼합 heading 대신 현재 표준 `## 데이터 소스`를 안내하도록 정리한다.

달성조건:

- [x] `AGENTS.md`에 남은 `## 데이터 소스 (deterministic packages)` 안내를 식별한다.
- [x] 해당 안내를 `## 데이터 소스` 표준 heading으로 수정한다.
- [x] 회귀 테스트가 repo 지침의 혼합 heading 재등장을 금지한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `rg -n '## 데이터 소스 \(deterministic packages\)|deterministic packages\)' AGENTS.md docs/adding-a-skill.md docs/architecture.md README.md` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent repository context documents the inherited architecture conventions'`
- [x] 2026-06-05: `npm run lint`

## Goal 206. Goal 203-205 통합 CI 검증

목표: 신규 스킬 작성 가이드와 repo 지침 표준화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 207. 새 제품 스킬 예시 이름 k-parent 규칙 정합화

목표: `docs/adding-a-skill.md`의 제품 스킬 예시 경로와 frontmatter가 `k-parent-*` 네이밍 규칙을 직접 따르도록 정리한다.

달성조건:

- [x] 제품 스킬 예시에 남은 `my-new-skill` 경로/name 드리프트를 식별한다.
- [x] 제품 스킬 디렉토리, frontmatter, package, checklist 예시를 `k-parent-my-new-skill`로 수정한다.
- [x] 회귀 테스트가 가이드에 parent 제품 스킬 예시 경로를 검증한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: generic product example name/path scan in `docs/adding-a-skill.md` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent repository context documents the inherited architecture conventions'`
- [x] 2026-06-05: `npm run lint`

## Goal 208. 새 제품 스킬 Python helper 예시 이름 정합화

목표: `docs/adding-a-skill.md`의 Python 스크립트 예시 파일명도 `k-parent-my-new-skill` 제품 스킬 예시와 일관되게 안내한다.

달성조건:

- [x] Python helper 예시에 남은 generic `my_new_skill.py`/`my_skill.py`를 식별한다.
- [x] helper 파일명과 호출 예시를 `k_parent_my_new_skill.py`로 수정한다.
- [x] 회귀 테스트가 Python helper 예시 이름과 generic 잔여 미사용을 검증한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: generic Python helper example scan in `docs/adding-a-skill.md` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent repository context documents the inherited architecture conventions'`
- [x] 2026-06-05: `npm run lint`

## Goal 209. Goal 207-208 통합 CI 검증

목표: 신규 제품 스킬 예시 이름과 Python helper 예시 정합화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 210. parent SKILL.md feature doc 링크 정합화

목표: 모든 parent `SKILL.md`가 자기 상세 feature doc 경로를 `## 관련 문서`로 안내하도록 정리한다.

달성조건:

- [x] feature doc 링크가 없는 parent `SKILL.md`를 식별한다.
- [x] 누락된 `## 관련 문서` 섹션과 `docs/features/<skill>.md` 링크를 추가한다.
- [x] 회귀 테스트가 모든 parent `SKILL.md`의 feature doc 링크를 검증한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: parent `SKILL.md` feature doc link scan (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skill phase metadata distinguishes implemented and concept work'`
- [x] 2026-06-05: `npm run lint`

## Goal 211. Goal 210 통합 CI 검증

목표: parent `SKILL.md` feature doc 링크 추가와 회귀 테스트 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 212. parent SKILL.md 단계 heading 한국어화

목표: parent `SKILL.md`의 `###` 단계 heading에 남은 영어 표현을 한국어로 정리한다.

달성조건:

- [x] parent `SKILL.md`에서 영어가 포함된 `###` 단계 heading을 식별한다.
- [x] 발견된 단계 heading을 한국어 중심 표현으로 수정한다.
- [x] 회귀 테스트가 parent `SKILL.md`의 영어 `###` 단계 heading 재등장을 금지한다.
- [x] focused test와 lint를 통과하고 검증 결과를 기록한다.

검증 기록:

- [x] 2026-06-05: `rg -n '^### .*[A-Za-z].*$' skills/k-parent-*/SKILL.md` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skill package references use packages paths'`
- [x] 2026-06-05: `npm run lint`

## Goal 213. Goal 212 통합 CI 검증

목표: parent `SKILL.md` 단계 heading 한국어화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 1. 저장소 구조와 에이전트 컨텍스트 정합성

목표: `k-parent-skill`이 `skills/*`, `examples/*`, `packages/*`, `docs/features/*` 구조를 일관되게 설명하고 검증하도록 유지한다.

달성조건:

- [x] 제품 스킬은 `skills/<skill-name>/SKILL.md`에 위치한다.
- [x] upstream 참고 스킬은 `examples/<skill-name>/SKILL.md`에 위치한다.
- [x] `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/architecture.md`, `docs/adding-a-skill.md`, `docs/install.md`가 같은 구조 규칙을 설명한다.
- [x] `scripts/validate-skills.sh`가 `skills/`와 `examples/` 컨테이너를 검증한다.
- [x] `npm run lint`의 하위 스킬 frontmatter 검증(`./scripts/validate-skills.sh`)이 통과한다.

병렬 작업:

- [x] 문서 표면 정합성 점검 및 불일치 수정
- [x] validator가 새 컨테이너 구조를 정확히 검사하는지 테스트 보강
- [x] 설치 문서와 개발 skill install 규칙 동기화

## Goal 2. 부모용 핵심 스킬 카탈로그 완성

목표: 부모 생활정보 핵심 스킬이 설치 가능한 `SKILL.md`와 상세 문서를 모두 갖추고, 라우팅 설명이 겹침 없이 동작한다.

달성조건:

- [x] 핵심 제품 스킬 16개가 `skills/` 아래에 존재한다.
- [x] 모든 제품 스킬 frontmatter `name`이 디렉토리명과 일치한다.
- [x] 모든 제품 스킬 description이 한국어, 트리거 예시 2~3개, 형제 스킬 경계 문장을 포함한다.
- [x] 각 제품 스킬의 `docs/features/<skill-name>.md`가 존재한다.
- [x] 새 스킬이나 라우팅 변경이 `docs/skill-routing.md`, `README.md`, `docs/roadmap.md`에 반영된다.
- [x] 부모 도메인 출력 필드(아이 나이/학년, 지역, 날짜, 출처, 마감일, 비용, 준비물, 다음 행동)가 관련 스킬에 반영된다.

병렬 작업:

- [x] `skills/k-parent-school-info`와 `skills/k-parent-kindergarten-info`의 데이터 소스·출력 필드 강화
- [x] 놀이 계열 4종(`play`, `festival`, `culture`, `travel`) 라우팅 경계 재점검
- [x] 생활 계열 4종(`application`, `schedule`, `school-doc`, `knowledge`) 승인/개인정보 경계 재점검
- [x] 쇼핑·콘텐츠·데이터 수집 스킬의 상업/출처/freshness 고지 재점검

## Goal 3. fixture-first 데이터 소스 패키지 안정화

목표: 공식/공개 API 어댑터가 fixture로 오프라인 테스트 가능하고, 키가 있으면 라이브 fixture 갱신으로 전환되도록 유지한다.

달성조건:

- [x] 모든 `packages/k-parent-source-*` 패키지가 README, fixture, parser test를 갖춘다.
- [x] 라이브 갱신 스크립트가 키 부재 시 명확히 실패하고 저장소에 시크릿을 남기지 않는다.
- [x] 각 패키지 normalized output이 `packages/k-parent-core` 스키마/가드레일과 충돌하지 않는다.
- [x] `npm test --workspaces --if-present`가 통과한다.
- [x] `npm run pack:dry-run`에서 모든 workspace 패키지가 패키징된다.

병렬 작업:

- [x] NEIS/학교/영양 패키지 검증
- [x] TourAPI/놀이터/서울예약/도서관/문화 패키지 검증
- [x] 어린이집/응급/복지/교통안전 패키지 검증
- [x] 네이버/쿠팡/유튜브 패키지 검증

## Goal 4. 모바일 부모 에이전트 제품화 기반

목표: 문서형 skill collection을 실제 모바일 부모 에이전트로 확장할 수 있는 최소 제품 표면과 품질 루프를 정의한다.

달성조건:

- [x] `docs/productization-gstack.md`가 모바일 홈, 자녀 전환, 데이터 freshness, 일정 후보, 확인 모달, canary 기준을 포함한다.
- [x] 첫 번째 MVP 워크플로우가 명시된다: 예) "이번 주 챙길 것" Today Brief.
- [x] Today Brief가 학교 일정, 급식, 안내문 추출, 놀이/신청 후보를 같은 출력 계약으로 합성한다.
- [x] 캘린더 쓰기, 예약, 신청, 결제는 confirm-before-side-effect 경계를 가진다.
- [x] QA 항목이 모바일 viewport와 source freshness 상태를 포함한다.

병렬 작업:

- [x] Today Brief 입력/출력 계약 점검
- [x] 캘린더 후보/ICS 중복 제거 점검
- [x] 문서 인입/OCR 추출 계약 점검
- [x] 모바일 QA 문서와 canary 기준 점검

## Goal 5. 소유자 작업과 시크릿/승인 경계

목표: 사람이 직접 처리해야 할 API 키, 활용신청, 본인인증, 운영 작업과 에이전트가 해도 되는 작업을 분리한다.

달성조건:

- [x] `OWNER-TASKS.md`가 크레덴셜 발급과 라이브 fixture 갱신 절차를 설명한다.
- [x] `.env.example`, `OWNER-TASKS.md`, package README의 환경변수명이 일치한다.
- [x] data.go.kr 활용신청 대상과 endpoint 확정 필요 항목이 문서화되어 있다.
- [x] guardrail 테스트가 side-effect action을 확인/핸드오프 대상으로 분류한다.
- [x] 시크릿, 로그인 state, raw backup, generated report가 커밋 대상에서 제외된다.

병렬 작업:

- [x] 환경변수명 정합성 점검
- [x] guardrail test 범위 점검
- [x] `.gitignore`와 생성물 정책 점검

## Goal 6. 검증과 CI 복구

목표: 현재 작업트리의 변경사항이 최소한 focused check를 통과하고, 실패가 있으면 TODO에 원인과 다음 조치를 남긴다.

달성조건:

- [x] `npm run lint` 통과 또는 실패 원인 기록
- [x] `npm run typecheck` 통과 또는 실패 원인 기록
- [x] `npm test` 통과 또는 실패 원인 기록
- [x] `npm run pack:dry-run` 통과 또는 실패 원인 기록
- [x] 릴리스/패키징 변경이 있으면 `npm run ci` 통과 또는 실패 원인 기록

병렬 작업:

- [x] 스킬 validation focused run
- [x] Node workspace tests focused run
- [x] Python/unit script tests focused run
- [x] package dry-run focused run

## Goal 7. source 패키지 lint 계약 강화

목표: fixture-first source 패키지의 테스트 파일도 lint/syntax check 대상에 포함해 parser 회귀 테스트가 CI 초반에 실패하도록 유지한다.

달성조건:

- [x] `k-parent-source-culture`, `k-parent-source-library`, `k-parent-source-seoul`의 `lint` script가 `test/index.test.js`를 검사한다.
- [x] source 패키지별 focused lint가 통과한다.
- [x] 관련 parser/freshness 테스트가 계속 통과한다.
- [x] 전체 `npm run lint`가 통과한다.

병렬 작업:

- [x] package script 정합성 보강
- [x] focused package lint/test 실행
- [x] TODO 검증 기록 갱신

## Goal 8. live fixture 갱신 명령 표면 정합성

목표: `scripts/refresh-fixtures.mjs`를 가진 source 패키지는 모두 같은 npm script 표면을 제공해 README/OWNER-TASKS의 라이브 fixture 갱신 절차가 일관되게 실행되도록 한다.

달성조건:

- [x] `scripts/refresh-fixtures.mjs`가 있는 모든 `packages/k-parent-source-*` 패키지가 `refresh:fixtures` script를 가진다.
- [x] `refresh:fixtures` script가 없는 예외는 키 없는 curated catalog 등 명시적 사유가 있다.
- [x] 수정한 package manifest가 JSON으로 파싱되고 lint에 포함된다.
- [x] 전체 `npm run lint`가 통과한다.

병렬 작업:

- [x] package manifest 정합성 보강
- [x] refresh script 보유/선언 상태 재점검
- [x] focused manifest/lint 검증

## Goal 9. refresh fixture 정합성 회귀 테스트

목표: `scripts/refresh-fixtures.mjs`와 `refresh:fixtures` package script의 정합성을 문서 메타 테스트에서 자동 검증해 수동 audit 의존도를 줄인다.

달성조건:

- [x] `scripts/skill-docs.test.js`가 refresh helper 보유 패키지의 `refresh:fixtures` script 존재를 검증한다.
- [x] `refresh:fixtures` script가 실제 helper 파일 없이 선언되지 않았는지 검증한다.
- [x] `k-parent-source-welfare`처럼 live refresh helper가 없는 curated catalog 예외를 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] 메타 테스트 추가
- [x] focused test/lint 실행
- [x] TODO 검증 기록 갱신

## Goal 10. OWNER-TASKS live fixture 명령 문서 표준화

목표: source 패키지에 표준화한 `refresh:fixtures` npm script를 소유자 운영 문서의 기본 명령으로 안내한다.

달성조건:

- [x] `OWNER-TASKS.md`가 `refresh:fixtures`를 표준 명령명으로 설명한다.
- [x] 라이브 fixture 재생성 예시가 `npm run refresh:fixtures --workspace <package>` 형태를 사용한다.
- [x] YouTube처럼 추가 인자가 필요한 경우 `-- "검색어"` 전달 방식을 문서화한다.
- [x] `node --test scripts/skill-docs.test.js` 또는 focused 문서 검증이 통과한다.

병렬 작업:

- [x] OWNER-TASKS refresh 명령 예시 갱신
- [x] 문서 회귀 테스트 보강 여부 판단
- [x] focused 검증과 TODO 기록 갱신

## Goal 11. source package README refresh 명령 표준화

목표: 각 `k-parent-source-*` README의 live fixture 갱신 안내가 표준 `refresh:fixtures` npm script와 일치하도록 정리한다.

달성조건:

- [x] refresh helper가 있는 source README는 직접 `node .../refresh-fixtures.mjs` 대신 `npm run refresh:fixtures`를 안내한다.
- [x] YouTube README는 추가 검색어 인자를 `npm run refresh:fixtures -- "검색어"` 형태로 안내한다.
- [x] NEIS README도 live fixture refresh 명령을 명시한다.
- [x] 문서 회귀 테스트 또는 focused grep 검증이 통과한다.

병렬 작업:

- [x] README 명령 예시 갱신
- [x] README 명령 정합성 테스트/grep
- [x] TODO 검증 기록 갱신

## Goal 12. source package tarball refresh helper 포함

목표: `refresh:fixtures`를 노출하는 source 패키지가 npm pack 결과에서도 helper와 fixture 디렉터리를 함께 포함해 README/package script가 깨지지 않도록 한다.

달성조건:

- [x] `refresh:fixtures`가 있는 source 패키지의 `files` 배열이 `scripts`를 포함한다.
- [x] 해당 `files` 배열이 refresh 출력 대상인 `test/fixtures`를 포함한다.
- [x] 메타 테스트가 refresh script와 package `files` 배열 정합성을 검증한다.
- [x] `npm run pack:dry-run` 또는 focused pack 검증이 통과한다.

병렬 작업:

- [x] source package manifest `files` 배열 갱신
- [x] 메타 테스트 보강
- [x] pack/lint 검증과 TODO 기록 갱신

## Goal 13. 연속 개선 후 전체 CI 재검증

목표: Goal 7-12에서 변경한 package script, README, 메타 테스트, pack 포함 범위가 전체 CI 게이트에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인을 TODO에 남기고 focused fix를 수행한다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 14. OWNER-TASKS data.go.kr 체크리스트 표현 정정

목표: data.go.kr 활용신청 대상 수가 늘어난 상태와 소유자 체크리스트 문구가 일치하도록 한다.

달성조건:

- [x] 수동 검증 체크리스트가 “서비스 3종”처럼 실제 목록과 맞지 않는 고정 숫자를 쓰지 않는다.
- [x] data.go.kr 활용신청은 2-1 목록 전체를 기준으로 확인하라고 안내한다.
- [x] focused grep 또는 `node --test scripts/skill-docs.test.js`가 통과한다.

병렬 작업:

- [x] OWNER-TASKS 문구 수정
- [x] focused 검증과 TODO 기록 갱신

## Goal 15. feature docs refresh 명령 표준화

목표: 루트 README와 feature docs의 live fixture 갱신 안내도 표준 `refresh:fixtures` npm script와 일치하도록 정리한다.

달성조건:

- [x] `README.md`가 직접 `scripts/refresh-fixtures.mjs` 실행 대신 `npm run refresh:fixtures --workspace <package>`를 안내한다.
- [x] `docs/features/k-parent-*-finder|recommender` 문서가 직접 refresh helper 실행 대신 workspace npm script를 안내한다.
- [x] `OWNER-TASKS.md` 체크리스트가 `refresh:fixtures` 실행을 기준으로 말한다.
- [x] 메타 테스트가 오래된 직접 refresh helper 명령을 금지한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] README/feature docs 명령 예시 갱신
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 16. source package README test 명령 표준화

목표: source package README가 루트 경로 `node --test packages/...` 대신 패키지 로컬 또는 workspace npm test 명령을 안내하도록 한다.

달성조건:

- [x] `packages/k-parent-source-youtube/README.md`가 `npm test`를 안내한다.
- [x] source package README에 루트 경로 `node --test packages/k-parent-source-*/test/` 안내가 남지 않는다.
- [x] 메타 테스트가 source package README의 루트 경로 test 명령을 금지한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] YouTube README 테스트 명령 수정
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 17. source package README refresh 섹션 제목 표준화

목표: refresh helper가 있는 source package README는 독립적인 fixture refresh 섹션을 가져 운영자가 명령을 빠르게 찾을 수 있도록 한다.

달성조건:

- [x] `k-parent-source-naver` README가 별도 `## Fixtures refresh` 섹션을 가진다.
- [x] `k-parent-source-coupang` README가 별도 `## Fixtures refresh` 섹션을 가진다.
- [x] 메타 테스트가 refresh helper 보유 source README의 refresh 섹션 제목을 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] Naver/Coupang/Traffic Safety README 섹션 분리
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 18. refresh helper 내부 실행 안내 표준화

목표: source package의 `scripts/refresh-fixtures.mjs` 내부 주석과 에러 메시지도 표준 `npm run refresh:fixtures` 실행 표면을 안내하도록 맞춘다.

달성조건:

- [x] refresh helper 내부에 루트 기준 `node packages/k-parent-source-*/scripts/refresh-fixtures.mjs` 안내가 남지 않는다.
- [x] NEIS 키 누락 에러 메시지가 `npm run refresh:fixtures`를 안내한다.
- [x] 메타 테스트가 refresh helper 내부의 루트 기준 직접 실행 안내를 금지한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] refresh helper 주석/에러 메시지 갱신
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 19. source package README 테스트 명령 표준화

목표: 모든 `k-parent-source-*` README가 패키지 로컬 테스트 명령을 `npm test`로 안내해 루트/패키지 실행 컨텍스트 혼선을 줄인다.

달성조건:

- [x] 모든 source package README가 `npm test`를 명시한다.
- [x] Naver/Coupang README의 `node --test` 안내가 `npm test` 안내로 교체된다.
- [x] 메타 테스트가 source package README의 `npm test` 안내를 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] source README 테스트 섹션 갱신
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 20. source package refresh script alias 단일화

목표: source package manifest의 live fixture 명령 표면을 `refresh:fixtures` 하나로 단일화해 오래된 `refresh-fixtures` alias가 문서/운영 흐름으로 되살아나지 않게 한다.

달성조건:

- [x] `k-parent-source-neis` package manifest에서 `refresh-fixtures` alias가 제거된다.
- [x] 모든 source package manifest가 `refresh:fixtures` 외의 refresh script alias를 갖지 않는다.
- [x] 메타 테스트가 `refresh-fixtures` script key 부재를 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] NEIS package script alias 제거
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 21. source 문서/manifest 표준화 후 전체 CI 재검증

목표: Goal 17-20에서 변경한 source README, refresh helper 안내, package manifest, 메타 테스트가 전체 CI 게이트에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 22. source package tarball 테스트 파일 포함

목표: `npm test`를 README에 안내하는 source package가 npm pack 결과에서도 실제 테스트 파일을 포함해 패키지 설치 후 검증 명령이 깨지지 않도록 한다.

달성조건:

- [x] 모든 `k-parent-source-*` package manifest의 `files` 배열이 `test/*.test.js`를 포함한다.
- [x] `k-parent-source-welfare`도 `npm test` 안내와 tarball 테스트 파일 포함 범위가 일치한다.
- [x] 메타 테스트가 source package README의 `npm test` 안내와 package `files` 배열을 함께 검증한다.
- [x] `npm run pack:dry-run`, `node --test scripts/skill-docs.test.js`, `npm run lint`가 통과한다.

병렬 작업:

- [x] source package manifest `files` 배열 갱신
- [x] 메타 테스트 보강
- [x] pack/focused 검증과 TODO 기록 갱신

## Goal 23. source package tarball 테스트 포함 후 전체 CI 재검증

목표: Goal 22의 package manifest 변경이 전체 CI 흐름과 pack dry-run을 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 24. source package README 테스트 섹션 제목 표준화

목표: 모든 source package README가 테스트 명령 섹션을 `## Testing`으로 표준화해 fixture refresh 섹션과 구분되도록 한다.

달성조건:

- [x] Naver/Coupang README의 `## Tests / fixtures` 제목이 `## Testing`으로 변경된다.
- [x] 모든 source package README가 `## Testing` 제목을 가진다.
- [x] 메타 테스트가 source package README의 `## Testing` 제목을 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] README 제목 갱신
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 25. source package README refresh 섹션 제목 완전 단일화

목표: refresh helper가 있는 모든 source package README의 live fixture 갱신 섹션 제목을 `## Fixtures refresh`로 통일한다.

달성조건:

- [x] `Refresh fixtures`, `Refreshing fixtures`, `픽스처 갱신` 제목이 `## Fixtures refresh`로 교체된다.
- [x] refresh helper 보유 source README가 모두 정확히 `## Fixtures refresh` 제목을 가진다.
- [x] 메타 테스트가 허용 변형 대신 정확한 `## Fixtures refresh` 제목을 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] README refresh 제목 갱신
- [x] 메타 테스트 강화
- [x] focused 검증과 TODO 기록 갱신

## Goal 26. source README 섹션 제목 단일화 후 전체 CI 재검증

목표: Goal 24-25의 README 섹션 제목 단일화와 메타 테스트 강화가 전체 CI 흐름에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 27. source README refresh 명령 env prefix 완성

목표: refresh helper가 있는 source package README의 `Fixtures refresh` 명령 예시가 필요한 환경변수와 `npm run refresh:fixtures`를 함께 보여주는 복사 실행 가능한 형태가 되도록 한다.

달성조건:

- [x] `k-parent-source-seoul` README refresh 명령에 `KSKILL_SEOUL_KEY=...`가 포함된다.
- [x] `k-parent-source-library` README refresh 명령에 `KSKILL_LIBRARY_KEY=...`가 포함된다.
- [x] `k-parent-source-culture` README refresh 명령에 `KSKILL_CULTURE_KEY=...`가 포함된다.
- [x] 메타 테스트가 refresh helper 보유 source README의 credential env와 refresh 명령 동시 안내를 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] Seoul/Library/Culture README 명령 예시 갱신
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 28. source README env prefix 보강 후 전체 CI 재검증

목표: Goal 27의 README refresh 명령 예시와 credential 메타 테스트 보강이 전체 CI 흐름에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 29. refresh helper 키 누락 에러 명령 안내 보강

목표: refresh helper를 env 없이 실행했을 때도 필요한 환경변수와 `npm run refresh:fixtures` 명령을 즉시 안내해 README를 다시 찾지 않아도 되도록 한다.

달성조건:

- [x] refresh helper 보유 source package의 키 누락 에러 경로가 `npm run refresh:fixtures`를 안내한다.
- [x] 단일 키 source helper는 해당 env prefix와 refresh 명령을 함께 출력한다.
- [x] 복수 키 source helper(Naver/Coupang)는 필요한 env prefix들과 refresh 명령을 함께 출력한다.
- [x] 메타 테스트가 refresh helper 내부의 env-prefixed refresh 명령 안내를 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] refresh helper 에러 메시지 갱신
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 30. multi-key refresh 문서 명령 한 줄 통일

목표: Naver/Coupang처럼 키가 2개인 source 문서에서도 refresh 명령이 줄바꿈 continuation 없이 한 줄 env-prefixed 명령으로 보이게 해 grep 감사와 복사 실행성을 높인다.

달성조건:

- [x] `packages/k-parent-source-naver/README.md` refresh 예시가 한 줄 명령이다.
- [x] `packages/k-parent-source-coupang/README.md` refresh 예시가 한 줄 명령이다.
- [x] `OWNER-TASKS.md` Naver/Coupang refresh 예시가 한 줄 명령이다.
- [x] 메타 테스트가 package README와 OWNER-TASKS에서 `\` 뒤 `npm run refresh:fixtures` continuation을 금지한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] 문서 명령 예시 갱신
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 31. refresh helper/docs 보강 후 전체 CI 재검증

목표: Goal 29-30의 helper 에러 메시지, 문서 예시, 메타 테스트 보강이 전체 CI 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 32. source README 최소 Usage 섹션 정렬

목표: 모든 `k-parent-source-*` README가 테스트/fixture 안내 전에 최소 실행 예시를 제공해 패키지 사용자가 exported function 진입점을 바로 찾도록 한다.

달성조건:

- [x] Usage가 없던 source README에 `## Usage` 섹션을 추가한다.
- [x] 각 Usage 예시는 패키지의 실제 exported function을 호출한다.
- [x] 메타 테스트가 모든 source README의 `## Usage` 섹션 존재를 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] source README Usage 예시 추가
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 33. source Usage 문서 보강 후 전체 CI 재검증

목표: Goal 32의 README Usage 섹션 추가와 메타 테스트 보강이 전체 CI와 pack dry-run 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 34. Usage 예시 bare payload placeholder 제거

목표: source README Usage 예시에서 정의되지 않은 `payload` shorthand를 없애고, 오프라인 fixture require 또는 명확한 live-call 인자를 사용하게 한다.

달성조건:

- [x] Usage 예시에 남은 bare `payload` shorthand를 실제 fixture 변수로 치환한다.
- [x] 메타 테스트가 source README에서 bare `payload` shorthand를 금지한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] Usage 예시 fixture 변수 명시
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 35. source README await Usage 예시 async wrapper 정렬

목표: CommonJS `require()`를 쓰는 source README Usage 예시가 top-level `await`만 남기지 않고 async wrapper 안에서 실행되도록 정리한다.

달성조건:

- [x] `await`를 포함한 source README Usage 예시는 `async function main()` 또는 async IIFE를 포함한다.
- [x] 메타 테스트가 `await` 포함 source README에 async wrapper가 있는지 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] Usage await 예시 wrapper 추가
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 36. source README async Usage 예시 main 호출 추가

목표: `async function main()`을 보여주는 source README Usage 예시가 함수 정의만 남기지 않고 `main().catch(...)`로 실제 실행 진입점까지 포함하게 한다.

달성조건:

- [x] `async function main()`을 포함한 source README Usage 예시에 `main().catch` 호출이 있다.
- [x] 메타 테스트가 async main 예시의 호출 누락을 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] Usage main 호출 추가
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 37. source Usage 실행성 보강 후 전체 CI 재검증

목표: Goal 34-36의 README Usage 실행성 보강과 메타 테스트가 전체 CI와 pack dry-run 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 38. README Usage fixture require 경로 검증

목표: source README Usage 예시가 `./test/fixtures/*.json`을 require할 때 문서에 적힌 fixture 파일이 실제 패키지에 존재하는지 메타 테스트로 보장한다.

달성조건:

- [x] 메타 테스트가 source README의 `require("./test/fixtures/...")` 경로를 추출한다.
- [x] 추출한 fixture 경로가 실제 package directory 안에 존재하는지 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] README fixture require 경로 메타 테스트 추가
- [x] focused 검증과 TODO 기록 갱신

## Goal 39. README Usage package require 이름 검증

목표: source README Usage 예시의 `require("k-parent-source-*")`가 해당 패키지 자신의 package name과 일치하도록 메타 테스트로 보장한다.

달성조건:

- [x] 메타 테스트가 source README의 `require("k-parent-source-*")` import를 추출한다.
- [x] 추출한 package import가 현재 package name과 일치하는지 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] README package require 이름 메타 테스트 추가
- [x] focused 검증과 TODO 기록 갱신

## Goal 40. README Usage 경로/이름 검증 후 전체 CI 재검증

목표: Goal 38-39의 README Usage 경로/패키지명 메타 테스트 보강이 전체 CI와 pack dry-run 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 41. source README async Usage 예시 결과 출력 추가

목표: source README의 async Usage 예시가 실행만 하고 조용히 끝나지 않도록 `main().then(console.log).catch(...)` 형태로 결과 출력까지 보여준다.

달성조건:

- [x] `async function main()`을 포함한 source README Usage 예시는 `main().then(console.log).catch` 호출을 포함한다.
- [x] 메타 테스트가 async main 예시의 출력 호출 누락을 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] Usage main 출력 호출 추가
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 42. Usage 결과 출력 보강 후 전체 CI 재검증

목표: Goal 41의 README Usage 결과 출력 보강과 메타 테스트가 전체 CI와 pack dry-run 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 43. README Usage fixture tarball 포함 계약 검증

목표: source README Usage 예시가 `./test/fixtures/*`를 require할 때 해당 fixture 디렉터리가 package tarball에도 포함되도록 메타 테스트로 보장한다.

달성조건:

- [x] 메타 테스트가 README fixture require 사용 여부를 감지한다.
- [x] fixture require를 사용하는 source package의 `package.json.files`가 `test/fixtures`를 포함하는지 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] README fixture require와 package files 계약 연결
- [x] focused 검증과 TODO 기록 갱신

## Goal 44. source README Usage 코드블록/자기 패키지 import 검증

목표: source README의 Usage 섹션이 복사 가능한 JavaScript 코드블록과 해당 패키지 자신의 import 예시를 항상 포함하도록 메타 테스트로 보장한다.

달성조건:

- [x] 메타 테스트가 `## Usage` 섹션 안의 `js` 또는 `javascript` fenced code block을 검증한다.
- [x] 메타 테스트가 Usage 섹션에서 현재 package name을 `require(...)`하는지 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] Usage section 코드블록/import 계약 추가
- [x] focused 검증과 TODO 기록 갱신

## Goal 45. Usage 메타 계약 보강 후 전체 CI 재검증

목표: Goal 43-44의 README Usage 메타 계약 보강이 전체 CI와 pack dry-run 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 46. source README Configuration heading 표준화

목표: source package README의 API key/환경 설정 안내를 `## Configuration` 섹션으로 통일해 운영자가 설정 정보를 빠르게 찾도록 한다.

달성조건:

- [x] credential 또는 optional live lookup이 있는 source README가 `## Configuration` 섹션을 가진다.
- [x] source README에서 `## Credentials`, `## Config`, `## Environment`, `## 환경변수`, `## Optional live lookup` heading을 제거한다.
- [x] 메타 테스트가 Configuration heading과 legacy heading 부재를 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] source README heading 표준화
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 47. source README shell 명령 fence 언어 표준화

목표: source README의 Testing, Fixtures refresh, shell 기반 Configuration 예시가 모두 `bash` fenced code block으로 표시되도록 통일한다.

달성조건:

- [x] Testing 섹션의 `npm test` 예시가 `bash` fenced code block을 사용한다.
- [x] Fixtures refresh 섹션의 env-prefixed refresh 예시가 `bash` fenced code block을 사용한다.
- [x] shell export가 있는 Configuration 예시가 `bash` fenced code block을 사용한다.
- [x] 메타 테스트가 shell 명령 fence 언어를 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] source README shell fence 표준화
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 48. source README 설정/명령 표준화 후 전체 CI 재검증

목표: Goal 46-47의 source README 설정 heading과 shell fence 표준화가 전체 CI와 pack dry-run 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 49. source README Testing 오프라인 계약 검증

목표: fixture-first source package README의 Testing 섹션이 네트워크 없이 오프라인 테스트가 실행된다는 점을 항상 명시하도록 보장한다.

달성조건:

- [x] 메타 테스트가 source README의 `## Testing` 섹션을 섹션 단위로 읽는다.
- [x] 각 Testing 섹션이 `fully offline` 또는 동등한 오프라인 실행 문구를 포함하는지 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] Testing offline 문구 메타 테스트 추가
- [x] focused 검증과 TODO 기록 갱신

## Goal 50. Testing 오프라인 계약 보강 후 전체 CI 재검증

목표: Goal 49의 README Testing 오프라인 계약 보강이 전체 CI와 pack dry-run 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 51. welfare source README refresh 예외 고정

목표: `k-parent-source-welfare`는 curated catalog/딥링크 패키지라 live fixture refresh 대상이 아니므로 README에도 `Fixtures refresh` 섹션이 생기지 않도록 메타 테스트로 보장한다.

달성조건:

- [x] 메타 테스트가 `k-parent-source-welfare` README에 `## Fixtures refresh` 섹션이 없는지 검증한다.
- [x] welfare package가 `refresh:fixtures` script와 refresh helper를 갖지 않는 기존 예외 검증과 함께 동작한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] welfare README refresh 섹션 금지 테스트 추가
- [x] focused 검증과 TODO 기록 갱신

## Goal 52. source README provenance/freshness 출력 계약 명시

목표: source package README가 정규화 결과에 출처/provenance와 freshness metadata가 포함된다는 출력 계약을 일관되게 설명하도록 한다.

달성조건:

- [x] 모든 `packages/k-parent-source-*` README가 provenance/source metadata를 언급한다.
- [x] 모든 source README가 freshness 또는 최신성 metadata를 언급한다.
- [x] 메타 테스트가 source README의 provenance/freshness 출력 계약 문구를 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] source README provenance/freshness 문구 추가
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 53. welfare/provenance 문서 계약 보강 후 전체 CI 재검증

목표: Goal 51-52의 welfare refresh 예외와 provenance/freshness README 계약 보강이 전체 CI와 pack dry-run 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 54. source README live fixture refresh 의미 명시

목표: live fixture refresh 대상 source package README가 `npm run refresh:fixtures` 명령이 실제 외부 API를 호출한다는 점을 명확히 설명하도록 한다.

달성조건:

- [x] welfare를 제외한 모든 source README의 `## Fixtures refresh` 섹션이 live/API 호출 의미를 포함한다.
- [x] 메타 테스트가 refresh 대상 README의 live fixture refresh 설명을 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] source README fixture refresh 문구 추가
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 55. parent feature docs 내부 fixture 경로 노출 축소

목표: 부모-facing feature 문서가 source package의 내부 `test/fixtures` 파일 경로를 사용자 계약처럼 노출하지 않고, 오프라인 테스트/갱신 명령 수준으로만 안내하도록 한다.

달성조건:

- [x] `docs/features/k-parent-shopping-recommender.md`에서 내부 fixture 파일 경로 나열을 제거한다.
- [x] 메타 테스트가 `docs/features/k-parent-*` 문서의 source package fixture 경로 노출을 금지한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] 쇼핑 추천 feature doc 정리
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 56. Goal 54-55 문서 계약 보강 후 전체 CI 재검증

목표: live fixture refresh 문구와 parent feature fixture 경로 노출 축소가 전체 CI와 pack dry-run 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 57. welfare source optional credential 예외 고정

목표: `k-parent-source-welfare`가 curated catalog 기본 동작이며 API key는 선택 사항이라는 예외가 문서와 메타 테스트에서 계속 유지되도록 한다.

달성조건:

- [x] welfare README가 no API key required, optional key, fully offline 기본 동작을 모두 설명한다.
- [x] OWNER-TASKS가 welfare는 외부 키 없이 동작하며 live lookup은 선택 stub임을 설명한다.
- [x] 메타 테스트가 welfare optional credential 예외를 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] welfare 문서 예외 상태 점검
- [x] 메타 테스트 보강
- [x] focused 검증과 TODO 기록 갱신

## Goal 58. welfare test fixture 패키징 누락 수정

목표: `k-parent-source-welfare` tarball에 `npm test`가 필요로 하는 `test/fixtures/expected-services.json`이 포함되도록 패키징 계약을 수정한다.

달성조건:

- [x] `packages/k-parent-source-welfare/package.json` `files`에 `test/fixtures`를 포함한다.
- [x] 메타 테스트가 source package 테스트에서 fixture를 읽으면 tarball `files`에 `test/fixtures`가 포함되는지 검증한다.
- [x] `npm test --workspace k-parent-source-welfare`, `node --test scripts/skill-docs.test.js`, `npm run lint`, `npm run pack:dry-run`이 통과한다.

병렬 작업:

- [x] welfare package files 수정
- [x] 메타 테스트 보강
- [x] focused/pack 검증과 TODO 기록 갱신

## Goal 59. welfare 예외/패키징 보강 후 전체 CI 재검증

목표: Goal 57-58의 welfare optional credential 예외와 fixture 패키징 수정이 전체 CI에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 60. 로컬 생성물/세션 파일 추적 금지 메타 테스트

목표: `.DS_Store`, 세션 파일, sqlite/db 상태, raw backup/archive 같은 로컬 생성물이 git tracked 파일로 들어오지 않도록 메타 테스트로 고정한다.

달성조건:

- [x] 메타 테스트가 `git ls-files` 기준 금지 로컬 파일 패턴을 검사한다.
- [x] `.gitignore`의 기존 생성물 차단 정책과 충돌하지 않는다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] tracked local artifact 테스트 추가
- [x] focused 검증과 TODO 기록 갱신

## Goal 61. local artifact 메타 테스트 추가 후 전체 CI 재검증

목표: Goal 60의 tracked local artifact 메타 테스트가 전체 CI 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 62. publishable workspace pack dry-run 누락 수정

목표: `publishConfig.access=public`인 workspace가 root `npm run pack:dry-run`에서 빠지지 않도록 `court-auction-notice-search` 누락을 수정하고 메타 테스트로 고정한다.

달성조건:

- [x] root `pack:dry-run` script가 `court-auction-notice-search`를 포함한다.
- [x] 메타 테스트가 publishable workspace 전체가 root `pack:dry-run`에 포함되는지 검증한다.
- [x] `node --test scripts/skill-docs.test.js`, `npm run lint`, `npm pack --workspace court-auction-notice-search --dry-run`, `npm run pack:dry-run`이 통과한다.

병렬 작업:

- [x] root package script 수정
- [x] 메타 테스트 보강
- [x] focused/pack 검증과 TODO 기록 갱신

## Goal 63. pack dry-run coverage 보강 후 전체 CI 재검증

목표: Goal 62의 publishable workspace pack coverage 보강이 전체 CI 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 64. 비활성 release-please 빈 설정 제거

목표: 실제 Python publish package가 없는 상태에서 남아 있는 빈 `.github/release-please` 설정을 제거하고, release automation disabled 정책을 메타 테스트로 고정한다.

달성조건:

- [x] `.github/release-please/python-config.json`와 `python-manifest.json` tracked 파일을 제거한다.
- [x] 메타 테스트가 `python-packages/*/pyproject.toml`이 없으면 release-please config/manifest가 tracked 상태로 남지 않는지 검증한다.
- [x] 메타 테스트가 GitHub Actions workflow에 release/publish job이 없음을 검증한다.
- [x] `node --test scripts/skill-docs.test.js`와 `npm run lint`가 통과한다.

병렬 작업:

- [x] stale release-please config 제거
- [x] release automation disabled 메타 테스트 추가
- [x] focused 검증과 TODO 기록 갱신

## Goal 65. release automation disabled 보강 후 전체 CI 재검증

목표: Goal 64의 release-please config 제거와 release automation disabled 메타 테스트가 전체 CI 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## 발견된 요구사항

- [x] `TODO.md`를 계속 갱신하며 새 요구사항을 구현 전 백로그에 추가한다.
- [x] 대규모 dirty worktree에서 사용자 변경을 되돌리지 않고 필요한 파일만 명시적으로 수정한다.
- [x] 현재 구조 변경(`skills/`, `examples/`)에 맞춰 문서와 검증 스크립트가 모두 일치하는지 확인한다.
- [x] `k-parent-source-welfare`는 키 없는 복지 카탈로그/딥링크 패키지라 live fixture refresh 대상에서 제외한다.

## Goal 66. repo-local ignored `.DS_Store` 정리

목표: `.github/.DS_Store`처럼 무시되지만 작업 디렉터리에 남아 있는 로컬 Finder 아티팩트를 제거해 저장소 점검 노이즈를 줄인다.

달성조건:

- [x] `.github/.DS_Store`를 제거한다.
- [x] `find .github -maxdepth 2 -name .DS_Store`가 빈 결과인지 확인한다.
- [x] `git status --short -- .github/.DS_Store`가 빈 결과인지 확인한다.

병렬 작업:

- [x] 로컬 아티팩트 제거
- [x] 제거 상태 검증

## Goal 67. stale Changesets publishing surface 제거

목표: 릴리스 자동화 비활성화 정책과 충돌하는 루트 Changesets 스크립트, 설정, 현재형 publish 문서를 제거하거나 비활성 상태 설명으로 바꾼다.

달성조건:

- [x] 루트 `package.json`에서 `changeset publish/version` 스크립트와 `@changesets/cli` devDependency를 제거한다.
- [x] `.changeset/config.json`을 제거하고 lockfile을 일관되게 갱신한다.
- [x] LCK 관련 문서의 현재형 자동 publish 설명을 현재 비활성 정책에 맞게 수정한다.
- [x] release automation disabled 메타 테스트가 Changesets 잔여 표면도 잡도록 보강한다.
- [x] focused 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 루트 패키징 설정 정리
- [x] 문서 현재형 publish 설명 정리
- [x] 메타 테스트 보강
- [x] focused 검증

## Goal 68. parent proxy secrets 기본 경로 정렬

목표: repo-specific proxy 운영 규칙과 맞지 않는 `~/.config/k-skill/secrets.env` 기본 경로를 parent/proxy 표면에서 `~/.config/k-parent-skill/secrets.env`로 정렬한다.

달성조건:

- [x] `docs/setup.md`, `docs/security-and-secrets.md`, `docs/adding-a-skill.md`의 parent/proxy secrets 경로를 갱신한다.
- [x] `scripts/run-k-skill-proxy.sh`, `scripts/check-setup.sh`, `packages/k-skill-proxy/README.md`의 기본 secrets 경로를 갱신한다.
- [x] 메타 테스트가 parent/proxy 표면의 오래된 `~/.config/k-skill/secrets.env` 경로를 잡도록 보강한다.
- [x] focused 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 문서 경로 갱신
- [x] 스크립트 기본값 갱신
- [x] 메타 테스트 보강
- [x] focused 검증

## Goal 69. parent-facing 설치/프록시 명칭 드리프트 정리

목표: 현재 저장소 설치 문서와 proxy README가 원본 `k-skill`이 아니라 `k-parent-skill` 대상임을 명확히 하되, 실제 패키지명(`k-skill-proxy`, `k-skill-setup`)은 유지한다.

달성조건:

- [x] `docs/install.md`의 기본 설치 흐름과 에이전트 프롬프트가 `k-parent-skill` 전체 스킬 설치로 표현된다.
- [x] `packages/k-skill-proxy/README.md` 소개가 parent repo에서도 쓰는 proxy임을 표현한다.
- [x] 메타 테스트가 설치 문서의 오래된 `k-skill 전체 스킬` 문구를 잡도록 보강된다.
- [x] focused 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 설치 문서 명칭 갱신
- [x] proxy README 명칭 갱신
- [x] 메타 테스트 보강
- [x] focused 검증

## Goal 70. install docs 제품 스킬 선택 설치 커버리지 보강

목표: `skills/` 컨테이너의 parent 제품 스킬이 `docs/install.md` 선택 설치 예시에 빠지지 않도록 문서와 메타 테스트를 보강한다.

달성조건:

- [x] `docs/install.md`에 parent 제품 스킬 선택 설치 예시를 추가한다.
- [x] `skills/*/SKILL.md`에 있는 모든 제품 스킬이 설치 문서의 `--skill` 예시에 포함된다.
- [x] 메타 테스트가 `skills/` 제품 스킬 누락을 잡도록 보강된다.
- [x] focused 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 설치 문서 제품 스킬 블록 추가
- [x] 메타 테스트 보강
- [x] focused 검증

## Goal 71. README 설치 가이드 설명 정렬

목표: README 문서 표의 설치 가이드 설명이 원본 구조 일반 설명이 아니라 `k-parent-skill` 제품 스킬 설치 흐름을 가리키도록 정렬한다.

달성조건:

- [x] README의 `docs/install.md` 설명을 parent 제품 스킬 설치/선택 설치 흐름으로 갱신한다.
- [x] 메타 테스트가 README 설치 가이드 설명의 parent install 문구를 확인한다.
- [x] focused 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] README 설명 갱신
- [x] 메타 테스트 보강
- [x] focused 검증

## Goal 72. 설치/시크릿 문서 변경 후 전체 CI 재검증

목표: Goals 68-71의 설치, 시크릿 경로, README, 메타 테스트 변경이 전체 CI 흐름에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 73. repo-wide ignored `.DS_Store` 로컬 아티팩트 정리

목표: 루트, docs, examples, packages, skills, node_modules, .git 아래에 남아 있는 무시된 `.DS_Store` 파일을 제거해 작업 디렉터리 점검 노이즈를 줄인다.

달성조건:

- [x] `find . -name .DS_Store -type f`로 현재 로컬 아티팩트를 확인한다.
- [x] 확인된 `.DS_Store` 파일을 제거한다.
- [x] 제거 후 `find . -name .DS_Store -type f`가 빈 결과인지 확인한다.
- [x] `git status --short -- .DS_Store docs/.DS_Store examples/.DS_Store packages/.DS_Store skills/.DS_Store`가 빈 결과인지 확인한다.

병렬 작업:

- [x] 로컬 아티팩트 목록 확인
- [x] `.DS_Store` 제거
- [x] 제거 상태 검증

## Goal 74. Changesets 제거 후 extraneous node_modules 정리

목표: lockfile과 루트 의존성에서 제거된 Changesets 패키지가 로컬 `node_modules`에 extraneous로 남지 않도록 정리한다.

달성조건:

- [x] `npm ls @changesets/cli --depth=0`에서 extraneous 상태를 확인한다.
- [x] `npm prune --ignore-scripts`로 lockfile에 없는 로컬 패키지를 제거한다.
- [x] `npm ls @changesets/cli --depth=0`이 의존성 없음으로 정리됐음을 확인한다.
- [x] package-lock의 `@changesets` 항목이 계속 0개임을 확인한다.

병렬 작업:

- [x] extraneous 상태 확인
- [x] npm prune 실행
- [x] 제거 상태 검증

## Goal 75. npm audit high severity 취약점 triage

목표: `npm prune` 출력에 남은 high severity 취약점 2건의 원인 패키지와 수정 가능 여부를 확인하고, 안전한 lockfile/package 업데이트로 해결 가능한 경우 적용한다.

달성조건:

- [x] `npm audit --json`으로 취약점 원인과 권장 조치를 확인한다.
- [x] semver-compatible 업데이트 또는 lockfile 재해결로 해결 가능하면 적용한다.
- [x] breaking/위험한 변경이 필요하면 TODO에 원인과 보류 사유를 남긴다.
- [x] 적용 또는 보류 후 focused 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] audit 결과 확인
- [x] 수정 가능성 판단
- [x] 수정/보류 기록
- [x] focused 검증

## Goal 76. 보안 의존성 업데이트 후 전체 CI 재검증

목표: Goal 75의 `fastify`/`fast-uri` 업데이트가 전체 lint/typecheck/test/pack 흐름에서도 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인과 다음 조치를 TODO에 남긴다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 77. feature/helper secrets 안내 경로 정렬

목표: 공통 설정 경로를 `~/.config/k-parent-skill/secrets.env`로 정리한 뒤에도 남아 있는 feature docs와 helper 에러 메시지의 옛 `~/.config/k-skill/secrets.env` 안내를 갱신한다.

달성조건:

- [x] `docs/features/srt-booking.md`, `ktx-booking.md`, `foresttrip-vacancy.md`, `fine-dust-location.md`의 secrets 경로를 갱신한다.
- [x] `scripts/ktx_booking.py`, `scripts/fine_dust.py`의 missing credential 안내 경로를 갱신한다.
- [x] 메타 테스트가 parent docs/scripts의 옛 secrets 경로를 잡도록 보강된다.
- [x] focused 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] feature docs 경로 갱신
- [x] helper 메시지 경로 갱신
- [x] 메타 테스트 보강
- [x] focused 검증

## Goal 78. setup product skill config root 정렬

목표: 제품 스킬 `skills/k-skill-setup`이 부모 저장소의 기본 config root인 `~/.config/k-parent-skill`을 안내하도록 정리한다.

달성조건:

- [x] credential resolution order와 secrets 파일 생성 예시가 `~/.config/k-parent-skill/secrets.env`를 사용한다.
- [x] update-check helper/log 예시가 `~/.config/k-parent-skill/bin`과 `~/.config/k-parent-skill/logs`를 사용한다.
- [x] completion checklist가 부모 config root 기준으로 갱신된다.
- [x] 메타 테스트가 setup product skill의 옛 secrets 경로 회귀를 잡는다.
- [x] focused 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] setup skill 본문 경로 갱신
- [x] setup skill completion checklist 갱신
- [x] 메타 테스트 보강
- [x] focused 검증

## Goal 79. installable examples secrets fallback 정렬

목표: `--full-depth`로 설치될 수 있는 inherited example 스킬의 secrets fallback 안내도 부모 저장소 기본 경로와 충돌하지 않게 맞춘다.

달성조건:

- [x] `examples/srt-booking/SKILL.md`의 secrets fallback 경로가 `~/.config/k-parent-skill/secrets.env`를 사용한다.
- [x] `examples/ktx-booking/SKILL.md`의 secrets fallback 경로가 `~/.config/k-parent-skill/secrets.env`를 사용한다.
- [x] `examples/foresttrip-vacancy/SKILL.md`의 credential resolution 및 safety note가 `~/.config/k-parent-skill/secrets.env`를 사용한다.
- [x] focused grep과 skill docs regression을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] SRT/KTX example credential 문구 갱신
- [x] Foresttrip example credential/safety 문구 갱신
- [x] focused 검증

## Goal 80. setup product skill repository branding 정렬

목표: 제품 스킬 `k-skill-setup`의 제목, 설치 전제, GitHub star 안내가 원본 `NomaDamas/k-skill`이 아니라 현재 `k-parent-skill` 제품 맥락을 가리키도록 정리한다.

달성조건:

- [x] frontmatter description과 본문 제목/목적이 `k-parent-skill` 설치 후 setup으로 설명된다.
- [x] install section이 `k-parent-skill` 전체 설치 후 실행되는 흐름으로 설명된다.
- [x] GitHub star 안내가 원본 저장소를 직접 대상으로 삼지 않고 현재 `k-parent-skill` repo placeholder를 사용한다.
- [x] 메타 테스트가 setup skill의 원본 repo star/설치 문구 회귀를 잡는다.
- [x] focused 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] setup skill 제목/설치 문구 갱신
- [x] GitHub star 안내 대상 갱신
- [x] 메타 테스트 보강
- [x] focused 검증

## Goal 81. setup/secrets 정렬 후 전체 CI 재검증

목표: Goal 77-80에서 변경한 setup skill, example skill, helper 문구, 메타 테스트가 전체 CI 게이트에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 원인을 TODO에 남기고 focused fix를 수행한다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 82. moved skill script/link path 정렬

목표: 루트 평면 스킬 구조에서 `skills/`·`examples/` 컨테이너 구조로 이동한 뒤 남아 있는 오래된 script/link 경로 안내를 현재 checkout 및 설치 기준에 맞춘다.

달성조건:

- [x] `docs/features/k-skill-cleaner.md`가 repo checkout 기준 `skills/k-skill-cleaner/scripts/k_skill_cleaner.py`를 안내한다.
- [x] `docs/features/coupang-product-search.md`와 `docs/features/foresttrip-vacancy.md`가 repo checkout 기준 `examples/<skill>/scripts/...`를 안내한다.
- [x] `examples/coupang-product-search/SKILL.md`와 `examples/foresttrip-vacancy/SKILL.md`는 설치된 스킬 디렉터리 기준 `scripts/...` helper 경로를 안내한다.
- [x] `docs/features/rhwp-edit.md`, `docs/features/rhwp-advanced.md`의 skill definition 링크가 `examples/` 컨테이너를 가리킨다.
- [x] focused grep과 regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] feature docs helper 경로 갱신
- [x] example SKILL helper 경로 갱신
- [x] rhwp skill definition 링크 갱신
- [x] focused 검증

## Goal 83. local markdown link integrity 정리

목표: 문서와 스킬 파일의 로컬 Markdown 링크가 실제 파일을 가리키거나, 링크가 아닌 스크랩 텍스트는 링크처럼 보이지 않게 정리한다.

달성조건:

- [x] `examples/korean-privacy-terms/SKILL.md`의 root LICENSE 링크가 실제 `LICENSE` 파일을 가리킨다.
- [x] `docs/neis_homepage_notice_all_schools_probe.md`의 잘못 생성된 parenthesis 링크가 일반 텍스트로 정리된다.
- [x] 로컬 Markdown 링크 audit가 missing 0건을 보고한다.
- [x] focused 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] Korean privacy terms LICENSE 링크 수정
- [x] NEIS probe generated link 텍스트 정리
- [x] local markdown link audit

## Goal 84. local markdown link audit 메타 테스트 승격

목표: 임시로 실행한 로컬 Markdown 링크 무결성 점검을 `scripts/skill-docs.test.js`의 상시 regression으로 승격해 깨진 내부 링크를 CI에서 잡는다.

달성조건:

- [x] `scripts/skill-docs.test.js`가 README, AGENTS/CLAUDE, docs, skills, examples 하위 Markdown 파일을 순회한다.
- [x] 외부 URL, mailto, anchor-only 링크는 건너뛰고 로컬 상대 링크만 검사한다.
- [x] missing local link가 있으면 파일과 target을 포함해 실패한다.
- [x] focused regression과 lint를 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] markdown 파일 순회 helper 추가
- [x] local link integrity test 추가
- [x] focused 검증

## Goal 85. path/link regression 추가 후 전체 CI 재검증

목표: Goal 82-84에서 변경한 경로 문서, 로컬 링크 수정, 메타 테스트가 전체 CI 게이트에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 원인을 TODO에 남기고 focused fix를 수행한다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 86. ignored Playwright MCP local logs 정리

목표: 저장소 정책상 커밋하지 않는 로컬 실행 로그 `.playwright-mcp/`를 작업 디렉터리에서 제거하고, ignore 규칙과 추적 상태가 안전한지 확인한다.

달성조건:

- [x] `.playwright-mcp/`가 git 추적 대상이 아님을 확인한다.
- [x] `.gitignore`가 `.playwright-mcp/`를 계속 무시한다.
- [x] 로컬 `.playwright-mcp/` 로그 디렉터리를 제거한다.
- [x] 재스캔에서 `.playwright-mcp/*.log`가 0건임을 확인하고 검증 기록에 남긴다.

병렬 작업:

- [x] 추적/ignore 상태 확인
- [x] 로컬 로그 삭제
- [x] 재스캔 검증

## Goal 87. local-only artifact regression 범위 확장

목표: `scripts/skill-docs.test.js`의 local-only artifact 회귀 테스트가 `.gitignore` 정책의 로그, login-state 이미지, 암호화/평문 덤프 확장자까지 감시하도록 보강한다.

달성조건:

- [x] tracked `.log` 파일이 있으면 실패한다.
- [x] tracked `*-login-state.png`와 `data-go-kr-login-state.png`가 있으면 실패한다.
- [x] tracked `.dec`, `.plaintext`, `.env`류 파일이 있으면 실패한다.
- [x] focused regression과 lint를 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] forbidden artifact regex 확장
- [x] focused 검증

## Goal 88. thin-wrapper install/pin path 정렬

목표: `examples/`로 이동한 thin-wrapper 스킬의 install script와 upstream pin 안내가 현재 repo checkout 및 설치 스킬 기준과 일치하도록 정리한다.

달성조건:

- [x] `docs/features/korean-privacy-terms.md`, `docs/features/korean-jangbu-for.md`, `docs/install.md`가 repo checkout 기준 `examples/<skill>/scripts/...`를 안내한다.
- [x] `examples/korean-privacy-terms/SKILL.md`, `examples/korean-jangbu-for/SKILL.md`가 설치된 스킬 디렉터리 기준 `scripts/install.sh`, `scripts/upstream.pin`을 안내한다.
- [x] `docs/features/iros-registry-automation.md`, `docs/sources.md`, `examples/iros-registry-automation/SKILL.md`의 upstream pin 경로가 `examples/` 또는 local `scripts/` 기준으로 정렬된다.
- [x] focused grep과 lint를 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] docs feature/install 경로 갱신
- [x] example SKILL 경로 갱신
- [x] iros pin 경로 갱신
- [x] focused 검증

## Goal 89. artifact/thin-wrapper regression 후 전체 CI 재검증

목표: Goal 87-88에서 변경한 local artifact regression과 thin-wrapper 경로 정렬이 전체 CI 게이트에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 원인을 TODO에 남기고 focused fix를 수행한다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 90. inherited K League skill release 안내 정렬

목표: inherited demo skill 문서에 남아 있는 Changesets 기반 npm publish 안내를 현재 k-parent-skill의 release automation 비활성 정책과 맞춘다.

달성조건:

- [x] `examples/kleague-results/SKILL.md`의 publish 안내를 로컬 workspace/pack dry-run 검증과 나중 재도입 안내로 교체한다.
- [x] stale publish 안내 회귀 테스트가 `npm publish(...)` 형태도 잡도록 보강한다.
- [x] focused grep과 regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] stale release 문구 스캔
- [x] 문서/테스트 수정
- [x] focused 검증

## Goal 91. CLAUDE.md compatibility symlink 정렬

목표: repo 운영 규칙의 단일 source of truth를 `AGENTS.md`로 정리하고, `CLAUDE.md`를 호환 symlink로 맞춘다.

달성조건:

- [x] `CLAUDE.md`에만 있던 SKILL.md authoring/gstack/proxy 요약 중 필요한 내용을 `AGENTS.md`에 반영한다.
- [x] `docs/architecture.md`의 agent context 설명을 `CLAUDE.md` symlink 정책과 맞춘다.
- [x] `CLAUDE.md`를 `AGENTS.md` symlink로 교체한다.
- [x] context regression이 symlink 정책을 검증하도록 보강한다.
- [x] focused regression과 lint를 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 기존 AGENTS/CLAUDE 차이 분석
- [x] 문서/테스트/symlink 정렬
- [x] focused 검증

## Goal 92. planning/department skill container 문구 정렬

목표: planning/department 문서에 남아 있는 root-level skill directory 설명을 현재 `skills/`/`examples/` 컨테이너 구조와 맞춘다.

달성조건:

- [x] `docs/planning/README.md`의 root-level skill folder 문구를 container-flat 구조로 교체한다.
- [x] `docs/departments/README.md`의 설치 단위 설명을 `skills/<skill-name>/SKILL.md`로 교체한다.
- [x] context regression이 planning/department container 문구를 검증하도록 보강한다.
- [x] focused grep/regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] stale root-level 문구 스캔
- [x] 문서/테스트 수정
- [x] focused 검증

## Goal 93. k-skill-cleaner container scan 지원

목표: `k-skill-cleaner` helper와 문서가 현재 `skills/`/`examples/` 컨테이너 구조에서도 올바른 cleanup 후보를 찾도록 정렬한다.

달성조건:

- [x] `find_skill_dirs`가 repo root의 `skills/`와 `examples/` 컨테이너를 스캔한다.
- [x] 기존 standalone/direct skill bundle 스캔 동작은 유지한다.
- [x] `k-skill-cleaner` SKILL/docs의 root-level 표현을 container-aware 표현으로 교체한다.
- [x] helper regression/lint와 stale root-level grep을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] helper 코드/테스트 수정
- [x] SKILL/docs 문구 수정
- [x] focused 검증

## Goal 94. briefing/research/planning container 구조 정렬

목표: 공유 브리핑, 스캐폴딩 계획, 연구 기록에 남아 있는 root-level skill 구조 설명을 현재 `skills/`/`examples/` 컨테이너 구조와 맞춘다.

달성조건:

- [x] `docs/planning/scaffolding-plan.md`의 baseline을 container skill directories로 교체한다.
- [x] `docs/briefing.html`의 현재 스킬 맵 설명을 `skills/`/`examples/` 구조로 교체한다.
- [x] `docs/research/k-parent-skill-architecture-ecosystem-2026-05-01.md`의 core thesis 구조 설명을 최신 구조로 보정한다.
- [x] stale root-level structure grep과 context regression/lint를 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 브리핑/계획/연구 문구 수정
- [x] stale root-level 구조 스캔
- [x] focused 검증

## Goal 95. context/container 정렬 후 전체 CI 재검증

목표: Goal 90-94에서 변경한 release 안내, agent context symlink, container 구조 문서, k-skill-cleaner helper 변경이 전체 CI 게이트에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 원인을 TODO에 남기고 focused fix를 수행한다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 96. release-disabled test 변수명 범위 정렬

목표: release automation disabled regression의 문서 목록 변수명을 실제 검사 범위와 맞춰 future maintainer 혼선을 줄인다.

달성조건:

- [x] `scripts/skill-docs.test.js`의 `lckReleaseDocs`를 더 일반적인 이름으로 바꾼다.
- [x] release disabled focused test와 lint를 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 테스트 변수명 정리
- [x] focused 검증

## Goal 97. AGENTS/CLAUDE 문서 source-of-truth 표현 정렬

목표: 새 `CLAUDE.md -> AGENTS.md` symlink 정책에 맞춰 새 스킬 가이드와 project structure spec의 agent context 설명을 정리한다.

달성조건:

- [x] `docs/adding-a-skill.md`의 프록시 참고와 체크리스트를 `AGENTS.md` 중심으로 바꾼다.
- [x] `docs/specs/project-structure.md`의 Agent entry 설명을 source-of-truth/symlink 관계로 바꾼다.
- [x] context regression이 별도 `CLAUDE.md` 업데이트를 요구하지 않도록 검증한다.
- [x] focused grep/regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] AGENTS/CLAUDE 문구 스캔
- [x] 문서/테스트 수정
- [x] focused 검증

## Goal 98. skill-routing 공통 출력/안전 신호 보강

목표: `docs/skill-routing.md`가 스킬 선택뿐 아니라 부모용 공통 출력 필드와 민감 작업 승인 경계를 함께 안내하도록 보강한다.

달성조건:

- [x] routing 문서에 공통 출력 신호(지역, 날짜 범위, 출처 URL, 마감, 비용, 필요 서류, 확인 기준일)를 추가한다.
- [x] routing 문서에 신청/예약/결제/아이 개인정보 쓰기 승인 경계를 명시한다.
- [x] routing regression이 공통 출력/안전 신호를 검증하도록 보강한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] routing 문서 보강
- [x] 테스트 보강
- [x] focused 검증

## Goal 99. install docs full-depth 범위 설명 정밀화

목표: 설치 문서가 제품 스킬 선택 설치와 예제 포함 선택 설치의 `--full-depth` 필요 여부를 혼동 없이 설명하도록 정리한다.

달성조건:

- [x] `docs/install.md`의 레이아웃 주의 문구를 제품 블록/예제 블록 차이에 맞게 수정한다.
- [x] install docs regression이 제품 선택 설치에는 `--full-depth`가 필수가 아니고 예제 포함 블록에는 필요하다는 설명을 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 설치 문구 수정
- [x] 테스트 보강
- [x] focused 검증

## Goal 100. routing/install/context 보강 후 전체 CI 재검증

목표: Goal 96-99에서 변경한 release regression 정리, AGENTS/CLAUDE source-of-truth 문서, routing 공통 출력/안전 신호, install full-depth 안내 보강이 전체 CI 게이트에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 원인을 TODO에 남기고 focused fix를 수행한다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 101. k-skill-proxy README endpoint 목록 정합성

목표: `packages/k-skill-proxy/README.md`의 현재 제공 엔드포인트 목록을 실제 `server.js` 라우트와 맞추고, 누락 회귀를 막는다.

달성조건:

- [x] README에 `/v1/blue-ribbon/nearby`, `/v1/opinet/*`, `/v1/real-estate/*`, MFDS 세부 food-safety 라우트를 추가한다.
- [x] proxy README endpoint regression이 `server.js`의 모든 `/v1/` GET 라우트가 README에 문서화됐는지 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 실제 route와 README 목록 비교
- [x] README/test 수정
- [x] focused 검증

## Goal 102. k-skill-proxy feature 문서 endpoint 목록 정합성

목표: `docs/features/k-skill-proxy.md`의 현재 제공 엔드포인트 목록도 실제 `server.js` 라우트와 맞추고, README와 같은 수준의 누락 회귀를 막는다.

달성조건:

- [x] feature 문서에 `/v1/blue-ribbon/nearby`, `/v1/real-estate/*`, `/v1/parking-lots/search`, `/v1/naver-news/search`, `/v1/lh-notice/*`, MFDS 세부 food-safety 라우트를 추가한다.
- [x] proxy endpoint regression이 `server.js`의 모든 `/v1/` GET 라우트가 feature 문서에도 문서화됐는지 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 실제 route와 feature 문서 목록 비교
- [x] feature 문서/test 수정
- [x] focused 검증

## Goal 103. k-skill-proxy 운영 환경변수 문서 정합성

목표: `server.js`의 `buildConfig`가 읽는 proxy 운영 환경변수를 README와 feature 문서가 빠짐없이 설명하도록 맞추고, 누락 회귀를 막는다.

달성조건:

- [x] `BLUE_RIBBON_SESSION_ID`, `KSKILL_PROXY_HOST`, `KSKILL_PROXY_NAME`, 캐시/레이트리밋 변수, 네이버 legacy alias를 proxy 운영 문서에 반영한다.
- [x] regression이 `buildConfig`에서 읽는 모든 환경변수를 proxy README와 feature 문서가 문서화했는지 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 실제 `buildConfig` env와 문서 목록 비교
- [x] proxy README/feature 문서/test 수정
- [x] focused 검증

## Goal 104. setup 문서 hosted proxy 기능 목록 정합성

목표: 사용자용 `docs/setup.md`와 `k-skill-setup`이 실제 hosted/self-host proxy 기반 기능 목록을 최신 라우트/스킬과 맞추도록 보강한다.

달성조건:

- [x] setup 안내에 블루리본, 공영주차장, 네이버 쇼핑/뉴스, LH 청약 공고 등 사용자 시크릿이 필요 없는 proxy-backed 기능을 추가한다.
- [x] setup regression이 `docs/setup.md`와 `k-skill-setup` 양쪽의 hosted proxy 기능 목록을 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] setup 문서와 실제 proxy-backed skill 목록 비교
- [x] setup 문서/test 수정
- [x] focused 검증

## Goal 105. proxy/setup 문서 보강 후 전체 CI 재검증

목표: Goal 101~104의 proxy README, feature 문서, setup 문서, regression 변경이 전체 프로젝트 검증에서도 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 실패/성공 결과 기록

## Goal 106. setup 핵심 hosted proxy regression 실행 영역 보강

목표: 기존 skip 영역에 있던 household waste, school lunch, MFDS 등 핵심 hosted proxy setup 검증을 실제 parent regression 영역에서도 실행되도록 보강한다.

달성조건:

- [x] `docs/setup.md`와 `k-skill-setup`의 핵심 hosted proxy 기능 목록을 실행되는 parent regression으로 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 기존 skipped setup assertions 검토
- [x] parent regression 추가
- [x] focused 검증

## Goal 107. install 문서 hosted proxy 기능 목록 정합성

목표: `docs/install.md`의 setup 필요 목록과 proxy-backed 사용 안내가 setup 문서와 같은 신규 hosted proxy 기능을 포함하도록 맞춘다.

달성조건:

- [x] install 문서에 블루리본, 공영주차장, 네이버 쇼핑/뉴스, LH 청약 공고의 사용자 시크릿 불필요 안내를 추가한다.
- [x] install docs regression이 해당 기능명, feature doc 링크, operator env key를 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] install 문서와 setup 문서 proxy-backed 목록 비교
- [x] install 문서/test 수정
- [x] focused 검증

## Goal 108. README hosted proxy 예제 스킬 노출

목표: README가 제품 스킬뿐 아니라 바로 쓸 수 있는 hosted proxy-backed 상속 예제 스킬도 찾기 쉽게 안내하도록 보강한다.

달성조건:

- [x] README에 블루리본, 공영주차장, 네이버 쇼핑/뉴스, LH 청약 공고 예제 스킬 하이라이트를 추가한다.
- [x] README regression이 해당 skill name과 feature doc 링크를 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] README 현재 노출 범위 확인
- [x] README/test 수정
- [x] focused 검증

## Goal 109. skill-routing hosted proxy 예제 라우팅 보강

목표: `docs/skill-routing.md`가 parent 제품 스킬뿐 아니라 자주 쓰는 hosted proxy-backed 예제 스킬의 선택 기준도 제공하도록 보강한다.

달성조건:

- [x] skill-routing에 블루리본, 공영주차장, 네이버 쇼핑/뉴스, LH 청약 공고 보조 라우팅 표를 추가한다.
- [x] routing regression이 해당 skill name과 트리거 신호를 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 현재 skill-routing 누락 확인
- [x] routing 문서/test 수정
- [x] focused 검증

## Goal 110. README/install/routing 보강 후 전체 CI 재검증

목표: Goal 106~109의 setup/install/README/routing regression과 문서 변경이 전체 프로젝트 검증에서도 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 결과와 산출물 재스캔을 검증 기록에 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] generated artifact 재스캔
- [x] 실패/성공 결과 기록

## Goal 111. sources 문서 hosted proxy 예제 출처 보강

목표: `docs/sources.md`가 README/install/routing에 노출된 hosted proxy-backed 예제 스킬의 공식 출처를 모두 포함하도록 맞춘다.

달성조건:

- [x] 공영주차장 표준데이터와 네이버 뉴스 검색 API 공식 문서 출처를 추가한다.
- [x] sources regression이 블루리본, 공영주차장, 네이버 쇼핑/뉴스, LH 출처를 모두 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] sources 누락 확인
- [x] sources 문서/test 수정
- [x] focused 검증

## Goal 112. roadmap hosted proxy 예제 표면 반영

목표: `docs/roadmap.md`가 현재 지원 중인 hosted proxy-backed 예제 스킬을 별도 표면으로 기록해 향후 제품 승격 후보를 추적하게 한다.

달성조건:

- [x] roadmap에 블루리본, 공영주차장, 네이버 쇼핑/뉴스, LH 청약 공고 예제 표면을 추가한다.
- [x] roadmap regression이 해당 skill name과 제품 승격 후보 문구를 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] roadmap 누락 확인
- [x] roadmap 문서/test 수정
- [x] focused 검증

## Goal 113. hosted proxy 문서 표면 연속 변경 후 전체 CI 재검증

목표: Goal 111-112에서 바뀐 출처/roadmap 문서와 regression 테스트가 전체 CI 게이트에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인을 TODO에 남기고 focused fix를 수행한다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.
- [x] CI 후 로컬 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남지 않았는지 확인한다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 산출물 재스캔
- [x] TODO 검증 기록 갱신

## Goal 114. security docs hosted proxy 신규 예제 시크릿 경계 반영

목표: `docs/security-and-secrets.md`가 블루리본, 공영주차장, 네이버 쇼핑/뉴스, LH 청약 공고의 사용자 키 불필요/운영자 키 주입 경계를 설명하도록 맞춘다.

달성조건:

- [x] security docs가 신규 hosted proxy-backed 예제의 사용자 쪽 키 불필요 원칙을 설명한다.
- [x] security docs가 `BLUE_RIBBON_SESSION_ID`, `NAVER_SEARCH_CLIENT_ID`, `NAVER_SEARCH_CLIENT_SECRET`, `DATA_GO_KR_API_KEY`의 proxy 운영자 문맥을 설명한다.
- [x] parent regression이 신규 예제명과 관련 env key를 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] security 문서 누락 확인
- [x] security 문서/test 수정
- [x] focused 검증

## Goal 115. department index hosted proxy 예제 맵 추가

목표: `docs/departments/README.md`가 신규 hosted proxy-backed 예제 스킬의 primary/secondary department를 기록해 제품 승격 후보를 부서별로 추적하게 한다.

달성조건:

- [x] department index에 블루리본, 공영주차장, 네이버 쇼핑/뉴스, LH 청약 공고 예제 스킬 맵을 추가한다.
- [x] 각 예제가 `examples/<skill-name>` 경로와 primary/secondary department를 가진다.
- [x] parent regression이 신규 예제 맵을 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] department 문서 누락 확인
- [x] department 문서/test 수정
- [x] focused 검증

## Goal 116. examples README hosted proxy 예제 빠른 목록 추가

목표: `examples/README.md`가 바로 설치해 써볼 수 있는 hosted proxy-backed 예제 스킬을 별도 목록으로 안내하게 한다.

달성조건:

- [x] examples README에 블루리본, 공영주차장, 네이버 쇼핑/뉴스, LH 청약 공고 예제를 추가한다.
- [x] 각 예제가 feature doc 링크와 사용자 API key 불필요 설명을 가진다.
- [x] parent regression이 examples README의 신규 예제 목록을 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] examples README 누락 확인
- [x] examples README/test 수정
- [x] focused 검증

## Goal 117. hosted proxy 예제 SKILL.md 사용자 키 경계 명시

목표: 신규 hosted proxy-backed 예제 `SKILL.md`가 사용자 API key 불필요와 proxy 운영자 env key 경계를 직접 설명하게 한다.

달성조건:

- [x] `blue-ribbon-nearby`, `parking-lot-search`, `naver-shopping-search` SKILL.md의 사용자 키 경계 문구를 보강한다.
- [x] `naver-news-search`, `lh-notice-search`와 함께 5개 예제 모두 hosted proxy 기본 경로와 사용자 키 불필요 원칙을 가진다.
- [x] parent regression이 5개 예제 SKILL.md의 hosted proxy/사용자 키 경계를 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 예제 SKILL.md 누락 확인
- [x] 예제 SKILL.md/test 수정
- [x] focused 검증

## Goal 118. hosted proxy 예제 인덱스/시크릿 변경 후 전체 CI 재검증

목표: Goal 114-117에서 바뀐 security, departments, examples README, 예제 SKILL.md, regression 테스트가 전체 CI 게이트에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인을 TODO에 남기고 focused fix를 수행한다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.
- [x] CI 후 로컬 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남지 않았는지 확인한다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 산출물 재스캔
- [x] TODO 검증 기록 갱신

## Goal 119. 새 스킬 추가 가이드 문서 표면 체크리스트 확장

목표: `docs/adding-a-skill.md`가 제품 스킬과 hosted proxy-backed 예제 스킬 추가 시 함께 갱신해야 하는 실제 문서 표면을 빠짐없이 안내하게 한다.

달성조건:

- [x] 체크리스트가 `docs/features`, `README`, `docs/skill-routing`, `docs/roadmap`, `docs/departments/README`, `examples/README`를 구분해 안내한다.
- [x] 프록시 경유 스킬은 `docs/setup.md`, `docs/security-and-secrets.md`, `docs/sources.md`, proxy README/feature doc 갱신을 안내한다.
- [x] parent regression이 추가 가이드의 문서 표면 체크리스트를 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] adding-a-skill 누락 확인
- [x] adding-a-skill/test 수정
- [x] focused 검증

## Goal 120. project structure spec의 stale root/proxy 명칭 정정

목표: `docs/specs/project-structure.md`가 현재 `skills/*`, `examples/*`, `packages/k-skill-proxy` 구조와 일치하도록 오래된 root-level skill 및 `k-parent-proxy` 표기를 제거한다.

달성조건:

- [x] current rule의 트리가 `skills/<skill-name>/SKILL.md`와 `examples/<skill-name>/SKILL.md`를 보여준다.
- [x] root-level skill directory가 installable unit이라는 오래된 문구를 제거한다.
- [x] future runtime proxy 표기가 기존 `k-skill-proxy` 확장 패턴과 일치한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] project structure spec 누락 확인
- [x] spec/test 수정
- [x] focused 검증

## Goal 121. productization/planning 문서의 root skill 표현 정정

목표: productization 및 OMC planning 문서에 남은 root skill folder 표현을 `skills/*`와 `examples/*` 컨테이너 구조로 정정한다.

달성조건:

- [x] `docs/productization-gstack.md`의 root skill folders 문구를 product/example container 표현으로 바꾼다.
- [x] `docs/planning/omc-agent-plan.md`의 root skill folders 문구를 product/example container 표현으로 바꾼다.
- [x] regression이 오래된 root skill 표현 부재와 새 container 표현을 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] stale root skill 표현 재스캔
- [x] 문서/test 수정
- [x] focused 검증

## Goal 122. 구조 문서 drift 정정 후 전체 CI 재검증

목표: Goal 119-121에서 바뀐 구조/계획 문서와 regression 테스트가 전체 CI 게이트에서도 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`를 실행한다.
- [x] 실패 시 실패 원인을 TODO에 남기고 focused fix를 수행한다.
- [x] 성공 시 검증 기록에 2026-06-05 전체 CI 통과를 남긴다.
- [x] CI 후 로컬 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남지 않았는지 확인한다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 산출물 재스캔
- [x] TODO 검증 기록 갱신

## Goal 123. project structure decision log stale root 표현 제거

목표: `docs/specs/project-structure.md` decision log의 마지막 root skill 표현을 현재 container 구조로 바꾼다.

달성조건:

- [x] decision log가 `skills/*` product container와 `examples/*` reference container를 명시한다.
- [x] stale root skill 표현이 repo 문서에서 regression 의도 외에는 사라진다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] decision log 문구 수정
- [x] stale 표현 재스캔
- [x] focused 검증

## Goal 124. future source package names 현재 패키지와 정렬

목표: 구조/스캐폴딩 문서의 future source package 예시를 현재 repo에 존재하는 `k-parent-source-childinfo`, `k-parent-source-tourapi`, `k-parent-source-welfare` 명명과 맞춘다.

달성조건:

- [x] `docs/specs/project-structure.md` future runtime package 예시가 현재 source package 계열명과 충돌하지 않는다.
- [x] `docs/planning/scaffolding-plan.md` Phase 2 package 예시가 실제 패키지명과 일치한다.
- [x] stale `k-parent-source-childcare/events/benefits` 표기가 regression 의도 외에는 사라진다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] project-structure package 예시 정렬
- [x] scaffolding-plan package 예시 정렬
- [x] regression/stale 검색 추가 및 검증

## Goal 125. planning/spec 구현 단계 문구 현재화

목표: planning/spec 문서가 이미 존재하는 runtime packages를 부정하지 않도록 `future/not current code` 표현을 부분 구현 상태로 바꾼다.

달성조건:

- [x] `docs/specs/project-structure.md`가 source/core/proxy package의 현재 부분 구현 상태와 추가 구현 조건을 구분한다.
- [x] `docs/planning/README.md`가 코드 없는 planning-only 단계라고 오해시키지 않는다.
- [x] regression test가 오래된 `not current code`/`코드 변경 없이` 표현 재발을 잡는다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] project-structure 상태 문구 수정
- [x] planning README 상태 문구 수정
- [x] regression/stale 검색 추가 및 검증

## Goal 126. Goal 123-125 통합 CI 재검증

목표: 최근 구조/계획 문서와 regression 변경 묶음을 전체 CI로 재검증하고 로컬 산출물이 남지 않았는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] CI 후 로컬 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남지 않았는지 확인한다.
- [x] TODO 검증 기록에 통합 검증 결과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 산출물 재스캔
- [x] TODO 검증 기록 갱신

## Goal 127. README 스킬 문서 상태 라벨 정리

목표: README 스킬 현황 표의 문서 링크 라벨을 현재 구현 상태에 맞춰 `플레이스홀더` 일괄 표현에서 기능/컨셉 문서로 구분한다.

달성조건:

- [x] backing package를 인용하는 제품 스킬의 README 링크 라벨이 `기능 문서`로 표시된다.
- [x] 아직 패키지 경계가 없는 `academy-connector`, `knowledge-helper`, `mobile-agent`는 `컨셉 문서`로 표시된다.
- [x] README 설명 문단이 컨셉 스킬 목록을 정확히 언급한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] README 링크 라벨 수정
- [x] README 상태 설명 문단 수정
- [x] regression/lint 검증

## Goal 128. 제품 feature doc 플레이스홀더 라벨 제거

목표: `docs/features/k-parent-*.md`의 오래된 `플레이스홀더` 라벨을 현재 상태에 맞는 기능/컨셉 문서 표현으로 바꾼다.

달성조건:

- [x] backing package가 있는 feature docs 제목/본문이 `기능 문서` 또는 구현 승격 표현을 사용한다.
- [x] 아직 패키지 경계가 없는 feature docs는 `컨셉 문서`로 표시된다.
- [x] `docs/features/k-parent-*.md`에 `플레이스홀더` 표현이 남지 않는다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] feature doc 제목/본문 라벨 수정
- [x] regression/stale 검색 추가
- [x] focused/lint 검증

## Goal 129. 컨셉 feature doc 본문 상태 라벨 정리

목표: 컨셉 feature docs의 본문 첫 설명이 `데모 스킬`이 아니라 현재 README 상태와 같은 `컨셉 스킬`로 설명되게 한다.

달성조건:

- [x] `k-parent-academy-connector` feature doc 본문이 컨셉 스킬로 설명된다.
- [x] `k-parent-knowledge-helper` feature doc 본문이 컨셉 스킬로 설명된다.
- [x] `docs/features/k-parent-*.md`에 `데모 스킬` 표현이 남지 않는다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 컨셉 feature docs 본문 수정
- [x] regression/stale 검색 추가
- [x] focused/lint 검증

## Goal 130. Goal 127-129 통합 CI 재검증

목표: README/feature docs 상태 라벨 정리와 regression 변경 묶음을 전체 CI로 재검증하고 로컬 산출물이 남지 않았는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] CI 후 로컬 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남지 않았는지 확인한다.
- [x] TODO 검증 기록에 통합 검증 결과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 산출물 재스캔
- [x] TODO 검증 기록 갱신

## Goal 131. briefing HTML 제품 상태 라벨 정리

목표: `docs/briefing.html`의 현재 저장소 상태와 생활 스킬 목록을 README의 기능/컨셉 상태와 맞춘다.

달성조건:

- [x] 브리핑 snapshot이 `데모 스킬 플레이스홀더` 대신 제품 스킬/컨셉 상태를 표현한다.
- [x] 생활 카드에 `academy-connector`가 포함된다.
- [x] regression test가 briefing HTML의 stale placeholder 라벨 재발을 잡는다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] briefing snapshot 문구 수정
- [x] briefing 생활 카드 목록 수정
- [x] regression/lint 검증

## Goal 132. roadmap 제품 스킬 상태 섹션 현재화

목표: `docs/roadmap.md`의 `Demo placeholders` 섹션을 현재 제품 스킬/컨셉 상태에 맞는 섹션으로 바꾼다.

달성조건:

- [x] roadmap이 `Demo placeholders` 제목을 쓰지 않는다.
- [x] roadmap이 제품 스킬은 `skills/*`의 `SKILL.md` 지침을 유지하고 package-backed 또는 concept으로 관리된다고 설명한다.
- [x] roadmap의 제품 스킬 목록에서 오래된 `플레이스홀더` 표현이 사라진다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] roadmap 섹션 제목/소개 수정
- [x] regression/stale 검색 추가
- [x] focused/lint 검증

## Goal 133. architecture/planning placeholder 용어 정리

목표: durable architecture/planning 문서의 `placeholder docs` 표현을 `SKILL.md-only concept docs`로 정리해 현재 기능/컨셉 문서 용어와 맞춘다.

달성조건:

- [x] `docs/architecture.md`가 concept validation 문서를 `SKILL.md-only concept docs`로 설명한다.
- [x] `docs/planning/omc-agent-plan.md`가 skill placeholder docs 대신 skill concept docs를 사용한다.
- [x] stale `placeholder docs` 표현이 docs 본문에서 사라진다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] architecture 용어 수정
- [x] omc-agent-plan 용어 수정
- [x] regression/stale 검색 및 검증

## Goal 134. Goal 131-133 통합 CI 재검증

목표: briefing/roadmap/architecture/planning 용어 정리와 regression 변경 묶음을 전체 CI로 재검증하고 로컬 산출물이 남지 않았는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] CI 후 로컬 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남지 않았는지 확인한다.
- [x] TODO 검증 기록에 통합 검증 결과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 산출물 재스캔
- [x] TODO 검증 기록 갱신

## Goal 135. parent skill regression test name 현재화

목표: `scripts/skill-docs.test.js`의 parent 제품 스킬 광고/문서화 regression 이름에서 오래된 `placeholder` 표현을 제거한다.

달성조건:

- [x] 테스트 이름이 parent product skills 상태를 표현한다.
- [x] 기존 parent skill 광고/문서화 검증 범위는 유지된다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] 테스트 이름 수정
- [x] focused test 실행
- [x] lint 실행

## Goal 136. README 시작 순서 데모 스킬 표현 정리

목표: README `처음 시작하는 순서`의 오래된 `데모 스킬` 표현을 제품/예제 스킬 컨테이너 구조에 맞춘다.

달성조건:

- [x] README 시작 순서가 필요한 제품 스킬 또는 예제 스킬을 설치하라고 설명한다.
- [x] README에 `필요한 데모 스킬` 표현이 남지 않는다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] README 시작 순서 문구 수정
- [x] regression/stale 검색
- [x] focused/lint 검증

## Goal 137. AGENTS.md parent capability 용어 현재화

목표: repo-specific `AGENTS.md`의 새 parent capability 시작/승격 규칙을 `demo placeholder`가 아니라 `SKILL.md-only concept doc` 용어로 정리한다.

달성조건:

- [x] `AGENTS.md`가 새 parent capability를 `SKILL.md-only concept doc`으로 시작한다고 설명한다.
- [x] `AGENTS.md`가 concept doc을 `packages/*` 또는 `scripts/*`로 승격한다고 설명한다.
- [x] parent context regression이 새 용어를 고정한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] AGENTS.md 용어 수정
- [x] regression/stale 검색
- [x] focused/lint 검증

## Goal 138. Goal 135-137 통합 CI 재검증

목표: 테스트명, README 시작 순서, AGENTS 용어 정리 변경 묶음을 전체 CI로 재검증하고 로컬 산출물이 남지 않았는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] CI 후 로컬 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남지 않았는지 확인한다.
- [x] TODO 검증 기록에 통합 검증 결과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 산출물 재스캔
- [x] TODO 검증 기록 갱신

## Goal 139. feature docs 초기 상태 표현 정리

목표: 구현으로 승격된 parent feature 문서가 더 이상 `초기 데모`라는 모호한 상태 표현을 쓰지 않고, `SKILL.md-only 흐름`에서 runtime 구현으로 승격된 이력을 명확히 설명한다.

달성조건:

- [x] `k-parent-data-collector` feature doc이 `초기 데모` 대신 `초기 SKILL.md-only 흐름`을 사용한다.
- [x] `k-parent-shopping-recommender` feature doc이 `초기 데모` 대신 `초기 SKILL.md-only 흐름`을 사용한다.
- [x] parent feature docs regression이 `초기 데모` 표현 재도입을 막는다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] feature docs 문구 수정
- [x] regression/stale 검색
- [x] focused/lint 검증

## Goal 140. k-parent skill phase metadata 현재화

목표: product skill frontmatter의 `metadata.phase`가 `demo`로 남아 구현 상태를 흐리지 않도록, runtime 구현이 있는 스킬은 `implemented`, 문서형 컨셉 스킬은 `concept`으로 구분한다.

달성조건:

- [x] `k-parent-application-helper`, `k-parent-academy-connector`, `k-parent-school-doc-capture`가 `phase: implemented`를 사용한다.
- [x] `k-parent-knowledge-helper`, `k-parent-mobile-agent`가 `phase: concept`을 사용한다.
- [x] `skills/k-parent-*` frontmatter에 `phase: demo`가 남지 않는다.
- [x] regression이 parent skill `phase: demo` 재도입을 막는다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] skill frontmatter phase 수정
- [x] phase regression/stale 검색
- [x] focused/lint 검증

## Goal 141. Goal 139-140 통합 CI 재검증

목표: feature doc 상태 표현과 parent skill phase metadata 변경 묶음을 전체 CI로 재검증하고 로컬 산출물이 남지 않았는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] CI 후 로컬 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남지 않았는지 확인한다.
- [x] TODO 검증 기록에 통합 검증 결과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 산출물 재스캔
- [x] TODO 검증 기록 갱신

## Goal 142. adding-a-skill phase 안내 정합성

목표: `docs/adding-a-skill.md`의 `metadata.phase` 예시와 필드 설명이 실제 parent skill phase 값(`p0`, `implemented`, `concept`)을 안내하도록 맞춘다.

달성조건:

- [x] `docs/adding-a-skill.md`의 parent 예시가 `phase: p0`를 사용한다.
- [x] `metadata.phase` 설명이 `p0`, `implemented`, `concept` 의미를 포함한다.
- [x] regression이 `metadata.phase` 안내와 parent phase 용어 정합성을 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] adding-a-skill 문서 수정
- [x] regression/stale 검색
- [x] focused/lint 검증

## Goal 143. adding-a-skill 구현 유형 예시 현재화

목표: `docs/adding-a-skill.md`의 `SKILL.md 전용` 예시가 runtime 구현을 가진 p0 스킬이 아니라 실제 concept-only parent 스킬을 가리키도록 정리한다.

달성조건:

- [x] `SKILL.md 전용` 예시가 `k-parent-knowledge-helper`, `k-parent-mobile-agent` 같은 concept-only 스킬을 사용한다.
- [x] `k-parent-meal-planner`, `k-parent-school-info`가 `SKILL.md 전용` 예시에서 제거된다.
- [x] regression이 해당 예시 정합성을 검증한다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] adding-a-skill 구현 유형 표 수정
- [x] regression/stale 검색
- [x] focused/lint 검증

## Goal 144. adding-a-skill reference 경로 안내 현재화

목표: `docs/adding-a-skill.md`의 reference 파일 안내가 현재 컨테이너 구조(`skills/<skill>/references`, `examples/<skill>/references`)를 명확히 가리키도록 정리한다.

달성조건:

- [x] 긴 코드표/필드맵 분리 안내가 `skills/<skill>/references/*.md` 또는 `examples/<skill>/references/*.md`를 명시한다.
- [x] 체크리스트가 `references/`를 skill 폴더 내부 경로로 설명한다.
- [x] regression이 `<skill>/references` 같은 모호한 경로 안내 재도입을 막는다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] adding-a-skill reference 경로 문구 수정
- [x] regression/stale 검색
- [x] focused/lint 검증

## Goal 145. Goal 142-144 통합 CI 재검증

목표: adding-a-skill phase, 구현 유형 예시, reference 경로 안내 변경 묶음을 전체 CI로 재검증하고 로컬 산출물이 남지 않았는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] CI 후 로컬 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남지 않았는지 확인한다.
- [x] TODO 검증 기록에 통합 검증 결과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 산출물 재스캔
- [x] TODO 검증 기록 갱신

## Goal 146. reference 경로 컨텍스트 문서 정합성

목표: `AGENTS.md`와 `docs/architecture.md`의 long reference 안내가 `<skill>/references` 같은 루트형 경로가 아니라 현재 `skills/*`/`examples/*` 컨테이너 구조를 사용하도록 정리한다.

달성조건:

- [x] `AGENTS.md`가 `skills/<skill>/references/*.md` 또는 `examples/<skill>/references/*.md`를 안내한다.
- [x] `docs/architecture.md`가 `skills/<skill>/references/*.md` 또는 `examples/<skill>/references/*.md`를 안내한다.
- [x] regression이 `AGENTS.md`와 `docs/architecture.md`의 모호한 `<skill>/references` 경로 재도입을 막는다.
- [x] focused regression/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] AGENTS/architecture reference 경로 수정
- [x] regression/stale 검색
- [x] focused/lint 검증

## Goal 147. moved example skill test 메시지 현재화

목표: `scripts/skill-docs.test.js`의 실패 메시지가 옛 루트형 `skill/SKILL.md` 경로 대신 현재 `examples/*` 컨테이너 경로를 설명하도록 정리한다.

달성조건:

- [x] `coupang-product-search` test 메시지가 `examples/coupang-product-search/SKILL.md`를 사용한다.
- [x] `korean-privacy-terms` test 메시지가 `examples/korean-privacy-terms/SKILL.md`를 사용한다.
- [x] `korean-jangbu-for` test 메시지가 `examples/korean-jangbu-for/SKILL.md`를 사용한다.
- [x] stale grep과 focused/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] test assertion 메시지 수정
- [x] stale 검색
- [x] focused/lint 검증

## Goal 148. skill-docs test SKILL.md 경로 메시지 일괄 현재화

목표: `scripts/skill-docs.test.js`의 `expected <skill>/SKILL.md to exist` 메시지를 실제 컨테이너 경로(`examples/<skill>/SKILL.md` 또는 `skills/<skill>/SKILL.md`)로 일괄 정리한다.

달성조건:

- [x] 루트형 `expected <skill>/SKILL.md to exist` 메시지가 남지 않는다.
- [x] example skill 메시지는 `examples/<skill>/SKILL.md`를 사용한다.
- [x] product skill 메시지는 `skills/<skill>/SKILL.md`를 사용한다.
- [x] focused/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] assertion 메시지 일괄 치환
- [x] stale 검색
- [x] focused/lint 검증

## Goal 149. Goal 146-148 통합 CI 재검증

목표: reference 경로 컨텍스트와 skill-docs assertion 메시지 현재화 변경 묶음을 전체 CI로 재검증하고 로컬 산출물이 남지 않았는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] CI 후 로컬 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남지 않았는지 확인한다.
- [x] TODO 검증 기록에 통합 검증 결과를 남긴다.

병렬 작업:

- [x] 전체 CI 실행
- [x] 산출물 재스캔
- [x] TODO 검증 기록 갱신

## Goal 150. private source worker 계획의 package 경계 명확화

목표: `docs/planning/scaffolding-plan.md`가 아직 구현되지 않은 private source worker를 `packages/k-parent-source-*` 패키지처럼 보이게 하지 않고, public-source MVP 이후의 조사/worker 후보로 표현한다.

달성조건:

- [x] Phase 6가 `packages/k-parent-source-culture-private/`를 future file로 안내하지 않는다.
- [x] Phase 6가 private source work를 `docs/research/` 또는 `workers/` 후보로 설명한다.
- [x] regression 또는 stale grep이 `k-parent-source-culture-private` 재도입을 잡는다.
- [x] focused/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] scaffolding plan Phase 6 문구 수정
- [x] regression/stale 검색
- [x] focused/lint 검증

## Goal 151. project-structure runtime package tree 현재화

목표: `docs/specs/project-structure.md`의 runtime package tree가 실제 `packages/k-parent-*` 구현 목록을 반영하고, 아직 없는 `k-parent-recommender` 같은 패키지를 현재 구조처럼 안내하지 않도록 정리한다.

달성조건:

- [x] package tree가 `k-parent-brief`, `k-parent-calendar`, `k-parent-doc-extract`를 포함한다.
- [x] package tree가 현재 source 패키지 묶음(traffic-safety, seoul, playground, emergency, naver, coupang, youtube 등)을 포함한다.
- [x] package tree가 존재하지 않는 `k-parent-recommender`를 안내하지 않는다.
- [x] scaffolding plan이 존재하지 않는 `k-parent-doc-capture` 대신 `k-parent-doc-extract`를 안내한다.
- [x] focused/lint 검증을 실행하고 결과를 검증 기록에 남긴다.

병렬 작업:

- [x] project-structure package tree 수정
- [x] regression/stale 검색
- [x] focused/lint 검증

## 검증 기록

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n 'k-parent-recommender|k-parent-doc-capture' docs/specs/project-structure.md docs/planning/scaffolding-plan.md docs/planning/omc-agent-plan.md README.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n 'k-parent-source-culture-private' docs/planning/scaffolding-plan.md docs/specs/project-structure.md docs/planning/omc-agent-plan.md README.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `rg -n 'expected [a-z0-9-]+/SKILL\\.md to exist' scripts/skill-docs.test.js | cat` (0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "coupang-product-search skill and docs use retention-corp coupang_partners MCP layer|repository docs advertise the korean-privacy-terms thin-wrapper skill|korean-privacy-terms skill is a thin wrapper|repository docs advertise the korean-jangbu-for thin-wrapper skill|korean-jangbu-for skill cites upstream author"`
- [x] 2026-06-05: root-style moved example skill assertion message grep audit (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: root-style reference path grep audit for `AGENTS.md`, `docs/architecture.md`, and `scripts/skill-docs.test.js` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n '<skill>/references' docs/adding-a-skill.md scripts/skill-docs.test.js | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n 'SKILL\\.md 전용.*k-parent-(meal-planner|school-info)' docs/adding-a-skill.md scripts/skill-docs.test.js | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n 'v1\\.5|phase: v1|안정\\) /' docs/adding-a-skill.md scripts/skill-docs.test.js | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent skill phase metadata distinguishes implemented and concept work"`
- [x] 2026-06-05: `rg -n "phase:\\s*demo" skills/k-parent-*/SKILL.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent feature docs do not expose source package fixture internals"`
- [x] 2026-06-05: `rg -n "초기 데모" docs/features/k-parent-*.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n 'demo placeholders|Promote a placeholder|only demo' AGENTS.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n "필요한 데모 스킬" README.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent product skills are advertised and documented"`
- [x] 2026-06-05: `rg -n "parent placeholder skills are advertised and documented" scripts/skill-docs.test.js TODO.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n 'placeholder docs|skill placeholder docs|placeholder:' docs/architecture.md docs/planning/omc-agent-plan.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "roadmap tracks newer hosted proxy-backed example surfaces"`
- [x] 2026-06-05: `rg -n "Demo placeholders|플레이스홀더" docs/roadmap.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: briefing HTML stale snapshot/life-card grep (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent feature docs do not expose source package fixture internals"`
- [x] 2026-06-05: `rg -n "플레이스홀더|데모 스킬" docs/features/k-parent-*.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent feature docs do not expose source package fixture internals"`
- [x] 2026-06-05: `rg -n "플레이스홀더|데모 플레이스홀더" docs/features/k-parent-*.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent product skills are advertised and documented"`
- [x] 2026-06-05: `rg -n "\\[[^\\]]+ 플레이스홀더\\]\\(docs/features/k-parent" README.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n "future structure, not current code|코드 변경 없이" docs/specs/project-structure.md docs/planning/README.md | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n "k-parent-source-(childcare|events|benefits)" docs README.md AGENTS.md scripts/skill-docs.test.js | cat` (0건)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "hosted proxy example skills document user secret boundaries"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "examples README lists newer hosted proxy-backed examples"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `rg -n "Root skill folders stay flat|root skill folders|Root-level skill directories remain|k-parent-proxy" README.md AGENTS.md docs | cat` (문서 stale 표현 0건, regression assertion 제외)
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "department index maps hosted proxy-backed example skills"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "security docs document newer hosted proxy-backed secret boundaries"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "roadmap tracks newer hosted proxy-backed example surfaces"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "sources document newer hosted proxy-backed example surfaces"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "skill routing index maps hosted proxy-backed example skills"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "README advertises newer hosted proxy-backed example skills"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "install docs document newer hosted proxy-backed examples"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "setup docs document core hosted proxy-backed skills"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact rescan after CI (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "setup docs document newer hosted proxy-backed skills"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "proxy docs document every buildConfig environment variable"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "proxy docs document every public v1 GET route"`
- [x] 2026-06-05: `npm run lint`

- [x] 2026-06-04: `npm test --workspace k-parent-source-culture`
- [x] 2026-06-04: `npm test --workspace k-parent-source-library`
- [x] 2026-06-04: `npm test --workspace k-parent-source-seoul`
- [x] 2026-06-04: `npm test --workspace k-parent-source-welfare`
- [x] 2026-06-04: `./scripts/validate-skills.sh`
- [x] 2026-06-04: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-04: `npm run lint`
- [x] 2026-06-04: `npm run ci`
- [x] 2026-06-05: `npm run lint --workspace k-parent-source-culture`
- [x] 2026-06-05: `npm run lint --workspace k-parent-source-library`
- [x] 2026-06-05: `npm run lint --workspace k-parent-source-seoul`
- [x] 2026-06-05: `npm test --workspace k-parent-source-culture && npm test --workspace k-parent-source-library && npm test --workspace k-parent-source-seoul`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: proxy README endpoint route coverage grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "proxy README documents every public v1 GET route"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: post-CI local generated artifact rescan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: install docs full-depth scope grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "install docs name k-parent-skill"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: skill routing common output/safety signal grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "skill routing index maps every parent skill"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: AGENTS/CLAUDE source-of-truth wording grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: post-CI local generated artifact rescan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
- [x] 2026-06-05: release disabled regression variable naming audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "release automation stays disabled"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: repo-wide stale root-level skill structure grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `PYTHONPATH=scripts python3 -m unittest scripts.test_k_skill_cleaner`
- [x] 2026-06-05: k-skill-cleaner root-level wording grep audit
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: stale root-level skill folder wording grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `CLAUDE.md -> AGENTS.md` symlink audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: stale K League release publish wording grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "release automation stays disabled"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node -e 'JSON.parse(...)' packages/k-parent-source-*/package.json`
- [x] 2026-06-05: refresh script 보유/선언 상태 shell audit
- [x] 2026-06-05: `npm run lint --workspaces --if-present`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README refresh command grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source package manifest JSON parse audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run pack:dry-run`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: welfare README refresh exception audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README provenance/freshness contract audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: source README live fixture refresh wording audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: parent feature docs source fixture path exposure audit (no matches)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: welfare optional credential wording audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm test --workspace k-parent-source-welfare`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run pack:dry-run`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: tracked local artifact grep audit (no matches)
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: publishable workspace pack:dry-run coverage audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm pack --workspace court-auction-notice-search --dry-run`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run pack:dry-run`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: release-please config absent audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: Seoul/Library/Culture README env-prefixed refresh command grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: README fixture require tarball files contract meta-test
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README Usage code block/package import meta-test
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: source README Configuration heading/legacy heading grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README shell command bash fence audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: source README Testing offline contract meta-test
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: source README Testing section heading grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README Fixtures refresh section heading grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `rg "data.go.kr 서비스 3종|data.go.kr 2-1 목록 전체" OWNER-TASKS.md scripts/skill-docs.test.js`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: stale refresh/test command grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README root-relative test command grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README fixture refresh section heading grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: refresh helper root-relative direct execution grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README npm test / node --test grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source package legacy refresh-fixtures alias audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: source package `test/*.test.js` files array audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run pack:dry-run`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: refresh helper npm run refresh:fixtures grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: refresh command line-continuation grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: source README Usage section grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: source README bare payload shorthand grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README async Usage wrapper grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README async main invocation grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: source README fixture require path grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: source README package require name grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: source README async main output grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: `find .github -maxdepth 2 -name .DS_Store -print`
- [x] 2026-06-05: `git status --short -- .github/.DS_Store`
- [x] 2026-06-05: `npm install --package-lock-only --ignore-scripts`
- [x] 2026-06-05: Changesets stale publishing surface grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: parent/proxy old secrets path grep audit
- [x] 2026-06-05: parent/proxy new secrets path grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent proxy secret docs use the k-parent-skill secrets path"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: install/proxy parent naming grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "install docs name k-parent-skill as the repository install target"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: product skill install coverage audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "install docs include every product skill in the selectable install examples"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: README install guide description grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent repository context documents the inherited architecture conventions"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: repo-wide `.DS_Store` cleanup and empty recheck
- [x] 2026-06-05: `git status --short -- .DS_Store docs/.DS_Store examples/.DS_Store packages/.DS_Store skills/.DS_Store`
- [x] 2026-06-05: `npm ls @changesets/cli --depth=0` returned `(empty)` after prune
- [x] 2026-06-05: `npm prune --ignore-scripts`
- [x] 2026-06-05: package-lock `@changesets` package count remains 0
- [x] 2026-06-05: `npm audit --json` (0 vulnerabilities after fastify/fast-uri update)
- [x] 2026-06-05: `npm update fastify fast-uri --workspace k-skill-proxy --ignore-scripts`
- [x] 2026-06-05: `npm test --workspace k-skill-proxy`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: feature/helper old secrets path grep audit
- [x] 2026-06-05: feature/helper new secrets path grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent proxy secret docs use the k-parent-skill secrets path"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: setup skill old secrets path grep audit
- [x] 2026-06-05: setup skill parent config root grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent proxy secret docs use the k-parent-skill secrets path"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: repo-wide old secrets path grep audit
- [x] 2026-06-05: example parent secrets path grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "parent proxy secret docs use the k-parent-skill secrets path"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: setup skill old repository branding grep audit
- [x] 2026-06-05: setup skill k-parent-skill branding grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "setup product skill uses k-parent-skill repository branding"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: moved skill old helper/link path grep audit
- [x] 2026-06-05: moved skill current helper/link path grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "moved skill helper paths use current containers"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: local markdown link audit (`checked=210 missing=0`)
- [x] 2026-06-05: stale local link grep audit
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "local markdown links resolve to files"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: `.playwright-mcp/` ignored/untracked audit
- [x] 2026-06-05: removed local `.playwright-mcp/` logs
- [x] 2026-06-05: local generated artifact rescan (`.playwright-mcp`, `.DS_Store`, `*.tgz` 0건)
- [x] 2026-06-05: local-only artifact regression expanded with `.env.example` allowlist fix
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "repository does not track local-only artifacts"`
- [x] 2026-06-05: `npm run lint`
- [x] 2026-06-05: thin-wrapper old root install/pin path grep audit
- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: thin-wrapper current install/pin path grep audit
- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern "thin-wrapper install and pin paths use current containers"`
- [x] 2026-06-05: `npm run lint`

## Goal 152. Goals 150-151 통합 검증

목표: scaffolding 계획과 프로젝트 구조 문서의 패키지 표면 정리 변경이 전체 검증 흐름에서도 깨지지 않는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] 로컬 생성 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남아 있지 않다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 165. culture-center-events feature doc 구현 소스/환경변수 정합화

목표: `docs/features/k-parent-culture-center-events.md`가 현재 구현된 서울/도서관/문화포털 source packages와 환경변수, fixture 갱신 명령을 설명하게 한다.

달성조건:

- [x] feature doc에 `k-parent-source-seoul`, `k-parent-source-library`, `k-parent-source-culture` 사용 표면을 추가한다.
- [x] `KSKILL_SEOUL_KEY`, `KSKILL_LIBRARY_KEY`, `KSKILL_CULTURE_KEY`와 refresh fixture 명령을 문서화한다.
- [x] “다음 구현 후보”가 이미 구현된 소스 패키지를 future처럼 보이지 않게 남은 확장 후보로 바뀐다.
- [x] `scripts/skill-docs.test.js`가 culture-center-events feature doc의 package/env coverage를 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'culture center events feature doc documents implemented source packages'`
- [x] 2026-06-05: `npm run lint`

## Goal 166. Goal 165 통합 CI 검증

목표: culture-center-events feature doc 정합화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 167. application-helper feature doc 복지 source 구현 표면 정합화

목표: `docs/features/k-parent-application-helper.md`가 현재 구현된 `k-parent-source-welfare` curated catalog와 optional live lookup 환경변수, 무제출 가드레일을 설명하게 한다.

달성조건:

- [x] feature doc에 `packages/k-parent-source-welfare` 사용 표면과 복지 카탈로그·딥링크 출력을 추가한다.
- [x] `KSKILL_DATAGOKR_KEY`가 선택적 live lookup stub용이며 기본 curated catalog는 외부 키 없이 동작한다고 문서화한다.
- [x] fixture refresh 명령이 없는 패키지임을 명시하고, “다음 구현 후보”를 남은 확장 후보로 바꾼다.
- [x] `scripts/skill-docs.test.js`가 application-helper feature doc의 welfare package/env/no-refresh coverage를 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'application helper feature doc documents implemented welfare package'`
- [x] 2026-06-05: `npm run lint`

## Goal 168. schedule/doc-capture 순수 로직 패키지 feature doc 정합화

목표: `k-parent-schedule-manager`와 `k-parent-school-doc-capture` feature doc이 현재 구현된 `k-parent-calendar`, `k-parent-doc-extract` 순수 로직 패키지와 무네트워크/무API-key 가드레일을 설명하게 한다.

달성조건:

- [x] schedule-manager doc에 `packages/k-parent-calendar`, `calendarCandidate`, `dedupeCandidates`, `toICS`, 확인 전 쓰기 금지를 문서화한다.
- [x] school-doc-capture doc에 `packages/k-parent-doc-extract`, `packages/k-parent-calendar`, `extractEvents`, `extractSupplies`, `extractDeadlines`, plain-text OCR 경계를 문서화한다.
- [x] 두 문서 모두 API key나 fixture refresh가 필요 없는 순수 로직 패키지임을 명시하고 “다음 구현 후보”를 남은 확장 후보로 바꾼다.
- [x] `scripts/skill-docs.test.js`가 schedule/doc-capture feature doc coverage를 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'schedule and school doc capture docs document pure logic packages'`
- [x] 2026-06-05: `npm run lint`

## Goal 169. Goal 167-168 통합 CI 검증

목표: application-helper, schedule-manager, school-doc-capture feature doc 정합화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 170. kindergarten-info feature doc childinfo source 정합화

목표: `docs/features/k-parent-kindergarten-info.md`가 현재 구현된 `k-parent-source-childinfo` data.go.kr 어댑터와 환경변수, fixture 갱신 명령, 남은 확장 후보를 표준 구조로 설명하게 한다.

달성조건:

- [x] feature doc에 `packages/k-parent-source-childinfo` 사용 패키지 표와 `fetchChildcareCenters`, `fetchKindergartens` 출력 범위를 추가한다.
- [x] `KSKILL_DATAGOKR_KEY`와 `npm run refresh:fixtures --workspace k-parent-source-childinfo`를 문서화한다.
- [x] data.go.kr endpoint/path 파라미터 확인 필요성과 EDSS/유치원알리미는 남은 확장 후보임을 분리한다.
- [x] `scripts/skill-docs.test.js`가 kindergarten-info feature doc의 childinfo package/env/refresh coverage를 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'kindergarten info feature doc documents childinfo source package'`
- [x] 2026-06-05: `npm run lint`

## Goal 171. content-recommender feature doc YouTube source 정합화

목표: `docs/features/k-parent-content-recommender.md`가 현재 구현된 `k-parent-source-youtube` YouTube Data API connector와 환경변수, fixture 갱신 명령, 안전검색 기본값을 표준 구조로 설명하게 한다.

달성조건:

- [x] feature doc에 `packages/k-parent-source-youtube` 사용 패키지 표와 `searchVideos` 출력 범위를 추가한다.
- [x] `KSKILL_YOUTUBE_KEY`, `safeSearch: "strict"`, `regionCode: "KR"`, `relevanceLanguage: "ko"`를 문서화한다.
- [x] `KSKILL_YOUTUBE_KEY=... npm run refresh:fixtures --workspace k-parent-source-youtube -- "검색어"`를 문서화하고 “다음 구현 후보”를 남은 확장 후보로 바꾼다.
- [x] `scripts/skill-docs.test.js`가 content-recommender feature doc의 YouTube package/env/refresh coverage를 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'content recommender feature doc documents youtube source package'`
- [x] 2026-06-05: `npm run lint`

## Goal 172. Goal 170-171 통합 CI 검증

목표: kindergarten-info와 content-recommender feature doc 정합화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 173. school-info/meal-planner NEIS source 문서 정합화

목표: `k-parent-school-info`와 `k-parent-meal-planner` feature doc이 현재 구현된 `k-parent-source-neis`, `k-parent-brief`, `k-parent-source-traffic-safety` 패키지와 환경변수, fixture 갱신 명령을 표준 구조로 설명하게 한다.

달성조건:

- [x] school-info doc에 사용 패키지 표, NEIS/brief/traffic-safety 함수 표면, `KEDU_INFO_KEY`, `KSKILL_DATAGOKR_KEY`를 정리한다.
- [x] meal-planner doc에 사용 패키지 표, NEIS meal/schedule/timetable/brief 함수 표면, `KEDU_INFO_KEY`를 정리한다.
- [x] 두 문서에 refresh fixture 명령을 추가하고 “다음 구현 후보”를 남은 확장 후보로 바꾼다.
- [x] `scripts/skill-docs.test.js`가 school-info/meal-planner feature doc coverage를 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'school info and meal planner docs document NEIS source packages'`
- [x] 2026-06-05: `npm run lint`

## Goal 174. Goal 173 통합 CI 검증

목표: school-info/meal-planner NEIS source 문서 정합화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 175. data-collector/shopping promoted feature doc 정리

목표: `k-parent-data-collector`와 `k-parent-shopping-recommender` feature doc에서 오래된 `SKILL.md-only` 표현을 제거하고, 현재 구현된 Naver/Coupang source package 표면과 환경변수/fixture 명령을 표준화한다.

달성조건:

- [x] data-collector doc이 `packages/k-parent-source-naver`와 `runCollector` 구현 표면을 현재형으로 설명한다.
- [x] shopping-recommender doc이 `packages/k-parent-source-naver`, `packages/k-parent-source-coupang`, fetch 함수, env vars, disclosure를 표준 구조로 설명한다.
- [x] 두 문서에서 `초기 SKILL.md-only` 문구가 사라지고 refresh fixture 명령은 workspace 형식으로 유지된다.
- [x] `scripts/skill-docs.test.js`가 data-collector/shopping-recommender promoted doc coverage를 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'data collector and shopping recommender docs describe promoted source packages'`
- [x] 2026-06-05: `npm run lint`

## Goal 176. Goal 175 통합 CI 검증

목표: data-collector/shopping-recommender promoted feature doc 정리가 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 177. academy-connector 순수 로직 패키지 feature doc 표준화

목표: `k-parent-academy-connector` feature doc이 현재 구현된 `k-parent-doc-extract`, `k-parent-calendar` 순수 로직 패키지와 무API-key/무fixture-refresh 경계를 표준 섹션으로 설명하게 한다.

달성조건:

- [x] `구현 패키지` 섹션을 `사용 패키지` 표로 바꾸고 `extractAcademyNotice`, `extractDeadlines`, `calendarCandidate`, `dedupeCandidates`, `toICS` 표면을 문서화한다.
- [x] API key가 필요 없고 fixture refresh 명령이 없음을 명시한다.
- [x] 승인 전 calendar write/payment/application side effect 금지를 현재 범위나 가드레일에 남긴다.
- [x] `scripts/skill-docs.test.js`가 academy-connector feature doc coverage를 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'academy connector feature doc documents pure logic packages'`
- [x] 2026-06-05: `npm run lint`

## Goal 178. Goal 177 통합 CI 검증

목표: academy-connector feature doc 표준화 변경이 전체 CI와 생성물 위생 검사를 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] generated artifact scan에서 `*.tgz`, `.playwright-mcp`, `.DS_Store`가 남지 않는다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 163. validate-skills parent metadata 검증 보강

목표: `scripts/validate-skills.sh`가 `skills/k-parent-*`의 parent-specific frontmatter metadata 누락을 lint 단계에서 직접 잡도록 한다.

달성조건:

- [x] `validate-skills.sh`가 parent product skill의 `license: MIT`, `metadata`, `category: parenting`, `locale: ko-KR`, 허용된 `phase`를 검사한다.
- [x] validator regression fixture가 parent metadata 누락 실패를 검증한다.
- [x] `docs/adding-a-skill.md`의 validator 설명이 새 검증 항목을 포함한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'validate-skills scans both product and example containers|parent repository context documents the inherited architecture conventions'`
- [x] 2026-06-05: `./scripts/validate-skills.sh`
- [x] 2026-06-05: `npm run lint`

## Goal 164. Goal 163 통합 검증

목표: parent metadata 검증이 추가된 `validate-skills.sh`가 전체 CI 경로에서도 문제 없이 동작하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] 로컬 생성 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남아 있지 않다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 160. 모든 parent skill phase metadata 명시

목표: `skills/k-parent-*`의 모든 `SKILL.md`가 `metadata.phase`를 가져 설치/문서 상태를 추적할 수 있게 한다.

달성조건:

- [x] phase가 빠진 parent skill 5개에 `license`, `metadata.category`, `metadata.locale`, `metadata.phase`를 추가한다.
- [x] `play`, `festival`, `culture-center`, `travel` 계열은 `p0`, schedule manager는 `implemented`로 분류한다.
- [x] `scripts/skill-docs.test.js`가 모든 parent skill의 phase presence와 허용값을 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skill phase metadata distinguishes implemented and concept work'`
- [x] 2026-06-05: parent skill phase presence grep audit
- [x] 2026-06-05: `npm run lint`

## Goal 161. parent skill 기본 frontmatter metadata 회귀 테스트

목표: 모든 `skills/k-parent-*` 스킬이 `license: MIT`, `metadata.category: parenting`, `metadata.locale: ko-KR`, 허용된 `metadata.phase`를 계속 갖도록 테스트로 고정한다.

달성조건:

- [x] `scripts/skill-docs.test.js`가 모든 parent skill의 license/category/locale presence를 검증한다.
- [x] 수동 grep 감사로 누락된 parent skill metadata가 없음을 확인한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent skill phase metadata distinguishes implemented and concept work'`
- [x] 2026-06-05: parent skill frontmatter metadata grep audit
- [x] 2026-06-05: `npm run lint`

## Goal 162. Goals 160-161 통합 검증

목표: parent skill frontmatter metadata 보강과 회귀 테스트 확장이 전체 CI에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] 로컬 생성 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남아 있지 않다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 156. project-structure의 scripts/python-packages 현재 상태 정리

목표: `docs/specs/project-structure.md`가 존재하지 않는 sync helper나 Python 패키지를 현재 구조처럼 보이지 않게 하고, 실제 shared script 표면과 Python 패키지 부재 상태를 분리한다.

달성조건:

- [x] runtime package structure 블록에서 현재 shared scripts를 실제 파일명 중심으로 설명한다.
- [x] Python 패키지는 현재 `python-packages/README.md`만 있고 실제 패키지는 없다고 명시한다.
- [x] 미래 helper/script 후보는 별도 `Future candidate files`로 분리한다.
- [x] `scripts/skill-docs.test.js`가 이 구분을 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent repository context documents the inherited architecture conventions'`
- [x] 2026-06-05: project-structure current tree/future candidate grep audit
- [x] 2026-06-05: `npm run lint`

## Goal 157. M0 source inventory deliverable 경로 갱신

목표: `docs/specs/project-structure.md`의 M0 deliverable이 이미 존재하는 `docs/sources.md`를 source inventory 표면으로 가리키게 한다.

달성조건:

- [x] “source inventory under future docs or issue tracker” 표현을 제거한다.
- [x] M0 deliverables가 `docs/sources.md`와 필요 시 issue checklist를 구분해 설명한다.
- [x] `scripts/skill-docs.test.js`가 stale source inventory 표현을 금지한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent repository context documents the inherited architecture conventions'`
- [x] 2026-06-05: project-structure stale source inventory grep audit
- [x] 2026-06-05: `npm run lint`

## Goal 158. academy connector 구현 상태 문서 정합화

목표: `k-parent-academy-connector`가 구현된 doc-extract/calendar 기반 스킬임을 README와 feature doc에 반영하고, 컨셉 스킬 목록에서는 제외한다.

달성조건:

- [x] README의 패키지 경계 없는 컨셉 목록에서 `academy-connector`를 제거한다.
- [x] README가 academy connector 기능 문서를 “기능 문서”로 링크한다.
- [x] `docs/features/k-parent-academy-connector.md`가 현재 구현 패키지와 동작을 설명한다.
- [x] `scripts/skill-docs.test.js`가 academy connector를 implemented skill로 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent product skills are advertised and documented|parent skill phase metadata distinguishes implemented and concept work'`
- [x] 2026-06-05: academy connector stale concept wording grep audit
- [x] 2026-06-05: `npm run lint`

## Goal 159. Goals 156-158 통합 검증

목표: project-structure 스펙 정리, M0 source inventory 경로 갱신, academy connector 구현 상태 문서 정합화가 전체 CI에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] 로컬 생성 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남아 있지 않다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)

## Goal 153. scaffolding 계획의 현재/미래 파일 표면 분리

목표: 이미 구현된 parent runtime 패키지를 계획 문서에서 `Future files`로 오해하지 않도록 현재 구현 파일과 향후 후보 파일을 분리해 설명한다.

달성조건:

- [x] `docs/planning/scaffolding-plan.md`의 Phase 1, 2, 4가 구현된 패키지를 현재 파일 표면으로 설명한다.
- [x] 아직 없는 `python-packages/k-parent-ocr-eval/`, `apps/mobile-web/`, `apps/api/`는 미래 후보로 남긴다.
- [x] `scripts/skill-docs.test.js`가 scaffolding 계획의 현재/미래 표현을 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent repository context documents the inherited architecture conventions'`
- [x] 2026-06-05: scaffolding `Future files` implemented package grep audit
- [x] 2026-06-05: `npm run lint`

## Goal 154. OMC handoff 예시를 현재 구현 이후 작업으로 갱신

목표: `docs/planning/omc-agent-plan.md`가 이미 끝난 초기 NEIS 구현을 첫 handoff처럼 안내하지 않고, 현재 패키지 fixture 구조에 맞는 후속 handoff 예시를 제공한다.

달성조건:

- [x] “Recommended first implementation handoff” 문구를 현재 구현 이후 후속 handoff로 바꾼다.
- [x] `tests/fixtures/neis/` 같은 존재하지 않는 root fixture 경로를 제거하고 package-local fixture 경로를 사용한다.
- [x] `scripts/skill-docs.test.js`가 OMC handoff 예시의 현재 경로를 검증한다.
- [x] focused regression과 `npm run lint`가 통과한다.

검증 기록:

- [x] 2026-06-05: `node --test scripts/skill-docs.test.js --test-name-pattern 'parent repository context documents the inherited architecture conventions'`
- [x] 2026-06-05: OMC handoff stale path grep audit
- [x] 2026-06-05: `npm run lint`

## Goal 155. Goals 153-154 통합 검증

목표: scaffolding 현재/미래 파일 표면 정리와 OMC handoff 갱신이 전체 CI에서 함께 통과하는지 확인한다.

달성조건:

- [x] `npm run ci`가 통과한다.
- [x] 로컬 생성 산출물(`*.tgz`, `.playwright-mcp`, `.DS_Store`)이 남아 있지 않다.
- [x] 검증 결과를 이 항목에 기록한다.

검증 기록:

- [x] 2026-06-05: `npm run ci`
- [x] 2026-06-05: generated artifact scan (`*.tgz`, `.playwright-mcp`, `.DS_Store` 0건)
