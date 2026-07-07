const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { SOURCE_FRESHNESS, ERROR_STATUS } = require("k-parent-core");
const {
  BASE,
  SCHOOLZONE_CHILD_ACCIDENT_PATH,
  fetchSchoolZoneChildAccidentHotspots,
  fetchGyeongbukChildProtectionZones,
  fetchSeongnamYellowCarpets,
  requestDatagokrJson,
  extractItems,
  normalizeSchoolZoneRisk,
  normalizeProtectionZones,
  normalizeYellowCarpets,
} = require("../src/index");

const fixturesDir = path.join(__dirname, "fixtures");
const riskPayload = readFixture("schoolzone-risk.json");
const zonePayload = readFixture("protection-zones.json");
const yellowPayload = readFixture("yellow-carpets.json");

test("extractItems handles array, single item, and empty envelopes", () => {
  assert.equal(extractItems(riskPayload).length, 1);
  assert.equal(extractItems(zonePayload).length, 1);
  assert.equal(extractItems(yellowPayload).length, 1);
  assert.equal(extractItems({}).length, 0);
});

test("fetchSchoolZoneChildAccidentHotspots normalizes accident hotspots", async () => {
  const result = await fetchSchoolZoneChildAccidentHotspots({
    payload: riskPayload,
    fetchedAt: "2026-05-01T00:00:00.000Z",
    now: "2026-05-01T01:00:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.hotspots.length, 1);
  assert.equal(result.hotspots[0].name, "서울 행복초등학교 앞");
  assert.equal(result.hotspots[0].type, "school_zone_risk");
  assert.equal(result.hotspots[0].accidentCount, 3);
  assert.equal(result.hotspots[0].casualtyCount, 4);
  assert.equal(result.hotspots[0].source.freshness.status, SOURCE_FRESHNESS.FRESH);
});

test("fetchGyeongbukChildProtectionZones normalizes protection zone fields", async () => {
  const result = await fetchGyeongbukChildProtectionZones({
    payload: zonePayload,
    fetchedAt: "2026-05-01T00:00:00.000Z",
    now: "2026-05-01T01:00:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.zones[0].name, "영천초등학교");
  assert.equal(result.zones[0].facilityType, "초등학교");
  assert.equal(result.zones[0].cctvCount, 2);
  assert.equal(result.zones[0].policeStation, "영천경찰서");
});

test("fetchSeongnamYellowCarpets normalizes single yellow-carpet object", async () => {
  const result = await fetchSeongnamYellowCarpets({
    payload: yellowPayload,
    fetchedAt: "2026-05-01T00:00:00.000Z",
    now: "2026-05-01T01:00:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.yellowCarpets[0].name, "성남초등학교 정문");
  assert.equal(result.yellowCarpets[0].type, "yellow_carpet");
  assert.equal(result.yellowCarpets[0].installedAt, "2025-03-02");
});

test("normalizers work directly on raw payloads", () => {
  assert.equal(normalizeSchoolZoneRisk(riskPayload).length, 1);
  assert.equal(normalizeProtectionZones(zonePayload).length, 1);
  assert.equal(normalizeYellowCarpets(yellowPayload).length, 1);
});

test("live request requires API key by default", async () => {
  await assert.rejects(
    () => requestDatagokrJson(SCHOOLZONE_CHILD_ACCIDENT_PATH, {}, { apiKey: "" }),
    /KSKILL_DATAGOKR_KEY/,
  );
});

test("live request builds data.go.kr URL and passes filters", async () => {
  let fetchedUrl = "";
  const result = await requestDatagokrJson(SCHOOLZONE_CHILD_ACCIDENT_PATH, { siDo: "서울특별시" }, {
    apiKey: "test-key",
    fetchImpl: async (url, opts = {}) => {
      fetchedUrl = String(url);
      assert.ok(opts.headers["accept-language"].includes("ko-KR"));
      return new Response(JSON.stringify(riskPayload), { status: 200 });
    },
  });

  assert.deepEqual(result, riskPayload);
  assert.ok(fetchedUrl.startsWith(BASE));
  assert.ok(fetchedUrl.includes("serviceKey=test-key"));
  assert.ok(decodeURIComponent(fetchedUrl).includes("siDo=서울특별시"));
});

test("upstream failure surfaces UPSTREAM_ERROR status", async () => {
  await assert.rejects(
    () => requestDatagokrJson(SCHOOLZONE_CHILD_ACCIDENT_PATH, {}, {
      apiKey: "test-key",
      fetchImpl: async () => new Response("err", { status: 503 }),
    }),
    (err) => err.status === ERROR_STATUS.UPSTREAM_ERROR,
  );
});

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, fileName), "utf8"));
}
