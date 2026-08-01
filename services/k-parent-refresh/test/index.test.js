"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fixture = require("./fixtures/adapter-result.json");

const {
  RefreshJobError,
  calculateRetryDelay,
  createRefreshScheduler,
  sanitizeSourceUrl,
} = require("../src");

function cloneFixture() {
  return JSON.parse(JSON.stringify(fixture));
}

test("registration is constrained by a required explicit allowlist", () => {
  assert.throws(() => createRefreshScheduler(), /allowlist/);
  assert.throws(
    () => createRefreshScheduler({ allowlist: ["UPPERCASE"] }),
    /jobName/
  );

  const scheduler = createRefreshScheduler({ allowlist: ["fixture-job"] });
  assert.throws(
    () => scheduler.register("other-job", { adapter: async () => ({}) }),
    /allowlist/
  );
  assert.throws(
    () => scheduler.register("fixture-job", {}),
    /adapter function/
  );

  scheduler.register("fixture-job", { adapter: async () => cloneFixture() });
  assert.throws(
    () => scheduler.register("fixture-job", { adapter: async () => cloneFixture() }),
    /already registered/
  );
});

test("runOnce returns normalized provenance and freshness around fixture data", async () => {
  const scheduler = createRefreshScheduler({
    allowlist: ["fixture-job"],
    clock: () => new Date("2026-08-01T02:00:00.000Z"),
  });
  scheduler.register("fixture-job", {
    adapter: async () => cloneFixture(),
    maxAgeHours: 6,
  });

  const result = await scheduler.runOnce("fixture-job");
  assert.equal(result.ok, true);
  assert.equal(result.data.length, 2);
  assert.equal(result.provenance.sourceName, "Fixture Education API");
  assert.equal(result.provenance.sourceUrl, "https://api.example.test/schools");
  assert.deepEqual(result.freshness, {
    status: "fresh",
    checkedAt: "2026-08-01T00:00:00.000Z",
    ageHours: 2,
    maxAgeHours: 6,
  });
  assert.deepEqual(result.summary, { itemCount: 2, addedCount: 1 });
});

test("status snapshots retain metadata but never adapter data or unknown summary fields", async () => {
  const scheduler = createRefreshScheduler({
    allowlist: ["fixture-job"],
    clock: () => new Date("2026-08-01T02:00:00.000Z"),
  });
  scheduler.register("fixture-job", { adapter: async () => cloneFixture() });
  await scheduler.runOnce("fixture-job");

  const status = scheduler.getStatus("fixture-job");
  assert.equal(status.status, "succeeded");
  assert.equal(status.lastResult.data, undefined);
  assert.deepEqual(status.lastResult.summary, { itemCount: 2, addedCount: 1 });

  const serialized = JSON.stringify(status);
  assert.doesNotMatch(serialized, /Fixture Elementary School/);
  assert.doesNotMatch(serialized, /fixture-secret/);
  assert.doesNotMatch(serialized, /must-not-enter-status/);

  status.totals.runs = 999;
  status.lastResult.summary.itemCount = 999;
  const freshSnapshot = scheduler.getStatus("fixture-job");
  assert.equal(freshSnapshot.totals.runs, 1);
  assert.equal(freshSnapshot.lastResult.summary.itemCount, 2);
});

test("retry delays grow exponentially and stop at the configured cap", async () => {
  const delays = [];
  let attempts = 0;
  const scheduler = createRefreshScheduler({
    allowlist: ["retry-job"],
    clock: () => new Date("2026-08-01T00:00:00.000Z"),
    sleep: async (delayMs, context) => {
      delays.push({ delayMs, context });
    },
  });
  scheduler.register("retry-job", {
    adapter: async () => {
      attempts += 1;
      if (attempts < 5) throw new Error("fixture failure");
      return cloneFixture();
    },
    retry: {
      maxAttempts: 5,
      initialDelayMs: 10,
      factor: 2,
      maxDelayMs: 25,
    },
  });

  const result = await scheduler.runOnce("retry-job");
  assert.equal(result.attempts, 5);
  assert.deepEqual(delays.map((entry) => entry.delayMs), [10, 20, 25, 25]);
  assert.deepEqual(delays.map((entry) => entry.context.nextAttempt), [2, 3, 4, 5]);
  assert.equal(scheduler.getStatus("retry-job").totals.retries, 4);
});

test("calculateRetryDelay caps even when the initial delay exceeds the cap", () => {
  assert.equal(calculateRetryDelay({ initialDelayMs: 100, factor: 3, maxDelayMs: 20 }, 1), 20);
  assert.equal(calculateRetryDelay({ initialDelayMs: 10, factor: 3, maxDelayMs: 20 }, 3), 20);
});

