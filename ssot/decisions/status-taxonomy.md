# Status taxonomy

SSOT items use separate maturity, verification, and deployment axes. They must
not be collapsed into a single `status` label.

## Maturity

| Value | Meaning |
| --- | --- |
| `concept` | Workflow or product idea without a reusable implementation boundary |
| `research` | Evidence, design, or specification exists but is not a product implementation |
| `prototype` | A demonstrable implementation exists with material product gaps |
| `implemented` | Reusable code or a complete workflow contract exists |
| `operational` | Used as an ongoing collection or runtime surface |
| `archived` | Preserved but intentionally inactive |
| `historical` | Known only through Git history, manifests, or other evidence |

## Verification

| Value | Meaning |
| --- | --- |
| `undocumented` | No trustworthy verification record found |
| `documented` | Reviewed documentation or metadata only |
| `fixture-tested` | Request/normalization behavior passed against offline fixtures |
| `offline-tested` | Deterministic logic or app behavior passed local tests |
| `live-probed` | A real upstream or live surface was probed successfully on the recorded date |
| `production-verified` | The deployed production surface was canary-verified on the recorded date |

## Deployment

| Value | Meaning |
| --- | --- |
| `not-applicable` | Data, library, or research artifact has no independent deployment |
| `repo-only` | Present in the repository but not installed or distributed globally |
| `local-only` | Runnable on this machine without a confirmed remote deployment |
| `not-deployed` | Explicitly not deployed |
| `deployment-unverified` | A deployment is described, but the current revision was not canary-verified |
| `deployed` | Current revision is deployed and has production evidence |
| `archived` | Historical deployment or deliverable is inactive |

Any move to `live-probed`, `production-verified`, or `deployed` must update
`lastVerified` and include an evidence path or note in the same registry entry.
