const test = require("node:test");
const assert = require("node:assert/strict");

const { assertLoopbackHost, createKParentApiServer } = require("../src/server");

test("runtime refuses non-loopback binding before authentication exists", () => {
  assert.equal(assertLoopbackHost("127.0.0.1"), "127.0.0.1");
  assert.throws(() => assertLoopbackHost("0.0.0.0"), /loopback/);
});

async function withServer(run) {
  const server = createKParentApiServer({ now: () => new Date("2026-08-01T00:00:00.000Z") });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("health declares local ephemeral mode with effects disabled", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.memory, "ephemeral");
    assert.equal(body.sideEffectExecution, "disabled");
  });
});

test("action approval API records but does not execute a side effect", async () => {
  await withServer(async (baseUrl) => {
    const createdResponse = await fetch(`${baseUrl}/v1/actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "action-test-1",
        type: "application",
        label: "돌봄 신청",
        scope: { target: "official-service", fields: ["region"] },
      }),
    });
    const created = await createdResponse.json();
    assert.equal(createdResponse.status, 201);
    assert.equal(created.status, "awaiting_approval");

    const decisionResponse = await fetch(`${baseUrl}/v1/actions/${created.id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision: "approved", actor: "parent-session" }),
    });
    const decided = await decisionResponse.json();
    assert.equal(decisionResponse.status, 200);
    assert.equal(decided.status, "approved");

    const executeResponse = await fetch(`${baseUrl}/v1/actions/${created.id}/execute`, { method: "POST" });
    assert.equal(executeResponse.status, 404);
  });
});

test("session memory is retrievable and rejects sensitive values", async () => {
  await withServer(async (baseUrl) => {
    const safeResponse = await fetch(`${baseUrl}/v1/memory/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "session-1:region", value: { region: "서울" }, ttlSeconds: 60 }),
    });
    assert.equal(safeResponse.status, 201);

    const getResponse = await fetch(`${baseUrl}/v1/memory/session/${encodeURIComponent("session-1:region")}`);
    assert.equal(getResponse.status, 200);
    assert.equal((await getResponse.json()).value.region, "서울");

    const unsafeResponse = await fetch(`${baseUrl}/v1/memory/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "unsafe", value: { password: "never-store" } }),
    });
    assert.equal(unsafeResponse.status, 400);
    assert.match((await unsafeResponse.json()).message, /forbidden/);
  });
});
