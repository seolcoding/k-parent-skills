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
  const record = createMemoryRecord({
    scope: MEMORY_SCOPE.KNOWLEDGE,
    key: "neis:school:public-code",
    value: { sourceUrl: "https://open.neis.go.kr", fetchedAt: "2026-08-01T00:00:00.000Z" },
  });
  assert.equal(record.sensitivity, "public");
  assert.throws(
    () => createMemoryRecord({
      scope: MEMORY_SCOPE.KNOWLEDGE,
      key: "private",
      value: {},
      sensitivity: "restricted",
    }),
    /public data only/,
  );
});

test("memory requires a serializable value", () => {
  assert.throws(
    () => createMemoryRecord({ scope: MEMORY_SCOPE.SESSION, key: "missing-value" }),
    /value is required/,
  );
});
