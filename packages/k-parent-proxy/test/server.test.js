const test = require("node:test");
const assert = require("node:assert/strict");
const { createKParentProxyServer, safeErrorMessage } = require("../src/server");

function fixtureEnvelope(dataset, rows) {
  return { [dataset]: [{ head: [{ list_total_count: rows.length }] }, { row: rows }] };
}

function fixtureAdapter(calls) {
  const real = require("k-parent-source-neis");
  return {
    ...real,
    async searchSchools() {
      calls.push("schoolInfo");
      return { ok: true, schools: [{ atptOfcdcScCode: "B10", schoolCode: "7010001", name: "미래초등학교", schoolLevel: "초등학교", address: "서울" }] };
    },
    async getTimetable() {
      calls.push("elsTimetable");
      return { timetable: [{ date: "2026-08-01", period: 1, subject: "수학", grade: "3", className: "2" }] };
    },
    async requestNeisJson(dataset) {
      calls.push(dataset);
      if (dataset === "classInfo") return fixtureEnvelope(dataset, [{ AY: "2026", GRADE: "3", CLASS_NM: "2" }]);
      return fixtureEnvelope(dataset, [{ AA_YMD: "20260801", EVENT_NM: "여름방학", SBTR_DD_SC_NM: "휴업일" }]);
    },
  };
}

async function withServer(options, run) {
  const server = createKParentProxyServer(options);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("health is public but reports missing NEIS configuration", async () => {
  await withServer({ apiKey: "" }, async (baseUrl) => {
    const health = await (await fetch(`${baseUrl}/health`)).json();
    assert.equal(health.readOnly, true);
    assert.equal(health.neisConfigured, false);
    assert.equal(health.capabilities.routePrefix, "/v1/neis");
    assert.deepEqual(health.capabilities.methods, ["GET"]);
    assert.equal(health.capabilities.cache.kind, "process-memory");
    assert.equal(health.capabilities.rateLimit.retryAfter, true);
    assert.equal(health.capabilities.upstream.provider, "NEIS");
    assert.equal(health.deployment.productionReady, false);
    assert.equal((await fetch(`${baseUrl}/v1/neis/school-search?schoolName=x`)).status, 503);
  });
});

test("error payload helper redacts credential-bearing diagnostics", () => {
  assert.equal(
    safeErrorMessage(new Error("Bearer example-upstream-token"), "The upstream request failed."),
    "The upstream request failed.",
  );
});

test("parent-only routes normalize schools, classes, timetable, and schedule", async () => {
  const calls = [];
  await withServer({ apiKey: "fixture-key", adapter: fixtureAdapter(calls) }, async (baseUrl) => {
    const school = await (await fetch(`${baseUrl}/v1/neis/school-search?educationOfficeCode=B10&schoolName=미래`)).json();
    assert.equal(school.rows[0].school_name, "미래초등학교");

    const classes = await (await fetch(`${baseUrl}/v1/neis/classes?educationOfficeCode=B10&schoolCode=7010001`)).json();
    assert.equal(classes.rows[0].class_nm, "2");

    const timetableUrl = `${baseUrl}/v1/neis/timetable?educationOfficeCode=B10&schoolCode=7010001&date=20260801&grade=3&classNm=2`;
    assert.equal((await (await fetch(timetableUrl)).json()).rows[0].subject, "수학");
    assert.equal((await (await fetch(timetableUrl)).json()).cache.hit, true);

    const schedule = await (await fetch(`${baseUrl}/v1/neis/schedule?educationOfficeCode=B10&schoolCode=7010001&from=20260801`)).json();
    assert.equal(schedule.rows[0].day_off, true);
  });
  assert.equal(calls.filter((call) => call === "elsTimetable").length, 1);
});

test("academies route returns parent fields from NEIS acaInsTiInfo without client keys", async () => {
  const real = require("k-parent-source-neis");
  const academyPayload = require("../../k-parent-source-neis/test/fixtures/academy.json");
  const received = [];
  const adapter = {
    ...real,
    async searchAcademies(options) {
      received.push(options);
      return real.searchAcademies({ ...options, payload: academyPayload });
    },
  };

  await withServer({ apiKey: "fixture-key", adapter }, async (baseUrl) => {
    const body = await (await fetch(`${baseUrl}/v1/neis/academies?educationOffice=서울&district=강남구&academyName=수학&pageSize=500`)).json();
    assert.equal(body.total_count, 514);
    assert.equal(body.rows.length, 5);
    const ig = body.rows.find((row) => row.name === "IG수학교습소");
    assert.deepEqual(ig.tuition.map((item) => item.amount_krw), [540000, 800000, 400000]);
    assert.equal(ig.on_leave_today, false);
    assert.equal(body.rows.find((row) => row.name === "BT수학전문수학교습소").telephone, null);
    assert.equal(JSON.stringify(body).includes("fixture-key"), false);

    assert.equal((await fetch(`${baseUrl}/v1/neis/academies?district=강남구`)).status, 400);
    assert.equal((await fetch(`${baseUrl}/v1/neis/academies?educationOfficeCode=B10`)).status, 400);
  });

  assert.equal(received[0].pageSize, 100);
  assert.equal(received[0].allowKeyless, false);
});

test("proxy rejects invalid or non-allowlisted routes", async () => {
  await withServer({ apiKey: "fixture-key", adapter: fixtureAdapter([]) }, async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/v1/korean-stock/search?q=x`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/v1/neis/timetable?educationOfficeCode=B10`)).status, 400);
    const invalidDate = `${baseUrl}/v1/neis/timetable?educationOfficeCode=B10&schoolCode=7010001&date=20260231`;
    assert.equal((await fetch(invalidDate)).status, 400);
    const reversedRange = `${baseUrl}/v1/neis/schedule?educationOfficeCode=B10&schoolCode=7010001&from=20260802&to=20260801`;
    assert.equal((await fetch(reversedRange)).status, 400);
    assert.equal((await fetch(`${baseUrl}/v1/neis/timetable`, { method: "POST" })).status, 405);
  });
});

