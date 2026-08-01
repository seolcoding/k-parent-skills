# k-parent-refresh

Zero-dependency, local-only refresh scheduling for injected K-Parent crawler and
adapter jobs. The module provides process-local timers and status visibility; it
is not a durable queue, distributed scheduler, or production deployment.

## Safety boundary

- A scheduler is created with an explicit job-name allowlist.
- Jobs are injected functions. The service does not load adapters dynamically,
  read credentials, or make network requests by itself.
- Only one run per job can be active. Concurrent manual or timer triggers share
  the existing in-flight promise.
- Status snapshots never retain adapter `data`, raw upstream payloads, raw error
  messages, or URL query strings/fragments. Callers must also avoid putting
  credentials in provenance URL paths.
- Timer failures remain visible in status and through `onFailure`; manual
  `runOnce` calls reject with `RefreshJobError` after retries are exhausted.

## Usage

```js
const { createRefreshScheduler } = require("./src");

const scheduler = createRefreshScheduler({
  allowlist: ["neis-school-info"],
  onFailure(event) {
    // Forward event.failure to local observability. Do not log event.error.cause.
  },
});

scheduler.register("neis-school-info", {
  intervalMs: 60 * 60 * 1000,
  retry: {
    maxAttempts: 4,
    initialDelayMs: 500,
    factor: 2,
    maxDelayMs: 5_000,
  },
  provenance: {
    sourceType: "official",
    sourceName: "NEIS",
    sourceUrl: "https://open.neis.go.kr/",
  },
  async adapter({ attempt, jobName }) {
    const data = await fetchAndNormalizeSchoolInfo({ attempt, jobName });
    return {
      data,
      provenance: data.metadata,
      summary: { itemCount: data.schools.length },
    };
  },
});

const result = await scheduler.runOnce("neis-school-info");
console.log(result.provenance, result.freshness);

scheduler.start("neis-school-info");
console.log(scheduler.getStatus("neis-school-info"));
scheduler.stop("neis-school-info");
```

`start()` and `stop()` without a name apply to every registered job that has an
`intervalMs`. Stopping a timer does not cancel a run already in progress.

## Result contract

A successful `runOnce` resolves to:

```js
{
  ok: true,
  jobName: "neis-school-info",
  attempts: 1,
  startedAt: "2026-08-01T00:00:00.000Z",
  completedAt: "2026-08-01T00:00:00.000Z",
  durationMs: 0,
  provenance: {
    sourceType: "official",
    sourceName: "NEIS",
    sourceUrl: "https://open.neis.go.kr/",
    fetchedAt: "2026-08-01T00:00:00.000Z",
    confirmedAt: "2026-08-01T00:00:00.000Z",
    updatedAt: null
  },
  freshness: {
    status: "fresh",
    checkedAt: "2026-08-01T00:00:00.000Z",
    ageHours: 0,
    maxAgeHours: 24
  },
  summary: { itemCount: 1 },
  data: []
}
```

The adapter may return `{ data, provenance, freshness, summary }`. For
compatibility with existing source packages, provenance can also come from
`source`, `metadata.source`, or `metadata`. If no `data` property is present,
the adapter return value itself becomes `data`. Only the numeric summary fields
`itemCount`, `addedCount`, `updatedCount`, `removedCount`, and `skippedCount`
are copied into status.

`provenance.sourceUrl` is normalized by removing credentials, query strings,
and fragments. Freshness is normalized to `fresh`, `stale`, `lag-prone`, or
`unknown`; when the adapter omits it, the scheduler derives it from the checked
timestamp and `maxAgeHours`.

## Deterministic tests

The clock, sleep function, and interval functions can be injected:

```js
createRefreshScheduler({
  allowlist: ["fixture-job"],
  clock: () => new Date("2026-08-01T00:00:00.000Z"),
  sleep: async (delayMs, context) => {},
  setInterval: (callback, intervalMs) => fakeHandle,
  clearInterval: (handle) => {},
});
```

The default suite is fixture-only and uses fake adapters; it performs no
network access.

```bash
npm run lint --prefix services/k-parent-refresh
npm test --prefix services/k-parent-refresh
```
