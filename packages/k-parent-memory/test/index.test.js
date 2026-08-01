const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MEMORY_SCOPE,
  createInMemoryStore,
  createMemoryRecord,
} = require("../src");

test("session memory expires and is removed", () => {
  let now = new Date("2026-08-01T00:00:00.000Z");
  const store = createInMemoryStore({ now: () => now });
  store.set({
    scope: MEMORY_SCOPE.SESSION,
    key: "session-1:region",
    value: { region: "서울" },
    ttlSeconds: 60,
  });

  assert.equal(store.get(MEMORY_SCOPE.SESSION, "session-1:region").value.region, "서울");
  now = new Date("2026-08-01T00:01:01.000Z");
  assert.equal(store.get(MEMORY_SCOPE.SESSION, "session-1:region"), null);
});

test("profile memory stores an opaque reference rather than child data", () => {
  const record = createMemoryRecord({
    scope: MEMORY_SCOPE.PROFILE_REF,
    key: "profile-1",
    value: "user-store://profiles/local-profile-1",
  });
  assert.equal(record.expiresAt, null);
  assert.throws(
    () => createMemoryRecord({ scope: MEMORY_SCOPE.PROFILE_REF, key: "profile-2", value: { grade: 3 } }),
    /opaque/,
  );
});

test("memory rejects credential and child identity keys", () => {
  assert.throws(
    () => createMemoryRecord({
      scope: MEMORY_SCOPE.SESSION,
      key: "unsafe",
      value: { nested: { password: "never-store" } },
    }),
    /forbidden/,
  );
  assert.throws(
    () => createMemoryRecord({
      scope: MEMORY_SCOPE.SESSION,
      key: "unsafe-child",
      value: { childName: "never-store" },
    }),
    /forbidden/,
  );
  assert.throws(
    () => createMemoryRecord({
      scope: MEMORY_SCOPE.SESSION,
      key: "unsafe-snake",
      value: { client_secret: "never-store" },
    }),
    /forbidden/,
  );
});

test("knowledge memory is public and size bounded", () => {
  const sourceUrl = "https://open.neis.go.kr/hub/schoolInfo";
  const record = createMemoryRecord({
    scope: MEMORY_SCOPE.KNOWLEDGE,
    key: "neis:school:public-code",
    value: { sourceUrl, fetchedAt: "2026-08-01T00:00:00.000Z" },
    sourceRef: sourceUrl,
    sensitivity: "public",
  });
  assert.equal(record.sensitivity, "public");
  assert.throws(
    () => createMemoryRecord({
      scope: MEMORY_SCOPE.KNOWLEDGE,
      key: "private",
      value: { sourceUrl, fetchedAt: "2026-08-01T00:00:00.000Z" },
      sourceRef: sourceUrl,
      sensitivity: "restricted",
    }),
    /explicit public/,
  );
  assert.throws(
    () => createMemoryRecord({
      scope: MEMORY_SCOPE.KNOWLEDGE,
      key: "unproven",
      value: { sourceUrl, fetchedAt: "2026-08-01T00:00:00.000Z" },
      sourceRef: sourceUrl,
    }),
    /explicit public/,
  );
  assert.throws(
    () => createMemoryRecord({
      scope: MEMORY_SCOPE.KNOWLEDGE,
      key: "payload",
      value: { sourceUrl, fetchedAt: "2026-08-01T00:00:00.000Z", payload: "raw content" },
      sourceRef: sourceUrl,
      sensitivity: "public",
    }),
    /not allowed/,
  );
});

test("session memory rejects free-form dialogue and unknown identity fields", () => {
  assert.throws(
    () => createMemoryRecord({
      scope: MEMORY_SCOPE.SESSION,
      key: "raw-dialogue",
      value: "아이와 나눈 전체 대화 원문",
    }),
    /structured object/,
  );
  assert.throws(
    () => createMemoryRecord({
      scope: MEMORY_SCOPE.SESSION,
      key: "student-id",
      value: { studentId: "1234" },
    }),
    /not allowed/,
  );
});

test("approval audit accepts only a minimal envelope", () => {
  const base = {
    actionId: "action-1",
    type: "application",
    status: "awaiting_approval",
    risk: "high",
    scopeDigest: "a".repeat(64),
    approvalDigest: "b".repeat(64),
    createdAt: "2026-08-01T00:00:00.000Z",
  };
  assert.equal(createMemoryRecord({
    scope: MEMORY_SCOPE.APPROVAL_AUDIT,
    key: "action-1",
    value: base,
  }).value.actionId, "action-1");
  assert.throws(
    () => createMemoryRecord({
      scope: MEMORY_SCOPE.APPROVAL_AUDIT,
      key: "action-2",
      value: { ...base, scope: { region: "서울" } },
    }),
    /not allowed/,
  );
});

test("memory requires a serializable value", () => {
  assert.throws(
    () => createMemoryRecord({ scope: MEMORY_SCOPE.SESSION, key: "missing-value" }),
    /value is required/,
  );
});
