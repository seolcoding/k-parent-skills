# 아키텍처 컨벤션

`k-parent-skills` keeps the repository architecture of `NomaDamas/k-skill` and changes the domain concept to 대한민국 부모 생활정보.

## 저장소 구조

```text
k-parent-skills/
├── skills/                  # product skills (install/trigger unit, flat)
│   └── <skill-name>/
│       └── SKILL.md
├── docs/
│   ├── architecture.md
│   ├── adding-a-skill.md
│   ├── departments/<department>.md
│   └── features/<skill-name>.md
├── packages/
│   └── <skill-name>/
├── apps/                    # user-facing experience surfaces
├── services/                # local/server runtime composition
├── tools/                   # repository-scoped callable tools
├── scripts/
└── ssot/                    # cross-layer governance registry
```

`skills/` is the canonical container the installer resolves with `--skill <name>` (`skills/<name>/SKILL.md`). Generic upstream examples are intentionally not copied into this repository.

Repository ownership follows the explicit [layer model](layers.md): Experience
→ Skill → Policy/HITL → Memory → Tool → Domain → Adapter → Data, with SSOT
Governance and Runtime composition across every layer.

## 스킬 우선 패턴

- Treat a skill directory under `skills/` as the public unit of capability.
- Keep skills flat inside their container — `skills/` is a single install container, not a department. Treat departments as the product taxonomy, not as nested install paths. Do not split skill folders under department folders.
- Keep `SKILL.md` concise and procedural. Put deeper explanation in `docs/features/<skill-name>.md`.
- Put department strategy, shared schemas, and skill maps in `docs/departments/<department>.md`.
- Use `SKILL.md`-only concept docs for concept validation.
- Add implementation code only when repeated usage proves that deterministic parsing, normalization, or API access is needed.

## 점진적 공개 패턴

Parent skills should preserve the upstream `k-skill` context-budget pattern:

| Stage | Name | Rule |
| --- | --- | --- |
| 1 | Advertise | `SKILL.md` frontmatter `name` and `description` should be enough for semantic routing. Descriptions are written for agent matching, not humans browsing a catalog. For k-parent skills write the description in Korean, include 2-3 concrete trigger utterances, and add a boundary sentence when a sibling skill overlaps. See `docs/adding-a-skill.md` and the cross-skill map in `docs/skill-routing.md`. |
| 2 | Load | The `SKILL.md` body should stay compact and procedural: when to use, what to ask, workflow, output fields, failure modes. When a deterministic package backs the skill, add a `## 데이터 소스` section naming the package, functions, and env vars. |
| 3 | Read resources | Long API field maps, policy manuals, PDF-derived tables, and crawler schemas should live in `skills/<skill>/references/*.md` (e.g. `skills/k-parent-meal-planner/references/allergen-codes.md`) and be read only when needed. |

This keeps many parent skills installable together without flooding an agent's initial context.

## 디파트먼트 분류

K-Parent Skills uses these top-level departments:

| Department | Korean label | Scope |
| --- | --- | --- |
| `school` | 학교 | school notices, meals, kindergarten, after-school, documents, applications |
| `academy` | 학원 | hagwon apps/APIs, classes, homework, attendance, makeup lessons, billing |
| `play` | 놀이 | places to go, indoor/outdoor play, festivals, culture centers, events |
| `life` | 생활 | childcare, benefits, healthcare, public applications, family logistics |
| `trend` | 트렌드 | parenting trends, local buzz, seasonal topics, popular programs |
| `shopping` | 쇼핑 | supplies, books, toys, price comparison, inventory, optional affiliate recommendations, purchase planning |
| `nutrition` | 영양 | school meals, kindergarten meals, allergies, home meal planning |

Department membership is metadata and documentation. A skill may belong to one primary department and optional secondary departments, but the `skills/<skill-name>` container folder name stays stable.

## 구현 승격 경로

1. `SKILL.md` concept doc: instructions, examples, failure modes, and safety rules.
2. Feature doc: source surfaces, output format, and known limitations.
3. Script helper: small one-off deterministic task.
4. Package helper: reusable Node package under `packages/*`.
5. Proxy route: free/public API aggregation via `packages/k-skill-proxy`.

## 공공 데이터 통합 패턴

Many parent workflows depend on public data where a natural-language query is not enough. Prefer resolver-first pipelines:

