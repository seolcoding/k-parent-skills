# K-Parent Skill Architecture and Integration Ecosystem Research

Date: 2026-05-01

This note records research supplied for building a Korea-focused parent agent skill ecosystem on top of the `NomaDamas/k-skill` architecture. Treat source claims as research inputs; verify current API fields, service rules, counts, and policy details before implementing production collectors.

## Core thesis

Korean parents face repeated information overload across school notices, meals, kindergarten and childcare disclosures, academy messages, local events, culture-center classes, welfare benefits, applications, shopping, and child schedules. A parent agent skill ecosystem should integrate these fragmented surfaces behind a conversational and mobile-first workflow.

The project should preserve the `k-skill` skill-first repository shape while specializing the domain for Korean parent workflows:

- product `skills/<skill>/SKILL.md` directories are the installable capability units; the new plural repository intentionally leaves generic upstream demos in `NomaDamas/k-skill`
- feature docs explain source surfaces, output schemas, and limitations
- helper scripts and packages are added only after repeated use proves deterministic logic is needed
- proxy routes and cached datasets can reduce CORS, rate-limit, and latency problems
- side-effectful actions require explicit confirmation

## Progressive disclosure pattern

Parent skills should follow the same context-budget discipline as `k-skill`:

| Stage | Name | Repository behavior |
| --- | --- | --- |
| 1 | Advertise | The agent sees only `name` and `description` in `SKILL.md` frontmatter. Descriptions must be semantic triggers written for agent matching, not marketing copy. |
| 2 | Load | The agent loads the full `SKILL.md` only after the user request matches the skill. Keep it procedural and compact. |
| 3 | Read resources | Large schemas, policy manuals, field maps, and PDF-derived references should live in separate resources and be read only when needed. |

This matters for parent skills because several related capabilities may be installed together: school search, meals, kindergarten comparison, document capture, welfare guidance, culture programs, and shopping.

## Data and integration surfaces

### NEIS school and meal data

The NEIS education information open portal is a high-priority source for school base information, schedules, and meal menus. A school meal skill should not query meals directly from a natural-language school name. It should first resolve:

- school name
- region and education office
- `SCHUL_CODE`
- `ATPT_OFCDC_SC_CODE`

Then it can query meal data and normalize fields such as:

- `MLSV_YMD`: meal date, after converting relative dates to absolute `YYYYMMDD`
- `MMEAL_SC_NM`: breakfast, lunch, dinner
- `DDISH_NM`: dish names, including allergy-number annotations
- `ORPLC_INFO`: origin information
- `CAL_INFO`: calories
- `NTR_INFO`: nutrition information

Meal parsing should extract allergy markers and map them to the official allergy-code table before warning a parent. This belongs in deterministic helper code once implemented.

### Kindergarten and childcare disclosure data

Kindergarten and childcare comparison should use public disclosure data when available. The useful parent-facing fields are not just names and addresses; comparison should prioritize:

- public/private type
- after-school or extended-care availability
- age/class type
- teacher composition and tenure signals
- tuition and extra activity costs
- meal operation, hygiene, safety, CCTV, vehicle support, and incident indicators
- enrollment and application timing

The agent should support multi-condition comparison, such as district, age, extended-care hours, cost ceiling, and safety constraints.

### Local play, festivals, culture centers, and lifelong education

Recommended sources include TourAPI, local government reservation datasets, Seoul public service reservation datasets, culture and arts education data, libraries, lifelong education centers, and local event pages.

Normalized records should include:

- title
- date range and registration period
- age target
- region, address, coordinates, and travel distance
- cost and materials
- reservation status
- official URL
- source refresh time
- stale-data warning when the source can lag the booking system

Events and programs must be filtered against the current date. Old events and future-but-not-yet-open programs should not appear as available recommendations without status labels.

### Non-open commercial surfaces

Some high-value parent surfaces, such as large-mart or department-store culture centers, may not expose public APIs. These should be treated as crawler candidates only after checking terms, robots, rate limits, and login boundaries.

Implementation guidance:

- prefer official/public APIs first
- use headless browser automation only when static requests are insufficient
- isolate scraping in helper packages or server jobs, not in prose-only skill logic
- store provenance, crawl time, and failure state
- do not bypass authentication or payment flows
- do not submit reservations without explicit user confirmation

### Welfare, Government24, Bokjiro, and care applications

Benefits and care applications are valuable parent workflows, but they cross sensitive identity and legal boundaries. The agent should operate in a pre-transaction guidance mode:

- explain eligibility and required documents
- extract deadlines, contact points, and official links
- prepare checklists
- create calendar/reminder candidates
- hand off to official sites for login, identity verification, final submission, and payment

When NPKI, certificate login, child personal data, or government identity verification is involved, the agent must not attempt to collect credentials or perform the final transaction.

## Legacy app comparison

Existing parent apps such as Kids Note and I-am-School are strong for institution-specific push notifications, but they are vertical silos. A parent agent should differentiate by horizontal integration:

- school meal plus allergy plus shopping preparation
- school notice plus calendar extraction
- academy message plus schedule conflict detection
- weekend schedule gap plus weather plus TourAPI/local events
- childcare disclosure plus commute and cost comparison
- welfare eligibility plus checklist and reminder

The product value is not another notification inbox; it is cross-domain synthesis and confirmed next actions.

## Architecture implications

Research-backed implementation priorities:

1. Keep `SKILL.md` short and use feature docs/resources for long mappings.
2. Add resolvers before final API calls when public APIs require official codes.
3. Cache slow-changing public datasets locally or server-side with freshness metadata.
4. Normalize all source records into parent decision fields.
5. Separate official data, crawled data, user documents, recommendations, and affiliate links.
6. Treat scraping as a server-side helper with provenance and failure states.
7. Keep government, payment, reservation, and child-data side effects behind explicit confirmation.
8. Build the mobile product surface as the proof point, not a developer-only skill demo.

## Source surfaces named in the research input

- `NomaDamas/k-skill`
- `NomaDamas` GitHub organization
- `k-skill` `AGENTS.md`, `hwp`, `lck-analytics`, `delivery-tracking`, and proxy-related docs
- NEIS education information open portal and meal dataset docs
- `agemor/neis-api`
- kindergarten and childcare information disclosure portals
- public data portals for local government, TourAPI, public reservation, and culture education datasets
- Government24, Bokjiro, and all-day care service surfaces
- Kids Note, I-am-School, and Korean parent communication app examples
- `VoltAgent/awesome-agent-skills`

Verify exact endpoints, current field names, terms, and policy text before implementation.
