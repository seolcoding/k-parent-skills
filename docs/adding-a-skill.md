# 새 스킬 추가 가이드

새 스킬을 k-parent-skills에 추가하는 방법과 스킬이 동작하는 구조를 설명한다. 이 저장소는 `NomaDamas/k-skill`의 구조를 승계하되, 대한민국 부모 생활정보 도메인에 맞춘다.

---

## 스킬이란

스킬은 AI 에이전트(Claude Code 등)가 특정 작업을 수행하는 방법을 정의한 문서+코드 묶음이다. 에이전트는 `SKILL.md`를 읽고 거기 적힌 워크플로우를 따라 실행한다.

스킬에는 네 가지 구현 유형이 있다.

| 유형 | 설명 | 예시 |
|------|------|------|
| **SKILL.md 전용** | 문서만으로 동작. 부모용 신규 컨셉은 이 형태로 먼저 시작 | `k-parent-knowledge-helper`, `k-parent-mobile-agent` |
| **도메인 패키지** | `packages/` 아래 순수 로직으로 구현 | `k-parent-calendar`, `k-parent-quiz-core` |
| **어댑터 패키지** | 공식·공개 API 응답을 정규화 | `k-parent-source-neis`, `k-parent-source-tourapi` |
| **툴/프록시** | 앱·에이전트가 호출하는 결정적 표면 | `quiz-dev-mcp`, NEIS proxy routes |
| **Python/Node 스크립트** | probe·crawler·catalog 작업 | `neis_live_probe.py`, `data_portal_k_parent_audit.mjs` |

---

## 스킬의 구조

모든 제품 스킬은 **`skills/` 컨테이너 아래에 디렉토리 하나**를 갖는다. 범용 한국 생활 스킬은 upstream `k-skill`에 남긴다.

```
k-parent-skills/
├── skills/                ← 제품 스킬 컨테이너 (설치·트리거 단위)
│   └── k-parent-my-new-skill/ ← 스킬 디렉토리 (이름 = 스킬 이름)
│       ├── SKILL.md       ← 필수. 에이전트가 읽는 핵심 파일
│       └── (지원 파일들)   ← 선택. 스크립트, 데이터 등
├── packages/              ← npm 패키지 유형일 때만
│   └── k-parent-my-new-skill/
│       ├── package.json
│       ├── src/
│       └── test/
├── tools/                 ← agent/app-callable tool 유형일 때만
└── scripts/               ← probe/crawler/script 유형일 때만
    └── k_parent_my_new_skill.py
```

---

## SKILL.md 형식

`SKILL.md`는 YAML frontmatter + Markdown 본문으로 구성된다.

```markdown
---
name: k-parent-my-new-skill
description: 한 문장으로 이 스킬이 무엇을 하는지 설명한다. 에이전트 UI에 표시된다.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: p0
---

# k-parent-my-new-skill

## 핵심 동작

이 스킬이 무엇을 하는지 한두 문단으로 설명한다.

## 사용 시점

- "사용자가 이런 말을 할 때"
- "또는 이런 상황일 때"

## 준비 사항

- Node.js 18+ (필요하면)
- 패키지 설치 명령

## 전형적 흐름

### 1. 첫 번째 단계

설명과 실행할 코드를 적는다.

```bash
# 실행할 명령어
```

### 2. 두 번째 단계

...

## 완료 조건

- 이런 조건이 만족되면 완료다

## 실패 모드

- 예상 가능한 실패 상황

## 참고

- 특이사항, 보안 정책 등
```

### frontmatter 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `name` | ✅ | **디렉토리 이름과 정확히 일치**해야 한다 |
| `description` | ✅ | 에이전트 라우팅용 한국어 설명. 트리거 예시 발화 2~3개 + 겹치는 형제 스킬 경계 문장 포함 (아래 규칙 참고) |
| `license` | ✅ | 항상 `MIT` |
| `metadata.category` | ✅ | parent 제품 스킬은 `parenting` |
| `metadata.locale` | ✅ | `ko-KR` |
| `metadata.phase` | ✅ | parent 제품 스킬은 `p0`(핵심 제품 후보), `implemented`(runtime 패키지/스크립트 구현 있음), `concept`(SKILL.md-only 컨셉) 중 하나를 쓴다 |

### description 작성 규칙 (컨텍스트 엔지니어링)

`description`은 에이전트가 스킬을 고르는 1차 신호다. 사람이 카탈로그를 훑기 위한 글이 아니라 **시맨틱 라우팅**을 위한 글이다.

