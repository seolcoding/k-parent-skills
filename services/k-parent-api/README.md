# k-parent-api

Local-first server runtime for K-Parent Skills architecture experiments.

Implemented surfaces:

- `GET /health`
- `POST /v1/actions`
- `GET /v1/actions/:id`
- `POST /v1/actions/:id/decision`
- `POST /v1/memory/session`
- `GET /v1/memory/session/:key`

The server stores data only in process memory and deliberately has no action
execution endpoint. Every `/v1/actions` and `/v1/memory` request requires a
Bearer token; `/health` remains public. Actions, approval audit records, and
session memory use token-resolved tenant namespaces, and cross-tenant reads or
decisions return `404`. Action IDs are server-generated even when a client
supplies one. The memory store receives only the minimal approval-audit envelope
(digests and decision metadata), never the action label or approved scope.

Configure a JSON object whose keys are bearer tokens and whose values are safe,
opaque tenant IDs. Credentials are digested in the resolver and are never
included in responses or startup logs:

```bash
KPARENT_API_TOKEN_TENANTS='{"replace-with-local-token":"family-local"}' \
  npm start --prefix services/k-parent-api
```

Default address: `http://127.0.0.1:4030`. This remains a loopback-only,
ephemeral prototype; authentication and namespace isolation do not constitute a
production deployment claim.