test("concurrent triggers share one in-flight adapter run", async () => {
  let adapterCalls = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const scheduler = createRefreshScheduler({ allowlist: ["slow-job"] });
  scheduler.register("slow-job", {
    adapter: async () => {
      adapterCalls += 1;
      await gate;
      return cloneFixture();
    },
  });

  const first = scheduler.runOnce("slow-job");
  const second = scheduler.runOnce("slow-job");
  assert.strictEqual(second, first);
  assert.equal(adapterCalls, 1);
  assert.equal(scheduler.getStatus("slow-job").totals.overlapsPrevented, 1);

  release();
  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.strictEqual(firstResult, secondResult);
  assert.equal(scheduler.getStatus("slow-job").totals.runs, 1);
});

test("exhausted retries reject visibly while status redacts the raw error", async () => {
  const failureEvents = [];
  const secret = "token=fixture-super-secret";
  const scheduler = createRefreshScheduler({
    allowlist: ["failure-job"],
    clock: () => new Date("2026-08-01T00:00:00.000Z"),
    onFailure: (event) => failureEvents.push(event),
    sleep: async () => {},
  });
  scheduler.register("failure-job", {
    adapter: async () => {
      const error = new Error(`upstream rejected ${secret}`);
      error.code = "UPSTREAM_UNAVAILABLE";
      throw error;
    },
    retry: { maxAttempts: 2, initialDelayMs: 0 },
  });

  await assert.rejects(
    scheduler.runOnce("failure-job"),
    (error) => {
      assert.ok(error instanceof RefreshJobError);
      assert.equal(error.code, "REFRESH_JOB_FAILED");
      assert.equal(error.failure.attempts, 2);
      assert.equal(error.cause.code, "UPSTREAM_UNAVAILABLE");
      return true;
    }
  );

  const status = scheduler.getStatus("failure-job");
  assert.equal(status.status, "failed");
  assert.equal(status.totals.failures, 1);
  assert.deepEqual(status.lastFailure.error, {
    name: "Error",
    code: "UPSTREAM_UNAVAILABLE",
  });
  assert.equal(failureEvents.length, 1);
  assert.equal(failureEvents[0].failure.error.code, "UPSTREAM_UNAVAILABLE");
  assert.equal(failureEvents[0].status.running, false);
  assert.doesNotMatch(JSON.stringify(status), /fixture-super-secret/);
  assert.doesNotMatch(JSON.stringify(failureEvents[0].failure), /fixture-super-secret/);
});

test("start and stop manage optional process-local timers without overlap", async () => {
  const timers = [];
  const cleared = [];
  let adapterCalls = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const scheduler = createRefreshScheduler({
    allowlist: ["timer-job", "manual-job"],
    clock: () => new Date("2026-08-01T00:00:00.000Z"),
    setInterval(callback, intervalMs) {
      const handle = { callback, intervalMs };
      timers.push(handle);
      return handle;
    },
    clearInterval(handle) {
      cleared.push(handle);
    },
  });
  scheduler.register("timer-job", {
    intervalMs: 5_000,
    adapter: async () => {
      adapterCalls += 1;
      await gate;
      return cloneFixture();
    },
  });
  scheduler.register("manual-job", { adapter: async () => cloneFixture() });

  scheduler.start();
  assert.equal(timers.length, 1);
  assert.equal(timers[0].intervalMs, 5_000);
  assert.equal(scheduler.getStatus("timer-job").scheduled, true);
  assert.equal(scheduler.getStatus("manual-job").scheduled, false);
  assert.equal(scheduler.getStatus("timer-job").nextRunAt, "2026-08-01T00:00:05.000Z");

  timers[0].callback();
  timers[0].callback();
  assert.equal(adapterCalls, 1);
  assert.equal(scheduler.getStatus("timer-job").totals.overlapsPrevented, 1);

  release();
  await new Promise((resolve) => setImmediate(resolve));
  scheduler.stop("timer-job");
  assert.equal(cleared.length, 1);
  assert.equal(scheduler.getStatus("timer-job").scheduled, false);
  assert.equal(scheduler.getStatus("timer-job").nextRunAt, null);
  assert.throws(() => scheduler.start("manual-job"), /intervalMs/);
});

test("source URL sanitization rejects non-web URLs and strips credentials and queries", () => {
  assert.equal(sanitizeSourceUrl("not-a-url"), null);
  assert.equal(sanitizeSourceUrl("file:///tmp/fixture"), null);
  assert.equal(
    sanitizeSourceUrl("https://user:password@example.test/path?apiKey=secret#hash"),
    "https://example.test/path"
  );
});