1. **한국어로 쓴다.** 부모 질의가 한국어이므로 영어 설명은 매칭이 약하다.
2. **트리거 예시 발화 2~3개**를 큰따옴표로 넣는다: `"이번 주 급식 뭐야", "유치원 식단표 확인해줘" 같은 요청에 사용.`
3. **겹치는 형제 스킬**이 있으면 경계 문장으로 구분한다: `날짜가 박힌 축제는 k-parent-festival-finder, 1박 이상 코스는 k-parent-travel-recommender.`
4. 동작 패키지가 있으면 한 줄로 언급한다: `... NEIS(packages/k-parent-source-neis)로 ...`.

### 본문 구조와 progressive disclosure

- 본문(`## 사용 시점`, `## 전형적 흐름` 등)은 **간결·절차형**으로 유지한다.
- 동작 패키지가 있으면 `## 데이터 소스` 섹션에 패키지·함수 시그니처·env 변수를 적는다.
- 긴 코드표·필드맵·정책표·샘플 데이터는 본문에 붓지 말고 **`skills/k-parent-my-new-skill/references/*.md`** 같은 skill 폴더 내부 `references/`로 분리하고 `SKILL.md` 본문에서는 백틱 경로(`` `references/foo.md` ``)로 링크한다.
- 질의→스킬 매핑과 겹침 해소 규칙은 `docs/skill-routing.md`에 모은다.

---

## 유형별 구현 방법

### A. SKILL.md 전용 스킬

에이전트가 `SKILL.md` 안의 bash/python 코드를 직접 실행한다.

1. 디렉토리 생성: `mkdir -p skills/k-parent-my-new-skill`
2. `skills/k-parent-my-new-skill/SKILL.md` 작성
3. `전형적 흐름` 섹션에 에이전트가 따를 단계별 명령어를 적는다

외부 라이브러리나 서버 없이 동작해야 한다.

### B. npm 패키지 스킬

`packages/k-parent-my-new-skill/`에 Node.js 구현체를 만들고, 스킬 디렉토리 `skills/k-parent-my-new-skill/SKILL.md`에서 `require('k-parent-my-new-skill')`로 호출한다.

```
packages/k-parent-my-new-skill/
├── package.json    # name, version, main, exports 필수
├── README.md
├── src/
│   └── index.js
└── test/
    └── index.test.js
```

`package.json`에 `"name": "k-parent-my-new-skill"` 설정 후 루트 `package.json`의 `workspaces`에 등록한다.

현재 `k-parent-skills`의 npm release workflow는 비활성 상태다. npm 배포가 실제로 필요해지면 `docs/releasing.md`에 따라 Changesets 설정과 publish workflow를 같은 변경에서 재도입한다.

### C. 프록시 경유 스킬

NEIS 읽기 API 키를 사용자에게 노출하지 않으려면 `k-parent-proxy`를 경유한다.

1. 부모용 read-only NEIS 범위인지 먼저 확인하고 `packages/k-parent-proxy/src/server.js`에 allowlist route 추가
2. `SKILL.md` `전형적 흐름`에 `curl $KPARENT_PROXY_BASE_URL/v1/...` 형태로 호출 작성
3. upstream API 키는 서버의 `~/.config/k-parent-skills/secrets.env`에만 보관

프록시 서버는 main 브랜치에 merge되어야 프로덕션에 반영된다 (`AGENTS.md` 참고; `CLAUDE.md`는 호환 symlink).

부모용 스킬에서 프록시를 추가할 때는 무료/공개 API 또는 공개 페이지 기반 조회만 넣는다. 로그인, 결제, 신청 제출, 아이 개인정보 입력이 필요한 작업은 프록시 자동화 대상이 아니다.

### D. Python 스크립트 스킬

`scripts/k_parent_my_new_skill.py`를 만들고 `SKILL.md`에서 `python3 scripts/k_parent_my_new_skill.py`로 호출한다.

---

## 스킬 등록 & 검증

스킬은 디렉토리 스캔으로 설치 대상이 되고, ID·layer·상태·canonical 경로는
`ssot/registry/skills.json`에 함께 등록한다.

추가 후 검증:

```bash
npm run ci
```

이 명령은 `scripts/validate-skills.sh`를 실행해 다음을 확인한다.

- `skills/` 하위 모든 디렉토리에 `SKILL.md`가 있는지
- frontmatter가 `---`로 시작하는지
- `name` 필드가 있는지
- `description` 필드가 있는지
- `name` 필드 값이 디렉토리 이름과 일치하는지
- `skills/k-parent-*` 제품 스킬은 `license: MIT`, `metadata.category: parenting`,
  `metadata.locale: ko-KR`, 허용된 `metadata.phase`를 갖는지

