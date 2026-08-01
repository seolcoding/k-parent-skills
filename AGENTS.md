# k-parent-skills repository instructions

This repository inherits the broader oh-my-codex guidance from the parent environment.
These rules are repo-specific and apply to everything under this directory.

## Repository concept

- This repository inherits the operating pattern of `NomaDamas/k-skill`: product skill folders under `skills/*`, optional implementation packages under `packages/*`, shared scripts under `scripts/`, and feature docs under `docs/features/*`.
- Keep the repository concept as `k-parent-skills`: a 대한민국 부모 생활정보 skill collection.
- Keep generic Korean-life products in upstream `k-skill`; do not copy `examples/*` or unrelated packages into this repository.
- Do not flatten the repository into a single app. Each parent-facing capability should remain an independently installable skill directory with its own `SKILL.md` under `skills/`.
- Start new parent capabilities as `SKILL.md`-only concept docs unless deterministic code is clearly needed.
- Promote a concept doc to `packages/*` or `scripts/*` only after the repeated workflow and source surface are clear.

## Architecture conventions

- Follow `docs/layers.md`: Experience → Skill → Policy/HITL → Memory → Tool → Domain → Adapter → Data; `services/` is Runtime and `ssot/` is cross-cutting Governance.
- Do not let adapters own routing, tools invent approval, or skills bypass the HITL layer for side effects.

- Every skill lives under `skills/<skill-name>/SKILL.md`; the frontmatter `name` must match the directory name. `skills/` is the canonical container the installer resolves with `--skill <name>`.
- Detailed user/developer docs live in `docs/features/<skill-name>.md`.
- Node implementations live in `packages/<skill-name>` and are called from the skill folder.
- Small deterministic Python or shell helpers live in `scripts/` or `<skill-name>/scripts/` depending on whether they are shared or skill-specific.
- Parent app API aggregation uses `k-parent-proxy`: parent-only read routes, narrow allowlists, cache/rate-limit where useful, and no user-side API key exposure.
- `apps/<app-name>` holds product surfaces (e.g. the Flutter quiz app) that consume skill/package assets. Apps live outside npm workspaces and `npm run ci`; they carry their own gates in a nested `AGENTS.md`. This coexists with the "do not flatten" rule — the skill collection stays the core.
- `tools/<tool-name>` holds repo development tooling (e.g. the quiz-dev MCP server) outside npm workspaces, with zero or minimal dependencies.
- Parent-specific outputs should normalize around: child age/grade, region, date range, source URL, deadline, cost, required documents, reservation/application status, and confirmation date.

## Agent context conventions

- Treat `README.md`, `AGENTS.md`, `ssot/README.md`, `docs/architecture.md`, and `docs/adding-a-skill.md` as the durable context set for future repository agents.
- Keep `CLAUDE.md` as a compatibility symlink to `AGENTS.md`; do not maintain a separate Claude-only instruction file.
- Use `docs/productization-gstack.md` when work shifts from skill design to app surfaces, QA, deployment, commercialization, or affiliate funnel decisions.
- When adding or changing a skill, update all relevant context surfaces in the same change: `SKILL.md`, `docs/features/<skill-name>.md`, `README.md`, and `docs/roadmap.md` when scope changes.
- When artifact identity, canonical location, maturity, verification, deployment, or relationships change, update `ssot/registry/*.json`, regenerate `ssot/INDEX.md`, and run `npm run ssot:check` in the same change.
- Preserve the original k-skill operational conventions unless they conflict with the parent-specific concept.
- Do not execute login, application submission, cancellation, payment, or child-personal-data entry without explicit user approval.
- Route every external side effect through `packages/k-parent-core/src/hitl.js`; approvals are scoped, expiring, one-time, and must never persist credentials or raw child data.
- Use `packages/k-parent-memory` for bounded memory contracts. Store only ephemeral context, opaque user-store references, public knowledge cache, and approval audit; never raw family dialogue, credentials, or child identity fields.
- Keep hosting composition in `services/*`. A local prototype must not be described as deployed until authentication, tenant isolation, durable storage controls, observability, and production evidence exist.
- For child-related facts, prefer current official/public sources and include the confirmation date. Do not answer from stale cached snippets when schedules, admissions, events, or application deadlines may have changed.

