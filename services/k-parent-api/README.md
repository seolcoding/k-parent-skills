# k-parent-api

Local-first server runtime for K-Parent Skills architecture experiments.

Implemented surfaces:

- `GET /health`
- `POST /v1/actions`
- `GET /v1/actions/:id`
- `POST /v1/actions/:id/decision`
- `POST /v1/memory/session`
- `GET /v1/memory/session/:key`

The server deliberately has no action execution endpoint. Every `/v1/actions`
and `/v1/memory` request requires a Bearer token; `/health` remains public.
Actions, approval audit records, and session memory use token-resolved tenant
namespaces, and cross-tenant reads or decisions return `404`. Action IDs are
server-generated even when a client supplies one. The memory store receives
only the minimal approval-audit envelope (digests and decision metadata), never
the action label or approved scope. Error payloads pass through the shared
redaction boundary before they reach a client.

Configure a JSON object whose keys are bearer tokens and whose values are safe,
opaque tenant IDs. Credentials are digested in the resolver and are never
included in responses or startup logs:

```bash
KPARENT_API_TOKEN_TENANTS='{"replace-with-local-token":"family-local"}' \
  npm start --prefix services/k-parent-api
```

Memory remains process-local and ephemeral by default. For opt-in encrypted
local persistence, set an explicit path and an independently managed 32-byte
key encoded as standard Base64. Both variables are required together; the key
is never written to the memory file or logged.

```bash
KPARENT_API_TOKEN_TENANTS='{"replace-with-local-token":"family-local"}' \
KPARENT_MEMORY_FILE='./.local/k-parent-memory.enc.json' \
KPARENT_MEMORY_KEY_BASE64='replace-with-base64-encoded-32-byte-key' \
  npm start --prefix services/k-parent-api
```

The encrypted adapter uses AES-256-GCM, atomic `0600` file replacement,
tenant/namespace separation, TTL cleanup, namespace export/delete, and consent
revocation. Action request state itself remains in process memory, and this
adapter is not a database, backup system, or production deployment.

Default address: `http://127.0.0.1:4030`. This remains a loopback-only,
local-only prototype; authentication, namespace isolation, and encrypted local
persistence do not constitute a production deployment claim.
