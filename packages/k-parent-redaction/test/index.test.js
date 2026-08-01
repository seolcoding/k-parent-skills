"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  CIRCULAR,
  DEPTH_LIMIT,
  ENTRY_LIMIT,
  PAYLOAD_LIMIT,
  REDACTED,
  containsSensitiveString,
  createSanitizedLogger,
  isForbiddenKey,
  normalizeKey,
  sanitize,
  sanitizeError,
} = require("../src");

test("normalizes credential and family identity keys before matching", () => {
  assert.equal(normalizeKey(" Client_Secret "), "clientsecret");
  assert.equal(isForbiddenKey("API-KEY"), true);
  assert.equal(isForbiddenKey("child_2_name"), true);
  assert.equal(isForbiddenKey("guardian-name"), true);
  assert.equal(isForbiddenKey("자녀 이름"), true);

  const result = sanitize({
    Client_Secret: "example-credential-value",
    "child-2-name": "Example Child",
    보호자_연락처: "000-0000-0000",
    childAge: 8,
    grade: 2,
  });

  assert.equal(result.Client_Secret, REDACTED);
  assert.equal(result["child-2-name"], REDACTED);
  assert.equal(result.보호자_연락처, REDACTED);
  assert.equal(result.childAge, 8);
  assert.equal(result.grade, 2);
});

test("recursively redacts forbidden keys without mutating the input", () => {
  const input = {
    request: {
      headers: { authorization: "example-auth-value" },
      items: [{ password: "example-password-value", status: "ready" }],
    },
  };
  const result = sanitize(input);

  assert.deepEqual(result, {
    request: {
      headers: { authorization: REDACTED },
      items: [{ password: REDACTED, status: "ready" }],
    },
  });
  assert.equal(input.request.headers.authorization, "example-auth-value");
});

test("blocks generic identity leaves inside child and family containers", () => {
  const result = sanitize({
    child: {
      name: "Example Child",
      age: 8,
      school: { studentNumber: "example-student-number", grade: 2 },
    },
    family: {
      members: [{ email: "example-family@example.invalid", role: "guardian" }],
    },
    program: { name: "Public program name" },
  });

  assert.equal(result.child.name, REDACTED);
  assert.equal(result.child.age, 8);
  assert.equal(result.child.school.studentNumber, REDACTED);
  assert.equal(result.child.school.grade, 2);
  assert.equal(result.family.members[0].email, REDACTED);
  assert.equal(result.family.members[0].role, "guardian");
  assert.equal(result.program.name, "Public program name");
  assert.equal(sanitize({ child: "Example Child" }).child, REDACTED);
});

test("detects bearer, JWT, cookie, API-key, and credential strings", () => {
  const examples = [
    "Bearer example_bearer_credential_value",
    "eyJleGFtcGxlIjoiMSJ9.eyJleGFtcGxlIjoyfQ.example_signature_value",
    "Cookie: example_session=example_cookie_value",
    "session_id=example_cookie_value; Path=/",
    "api_key=example_api_key_value",
    "password: example_password_value",
    "sk-test-examplecredentialvalue1234",
  ];

  for (const value of examples) {
    assert.equal(containsSensitiveString(value), true, value);
    assert.equal(sanitize(value), REDACTED, value);
  }
  assert.equal(sanitize("public status: ready"), "public status: ready");
});

test("preserves public provenance URLs and timestamps while masking URL secrets", () => {
  const result = sanitize({
    sourceUrl: "https://data.example.org/notices/42?locale=ko&api_key=example_api_key_value&token=example_token_value",
    fetchedAt: "2026-08-01T00:00:00.000Z",
    confirmedAt: new Date("2026-08-01T01:02:03.000Z"),
  });

  assert.match(result.sourceUrl, /^https:\/\/data\.example\.org\/notices\/42\?/);
  assert.match(result.sourceUrl, /locale=ko/);
  assert.match(result.sourceUrl, /api_key=%5BREDACTED%5D/);
  assert.match(result.sourceUrl, /token=%5BREDACTED%5D/);
  assert.equal(result.fetchedAt, "2026-08-01T00:00:00.000Z");
  assert.equal(result.confirmedAt, "2026-08-01T01:02:03.000Z");
});

test("removes URL userinfo and masks sensitive URL path and fragment material", () => {
  const result = sanitize({
    url: "https://example-user:example-pass@data.example.org/Bearer%20example_bearer_value#api_key=example_value",
  });

  assert.doesNotMatch(result.url, /example-user|example-pass|example_bearer_value|example_value/);
  assert.match(result.url, /data\.example\.org/);
  assert.match(result.url, /REDACTED/);
});

