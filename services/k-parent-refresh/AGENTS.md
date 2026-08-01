# k-parent-refresh service instructions

- This is a zero-dependency, local runtime module. It schedules injected crawler
  and adapter functions but does not own adapter implementations or credentials.
- Register only explicitly allowlisted job names. Do not add dynamic module
  loading, user-supplied code execution, or a public control plane.
- Keep status snapshots metadata-only: never retain adapter data, raw upstream
  payloads, credential-bearing URLs, or raw error messages.
- Default tests must use local fixtures and fake adapters only. Do not add network
  calls to the test suite.
- Timers are process-local and best-effort. Do not describe this module as a
  durable queue, distributed scheduler, or production deployment.
- Run `npm run lint --prefix services/k-parent-refresh` and
  `npm test --prefix services/k-parent-refresh` after changes.
