const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ERROR_STATUS,
  SENSITIVE_ACTION_TYPES,
  SOURCE_FRESHNESS,
  assessSourceFreshness,
  createErrorResult,
  guardActionCandidate,
  isSensitiveActionType,
  normalizeChildProfile,
  normalizeMeal,
  normalizeSourceMetadata,
  requiresOfficialSiteHandoff,
} = require("../src/index");

test("child profile accepts stage without exact birth date", () => {
  const profile = normalizeChildProfile({
    id: "child-1",
    stage: "lower_elementary",
    schoolCode: "7010123",
    interests: "science",
    allergyNumbers: ["1", 10],
  });

  assert.equal(profile.stage, "lower_elementary");
  assert.equal(profile.birthYm, null);
  assert.deepEqual(profile.interests, ["science"]);
  assert.deepEqual(profile.allergyNumbers, [1, 10]);
});

test("child profile rejects sensitive credential and identity fields", () => {
  assert.throws(
    () => normalizeChildProfile({ stage: "preschool", residentRegistrationNumber: "123" }),
    /residentRegistrationNumber is not allowed/,
  );
  assert.throws(
    () => normalizeChildProfile({ stage: "preschool", nested: { certificatePassword: "x" } }),
    /certificatePassword is not allowed/,
  );
});

test("sensitive actions require confirmation and are not executable", () => {
  const action = guardActionCandidate({
    type: "application",
    title: "정부24 신청",
    executable: true,
    officialUrl: "https://www.gov.kr",
  });

  assert.equal(action.requiresConfirmation, true);
  assert.equal(action.requiresOfficialSiteHandoff, true);
  assert.equal(action.executable, false);
});

test("all side-effect action types are confirmation-gated and non-executable", () => {
  assert.deepEqual(SENSITIVE_ACTION_TYPES, [
    "calendar_write",
    "reservation",
    "application",
    "purchase",
    "payment",
    "message_send",
    "cancellation",
  ]);

  for (const type of SENSITIVE_ACTION_TYPES) {
    const action = guardActionCandidate({
      type,
      title: `${type} 후보`,
      executable: true,
    });

    assert.equal(isSensitiveActionType(type), true, `${type} should be sensitive`);
    assert.equal(action.requiresConfirmation, true, `${type} should require confirmation`);
    assert.equal(action.executable, false, `${type} should not remain executable`);
  }
});

test("official transaction actions are marked for official-site handoff", () => {
  for (const type of ["reservation", "application", "payment", "purchase"]) {
    const action = guardActionCandidate({ type, executable: true });

    assert.equal(requiresOfficialSiteHandoff(type), true, `${type} should require handoff`);
    assert.equal(action.requiresOfficialSiteHandoff, true, `${type} should be a handoff candidate`);
  }
});

test("non-sensitive reminder candidates can remain executable", () => {
  const action = guardActionCandidate({
    type: "checklist",
    title: "준비물 확인",
    executable: true,
  });

  assert.equal(action.requiresConfirmation, false);
  assert.equal(action.executable, true);
});

test("source freshness classifies fresh, stale, and unknown sources", () => {
  const fresh = assessSourceFreshness({
    fetchedAt: "2026-05-01T00:00:00.000Z",
    now: "2026-05-01T12:00:00.000Z",
    maxAgeHours: 24,
  });
  const stale = assessSourceFreshness({
    fetchedAt: "2026-04-29T00:00:00.000Z",
    now: "2026-05-01T12:00:00.000Z",
    maxAgeHours: 24,
  });
  const unknown = assessSourceFreshness({});

  assert.equal(fresh.status, SOURCE_FRESHNESS.FRESH);
  assert.equal(stale.status, SOURCE_FRESHNESS.STALE);
  assert.equal(unknown.status, SOURCE_FRESHNESS.UNKNOWN);
});

test("source metadata carries freshness for parent-facing outputs", () => {
  const source = normalizeSourceMetadata({
    sourceName: "NEIS",
    sourceUrl: "https://open.neis.go.kr",
    fetchedAt: "2026-05-01T00:00:00.000Z",
    now: "2026-05-01T01:00:00.000Z",
  });

  assert.equal(source.sourceType, "official");
  assert.equal(source.freshness.status, SOURCE_FRESHNESS.FRESH);
  assert.equal(source.sourceUrl, "https://open.neis.go.kr");
});

test("meal schema keeps allergy numbers and source metadata", () => {
  const source = normalizeSourceMetadata({ sourceName: "NEIS", fetchedAt: "2026-05-01T00:00:00.000Z", now: "2026-05-01T01:00:00.000Z" });
  const meal = normalizeMeal({
    date: "2026-05-01",
    mealType: "중식",
    menuItems: ["밥", "국"],
    allergyNumbers: [5, "9"],
    source,
  });

  assert.deepEqual(meal.allergyNumbers, [5, 9]);
  assert.equal(meal.source.freshness.status, SOURCE_FRESHNESS.FRESH);
});

test("common error result uses supported statuses", () => {
  assert.equal(createErrorResult(ERROR_STATUS.AMBIGUOUS, "학교 후보가 여러 개입니다.").status, "ambiguous");
  assert.throws(() => createErrorResult("bad", "bad"), /unsupported error status/);
});
