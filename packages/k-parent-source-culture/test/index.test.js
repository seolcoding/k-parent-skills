"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { SOURCE_FRESHNESS } = require("k-parent-core");
const { fetchCultureEvents, parseCultureEvents } = require("../src/index");

function readFixture(name) {
  const filePath = path.join(__dirname, "fixtures", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

test("fetchCultureEvents throws MISSING_CONFIG when no api key", async () => {
  const saved = process.env.KSKILL_CULTURE_KEY;
  delete process.env.KSKILL_CULTURE_KEY;
  try {
    await assert.rejects(
      () => fetchCultureEvents({ fetchImpl: async () => new Response("{}") }),
      (err) => err.status === "missing_config"
    );
  } finally {
    if (saved !== undefined) process.env.KSKILL_CULTURE_KEY = saved;
  }
});

test("fetchCultureEvents returns payload without http when provided", async () => {
  const payload = readFixture("culture-events.json");
  const result = await fetchCultureEvents({ apiKey: "test", payload });
  assert.deepEqual(result, payload);
});

test("fetchCultureEvents builds url and returns json", async () => {
  const payload = readFixture("culture-events.json");
  let calledUrl = null;
  const result = await fetchCultureEvents({
    apiKey: "test",
    from: "20260601",
    to: "20260630",
    area: "1",
    fetchImpl: async (url) => {
      calledUrl = url;
      return new Response(JSON.stringify(payload), { status: 200 });
    },
  });
  assert.deepEqual(result, payload);
  assert.ok(calledUrl.includes("publicperformancedisplays/area?"));
  assert.ok(calledUrl.includes("serviceKey=test"));
  assert.ok(calledUrl.includes("from=20260601"));
});

test("fetchCultureEvents throws UPSTREAM_ERROR on non-ok", async () => {
  await assert.rejects(
    () =>
      fetchCultureEvents({
        apiKey: "test",
        fetchImpl: async () => new Response("err", { status: 500 }),
      }),
    (err) => err.status === "upstream_error"
  );
});

test("parseCultureEvents normalizes perforList rows", () => {
  const payload = readFixture("culture-events.json");
  const result = parseCultureEvents(payload, {
    fetchedAt: "2026-06-04T00:00:00.000Z",
    now: "2026-06-04T12:00:00.000Z",
  });
  assert.equal(result.items.length, 2);
  const first = result.items[0];
  assert.equal(first.title, "어린이 인형극 - 아기돼지 삼형제");
  assert.equal(first.place, "세종문화회관 어린이극장");
  assert.equal(first.startDate, "2026-06-01");
  assert.equal(first.endDate, "2026-06-30");
  assert.equal(first.area, "서울");
  assert.equal(first.genre, "연극");
  assert.ok(first.url.includes("culture.go.kr"));
  assert.ok(first.image.includes("thumb"));
  assert.equal(first.charge, "전석 15,000원");
  assert.equal(result.items[1].charge, "무료");
  assert.equal(result.metadata.sourceName, "문화포털 공연전시정보");
  assert.equal(result.metadata.freshness.status, SOURCE_FRESHNESS.FRESH);
  assert.equal(result.metadata.freshness.checkedAt, "2026-06-04T00:00:00.000Z");
});

test("parseCultureEvents handles single-object and empty payloads", () => {
  const single = {
    response: { msgBody: { perforList: { title: "단일 공연", place: "어딘가" } } },
  };
  assert.equal(parseCultureEvents(single).items.length, 1);
  assert.deepEqual(parseCultureEvents({}).items, []);
  assert.deepEqual(parseCultureEvents(null).items, []);
});
