# K-Parent SSOT

`ssot/` is the machine-readable inventory and status source of truth for the
K-Parent ecosystem. It does not copy application code, large crawl outputs,
videos, private documents, or archived repositories into this directory.
Instead, it records where the canonical artifact lives, how mature it is, how
it was verified, and whether it is actually deployed.

## Authority boundaries

- `ssot/registry/*.json` is authoritative for cross-artifact identity,
  canonical paths, maturity, verification, deployment, and relationships.
- `skills/*/SKILL.md` remains authoritative for agent routing and workflow
  behavior.
- `packages/*`, `apps/*`, `services/*`, `scripts/*`, and `tools/*` remain
  authoritative for implementation and runtime contracts.
- `docs/features/*` remains the detailed human-facing explanation layer.
- `ssot/INDEX.md` is generated from the registries and must not be edited by hand.

When these surfaces disagree, fix the implementation or behavioral source
first, then update the corresponding registry entry and regenerate the index.

## Registry layout

| Registry | Scope |
| --- | --- |
| `skills.json` | Parent-facing installable skills and their backing packages |
| `packages.json` | Reusable logic and source-adapter packages |
| `apis.json` | External APIs and hosted/self-hosted proxy contracts |
| `crawlers.json` | Crawlers, probes, collection runners, and catalog tooling |
| `datasets.json` | Public, synthetic, fixture, and generated data artifacts |
| `products.json` | Apps, proxy surfaces, collections, and development tools |
| `legacy.json` | Historical, archived, adjacent, and predecessor artifacts |

Machine-specific archives and private documents use redacted `local://`
identifiers with `tracking: "local-pointer"`. Their actual paths belong only in
the gitignored `ssot/local/paths.json`; see `ssot/local/README.md`. Public
registries and the generated index must never expose home-directory paths.

Every registry item separates three dimensions:

- `maturity`: how much product or implementation exists;
- `verification`: what has actually been tested or probed;
- `deployment`: where, if anywhere, the artifact is available.

Do not infer one dimension from another. An implemented, offline-tested item
may still be `repo-only` or `deployment-unverified`.

Every registry also declares `defaultLayer`; items override `layer` only when
needed. Layer describes architectural ownership and remains independent from
kind and status. See `decisions/layer-model.md` and `docs/layers.md`.

## Update workflow

1. Edit the relevant registry JSON and the artifact's real source document or
   implementation in the same change.
2. Run `npm run ssot:validate`.
3. Run `npm run ssot:generate` to refresh `ssot/INDEX.md`.
4. Run `npm run ssot:check` and the focused tests for the changed artifact.
5. Commit the registry, generated index, and implementation/docs together.

The full repository gate (`npm run ci`) includes `ssot:check`.

## Data policy

- Large raw outputs under `tmp/` remain ignored. Record their schema, count,
  size, provenance, and rendered tracked report instead of committing them.
- Archived binaries and external documents remain at their canonical archive
  location. Store metadata and a pointer only.
- Never put credentials, auth/session state, raw personal conversations,
  student records, or child-identifying data in the registries.
- Actual family conversations are not a default fixture source. Use synthetic
  cases for dialogue tests.

See `decisions/` for the status vocabulary, canonical-path rules, and retention
policy.