## SKILL.md authoring rules

- Frontmatter `description` is the first routing signal, so write it in Korean for parent-facing skills.
- Include 2-3 realistic Korean user trigger examples in the description.
- If sibling skills overlap, include a boundary sentence that explains when to use each one.
- If a skill has deterministic package support, document package names, functions, and env vars in a `## 데이터 소스` section.
- Keep long code tables, field maps, and policy tables in `skills/<skill>/references/*.md` instead of the main `SKILL.md`.
- Update `docs/skill-routing.md` when adding or changing skill routing or overlap rules.
- `scripts/skill-docs.test.js` enforces the parent skill authoring contract in CI.

## gstack productization

- Use `docs/productization-gstack.md` as the standing plan for turning skill concepts into product surfaces.
- When a web/app surface exists, dogfood the actual parent workflow before claiming it works: upload/import, OCR review, calendar candidate creation, shopping disclosure, and mobile layout.
- Keep product screens, skill docs, schemas, and roadmap changes aligned in the same change.

## Release automation rules

- Node packages live under `packages/*` and use npm workspaces.
- Release automation is intentionally disabled for now. This repository is currently a parent-skill concept/workflow repo, not a package publishing repo.
- Do not add push-triggered release workflows until there is a real package to publish and the publishing target is confirmed.
- If npm publishing becomes real later, reintroduce Changesets and a release workflow in the same PR as the first publishable package decision.
- If Python publishing becomes real later, add `python-packages/<package-name>/pyproject.toml`, release-please config, and a top-level PyPI publish job together.
- Prefer trusted publishing via OIDC for npm and PyPI when available. Do not introduce long-lived registry tokens unless trusted publishing is unavailable.

## Verification rules

- For release or packaging changes, run `npm run ci`.
- The root TypeScript gate incrementally checks the parent safety boundary (`k-parent-core` HITL, `k-parent-memory`, and `k-parent-api`). Syntax and tests cover the remaining inherited JavaScript until packages are typed deliberately.
- Keep release docs, workflow files, and package metadata aligned in the same change.

## Testing anti-patterns

- **Never write tests that assert `.changeset/*.md` files exist.** Changesets are consumed (deleted) by `changeset version` during the release flow. Any test guarding changeset file presence will break CI on the version-bump commit and block the release pipeline.

## Development skill install rules

- When testing or developing skills from this repository, install or sync the current skill directories into the user's home-directory global skill locations first.
- Use `~/.claude/skills/<skill-name>` for Claude Code and `~/.agents/skills/<skill-name>` for agents-compatible home installs.
- Respect existing home-directory indirection such as symlinks when syncing `~/.agents/skills`.
- Skill **installation** for testing stays in the home-directory locations above — do not use repo-local directories as a skill install target.
- Repo-local `.claude/agents/`, `.claude/skills/`, `.mcp.json`, and `tools/` are committed **development infrastructure** for this repository's own build loops (owner request, 2026-07). They are strictly repo-scoped: never sync them into home directories, and never point them at files outside this repository.

## Free API proxy policy

- The built-in `k-parent-proxy` is for **free APIs only**.
- Default posture is loopback/local or explicitly managed self-hosting; no public hosted endpoint is claimed.
- Keep free-API proxy surfaces narrow, read-only, allowlisted, cache-backed, and rate-limited before any public exposure.
- A future public deployment requires abuse controls, managed secrets, authentication or an explicitly reviewed anonymous-access policy, observability, and live canary evidence.

## Proxy server development

- 현재 proxy는 local/self-host only이며 공개 hosted endpoint를 주장하지 않는다.
- 운영 승격 전에는 rate limit, managed secret, 관측성, deploy pipeline, live canary evidence를 갖춘다.
- proxy 서버 코드: `packages/k-parent-proxy/src/server.js`
- proxy 서버 테스트: `packages/k-parent-proxy/test/server.test.js`
- proxy 환경변수(API key 등)는 `~/.config/k-parent-skills/secrets.env` 또는 환경별 secret store에 넣고, 실행 스크립트에서 source한다. 기존 단수 경로는 읽기 호환만 제공한다.
- 로컬 테스트는 `node packages/k-parent-proxy/src/server.js`로 직접 실행한다.
