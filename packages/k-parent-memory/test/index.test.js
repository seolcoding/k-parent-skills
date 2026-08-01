const test = require("node:test");
const assert = require("node:assert/strict");
const {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");

const {
  MEMORY_SCOPE,
  createEncryptedFileStore,
  createInMemoryStore,
  createMemoryRecord,
} = require("../src");

function createDurableFixture(context, overrides = {}) {
  const directory = mkdtempSync(join(tmpdir(), "k-parent-memory-"));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  return {
    directory,
    options: {
      filePath: join(directory, "memory.enc"),
      encryptionKey: Buffer.alloc(32, 7),
      tenantId: "tenant-a",
      namespace: "family-calendar",
      ...overrides,
    },
  };
}

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

test("encrypted file store persists across restarts without writing plaintext or the key", (context) => {
  const { directory, options } = createDurableFixture(context);
  const firstStore = createEncryptedFileStore(options);
  firstStore.set({
    scope: MEMORY_SCOPE.SESSION,
    key: "calendar-region",
    value: { region: "서울특별시" },
  });

  const restartedStore = createEncryptedFileStore(options);
  assert.equal(
    restartedStore.get(MEMORY_SCOPE.SESSION, "calendar-region").value.region,
    "서울특별시",
  );

  const persisted = readFileSync(options.filePath, "utf8");
  assert.doesNotMatch(persisted, /서울특별시|calendar-region|tenant-a|family-calendar/);
  assert.doesNotMatch(persisted, new RegExp(options.encryptionKey.toString("hex")));
  assert.doesNotMatch(persisted, new RegExp(options.encryptionKey.toString("base64")));
  assert.equal(statSync(options.filePath).mode & 0o777, 0o600);
  assert.deepEqual(readdirSync(directory), ["memory.enc"]);
});

test("encrypted file store rejects a wrong key and authenticated ciphertext tampering", (context) => {
  const { options } = createDurableFixture(context);
  const store = createEncryptedFileStore(options);
  store.set({
    scope: MEMORY_SCOPE.SESSION,
    key: "workflow",
    value: { workflowStep: "review" },
  });

  const wrongKeyStore = createEncryptedFileStore({
    ...options,
    encryptionKey: Buffer.alloc(32, 8),
  });
  assert.throws(
    () => wrongKeyStore.list(),
    /authentication failed/,
  );

  const envelope = JSON.parse(readFileSync(options.filePath, "utf8"));
  const ciphertext = Buffer.from(envelope.ciphertext, "base64");
  ciphertext[0] ^= 1;
  envelope.ciphertext = ciphertext.toString("base64");
  writeFileSync(options.filePath, JSON.stringify(envelope));
  assert.throws(
    () => store.list(),
    /authentication failed/,
  );
});

test("encrypted file store removes expired records from durable state", (context) => {
  let now = new Date("2026-08-01T00:00:00.000Z");
  const { options } = createDurableFixture(context, { now: () => now });
  const store = createEncryptedFileStore(options);
  store.set({
    scope: MEMORY_SCOPE.SESSION,
    key: "short-lived",
    value: { region: "부산" },
    ttlSeconds: 60,
  });

  now = new Date("2026-08-01T00:01:01.000Z");
  assert.equal(store.get(MEMORY_SCOPE.SESSION, "short-lived"), null);

  const restartedStore = createEncryptedFileStore(options);
  assert.deepEqual(restartedStore.list(), []);
  assert.equal(restartedStore.cleanupExpired(), 0);
});

test("encrypted file store isolates both tenants and namespaces", (context) => {
  const { options } = createDurableFixture(context);
  const tenantANamespaceA = createEncryptedFileStore(options);
  const tenantANamespaceB = createEncryptedFileStore({ ...options, namespace: "school-search" });
  const tenantBNamespaceA = createEncryptedFileStore({ ...options, tenantId: "tenant-b" });

  tenantANamespaceA.set({
    scope: MEMORY_SCOPE.SESSION,
    key: "region",
    value: { region: "서울" },
  });
  tenantANamespaceB.set({
    scope: MEMORY_SCOPE.SESSION,
    key: "region",
    value: { region: "대전" },
  });
  tenantBNamespaceA.set({
    scope: MEMORY_SCOPE.SESSION,
    key: "region",
    value: { region: "광주" },
  });

  assert.equal(tenantANamespaceA.get(MEMORY_SCOPE.SESSION, "region").value.region, "서울");
  assert.equal(tenantANamespaceB.get(MEMORY_SCOPE.SESSION, "region").value.region, "대전");
  assert.equal(tenantBNamespaceA.get(MEMORY_SCOPE.SESSION, "region").value.region, "광주");
  assert.equal(tenantANamespaceA.list().length, 1);
});

test("namespace export, deletion, and consent revocation remain scoped", (context) => {
  const { options } = createDurableFixture(context);
  const calendar = createEncryptedFileStore(options);
  const search = createEncryptedFileStore({ ...options, namespace: "school-search" });
  const otherTenant = createEncryptedFileStore({ ...options, tenantId: "tenant-b" });

  calendar.set({
    scope: MEMORY_SCOPE.SESSION,
    key: "region",
    value: { region: "서울" },
  });
  calendar.set({
    scope: MEMORY_SCOPE.PROFILE_REF,
    key: "profile",
    value: "user-store://profiles/parent-1",
  });
  search.set({
    scope: MEMORY_SCOPE.SESSION,
    key: "query-date",
    value: { date: "2026-08-01" },
  });
  otherTenant.set({
    scope: MEMORY_SCOPE.SESSION,
    key: "region",
    value: { region: "제주" },
  });

  assert.deepEqual(
    calendar.exportNamespace().map((record) => record.key),
    ["profile", "region"],
  );
  assert.equal(calendar.deleteNamespace(), 2);
  assert.deepEqual(calendar.exportNamespace(), []);
  assert.equal(search.list().length, 1);
  assert.equal(otherTenant.list().length, 1);

  assert.equal(search.revokeConsent(), 1);
  assert.deepEqual(search.list(), []);
  assert.equal(otherTenant.list().length, 1);
});

test("encrypted file store applies the existing allowlisted record validation", (context) => {
  const { directory, options } = createDurableFixture(context);
  const store = createEncryptedFileStore(options);

  assert.throws(
    () => store.set({
      scope: MEMORY_SCOPE.SESSION,
      key: "unsafe-child",
      value: { childName: "never-store" },
    }),
    /forbidden/,
  );
  assert.equal(readdirSync(directory).length, 0);
});

test("encrypted file store requires explicit storage and isolation inputs", (context) => {
  const { options: base } = createDurableFixture(context);

  assert.throws(() => createEncryptedFileStore({ ...base, filePath: undefined }), /filePath/);
  assert.throws(
    () => createEncryptedFileStore({ ...base, encryptionKey: Buffer.alloc(31) }),
    /32-byte key/,
  );
  assert.throws(() => createEncryptedFileStore({ ...base, tenantId: "../tenant" }), /tenantId/);
  assert.throws(() => createEncryptedFileStore({ ...base, namespace: "" }), /namespace/);
});