1. Resolve user language into official identifiers: school code, education office code, district code, institution id, coordinates, or dataset id.
2. Query the official/public source with those identifiers.
3. Normalize records into parent decision fields.
4. Store provenance: official URL, source name, collection time, field confidence, and freshness.
5. Explain missing or stale data instead of silently substituting guesses.

Priority source families:

- NEIS: school resolver, academic schedule, timetable candidates, school meals, allergy and nutrition fields.
- Kindergarten and childcare disclosure: operating type, hours, after-school/extended care, cost, teacher/staff, safety, meal, vehicle, and application indicators.
- TourAPI and local government datasets: festivals, events, child-friendly places, travel and seasonal programs.
- Public reservation and lifelong education datasets: culture centers, libraries, civic programs, arts education, registration status.
- Government24 and Bokjiro: eligibility guidance, document checklists, official links, and reminder candidates.

Default source priority:

1. Official API or official disclosure.
2. Public data file download.
3. Map or local-search API for freshness and geocoding.
4. Limited scraping for public fields missing from official sources.
5. Community, blog, or review signals as secondary context only.

The assistant should avoid ranking schools or childcare institutions as leaderboards. Prefer practical comparison fields such as distance, hours, care options, class size, meal/safety data, cost, official notices, and deadlines.

## 정규화 레이어 패턴

Parent-domain implementations may keep skills independent while sharing a central normalization layer for codes and profile context:

- `region_code_map`: education, tourism, public-service, legal-dong, and local-government code mapping.
- `institution`: schools, kindergartens, childcare centers, culture centers, libraries, and civic facilities.
- `content_item`: festivals, outings, classes, programs, and events.
- `application_service`: benefits, care programs, reservations, and public-service metadata.
- `parent_profile`, `child_profile`, and `consent_log`: minimal product profile and consent records.

Do not duplicate NEIS, TourAPI, public-reservation, and welfare code mapping logic inside every skill. Skills should call shared resolvers when the implementation is promoted beyond concept docs.

## 캐시와 크롤러 패턴

Use live calls only when the data is volatile or the user needs a current answer. For slow-moving datasets, prefer scheduled or local/server-side synchronization:

- Cache school, kindergarten, childcare, program, and policy reference data with refresh time.
- Keep raw source payloads separate from normalized records.
- Deduplicate by official id when available; otherwise use source URL, title, date, place, and text hash.
- Treat crawler output as fallible: expose blocked, stale, empty, and parse-error states.
- Keep scraping code in helpers or server jobs; do not encode brittle browser steps only in `SKILL.md`.
- Prefer official APIs before headless-browser scraping.

## 모바일 에이전트 제품 패턴

The product target is a server-deployed mobile-first parent agent for normal users, not only local developer skills:

1. Mobile surface: parent can open a URL/app, select a child, and ask agentic questions.
2. Server runtime: crawlers, OCR, schedule extraction, recommendation jobs, and connector tasks run server-side.
3. Source layer: school data, timetables, education office data, lifelong education, festivals, events, trend sources, and travel/place data are collected with provenance.
4. Personal layer: child schedule, family calendar, reminders, school documents, academy notices, and preferences are user-controlled.
5. Action layer: calendar writes, applications, reservations, messages, and purchases require explicit confirmation.
6. QA layer: gstack validates mobile flows, source freshness states, and deployed canaries.

## 문서 인입 패턴

School, academy, and institution documents should follow an ingest-normalize-confirm flow:

1. Capture original: photo, PDF, app screenshot, message, or downloaded attachment.
2. Extract text: OCR or structured parser, keeping confidence and source page/region when available.
3. Normalize entities: date, time, place, child/grade target, cost, materials, deadline, application URL, contact, and issuer.
4. Store linkable records: keep original path, extracted text, normalized JSON, source date, and confirmation state together.
5. Propose actions: calendar events, reminders, checklist items, or application tasks.
6. Confirm before side effects: write to calendar, send messages, submit applications, or pay only after explicit user approval.

## 커머스와 제휴 패턴

Shopping recommendations may monetize through Coupang Partners or other affiliate links, but this is not core product logic. Recommendations must preserve parent trust:

1. Start from a concrete parent need: school supply list, academy book, event material, nutrition item, toy, or household repeat purchase.
2. Normalize the need before recommending products: item name, quantity, deadline, required/optional status, age/grade fit, budget, delivery deadline, and source document.
3. Present non-affiliate decision information first: product type, constraints, price range, delivery estimate, alternatives, and whether offline/used purchase is reasonable.
4. Disclose affiliate status before showing affiliate links. Use clear wording that purchase through the link may generate commission.
5. Provide affiliate links only after the user asks to buy, compare purchase candidates, or requests product links.
6. Do not auto-purchase, add to cart, or steer around safety/age suitability for commission.
7. Keep commercial ranking explainable: relevance, deadline fit, price, reviews, delivery, and stock should be visible signals.

