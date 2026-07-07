# Scaffolding Plan

This document describes how to move from the current documentation-first repo to implementation without breaking upstream `k-skill` conventions.

## Current Baseline

Keep:

- container skill directories with `skills/<skill>/SKILL.md` for product skills and `examples/<skill>/SKILL.md` for inherited upstream demos
- `docs/features/<skill>.md`
- `docs/departments/*.md`
- `docs/specs/*.md`
- `scripts/skill-docs.test.js`
- optional future `packages/`, `scripts/`, and `python-packages/`

Do not create runtime packages until an adapter boundary is proven by fixtures and repeated workflows.

## Phase 0: Planning and Source Inventory

Goal:

- Make implementation decisions explicit before adding code.

Create or refine:

- `docs/planning/*`
- `docs/sources.md`
- source inventory table with API owner, endpoint, auth, quota, license, refresh cadence, and risk
- issue or checklist per source adapter

Exit criteria:

- PRD is accepted.
- Data contracts are stable enough for fixture design.
- Sensitive-action boundaries are documented.
- OMC agent plan is available for future parallel work.

## Phase 1: Core Package Skeleton

Current implemented files:

```text
packages/k-parent-core/
├── package.json
├── src/
│   ├── index.js
│   ├── freshness.js
│   ├── guardrails.js
│   └── schemas.js
└── test/
```

Responsibilities:

- shared schemas
- source freshness model
- sensitive action taxonomy
- child profile minimum shape
- region and institution id resolver interfaces
- error and fallback model

Required tests:

- schema validation
- stale source formatting
- sensitive-action guard behavior
- no resident registration number or credential fields in public profile schema

## Phase 2: Official Data Adapters

Current implemented files:

```text
packages/k-parent-source-neis/
packages/k-parent-source-childinfo/
packages/k-parent-source-tourapi/
packages/k-parent-source-playground/
packages/k-parent-source-traffic-safety/
packages/k-parent-source-welfare/
packages/k-parent-source-seoul/
packages/k-parent-source-culture/
packages/k-parent-source-library/
packages/k-parent-source-emergency/
```

Adapter rules:

- one source owner per package when possible
- no UI formatting inside source adapters
- return normalized objects plus raw source metadata
- expose freshness and source URL
- fixture tests before live tests
- live tests are opt-in when API keys are required

Initial adapter order:

1. NEIS school resolver.
2. NEIS meal and allergy parser.
3. NEIS school schedule.
4. Kindergarten and childcare disclosure summary.
5. TourAPI event/place lookup.
6. Government24/Bokjiro guidance metadata.

## Phase 3: Briefing and Ranking Logic

Current and future files:

```text
packages/k-parent-brief/
packages/k-parent-source-naver/
packages/k-parent-source-youtube/
docs/research/ranking-and-explanations.md
```

Responsibilities:

- combine official data into parent decision units
- generate recommendation reasons
- separate official facts from community or commercial signals
- handle age, date, distance, weather, cost, and schedule constraints
- emit next-action candidates without side effects

Required tests:

- no affiliate output without purchase intent
- no school ranking mode
- stale source warning included when needed
- recommendation reason exists for each candidate

## Phase 4: Document Capture and Calendar

Current implemented files:

```text
packages/k-parent-doc-extract/
packages/k-parent-calendar/
```

Future candidate files:

```text
python-packages/k-parent-ocr-eval/
```

Responsibilities:

- OCR ingestion abstraction
- extracted event schema
- duplicate detection
- confirmation-required calendar write proposal
- correction loop for user-reviewed OCR fields

Required tests:

- date/time extraction fixtures
- ambiguous date handling
- duplicate event detection
- confirm-before-write guard

## Phase 5: Mobile Product Surface

Future files:

```text
apps/mobile-web/
apps/api/
```

Create only after the core source adapters and daily brief flow are proven.

Product requirements:

- same-origin API calls where possible
- narrow mobile view first
- source and freshness visible
- confirmation UI for side effects
- no raw API-key exposure
- explicit empty, stale, blocked, and failed-source states

## Phase 6: Private Source Workers

Future surfaces:

```text
docs/research/culture-private-source-surface.md
workers/culture-center-monitor/
```

Only start after public-source MVP works. Do not create a `packages/k-parent-source-*`
package for private surfaces until the source boundary, fixtures, tests, and terms review
are clear.

Rules:

- obey terms, robots, and login boundaries
- no full mirroring
- conservative polling
- kill switch per source
- manual review queue for changed layouts
- source freshness and confidence shown to users

## CI and Validation

Keep current checks:

- `./scripts/validate-skills.sh`
- `node --test scripts/skill-docs.test.js`
- `npm run ci`

Future checks:

- package unit tests
- fixture snapshot tests
- source freshness tests
- schema compatibility tests
- mobile browser QA
- stale-data and blocked-source regression tests

## Commit Strategy

Use small, reviewable PRs:

1. docs-only planning
2. core schemas
3. NEIS resolver fixtures
4. NEIS meal adapter
5. daily brief composition
6. first mobile surface

Each implementation PR should include:

- changed scope
- source contract
- fixtures
- tests
- safety impact
- docs update
