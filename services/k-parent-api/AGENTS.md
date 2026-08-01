# k-parent-api service instructions

- This is a local-first runtime prototype, not a production deployment.
- Bind to `127.0.0.1` by default. Do not expose it publicly without authentication,
  tenant isolation, encrypted persistence, rate limiting, and deployment review.
- The service may create and decide HITL requests but must not execute external
  side effects.
- Memory is process-local and ephemeral by default. Optional encrypted local-file
  persistence must require an injected key and explicit path, remain tenant-scoped,
  and must not be described as a production database.
- Never add raw credentials, child identity data, or private family conversations
  to request bodies, logs, or fixtures.
- Run `npm test --prefix services/k-parent-api` after changes.