test("handles circular references and repeated non-circular references", () => {
  const shared = { status: "ready" };
  const input = { first: shared, second: shared };
  input.self = input;

  const result = sanitize(input);
  assert.equal(result.self, CIRCULAR);
  assert.deepEqual(result.first, { status: "ready" });
  assert.deepEqual(result.second, { status: "ready" });
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("enforces depth and global entry limits", () => {
  assert.deepEqual(
    sanitize({ level1: { level2: { status: "ready" } } }, { maxDepth: 2 }),
    { level1: { level2: DEPTH_LIMIT } },
  );

  const limited = sanitize({ first: 1, second: 2, third: 3 }, { maxEntries: 2 });
  assert.equal(limited.first, 1);
  assert.equal(limited.second, 2);
  assert.equal(limited.__truncated__, ENTRY_LIMIT);
  assert.equal("third" in limited, false);
});

test("enforces string and serialized payload limits", () => {
  const stringLimited = sanitize("x".repeat(100), { maxStringLength: 24 });
  assert.equal(stringLimited.length, 24);
  assert.match(stringLimited, /\[TRUNCATED\]$/);

  const payloadLimited = sanitize({
    sourceUrl: "https://data.example.org/public/notices",
    fetchedAt: "2026-08-01T00:00:00.000Z",
    large: "x".repeat(2000),
    later: "omitted",
  }, { maxPayloadBytes: 160 });
  assert.ok(Buffer.byteLength(JSON.stringify(payloadLimited), "utf8") <= 160);
  assert.equal(payloadLimited.sourceUrl, "https://data.example.org/public/notices");
  assert.equal(payloadLimited.fetchedAt, "2026-08-01T00:00:00.000Z");
  assert.equal(payloadLimited.__truncated__, PAYLOAD_LIMIT);
});

test("converts non-JSON primitives and binary values to safe metadata", () => {
  const result = sanitize({
    count: 12n,
    invalid: Number.NaN,
    bytes: Buffer.from("example binary content"),
    missing: undefined,
  });

  assert.deepEqual(result, {
    count: "12n",
    invalid: "NaN",
    bytes: "[BINARY]: 22 bytes",
    missing: "[UNDEFINED]",
  });
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("sanitizeError retains diagnostics but redacts messages, causes, and custom fields", () => {
  const cause = new Error("public upstream failure");
  cause.apiKey = "example-api-key-value";
  const error = new TypeError("authorization: example_authorization_value", { cause });
  error.childName = "Example Child";
  error.context = { sourceUrl: "https://status.example.org/incidents/42" };

  const result = sanitizeError(error);
  assert.equal(result.name, "TypeError");
  assert.equal(result.message, REDACTED);
  assert.equal(result.stack, REDACTED);
  assert.equal(result.childName, REDACTED);
  assert.equal(result.cause.message, "public upstream failure");
  assert.equal(result.cause.apiKey, REDACTED);
  assert.equal(result.context.sourceUrl, "https://status.example.org/incidents/42");
});

test("sanitizeError is circular-safe for self-referential causes", () => {
  const error = new Error("public failure");
  error.cause = error;
  assert.equal(sanitizeError(error).cause, CIRCULAR);
});

test("does not invoke forbidden getters and contains throwing getters", () => {
  let forbiddenGetterCalls = 0;
  const input = {};
  Object.defineProperty(input, "password", {
    enumerable: true,
    get() {
      forbiddenGetterCalls += 1;
      throw new Error("must not run");
    },
  });
  Object.defineProperty(input, "status", {
    enumerable: true,
    get() {
      throw new Error("example getter failure");
    },
  });

  const result = sanitize(input);
  assert.equal(result.password, REDACTED);
  assert.equal(result.status, "[UNAVAILABLE]");
  assert.equal(forbiddenGetterCalls, 0);
});

test("sanitized logger passes sanitized arguments only and preserves logger context", () => {
  const calls = [];
  const logger = {
    prefix: "captured",
    info(...args) {
      calls.push([this.prefix, ...args]);
      return "logged";
    },
    error(...args) {
      calls.push([this.prefix, ...args]);
    },
  };
  const safeLogger = createSanitizedLogger(logger);

  assert.equal(safeLogger.info("request", { cookie: "example-cookie-value", status: "ready" }), "logged");
  safeLogger.error(new Error("Bearer example_bearer_credential_value"));

  assert.deepEqual(calls[0], ["captured", "request", { cookie: REDACTED, status: "ready" }]);
  assert.equal(calls[1][1].message, REDACTED);
  assert.equal(calls[1][1].stack, REDACTED);
  assert.doesNotMatch(JSON.stringify(calls), /example-cookie-value|example_bearer_credential_value/);
});

test("sanitized logger blocks credentials supplied through format placeholders", () => {
  const calls = [];
  const logger = { warn: (...args) => calls.push(args) };
  const safeLogger = createSanitizedLogger(logger);

  safeLogger.warn("request failed password=%s", "example-standalone-credential", { status: "denied" });
  assert.deepEqual(calls, [[REDACTED, REDACTED, REDACTED]]);
});

test("rejects invalid safety limits", () => {
  assert.throws(() => sanitize({}, { maxDepth: 0 }), /maxDepth/);
  assert.throws(() => sanitize({}, { maxEntries: -1 }), /maxEntries/);
  assert.throws(() => sanitize({}, { maxStringLength: 8 }), /maxStringLength/);
  assert.throws(() => sanitize({}, { maxPayloadBytes: 32 }), /maxPayloadBytes/);
});
