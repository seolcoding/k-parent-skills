# Artifact layer taxonomy

Every SSOT artifact resolves to one layer. A registry declares `defaultLayer`;
individual items use `layer` only when they differ from that default.

| Layer | Ownership |
| --- | --- |
| `experience` | User-facing apps and product surfaces |
| `skill` | Intent routing and procedural workflows |
| `policy` | HITL, consent, risk, guardrails, freshness policy |
| `memory` | Ephemeral context, opaque profile references, public caches, approval audit |
| `tool` | Agent/app-callable operations, crawlers, probes, proxy routes |
| `domain` | Pure parent-domain composition, extraction, calendar, quiz logic |
| `adapter` | External API contracts and response normalization |
| `data` | Fixtures, datasets, generated banks, raw-output metadata |
| `governance` | Cross-artifact SSOT and repository policy |
| `runtime` | Hosting composition, API process, workers, queues, and scheduled jobs |
| `archive` | Historical, archived, and adjacent evidence |

Layer is independent from `kind`, `maturity`, `verification`, and `deployment`.
For example, a proxy is a product-kind artifact in the tool layer, and a live
API is an API-kind artifact in the adapter layer.

The dependency direction and behavioral rules are documented in
`docs/layers.md`.
