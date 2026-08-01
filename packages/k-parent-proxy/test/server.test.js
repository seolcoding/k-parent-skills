const test = require("node:test");
const assert = require("node:assert/strict");
const { createKParentProxyServer } = require("../src/server");

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
    assert.equal((await fetch(`${baseUrl}/v1/neis/school-search?schoolName=x`)).status, 503);
  });
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
