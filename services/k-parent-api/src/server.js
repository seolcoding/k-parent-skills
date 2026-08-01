const http = require("node:http");
const { URL } = require("node:url");

const {
  createActionRequest,
  decideActionRequest,
} = require("../../../packages/k-parent-core");
const {
  MEMORY_SCOPE,
  createInMemoryStore,
} = require("../../../packages/k-parent-memory");

const MAX_BODY_BYTES = 64 * 1024;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);

function assertLoopbackHost(host) {
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error("k-parent-api may bind only to a loopback host until authentication is implemented.");
  }
  return host;
}

function createKParentApiServer(options = {}) {
  const memory = options.memoryStore || createInMemoryStore({ now: options.now });
  const now = typeof options.now === "function" ? options.now : () => new Date();

  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");

      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, {
          ok: true,
          service: "k-parent-api",
          mode: "local-only",
          memory: "ephemeral",
          sideEffectExecution: "disabled",
          layers: ["skill", "policy", "memory", "tool"],
        });
      }

      if (request.method === "POST" && url.pathname === "/v1/actions") {
        const body = await readJsonBody(request);
        const action = createActionRequest(body, { now: now() });
        storeAction(memory, action, now());
        return sendJson(response, 201, action);
      }

      const actionMatch = url.pathname.match(/^\/v1\/actions\/([^/]+)$/);
      if (request.method === "GET" && actionMatch) {
        const action = getAction(memory, decodeURIComponent(actionMatch[1]));
        if (!action) return sendError(response, 404, "action_not_found", "Action request was not found.");
        return sendJson(response, 200, action);
      }

      const decisionMatch = url.pathname.match(/^\/v1\/actions\/([^/]+)\/decision$/);
      if (request.method === "POST" && decisionMatch) {
        const id = decodeURIComponent(decisionMatch[1]);
        const action = getAction(memory, id);
        if (!action) return sendError(response, 404, "action_not_found", "Action request was not found.");
        const body = await readJsonBody(request);
        const decided = decideActionRequest(action, body, { now: now() });
        storeAction(memory, decided, now());
        return sendJson(response, 200, decided);
      }

      if (request.method === "POST" && url.pathname === "/v1/memory/session") {
        const body = await readJsonBody(request);
        const record = memory.set({
          scope: MEMORY_SCOPE.SESSION,
          key: body.key,
          value: body.value,
          ttlSeconds: body.ttlSeconds,
          sourceRef: body.sourceRef || null,
        });
        return sendJson(response, 201, record);
      }

      const memoryMatch = url.pathname.match(/^\/v1\/memory\/session\/([^/]+)$/);
      if (request.method === "GET" && memoryMatch) {
        const record = memory.get(MEMORY_SCOPE.SESSION, decodeURIComponent(memoryMatch[1]));
        if (!record) return sendError(response, 404, "memory_not_found", "Memory record was not found or expired.");
        return sendJson(response, 200, record);
      }

      return sendError(response, 404, "not_found", "Route not found.");
    } catch (error) {
      const status = error.code === "BODY_TOO_LARGE" ? 413 : 400;
      return sendError(response, status, "invalid_request", error.message);
    }
  });
}

function storeAction(memory, action, now) {
  memory.set({
    scope: MEMORY_SCOPE.APPROVAL_AUDIT,
    key: action.id,
    value: action,
    ttlSeconds: 24 * 60 * 60,
    createdAt: now,
  });
}

function getAction(memory, id) {
  return memory.get(MEMORY_SCOPE.APPROVAL_AUDIT, id)?.value || null;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    request.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        const error = Object.assign(new Error("Request body exceeds 64 KiB."), {
          code: "BODY_TOO_LARGE",
        });
        reject(error);
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function sendError(response, status, code, message) {
  return sendJson(response, status, { ok: false, error: code, message });
}

if (require.main === module) {
  const host = assertLoopbackHost(process.env.KPARENT_API_HOST || "127.0.0.1");
  const port = Number(process.env.KPARENT_API_PORT || 4030);
  createKParentApiServer().listen(port, host, () => {
    console.log(`k-parent-api listening on http://${host}:${port}`);
  });
}

module.exports = {
  LOOPBACK_HOSTS,
  MAX_BODY_BYTES,
  assertLoopbackHost,
  createKParentApiServer,
  getAction,
  readJsonBody,
  storeAction,
};