test("rate limiting is per client and sends Retry-After on 429", async () => {
  let currentTime = new Date("2026-08-01T00:00:00.000Z");
  await withServer({
    apiKey: "fixture-key",
    adapter: fixtureAdapter([]),
    getClientId: (request) => request.headers["x-test-client"],
    now: () => currentTime,
    rateLimitMaxRequests: 2,
    rateLimitWindowMs: 2_000,
  }, async (baseUrl) => {
    const url = `${baseUrl}/v1/neis/school-search?schoolName=미래`;
    const clientA = { headers: { "x-test-client": "client-a" } };
    assert.equal((await fetch(url, clientA)).status, 200);
    assert.equal((await fetch(url, clientA)).status, 200);

    const limited = await fetch(url, clientA);
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("retry-after"), "2");
    assert.equal((await limited.json()).error, "rate_limited");
    assert.equal((await fetch(url, { headers: { "x-test-client": "client-b" } })).status, 200);

    currentTime = new Date("2026-08-01T00:00:02.000Z");
    assert.equal((await fetch(url, clientA)).status, 200);
  });
});

test("rate limiter bounds tracked clients with least-recently-used eviction", async () => {
  await withServer({
    apiKey: "fixture-key",
    adapter: fixtureAdapter([]),
    getClientId: (request) => request.headers["x-test-client"],
    now: () => new Date("2026-08-01T00:00:00.000Z"),
    rateLimitMaxClients: 2,
    rateLimitMaxRequests: 1,
  }, async (baseUrl) => {
    const url = `${baseUrl}/v1/neis/school-search?schoolName=미래`;
    const requestAs = (clientId) => fetch(url, { headers: { "x-test-client": clientId } });
    assert.equal((await requestAs("client-a")).status, 200);
    assert.equal((await requestAs("client-a")).status, 429);
    assert.equal((await requestAs("client-b")).status, 200);
    assert.equal((await requestAs("client-c")).status, 200);
    assert.equal((await requestAs("client-a")).status, 200);
  });
});

test("retryable upstream failures use capped injected backoff", async () => {
  const calls = [];
  const backoffs = [];
  const adapter = fixtureAdapter([]);
  adapter.requestNeisJson = async (dataset) => {
    calls.push(dataset);
    if (calls.length < 4) {
      throw Object.assign(new Error("temporary upstream failure"), { status: "upstream_error" });
    }
    return fixtureEnvelope(dataset, [{ AY: "2026", GRADE: "3", CLASS_NM: "2" }]);
  };

  await withServer({
    apiKey: "fixture-key",
    adapter,
    retryBackoffMaxMs: 15,
    retryBackoffMs: 10,
    sleep: async (delayMs) => backoffs.push(delayMs),
    upstreamMaxRetries: 99,
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/neis/classes?educationOfficeCode=B10&schoolCode=7010001`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).rows[0].class_nm, "2");
  });

  assert.equal(calls.length, 4);
  assert.deepEqual(backoffs, [10, 15, 15]);
});

test("upstream timeout aborts the attempt and returns 504 with injected timers", async () => {
  let capturedSignal;
  const adapter = fixtureAdapter([]);
  adapter.searchSchools = async (options) => {
    capturedSignal = options.signal;
    return new Promise(() => {});
  };

  await withServer({
    apiKey: "fixture-key",
    adapter,
    clearTimer: () => {},
    setTimer: (callback) => {
      queueMicrotask(callback);
      return 1;
    },
    upstreamMaxRetries: 0,
    upstreamTimeoutMs: 25,
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/neis/school-search?schoolName=미래`);
    const body = await response.json();
    assert.equal(response.status, 504);
    assert.equal(body.error, "upstream_timeout");
    assert.equal(capturedSignal.aborted, true);
  });
});

test("process cache evicts least-recently-used entries at its configured bound", async () => {
  const cache = new Map();
  const calls = [];
  const adapter = fixtureAdapter([]);
  adapter.searchSchools = async ({ schoolName }) => {
    calls.push(schoolName);
    return {
      ok: true,
      schools: [{
        atptOfcdcScCode: "B10",
        schoolCode: `code-${schoolName}`,
        name: schoolName,
        schoolLevel: "초등학교",
        address: "서울",
      }],
    };
  };

  await withServer({ apiKey: "fixture-key", adapter, cache, cacheMaxEntries: 2 }, async (baseUrl) => {
    const requestSchool = (name) => fetch(`${baseUrl}/v1/neis/school-search?schoolName=${name}`);
    assert.equal((await requestSchool("가람초")).status, 200);
    assert.equal((await requestSchool("나래초")).status, 200);
    assert.equal((await (await requestSchool("가람초")).json()).cache.hit, true);
    assert.equal((await requestSchool("다온초")).status, 200);
    assert.equal(cache.size, 2);
    assert.equal((await (await requestSchool("나래초")).json()).cache.hit, false);
  });

  assert.deepEqual(calls, ["가람초", "나래초", "다온초", "나래초"]);
  assert.equal(cache.size, 2);
});
