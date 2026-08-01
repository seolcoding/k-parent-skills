const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ERROR_STATUS,
  HITL_STATUS,
  SENSITIVE_ACTION_TYPES,
  SOURCE_FRESHNESS,
  assertActionExecutable,
  assessSourceFreshness,
  createActionRequest,
  decideActionRequest,
  createErrorResult,
  guardActionCandidate,
  isSensitiveActionType,
  markActionExecuted,
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
    "login",
    "credential_entry",
    "child_personal_data_entry",
    "external_data_share",
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

test("HITL approval is scoped, expiring, and consumed once", () => {
  const scope = {
    target: "government-application",
    fields: ["serviceCode", "region"],
    childProfileRef: "local-profile-1",
  };
  const request = createActionRequest(
    {
      id: "action-1",
      type: "application",
      label: "돌봄 신청",
      scope,
      officialUrl: "https://www.gov.kr/",
    },
    { now: "2026-08-01T00:00:00.000Z" },
  );

  assert.equal(request.status, HITL_STATUS.AWAITING_APPROVAL);
  assert.equal(request.requiresOfficialSiteHandoff, true);
  assert.throws(() => assertActionExecutable(request), /not approved/);

  const approved = decideActionRequest(
    request,
    { decision: "approved", actor: "parent-1", reason: "내용 확인 완료" },
    { now: "2026-08-01T00:01:00.000Z" },
  );
  assert.equal(approved.status, HITL_STATUS.APPROVED);
  assert.throws(
    () => assertActionExecutable(approved, { now: "2026-08-01T00:02:00.000Z" }),
    /scope is required/,
  );
  assert.equal(assertActionExecutable(approved, { now: "2026-08-01T00:02:00.000Z", scope }), true);
  assert.throws(
    () => assertActionExecutable(approved, {
      now: "2026-08-01T00:02:00.000Z",
      scope: { ...scope, target: "different-application" },
    }),
    /does not match/,
  );
  assert.throws(
    () => assertActionExecutable({ ...approved, id: "tampered" }, {
      now: "2026-08-01T00:02:00.000Z",
      scope,
    }),
    /modified after approval/,
  );
  assert.throws(
    () => assertActionExecutable({ ...approved, officialUrl: "https://example.com/other" }, {
      now: "2026-08-01T00:02:00.000Z",
      scope,
    }),
    /modified after approval/,
  );
  assert.throws(
    () => markActionExecuted(
      { ...approved, requiresOfficialSiteHandoff: false },
      { actor: "executor", scope },
      { now: "2026-08-01T00:03:00.000Z" },
    ),
    /policy fields were modified/,
  );

  const executed = markActionExecuted(
    approved,
    { actor: "official-site-handoff", resultRef: "local-confirmation-ref", scope },
    { now: "2026-08-01T00:03:00.000Z" },
  );
  assert.equal(executed.status, HITL_STATUS.EXECUTED);
  assert.throws(() => assertActionExecutable(executed), /not approved/);
});

test("HITL rejects denied, expired, and sensitive persisted scopes", () => {
  const request = createActionRequest(
    { type: "payment", label: "결제", scope: { amount: 10000, currency: "KRW" } },
    { now: "2026-08-01T00:00:00.000Z" },
  );
  const rejected = decideActionRequest(
    request,
    { decision: "rejected", actor: "parent-1" },
    { now: "2026-08-01T00:01:00.000Z" },
  );
  assert.throws(() => assertActionExecutable(rejected), /not approved/);

  assert.throws(
    () => decideActionRequest(
      request,
      { decision: "approved", actor: "parent-1", expiresAt: "2099-01-01T00:00:00.000Z" },
      { now: "2026-08-01T00:01:00.000Z" },
    ),
    /cannot be overridden/,
  );
  const approved = decideActionRequest(
    request,
    { decision: "approved", actor: "parent-1" },
    { now: "2026-08-01T00:01:00.000Z" },
  );
  assert.throws(
    () => assertActionExecutable(approved, {
      now: "2026-08-01T00:06:00.000Z",
      scope: request.scope,
    }),
    /expired/,
  );
  assert.throws(
    () => assertActionExecutable(approved, {
      now: "2026-08-01T00:07:00.000Z",
      scope: request.scope,
    }),
    /expired/,
  );

  assert.throws(
    () => createActionRequest({ type: "login", label: "로그인", scope: { password: "never-store" } }),
    /forbidden in persisted approval scope/,
  );
  assert.throws(
    () => createActionRequest({ type: "login", label: "로그인", scope: { Password: "case-bypass" } }),
    /forbidden in persisted approval scope/,
  );
  assert.throws(
    () => createActionRequest({ type: "login", label: "로그인", scope: { client_secret: "snake-bypass" } }),
    /forbidden in persisted approval scope/,
  );
});

test("unknown action types default to human approval", () => {
  const request = createActionRequest({ type: "future_side_effect", label: "새 외부 작업", scope: {} });
  assert.equal(request.status, HITL_STATUS.AWAITING_APPROVAL);
  assert.equal(request.risk, "high");
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
