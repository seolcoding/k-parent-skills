# Tool layer

`tools/*` contains repository-scoped agent/app-callable development tools.
Operator probes and crawlers live in `scripts/*`; reusable domain and adapter
libraries live in `packages/*`.

A tool must:

- accept explicit normalized input and return structured output;
- be read-only by default;
- require a scoped approved HITL request before any external side effect;
- never persist credentials, raw child data, or private family conversations;
- expose deterministic tests or an offline verification path;
- report source provenance and failure state instead of guessing.

Current tool: `quiz-dev-mcp`, a local read-only MCP surface for curriculum and
quiz development. It is not a user-facing product or a production deployment.
