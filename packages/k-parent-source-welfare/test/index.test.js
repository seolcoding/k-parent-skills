const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { SOURCE_FRESHNESS } = require("k-parent-core");
const {
  listServices,
  getService,
  buildDeepLink,
  isLiveLookupAvailable,
  describeLiveLookup,
} = require("k-parent-source-welfare");

const expected = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures", "expected-services.json"), "utf8")
);

test("listServices returns the full curated catalog", () => {
  const result = listServices();
  assert.equal(result.ok, true);
  assert.equal(result.metadata.sourceType, "curated");
  assert.equal(result.metadata.freshness.status, SOURCE_FRESHNESS.FRESH);
  assert.equal(result.services.length, expected.serviceIds.length);
  assert.deepEqual(
    result.services.map((s) => s.serviceId).sort(),
    [...expected.serviceIds].sort()
  );
  for (const service of result.services) {
    assert.ok(service.title);
    assert.ok(service.agency);
    assert.ok(service.eligibility);
    assert.ok(Array.isArray(service.requiredDocs) && service.requiredDocs.length > 0);
    assert.match(service.officialUrl, /^https:\/\//);
    assert.ok(service.contact);
    assert.ok(service.deadline);
  }
});

test("listServices filters by category", () => {
  const cash = listServices({ category: "현금지원" });
  assert.ok(cash.services.length >= 4);
  assert.ok(cash.services.every((s) => s.category === "현금지원"));
});

test("getService returns one service or a not_found error", () => {
  const ok = getService("parental-benefit");
  assert.equal(ok.ok, true);
  assert.equal(ok.service.title, "부모급여");
  assert.equal(ok.metadata.sourceType, "curated");
  assert.equal(ok.metadata.freshness.status, SOURCE_FRESHNESS.FRESH);

  const missing = getService("does-not-exist");
  assert.equal(missing.ok, false);
  assert.equal(missing.status, "not_found");
});

test("buildDeepLink targets the right portal and flags handoff", () => {
  const child = buildDeepLink("child-allowance");
  assert.equal(child.portal, "bokjiro");
  assert.match(child.url, /^https:\/\/www\.bokjiro\.go\.kr\/\?/);
  assert.match(child.url, /svcId=child-allowance/);
  assert.equal(child.requiresOfficialSiteHandoff, true);

  const idolbom = buildDeepLink(getService("idolbom").service, { region: "seoul" });
  assert.equal(idolbom.portal, "idolbom");
  assert.match(idolbom.url, /region=seoul/);

  const preschool = buildDeepLink("preschool-tuition");
  assert.equal(preschool.portal, "isarang");
  assert.match(preschool.url, /childcare\.go\.kr/);
});

test("buildDeepLink rejects invalid input", () => {
  assert.throws(() => buildDeepLink("nope"), /valid service/);
  assert.throws(() => buildDeepLink({}), /valid service/);
});

test("live lookup is optional and off by default (offline)", () => {
  assert.equal(isLiveLookupAvailable({}), false);
  const described = describeLiveLookup({});
  assert.equal(described.ok, false);
  assert.equal(described.status, "missing_config");
  assert.equal(isLiveLookupAvailable({ KSKILL_DATAGOKR_KEY: "x" }), true);
});
