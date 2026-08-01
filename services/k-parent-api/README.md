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
execution endpoint. It is `prototype/local-only`: no authentication, persistent
database, tenant isolation, scheduler, or production deployment is claimed.

```bash
npm start --prefix services/k-parent-api
```

Default address: `http://127.0.0.1:4030`. Non-loopback binding is rejected until
authentication exists.
