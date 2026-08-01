const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MAX_BODY_BYTES,
  assertLoopbackHost,
  createEnvTokenTenantResolver,
  createKParentApiServer,
  createTokenTenantResolver,
  toTenantStorageKey,
} = require("../src/server");
const { MEMORY_SCOPE, createInMemoryStore } = require("../../../packages/k-parent-memory");

const TOKENS = Object.freeze({
  alpha: "alpha-test-bearer-secret",
  beta: "beta-test-bearer-secret",
});

const AUTH_CONFIG = Object.freeze({
  tokenTenants: Object.freeze({
    [TOKENS.alpha]: "tenant-alpha",
    [TOKENS.beta]: "tenant-beta",
  }),
});

test("runtime remains loopback-only", () => {
  assert.equal(assertLoopbackHost("127.0.0.1"), "127.0.0.1");
  assert.throws(() => assertLoopbackHost("0.0.0.0"), /loopback/);
});

test("token-to-tenant resolver supports injected and env-backed config without exposing tokens", () => {
  const injected = createTokenTenantResolver(AUTH_CONFIG);
  assert.equal(injected(TOKENS.alpha), "tenant-alpha");
  assert.equal(injected("unknown-token"), null);

  const fromEnv = createEnvTokenTenantResolver({
    KPARENT_API_TOKEN_TENANTS: JSON.stringify(AUTH_CONFIG.tokenTenants),
  });
  assert.equal(fromEnv(TOKENS.beta), "tenant-beta");

  const secretInMalformedConfig = "must-not-appear-in-errors";
  assert.throws(
    () => createEnvTokenTenantResolver({ KPARENT_API_TOKEN_TENANTS: `{${secretInMalformedConfig}` }),
    (error) => !error.message.includes(secretInMalformedConfig),
  );
  assert.throws(() => createKParentApiServer(), /requires a bearer token-to-tenant resolver/);
});

async function withServer(run, options = {}) {
  const now = options.now || (() => new Date("2026-08-01T00:00:00.000Z"));
  const server = createKParentApiServer({ auth: AUTH_CONFIG, ...options, now });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function authHeaders(token, json = false) {
  return {
    authorization: `Bearer ${token}`,
    ...(json ? { "content-type": "application/json" } : {}),
  };
}

function actionBody(overrides = {}) {
  return {
    type: "application",
    label: "돌봄 신청",
    scope: { target: "official-service", fields: ["region"] },
    ...overrides,
  };
}

async function createAction(baseUrl, token, overrides = {}) {
  return fetch(`${baseUrl}/v1/actions`, {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(actionBody(overrides)),
  });
}

test("health is public and declares authenticated tenant isolation", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.memory, "ephemeral");
    assert.equal(body.authentication, "bearer");
    assert.equal(body.tenantIsolation, "enabled");
    assert.equal(body.sideEffectExecution, "disabled");
  });
});

