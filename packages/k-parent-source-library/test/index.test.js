"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { SOURCE_FRESHNESS } = require("k-parent-core");
const { fetchLibraries, parseLibraries } = require("../src/index");

function readFixture(name) {
  const filePath = path.join(__dirname, "fixtures", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

test("fetchLibraries throws MISSING_CONFIG when no api key", async () => {
  const saved = process.env.KSKILL_LIBRARY_KEY;
  delete process.env.KSKILL_LIBRARY_KEY;
  try {
    await assert.rejects(
      () => fetchLibraries({ fetchImpl: async () => new Response("{}") }),
      (err) => err.status === "missing_config"
    );
  } finally {
    if (saved !== undefined) process.env.KSKILL_LIBRARY_KEY = saved;
  }
});

test("fetchLibraries returns payload without http when provided", async () => {
  const payload = readFixture("libraries.json");
  const result = await fetchLibraries({ apiKey: "test", payload });
  assert.deepEqual(result, payload);
});

test("fetchLibraries builds url with authKey/region/format", async () => {
  const payload = readFixture("libraries.json");
  let calledUrl = null;
  const result = await fetchLibraries({
    apiKey: "test",
    region: "11",
    dtlRegion: "11680",
    fetchImpl: async (url) => {
      calledUrl = url;
      return new Response(JSON.stringify(payload), { status: 200 });
    },
  });
  assert.deepEqual(result, payload);
  assert.ok(calledUrl.includes("/libSrch?"));
  assert.ok(calledUrl.includes("authKey=test"));
  assert.ok(calledUrl.includes("format=json"));
  assert.ok(calledUrl.includes("region=11"));
  assert.ok(calledUrl.includes("dtl_region=11680"));
});

test("fetchLibraries throws UPSTREAM_ERROR on non-ok", async () => {
  await assert.rejects(
    () =>
      fetchLibraries({
        apiKey: "test",
        fetchImpl: async () => new Response("err", { status: 500 }),
      }),
    (err) => err.status === "upstream_error"
  );
});

test("parseLibraries normalizes response.libs[].lib", () => {
  const payload = readFixture("libraries.json");
  const result = parseLibraries(payload, {
    fetchedAt: "2026-06-04T00:00:00.000Z",
    now: "2026-06-04T12:00:00.000Z",
  });
  assert.equal(result.items.length, 2);
  const first = result.items[0];
  assert.equal(first.libCode, "111001");
  assert.equal(first.libName, "강남구립개포도서관");
  assert.equal(first.address, "서울특별시 강남구 개포로 615");
  assert.equal(first.tel, "02-3460-4350");
  assert.equal(first.homepage, "https://library.gangnam.go.kr");
  assert.equal(first.latitude, "37.4781");
  assert.equal(first.longitude, "127.0658");
  assert.equal(first.institution.name, "강남구립개포도서관");
  assert.equal(first.institution.address, "서울특별시 강남구 개포로 615");
  assert.equal(result.metadata.sourceName, "도서관정보나루 data4library");
  assert.equal(result.metadata.freshness.status, SOURCE_FRESHNESS.FRESH);
  assert.equal(result.metadata.freshness.checkedAt, "2026-06-04T00:00:00.000Z");
});

test("parseLibraries returns empty items for malformed payload", () => {
  assert.deepEqual(parseLibraries({}).items, []);
  assert.deepEqual(parseLibraries(null).items, []);
});