---

## 시크릿이 필요한 스킬

인증이 필요한 스킬은 아래 우선순위로 credential을 확보한다.

1. 이미 환경변수에 있으면 → 그대로 사용
2. 에이전트 vault(1Password, Bitwarden, macOS Keychain) → 주입
3. `~/.config/k-parent-skills/secrets.env` → 파일에서 읽기
4. 아무것도 없으면 → 사용자에게 물어보고 3번에 저장

시크릿 변수 이름은 기존 package 계약을 따른다(예: `KEDU_INFO_KEY`, `KSKILL_TOURAPI_KEY`). 새 변수는 `.env.example`, setup/security 문서, SSOT를 함께 갱신한다.

절대 하지 말 것:
- 시크릿을 저장소에 커밋
- 프록시 upstream 키를 클라이언트에 노출
- 사용자 확인 없이 side-effect가 있는 작업 실행

---

## 체크리스트

새 스킬을 PR 올리기 전에 확인한다.

- [ ] `skills/k-parent-my-new-skill/SKILL.md` 작성 완료
- [ ] frontmatter `name`이 디렉토리 이름과 일치
- [ ] `description`이 한국어 + 트리거 예시 발화 2~3개 포함 (겹치는 스킬이 있으면 경계 문장도)
- [ ] 동작 패키지가 있으면 본문에 `## 데이터 소스` 섹션으로 패키지·env 명시
- [ ] 긴 코드표/필드맵은 해당 skill 폴더 내부 `references/`로 분리하고 백틱 경로로 링크
- [ ] 새 스킬이거나 라우팅이 바뀌면 `docs/skill-routing.md` 갱신
- [ ] 부모용 스킬이면 아이 나이/학년, 지역, 날짜, 출처, 마감일, 비용, 준비물, 다음 행동이 출력 형식에 반영됨
- [ ] 구현이 [레이어 모델](layers.md)의 Skill·Policy/HITL·Tool·Domain·Adapter 책임을 지키는지 확인
- [ ] child-personal-data, 로그인, 결제, 제출, 취소 같은 side effect는 `k-parent-core` HITL 승인 전 실행하지 않도록 구현·명시
- [ ] `npm run ci` 통과 (`./scripts/validate-skills.sh` 포함)
- [ ] npm 패키지라면 `packages/`에 구현체와 테스트 추가
- [ ] npm 패키지를 실제 배포 대상으로 전환한다면 `docs/releasing.md`에 따라 Changesets 설정과 publish workflow를 같은 변경에서 재도입
- [ ] `docs/features/k-parent-my-new-skill.md` 작성
- [ ] 새 제품 스킬이면 `README.md`, `docs/skill-routing.md`, `docs/roadmap.md`, `docs/departments/README.md` 갱신
- [ ] `ssot/registry/skills.json`에 ID·layer·상태·canonical 경로를 등록하고 `npm run ssot:generate` 실행
- [ ] 프록시 경유라면 `packages/k-parent-proxy/src/server.js`에 route 추가, `packages/k-parent-proxy/README.md`와 `docs/features/k-parent-proxy.md`에 route/env 문서화, main merge 전에는 프로덕션 미반영임을 기록
- [ ] 프록시 경유 또는 시크릿 경계가 있으면 `docs/setup.md`, `docs/security-and-secrets.md`, `docs/sources.md`, `.env.example`, `OWNER-TASKS.md` 중 관련 표면 갱신
- [ ] 시크릿이 있다면 사용자/client env와 proxy 운영자 env를 구분하고 `docs/security-and-secrets.md`의 기본 secrets 파일에 운영자 전용 key를 넣지 않음
- [ ] 범위나 아키텍처가 바뀌면 `docs/architecture.md`, `AGENTS.md` 중 관련 파일 업데이트 (`CLAUDE.md`는 `AGENTS.md` symlink)

---

## 관련 문서

- [공통 설정 가이드](setup.md) — 시크릿 설정 방법
- [릴리스와 자동 배포](releasing.md) — npm 패키지 배포 흐름
- [보안/시크릿 정책](security-and-secrets.md) — 인증 정보 취급 원칙
- [아키텍처 컨벤션](architecture.md) — 원본 k-skill 구조 승계와 부모용 승격 규칙
- [레이어 모델](layers.md) — Skill·Policy/HITL·Tool·Domain·Adapter 책임 경계
- [HITL 레이어](hitl.md) — 외부 부작용 승인 상태와 런타임 계약
