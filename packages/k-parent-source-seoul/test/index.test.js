"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { SOURCE_FRESHNESS } = require("k-parent-core");
const {
  fetchReservations,
  parseReservations,
  RESERVATION_SERVICES,
} = require("../src/index");

function readFixture(name) {
  const filePath = path.join(__dirname, "fixtures", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

test("fetchReservations throws MISSING_CONFIG when no api key", async () => {
  const saved = process.env.KSKILL_SEOUL_KEY;
  delete process.env.KSKILL_SEOUL_KEY;
  try {
    await assert.rejects(
      () => fetchReservations({ fetchImpl: async () => new Response("{}") }),
      (err) => err.status === "missing_config"
    );
  } finally {
    if (saved !== undefined) process.env.KSKILL_SEOUL_KEY = saved;
  }
});

test("fetchReservations returns payload without http when provided", async () => {
  const payload = readFixture("reservation-culture.json");
  const result = await fetchReservations({ apiKey: "test", payload });
  assert.deepEqual(result, payload);
});

test("fetchReservations builds url and returns json", async () => {
  const payload = readFixture("reservation-education.json");
  let calledUrl = null;
  const result = await fetchReservations({
    apiKey: "test",
    service: "ListPublicReservationEducation",
    start: 1,
    end: 5,
    fetchImpl: async (url) => {
      calledUrl = url;
      return new Response(JSON.stringify(payload), { status: 200 });
    },
  });
  assert.deepEqual(result, payload);
  assert.ok(calledUrl.includes("/json/ListPublicReservationEducation/1/5/"));
});

test("fetchReservations throws UPSTREAM_ERROR on non-ok", async () => {
  await assert.rejects(
    () =>
      fetchReservations({
        apiKey: "test",
        fetchImpl: async () => new Response("err", { status: 500 }),
      }),
    (err) => err.status === "upstream_error"
  );
});

test("RESERVATION_SERVICES contains the three reservation feeds", () => {
  assert.deepEqual(RESERVATION_SERVICES, [
    "ListPublicReservationCulture",
    "ListPublicReservationEducation",
    "ListPublicReservationSport",
  ]);
});

test("parseReservations normalizes culture rows and reads RESULT.CODE", () => {
  const payload = readFixture("reservation-culture.json");
  const result = parseReservations(payload, {
    service: "ListPublicReservationCulture",
    fetchedAt: "2026-06-04T00:00:00.000Z",
    now: "2026-06-04T12:00:00.000Z",
  });
  assert.equal(result.resultCode, "INFO-000");
  assert.equal(result.items.length, 1);
  const item = result.items[0];
  assert.equal(item.svcName, "어린이 도자기 체험");
  assert.equal(item.place, "서울시립미술관");
  assert.equal(item.areaName, "중구");
  assert.equal(item.useTarget, "만 5세 이상");
  assert.equal(item.svcStatus, "접수중");
  assert.ok(item.svcUrl.includes("yeyak.seoul.go.kr"));
  assert.equal(item.institution.name, "서울시립미술관");
  assert.equal(result.metadata.sourceName, "서울 열린데이터광장 공공서비스예약");
  assert.equal(result.metadata.freshness.status, SOURCE_FRESHNESS.FRESH);
  assert.equal(result.metadata.freshness.checkedAt, "2026-06-04T00:00:00.000Z");
});

test("parseReservations handles each reservation service fixture", () => {
  const cases = [
    ["reservation-culture.json", "ListPublicReservationCulture"],
    ["reservation-education.json", "ListPublicReservationEducation"],
    ["reservation-sport.json", "ListPublicReservationSport"],
  ];
  for (const [fixture, service] of cases) {
    const payload = readFixture(fixture);
    const result = parseReservations(payload, { service });
    assert.equal(result.items.length, 1);
    assert.ok(result.items[0].svcId);
  }
});

test("parseReservations returns empty items for unknown service", () => {
  const payload = readFixture("reservation-culture.json");
  const result = parseReservations(payload, { service: "Nope" });
  assert.deepEqual(result.items, []);
  assert.equal(result.resultCode, null);
});