## 민감 거래 경계

모든 외부 부작용은 [HITL 레이어](hitl.md)를 통과한다. `k-parent-core`가 작업
유형별 위험도, 승인 필요 여부, scope digest, 승인 만료, one-time consumption을
검증한다. 등록되지 않은 작업 유형도 기본 high-risk로 다룬다. 각 스킬과 앱은
승인 UI를 직접 새로 정의하지 말고 이 공통 상태 모델을 사용한다.

Government services, care applications, reservations, payments, academy account actions, and child-data writes require a hard boundary:

1. The agent may collect public requirements, summarize procedures, prepare checklists, and create reminder/calendar candidates.
2. The agent may open or link to official pages for the parent.
3. The agent must not collect NPKI/certificate credentials, impersonate identity verification, submit government applications, reserve paid programs, cancel bookings, pay, or expose child personal data without explicit approval.
4. For certificate-login or identity-heavy services, default to pre-transaction guidance and handoff to the official site.

## gstack 개발 루프

Use gstack as the development and commercialization quality loop once this repo grows beyond pure skill documents:

1. Product surface: build the smallest usable mobile web/app surface for one parent workflow.
2. Dogfood: use gstack browser QA to run the real parent flow end to end.
3. Design review: inspect screenshots for clarity, trust, source freshness, mobile usability, and parent decision load.
4. Benchmark: record load, data refresh, crawler, OCR/import, recommendation, and calendar latency baselines before larger changes.
5. Canary: after deploy, verify the live app has no blocking console errors and that key flows still work.
6. Ship discipline: keep skill docs, schemas, tests, and product screens aligned in each PR.

## 부모 도메인 출력 스키마

Parent-facing skills should normalize information into practical decision fields:

- child age or grade
- region and travel distance
- date range and deadline
- target age or eligibility
- cost, materials, documents, and login requirements
- reservation/application status
- official source URL
- confirmation date
- next action for the parent
- original document path or capture source when the information came from OCR/PDF/app screenshots
- confidence and review-needed flag for OCR-derived fields
- commerce disclosure and affiliate link status when the next action is purchase-related
- source freshness and crawl provenance when the answer depends on collected data

## 안전과 개인정보

- Do not store child names, birth dates, school identifiers, contact information, or application credentials in the repository.
- Store OCR outputs and document metadata in user-controlled local storage by default; do not commit captured school or academy documents.
- Do not submit applications, make reservations, cancel, pay, or enter child-personal-data without explicit user approval.
- Do not hide affiliate relationships or present paid links as neutral recommendations.
- Separate confirmed official information from recommendations, guesses, reviews, or stale search snippets.
- Schedules, admissions, events, and applications are time-sensitive. Verify current sources before answering.

## SSOT 경계

`ssot/registry/*.json`은 저장소 안팎에 흩어진 스킬, 패키지, API, 크롤러,
데이터셋, 제품, 레거시 자산의 ID와 canonical 경로, 성숙도, 검증 수준,
배포 상태를 관리한다. 실제 동작 계약은 `skills/*/SKILL.md`, 구현은
`packages/`, `apps/`, `scripts/`, `tools/`가 계속 소유한다. SSOT는 이를
복사하지 않고 관계와 상태만 연결한다.

상태는 `maturity`, `verification`, `deployment` 세 축으로 분리한다. fixture
테스트를 통과한 구현을 라이브 검증 또는 배포 완료로 간주하지 않는다. 변경 후
`npm run ssot:generate`와 `npm run ssot:check`를 실행한다.

## 에이전트 컨텍스트 표면

Future agents should use these files as the standing repository context:

- `AGENTS.md`: operational rules for coding agents
- `CLAUDE.md`: compatibility symlink to `AGENTS.md`
- `ssot/README.md`: cross-artifact identity, status, and canonical-path rules
- `docs/architecture.md`: architecture and promotion conventions
- `docs/adding-a-skill.md`: new skill workflow
- `docs/departments/README.md`: department taxonomy and skill map
- `docs/productization-gstack.md`: gstack-based development and commercialization plan
- `docs/roadmap.md`: concept and implementation priorities

When changing the architecture or conventions, update these surfaces together.
