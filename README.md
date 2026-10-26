# K-Parent Skills

대한민국 부모가 매주 반복해서 확인하는 아이 관련 생활 정보를 모바일에서 에이전틱하게 사용할 수 있도록 만드는 스킬·데이터·상품화 실험 저장소입니다.

원본 [`NomaDamas/k-skill`](https://github.com/NomaDamas/k-skill)의 컬렉션형 운영 구조를 승계하되, 부모 제품 스킬만 `skills/` 아래에 평면 배치합니다. 범용 한국 생활 스킬은 복제하지 않고 upstream에 남기며, 필요한 구현은 `packages/`, `apps/`, `services/`, `scripts/`, `tools/`로 확장합니다.

Claude Code, Codex, OpenCode, OpenClaw/ClawHub 등 각종 코딩 에이전트에서 사용할 수 있는 `SKILL.md` 중심 구조입니다.

## 디파트먼트

K-Parent Skills는 개별 스킬을 아래 디파트먼트로 묶어 운영합니다. 제품 스킬 디렉토리는 `skills/` 컨테이너 아래에 평면 배치하고, 디파트먼트는 문서·로드맵·검색/추천의 상위 분류로 사용합니다.

| 디파트먼트 | 범위 | 대표 스킬 |
| --- | --- | --- |
| 학교 | 학교 공지, 급식, 가정통신문, 방과후, 신청 마감 | `k-parent-school-info`, `k-parent-school-doc-capture` |
| 학원 | 학원 앱/API, 수업 일정, 숙제, 출결, 보강, 결제 | `k-parent-academy-connector` |
| 놀이 | 실내외 놀거리, 체험, 축제, 문화센터, 행사, 이동 중 콘텐츠 | `k-parent-play-finder`, `k-parent-festival-finder`, `k-parent-culture-center-events`, `k-parent-content-recommender` |
| 생활 | 돌봄, 지원사업, 병원, 예방접종, 자녀 스케줄, 가족 일정, 행정 신청 | `k-parent-application-helper`, `k-parent-schedule-manager` |
| 트렌드 | 지역/육아 트렌드, 후기 흐름, 인기 행사, 시즌 이슈, 실제 크롤링 데이터 | `k-parent-data-collector` |
| 쇼핑 | 준비물, 교재, 장난감, 육아용품, 가격 비교, 재고, 보조 어필리에이트 | `k-parent-shopping-recommender` |
| 영양 | 급식, 유치원 식단, 알레르기, 집밥 보완, 영양 메모 | `k-parent-meal-planner` |

## 스킬 현황

아래 스킬은 대부분 `packages/k-parent-source-*`(공식 API 어댑터) 또는 `packages/k-parent-*`(순수 로직) 패키지로 뒷받침됩니다. 각 소스 패키지는 **fixture-first**로 동작합니다: 공개 API 스펙 기반의 목 응답을 `test/fixtures/`에 캐시해 오프라인으로 정규화·테스트하고, 크레덴셜을 넣고 `npm run refresh:fixtures --workspace <package>`를 돌리면 라이브 데이터로 전환됩니다. 크레덴셜 발급은 [OWNER-TASKS.md](OWNER-TASKS.md)와 [.env.example](.env.example)을 참고하세요. `knowledge-helper`·`mobile-agent`는 아직 패키지 경계가 없는 컨셉(워크플로우) 스킬입니다.

| 디파트먼트 | 할 수 있는 일 | 스킬 이름 | 설명 | 사용자 로그인 | 문서 |
| --- | --- | --- | --- | --- | --- |
| 영양 | 식단 | `k-parent-meal-planner` | 학교 급식, 유치원 식단, 가정 식단 후보를 아이 기준으로 정리 | 불필요 | [식단 기능 문서](docs/features/k-parent-meal-planner.md) |
| 학교 | 학교 정보 | `k-parent-school-info` | 학교 기본정보, 학사일정, 공지, 방과후 정보를 확인 | 불필요 | [학교 정보 기능 문서](docs/features/k-parent-school-info.md) |
| 학교 | 유치원 | `k-parent-kindergarten-info` | 유치원 기본정보, 모집, 방과후, 통학 조건을 비교 | 불필요 | [유치원 기능 문서](docs/features/k-parent-kindergarten-info.md) |
| 놀이 | 놀거리 | `k-parent-play-finder` | 아이와 갈 실내외 놀이, 체험, 키즈 공간 후보를 추천 | 불필요 | [놀거리 기능 문서](docs/features/k-parent-play-finder.md) |
| 놀이 | 축제 | `k-parent-festival-finder` | 지역 축제와 가족 동반 행사를 날짜·연령 기준으로 정리 | 불필요 | [축제 기능 문서](docs/features/k-parent-festival-finder.md) |
| 놀이 | 문화센터, 행사 | `k-parent-culture-center-events` | 백화점·마트·도서관·공공기관 문화센터 강좌와 행사를 탐색 | 불필요 | [문화센터/행사 기능 문서](docs/features/k-parent-culture-center-events.md) |
| 생활 | 각종 신청 | `k-parent-application-helper` | 돌봄, 방과후, 바우처, 체험 신청의 준비물과 마감일을 정리 | 필요할 수 있음 | [각종 신청 기능 문서](docs/features/k-parent-application-helper.md) |
| 학원 | 학원 안내문 | `k-parent-academy-connector` | 학원 공지에서 수업, 보강, 숙제, 시험, 수강료 마감을 추출하고 일정 후보로 정리 | 필요할 수 있음 | [학원 안내문 기능 문서](docs/features/k-parent-academy-connector.md) |
| 학교 | 학교문서 스캔 | `k-parent-school-doc-capture` | 학교 안내문 사진을 OCR로 저장하고 일정·준비물·신청 마감 캘린더 후보로 정리 | 필요할 수 있음 | [학교문서 스캔 기능 문서](docs/features/k-parent-school-doc-capture.md) |
| 쇼핑 | 준비물 쇼핑 | `k-parent-shopping-recommender` | 준비물·교재·육아용품 구매 후보를 정리하고 쿠팡 어필리에이트 링크를 선택적으로 제공 | 필요할 수 있음 | [준비물 쇼핑 기능 문서](docs/features/k-parent-shopping-recommender.md) |
| 생활 | 모바일 에이전트 | `k-parent-mobile-agent` | 서버 배포형 모바일 부모 에이전트 제품 표면 | 필요할 수 있음 | [모바일 에이전트 컨셉 문서](docs/features/k-parent-mobile-agent.md) |
| 트렌드 | 데이터 수집 | `k-parent-data-collector` | 학교데이터, 시간표, 평생교육, 축제, 행사, 트렌드 크롤링 | 불필요 | [데이터 수집 기능 문서](docs/features/k-parent-data-collector.md) |
| 생활 | 자녀 스케줄 | `k-parent-schedule-manager` | 자녀 스케줄, 가족 캘린더, 리마인더 후보 관리 | 필요할 수 있음 | [스케줄 관리 기능 문서](docs/features/k-parent-schedule-manager.md) |
| 놀이 | 여행지 추천 | `k-parent-travel-recommender` | 아이 동반 여행지, 체험, 일정 추천 | 불필요 | [여행지 추천 기능 문서](docs/features/k-parent-travel-recommender.md) |
| 생활 | 일반 지식 | `k-parent-knowledge-helper` | 부모가 묻는 일반 지식과 생활 판단 질문에 출처 기반 답변 | 불필요 | [일반 지식 컨셉 문서](docs/features/k-parent-knowledge-helper.md) |
| 놀이 | 콘텐츠 추천 | `k-parent-content-recommender` | 차 안에서 듣기 좋은 유튜브 채널·영상, 교과 연계 콘텐츠, 부모-자녀 대화 주제 추천 | 불필요 | [콘텐츠 추천 기능 문서](docs/features/k-parent-content-recommender.md) |
| 학교 | 오늘 배운 퀴즈 | `k-parent-quiz-maker` | 나이스 시간표로 오늘 배운 과목을 확인하고 성취기준 기반 결정적 문항 은행으로 복습 퀴즈 생성(Flutter 앱 `apps/k-parent-quiz-app`) | 불필요 | [오늘 배운 퀴즈 기능 문서](docs/features/k-parent-quiz-maker.md) |

공통 설치·환경 진단은 `k-parent-setup` 스킬이 담당합니다.

## 구조

```text
k-parent-skills/
├── skills/                       # 제품 스킬 (설치·트리거 단위, 평면 배치)
│   ├── k-parent-meal-planner/
│   │   └── SKILL.md
│   ├── k-parent-school-info/
│   │   └── SKILL.md
│   └── k-parent-setup/           # 설치·환경 진단
├── docs/features/
│   └── k-parent-*.md
├── ssot/                         # 생태계 자산·상태·경로의 기계 판독형 SSOT
│   ├── registry/                 # skills, packages, APIs, crawlers, datasets, products, legacy
│   └── INDEX.md                  # 레지스트리에서 자동 생성
├── docs/departments/
│   └── school.md, academy.md, play.md, life.md, trend.md, shopping.md, nutrition.md
├── packages/
│   ├── k-parent-core/            # 공통 스키마·가드레일·freshness
│   ├── k-parent-memory/          # 최소화된 세션·참조·공개 캐시·승인 감사 메모리
│   ├── k-parent-redaction/       # 로그·trace·error payload redaction 경계
│   ├── k-parent-proxy/           # 부모 전용 NEIS 읽기 allowlist proxy
│   ├── k-parent-brief/           # 부모용 Today Brief 합성
│   ├── k-parent-calendar/        # 캘린더 후보·중복제거·ICS
│   ├── k-parent-doc-extract/     # 안내문 텍스트 → 일정·준비물·마감 추출
│   └── k-parent-source-*/        # 공식·공개 데이터 어댑터
├── apps/k-parent-quiz-app/       # Flutter 퀴즈 제품 표면
├── services/
│   ├── k-parent-api/             # 인증·tenant·HITL·메모리 local runtime
│   └── k-parent-refresh/         # crawler/adapter local refresh scheduler
├── tools/quiz-dev-mcp/           # 퀴즈 개발 MCP
└── scripts/                      # 검증, probe, catalog 도구
```

제품 스킬은 `skills/<skill-name>/SKILL.md` 컨테이너에 평면 배치합니다. `skills/`는 설치 CLI가 `--skill <name>`으로 해석하는 표준 컨테이너입니다.

## 처음 시작하는 순서

1. `npx --yes skills add seolcoding/k-parent-skills --all -g`로 제품 스킬을 설치합니다.
2. `k-parent-setup`으로 fixture 또는 라이브 API 환경을 점검합니다.
3. 사용자가 지역, 아이 나이, 날짜, 예산, 이동수단 같은 조건을 말하면 스킬 워크플로우를 따릅니다.
4. 실제 조회가 필요한 정보는 현재 날짜 기준으로 공식/공개 출처를 확인하고, 출처와 마감일을 함께 답합니다.

## 구현 원칙

- 부모에게 필요한 판단 단위로 요약합니다: 날짜, 위치, 대상 연령, 비용, 준비물, 신청 링크, 마감일.
- 사진·PDF·알림장·학원 앱에서 들어온 문서는 OCR/추출 결과와 원본을 연결해 일정, 준비물, 신청 항목으로 구조화합니다.
- 모바일에서 일반 사용자도 쓸 수 있도록 서버 배포형 제품 표면을 우선합니다.
- 실제 학교데이터, 시간표, 평생교육, 축제, 행사, 트렌드 데이터는 수집 시각과 출처를 함께 관리합니다.
- 준비물 쇼핑 추천과 쿠팡 어필리에이트는 핵심 로직이 아니라 구매 의도가 있을 때의 보조 기능입니다.
- 아이 관련 정보는 오래된 결과를 그대로 쓰지 않고 현재 출처를 확인합니다.
- 로그인, 결제, 신청서 제출은 사용자의 명시적 승인 없이는 실행하지 않습니다.
- 개인정보와 아동 정보는 사용자 소유 저장소의 참조로만 연결하고, 서버 메모리에 원문을 저장하지 않습니다.

## 문서

| 문서 | 설명 |
| --- | --- |
| [SSOT 운영 규칙](ssot/README.md) | 스킬·패키지·API·크롤러·데이터셋·제품·레거시의 canonical 경로와 상태 관리 규칙 |
| [SSOT 인덱스](ssot/INDEX.md) | JSON 레지스트리에서 자동 생성한 전체 자산 목록 |
| [기여 가이드](CONTRIBUTING.md) | 부모 전용 저장소 경계, 변경 단위, 검증 절차 |
| [HITL 레이어](docs/hitl.md) | 로그인·개인정보·신청·예약·캘린더·구매·결제의 공통 승인 상태와 런타임 계약 |
| [메모리 레이어](docs/memory.md) | 세션·profile reference·공개 지식 cache·승인 감사의 저장·보존·금지 경계 |
| [서버 런타임](services/README.md) | localhost HITL·메모리 API, refresh scheduler와 운영 승격 조건 |
| [원격 개발](docs/remote-development.md) | Codespaces·클라우드 런타임에서 저장소를 그대로 개발 환경으로 쓰는 방법과 시크릿 정책 |
| [레이어 모델](docs/layers.md) | Experience·Skill·Policy/HITL·Memory·Tool·Domain·Adapter·Data·Runtime·Governance 책임 경계 |
| [소유자 작업·크레덴셜](OWNER-TASKS.md) | 발급해야 할 API 키, 가입 URL, 라이브 fixture 재생성 명령, 가드레일 |
| [환경변수 템플릿](.env.example) | `KEDU_INFO_KEY` + 모든 `KSKILL_*` 변수 |
| [처음 사용자 온보딩](docs/onboarding.md) | 저장소 목적, 기능 지형도, 설치 후 확인, fixture-first 동작, 검증 명령 |
| [아키텍처 컨벤션](docs/architecture.md) | 원본 k-skill 구조 승계, 스킬 승격 경로, 에이전트 컨텍스트 |
| [디파트먼트 인덱스](docs/departments/README.md) | 학교·학원·놀이·생활·트렌드·쇼핑·영양 분류와 스킬 매핑 |
| [스킬 라우팅 인덱스](docs/skill-routing.md) | 부모 질의 → 스킬 매핑, 놀이 계열 겹침 해소, 복합 명령 분해 |
| [gstack 개발·상품화 계획](docs/productization-gstack.md) | gstack 기반 QA, 디자인 검토, 배포 검증, 상품화 단계 |
| [새 스킬 추가 가이드](docs/adding-a-skill.md) | 원본 k-skill 방식의 스킬 추가 규칙 |
| [로드맵](docs/roadmap.md) | 부모용 스킬 확장 후보 |
| [EDSS/KERIS 소스 후보](docs/edss_k_parent_sources.md) | 한국교육학술정보원 EDSS와 학교알리미·NEIS·유치원알리미 API 후보 |
| [브리핑 HTML](docs/briefing.html) | 리포·리서치·기능 계획을 한 번에 설명하는 공유용 HTML |
| [설치 방법](docs/install.md) | `seolcoding/k-parent-skills` 전체 또는 선택 설치 안내 |
| [연구 기록](docs/research/k-parent-skills-architecture-ecosystem-2026-05-01.md) | k-skill 기반 부모 타깃 스킬 아키텍처와 연동 생태계 분석 |
| [전환 전략 연구](docs/research/k-parent-skills-conversion-strategy-2026-05-01.md) | 부모용 보이스/어시스턴트 전환, API 우선순위, 딥링크형 신청 보조 전략 |
| [스펙 인덱스](docs/specs/README.md) | 제품 스펙, 데이터 계약, 프로젝트 구조와 향후 계획 |
| [플래닝 인덱스](docs/planning/README.md) | OMC 기반 PRD, 스캐폴딩 계획, 기능별 플래닝, 에이전트 운용 계획 |