test("all action and memory paths reject missing, malformed, and invalid credentials", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/v1/actions`, { method: "POST" });
    assert.equal(missing.status, 401);
    assert.equal(missing.headers.get("www-authenticate"), "Bearer");
    assert.equal((await missing.json()).error, "missing_credentials");

    const malformed = await fetch(`${baseUrl}/v1/memory/session/a`, {
      headers: { authorization: "Basic abc" },
    });
    assert.equal(malformed.status, 401);
    assert.equal((await malformed.json()).error, "invalid_credentials");

    const invalidToken = "invalid-bearer-value";
    const invalid = await fetch(`${baseUrl}/v1/actions/not-an-id/decision`, {
      method: "POST",
      headers: authHeaders(invalidToken),
    });
    const invalidBody = await invalid.text();
    assert.equal(invalid.status, 401);
    assert.equal(invalidBody.includes(invalidToken), false);

    const unauthenticatedExecute = await fetch(`${baseUrl}/v1/actions/any/execute`, { method: "POST" });
    assert.equal(unauthenticatedExecute.status, 401);
  });
});

test("actions and session memory are isolated across tenant namespaces", async () => {
  await withServer(async (baseUrl) => {
    const createdResponse = await createAction(baseUrl, TOKENS.alpha);
    const created = await createdResponse.json();
    assert.equal(createdResponse.status, 201);

    const crossTenantAction = await fetch(`${baseUrl}/v1/actions/${created.id}`, {
      headers: authHeaders(TOKENS.beta),
    });
    assert.equal(crossTenantAction.status, 404);

    const crossTenantDecision = await fetch(`${baseUrl}/v1/actions/${created.id}/decision`, {
      method: "POST",
      headers: authHeaders(TOKENS.beta, true),
      body: JSON.stringify({ decision: "approved", actor: "other-parent" }),
    });
    assert.equal(crossTenantDecision.status, 404);

    const ownAction = await fetch(`${baseUrl}/v1/actions/${created.id}`, {
      headers: authHeaders(TOKENS.alpha),
    });
    assert.equal(ownAction.status, 200);

    const alphaMemory = await fetch(`${baseUrl}/v1/memory/session`, {
      method: "POST",
      headers: authHeaders(TOKENS.alpha, true),
      body: JSON.stringify({ key: "shared-key", value: { region: "서울" }, ttlSeconds: 60 }),
    });
    assert.equal(alphaMemory.status, 201);
    assert.equal((await alphaMemory.json()).key, "shared-key");

    const missingFromBeta = await fetch(`${baseUrl}/v1/memory/session/shared-key`, {
      headers: authHeaders(TOKENS.beta),
    });
    assert.equal(missingFromBeta.status, 404);

    const betaMemory = await fetch(`${baseUrl}/v1/memory/session`, {
      method: "POST",
      headers: authHeaders(TOKENS.beta, true),
      body: JSON.stringify({ key: "shared-key", value: { region: "부산" }, ttlSeconds: 60 }),
    });
    assert.equal(betaMemory.status, 201);

    const [alphaRead, betaRead] = await Promise.all([
      fetch(`${baseUrl}/v1/memory/session/shared-key`, { headers: authHeaders(TOKENS.alpha) }),
      fetch(`${baseUrl}/v1/memory/session/shared-key`, { headers: authHeaders(TOKENS.beta) }),
    ]);
    assert.equal((await alphaRead.json()).value.region, "서울");
    assert.equal((await betaRead.json()).value.region, "부산");
  });
});

test("authenticated HITL API uses server IDs, records minimal audit, and never executes", async () => {
  const memoryStore = createInMemoryStore({ now: () => new Date("2026-08-01T00:00:00.000Z") });
  await withServer(async (baseUrl) => {
    const createdResponse = await createAction(baseUrl, TOKENS.alpha, { id: "client-controlled-id" });
    const created = await createdResponse.json();
    assert.equal(createdResponse.status, 201);
    assert.equal(created.status, "awaiting_approval");
    assert.notEqual(created.id, "client-controlled-id");

    const auditKey = toTenantStorageKey("tenant-alpha", "approval-audit", created.id);
    const audit = memoryStore.get(MEMORY_SCOPE.APPROVAL_AUDIT, auditKey).value;
    assert.equal(audit.actionId, created.id);
    assert.equal(audit.scope, undefined);
    assert.equal(audit.label, undefined);

    const decisionResponse = await fetch(`${baseUrl}/v1/actions/${created.id}/decision`, {
      method: "POST",
      headers: authHeaders(TOKENS.alpha, true),
      body: JSON.stringify({ decision: "approved", actor: "parent-session" }),
    });
    const decided = await decisionResponse.json();
    assert.equal(decisionResponse.status, 200);
    assert.equal(decided.status, "approved");

    const executeResponse = await fetch(`${baseUrl}/v1/actions/${created.id}/execute`, {
      method: "POST",
      headers: authHeaders(TOKENS.alpha),
    });
    assert.equal(executeResponse.status, 404);
  }, { memoryStore });
});

test("request bodies are size and structure bounded", async () => {
  await withServer(async (baseUrl) => {
    const oversizedResponse = await createAction(baseUrl, TOKENS.alpha, {
      label: "x".repeat(MAX_BODY_BYTES),
    });
    assert.equal(oversizedResponse.status, 413);

    let nested = "value";
    for (let depth = 0; depth < 14; depth += 1) nested = { child: nested };
    const complexResponse = await createAction(baseUrl, TOKENS.alpha, { scope: nested });
    assert.equal(complexResponse.status, 400);
    assert.equal((await complexResponse.json()).error, "invalid_request");
  });
});

test("session memory still rejects sensitive values", async () => {
  await withServer(async (baseUrl) => {
    const unsafeResponse = await fetch(`${baseUrl}/v1/memory/session`, {
      method: "POST",
      headers: authHeaders(TOKENS.alpha, true),
      body: JSON.stringify({ key: "unsafe", value: { password: "never-store" } }),
    });
    assert.equal(unsafeResponse.status, 400);
    assert.match((await unsafeResponse.json()).message, /forbidden/);
  });
});
