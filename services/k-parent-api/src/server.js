const { createHash } = require("node:crypto");
const http = require("node:http");
const { URL } = require("node:url");

const {
  createActionRequest,
  decideActionRequest,
} = require("../../../packages/k-parent-core");
const {
  MEMORY_SCOPE,
  createEncryptedFileStore,
  createInMemoryStore,
} = require("../../../packages/k-parent-memory");
const {
  REDACTED,
  sanitizeError,
} = require("../../../packages/k-parent-redaction");

const MAX_BODY_BYTES = 64 * 1024;
const BODY_TIMEOUT_MS = 5_000;
const MAX_JSON_DEPTH = 12;
const MAX_JSON_NODES = 512;
const MAX_JSON_STRING_BYTES = 4 * 1024;
const MAX_AUTH_TOKEN_BYTES = 512;
const MAX_CONFIGURED_TOKENS = 1_000;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);
const TENANT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
const MEMORY_KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

function assertLoopbackHost(host) {
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error("k-parent-api remains loopback-only without production deployment controls.");
  }
  return host;
}

function createTokenTenantResolver(config = {}) {
  const tokenTenants = config.tokenTenants;
  if (!tokenTenants || typeof tokenTenants !== "object" || Array.isArray(tokenTenants)) {
    throw new Error("Bearer authentication requires a token-to-tenant configuration.");
  }

  const entries = Object.entries(tokenTenants);
  if (entries.length === 0 || entries.length > MAX_CONFIGURED_TOKENS) {
    throw new Error(`Bearer authentication requires between 1 and ${MAX_CONFIGURED_TOKENS} configured tokens.`);
  }

  const tenantByTokenDigest = new Map();
  for (const [token, tenantId] of entries) {
    if (!isBoundedToken(token) || !isTenantId(tenantId)) {
      throw new Error("Bearer authentication configuration contains an invalid credential entry.");
    }
    tenantByTokenDigest.set(digestToken(token), tenantId);
  }

  return (token) => {
    if (!isBoundedToken(token)) return null;
    return tenantByTokenDigest.get(digestToken(token)) || null;
  };
}

function createEnvTokenTenantResolver(env = process.env) {
  const serialized = env.KPARENT_API_TOKEN_TENANTS;
  if (typeof serialized !== "string" || !serialized) {
    throw new Error("KPARENT_API_TOKEN_TENANTS must configure bearer authentication.");
  }

  let tokenTenants;
  try {
    tokenTenants = JSON.parse(serialized);
  } catch {
    throw new Error("KPARENT_API_TOKEN_TENANTS must be a valid JSON object.");
  }
  return createTokenTenantResolver({ tokenTenants });
}

function createEnvMemoryStoreConfig(env = process.env) {
  const filePath = env.KPARENT_MEMORY_FILE;
  const encodedKey = env.KPARENT_MEMORY_KEY_BASE64;

  if (!filePath && !encodedKey) {
    return { memoryMode: "ephemeral", memoryStoreForTenant: null };
  }
  if (!filePath || !encodedKey) {
    throw new Error("KPARENT_MEMORY_FILE and KPARENT_MEMORY_KEY_BASE64 must be configured together.");
  }

  const encryptionKey = decodeMemoryEncryptionKey(encodedKey);
  const stores = new Map();
  return {
    memoryMode: "encrypted-file",
    memoryStoreForTenant(tenantId) {
      if (!isTenantId(tenantId)) throw new Error("A valid tenant namespace is required.");
      if (!stores.has(tenantId)) {
        stores.set(tenantId, createEncryptedFileStore({
          encryptionKey,
          filePath,
          namespace: "runtime",
          tenantId,
        }));
      }
      return stores.get(tenantId);
    },
  };
}

function createKParentApiServer(options = {}) {
  const defaultMemory = options.memoryStore || createInMemoryStore({ now: options.now });
  const memoryStoreForTenant = options.memoryStoreForTenant || (() => defaultMemory);
  const actions = options.actionStore || new Map();
  const now = typeof options.now === "function" ? options.now : () => new Date();
  const resolveTenant = options.resolveTenant
    || (options.auth ? createTokenTenantResolver(options.auth) : null);
  const bodyTimeoutMs = options.bodyTimeoutMs || BODY_TIMEOUT_MS;

  if (typeof resolveTenant !== "function") {
    throw new Error("k-parent-api requires a bearer token-to-tenant resolver.");
  }
  if (typeof memoryStoreForTenant !== "function") {
    throw new Error("memoryStoreForTenant must be a function when configured.");
  }

  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");

      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, {
          ok: true,
          service: "k-parent-api",
          mode: "local-only",
          memory: options.memoryMode || "ephemeral",
          authentication: "bearer",
          tenantIsolation: "enabled",
          sideEffectExecution: "disabled",
          layers: ["runtime", "policy", "memory"],
        });
      }

      let tenantId = null;
      if (isProtectedPath(url.pathname)) {
        tenantId = authenticateRequest(request, response, resolveTenant);
        if (!tenantId) return undefined;
      }
      const memory = tenantId ? memoryStoreForTenant(tenantId) : defaultMemory;

      if (request.method === "POST" && url.pathname === "/v1/actions") {
        const body = await readJsonBody(request, { bodyTimeoutMs });
        const { id: _ignoredClientId, ...actionInput } = body;
        const action = createActionRequest(actionInput, { now: now() });
        storeAction(actions, memory, tenantId, action, now());
        return sendJson(response, 201, action);
      }

      const actionMatch = url.pathname.match(/^\/v1\/actions\/([^/]+)$/);
      if (request.method === "GET" && actionMatch) {
        const id = decodeResourceId(actionMatch[1]);
        const action = getAction(actions, tenantId, id);
        if (!action) return sendError(response, 404, "action_not_found", "Action request was not found.");
        return sendJson(response, 200, action);
      }

      const decisionMatch = url.pathname.match(/^\/v1\/actions\/([^/]+)\/decision$/);
      if (request.method === "POST" && decisionMatch) {
        const id = decodeResourceId(decisionMatch[1]);
        const action = getAction(actions, tenantId, id);
        if (!action) return sendError(response, 404, "action_not_found", "Action request was not found.");
        const body = await readJsonBody(request, { bodyTimeoutMs });
        const decided = decideActionRequest(action, body, { now: now() });
        storeAction(actions, memory, tenantId, decided, now());
        return sendJson(response, 200, decided);
      }

      if (request.method === "POST" && url.pathname === "/v1/memory/session") {
        const body = await readJsonBody(request, { bodyTimeoutMs });
        const key = assertMemoryKey(body.key);
        const record = memory.set({
          scope: MEMORY_SCOPE.SESSION,
          key: toTenantStorageKey(tenantId, "session", key),
          value: body.value,
          ttlSeconds: body.ttlSeconds,
          sourceRef: body.sourceRef || null,
        });
        return sendJson(response, 201, toPublicMemoryRecord(record, key));
      }

      const memoryMatch = url.pathname.match(/^\/v1\/memory\/session\/([^/]+)$/);
      if (request.method === "GET" && memoryMatch) {
        const key = assertMemoryKey(decodeURIComponent(memoryMatch[1]));
        const record = memory.get(
          MEMORY_SCOPE.SESSION,
          toTenantStorageKey(tenantId, "session", key),
        );
        if (!record) return sendError(response, 404, "memory_not_found", "Memory record was not found or expired.");
        return sendJson(response, 200, toPublicMemoryRecord(record, key));
      }

      return sendError(response, 404, "not_found", "Route not found.");
    } catch (error) {
      const status = error.code === "BODY_TOO_LARGE"
        ? 413
        : error.code === "BODY_TIMEOUT" ? 408 : 400;
      return sendError(
        response,
        status,
        "invalid_request",
        safeErrorMessage(error, "Request could not be processed."),
      );
    }
  });
}

function authenticateRequest(request, response, resolveTenant) {
  const authorization = request.headers.authorization;
  if (typeof authorization !== "string") {
    sendAuthError(response, "missing_credentials", "Bearer authentication is required.");
    return null;
  }

  const match = authorization.match(/^Bearer ([^\s]+)$/i);
  if (!match || !isBoundedToken(match[1])) {
    sendAuthError(response, "invalid_credentials", "Bearer credentials are invalid.");
    return null;
  }

  let tenantId = null;
  try {
    tenantId = resolveTenant(match[1]);
  } catch {
    tenantId = null;
  }
  if (!isTenantId(tenantId)) {
    sendAuthError(response, "invalid_credentials", "Bearer credentials are invalid.");
    return null;
  }
  return tenantId;
}

function isProtectedPath(pathname) {
  return pathname === "/v1/actions"
    || pathname.startsWith("/v1/actions/")
    || pathname === "/v1/memory"
    || pathname.startsWith("/v1/memory/");
}

function storeAction(actions, memory, tenantId, action, now) {
  actions.set(toTenantStorageKey(tenantId, "action", action.id), action);
  memory.set({
    scope: MEMORY_SCOPE.APPROVAL_AUDIT,
    key: toTenantStorageKey(tenantId, "approval-audit", action.id),
    value: toAuditEnvelope(action),
    ttlSeconds: 24 * 60 * 60,
    createdAt: now,
  });
}

function getAction(actions, tenantId, id) {
  return actions.get(toTenantStorageKey(tenantId, "action", id)) || null;
}

function toTenantStorageKey(tenantId, kind, key) {
  if (!isTenantId(tenantId)) throw new Error("A valid tenant namespace is required.");
  return `t:${createHash("sha256").update(`${tenantId}\0${kind}\0${key}`).digest("hex")}`;
}

function toPublicMemoryRecord(record, key) {
  return { ...record, key };
}

function toAuditEnvelope(action) {
  return {
    actionId: action.id,
    type: action.type,
    status: action.status,
    risk: action.risk,
    scopeDigest: action.scopeDigest,
    approvalDigest: action.approvalDigest,
    decision: action.approval?.decision || null,
    actor: action.approval?.actor || null,
    createdAt: action.createdAt,
    decidedAt: action.approval?.decidedAt || null,
    expiresAt: action.approval?.expiresAt || null,
  };
}

function readJsonBody(request, options = {}) {
  const maxBodyBytes = options.maxBodyBytes || MAX_BODY_BYTES;
  const bodyTimeoutMs = options.bodyTimeoutMs || BODY_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const declaredLength = Number(request.headers["content-length"]);
    if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
      request.resume();
      reject(bodyError("Request body exceeds 64 KiB.", "BODY_TOO_LARGE"));
      return;
    }

    const chunks = [];
    let bytes = 0;
    let settled = false;
    const timer = setTimeout(() => {
      fail(bodyError("Request body was not received within the time limit.", "BODY_TIMEOUT"));
    }, bodyTimeoutMs);
    timer.unref();

    function cleanup() {
      clearTimeout(timer);
      request.removeListener("data", onData);
      request.removeListener("end", onEnd);
      request.removeListener("error", onError);
    }

    function fail(error) {
      if (settled) return;
      settled = true;
      cleanup();
      request.resume();
      reject(error);
    }

    function onData(chunk) {
      bytes += chunk.length;
      if (bytes > maxBodyBytes) {
        fail(bodyError("Request body exceeds 64 KiB.", "BODY_TOO_LARGE"));
        return;
      }
      chunks.push(chunk);
    }

    function onEnd() {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        const body = raw ? JSON.parse(raw) : {};
        assertBoundedJson(body);
        resolve(body);
      } catch (error) {
        reject(error.code ? error : new Error("Request body must be valid, bounded JSON."));
      }
    }

    function onError(error) {
      fail(error);
    }

    request.on("data", onData);
    request.on("end", onEnd);
    request.on("error", onError);
  });
}

function assertBoundedJson(value) {
  let nodes = 0;

  function visit(current, depth) {
    nodes += 1;
    if (nodes > MAX_JSON_NODES || depth > MAX_JSON_DEPTH) {
      throw new Error("Request JSON structure exceeds the allowed complexity.");
    }
    if (typeof current === "string" && Buffer.byteLength(current, "utf8") > MAX_JSON_STRING_BYTES) {
      throw new Error("Request JSON string exceeds 4 KiB.");
    }
    if (Array.isArray(current)) {
      current.forEach((child) => visit(child, depth + 1));
    } else if (current && typeof current === "object") {
      Object.entries(current).forEach(([key, child]) => {
        visit(key, depth + 1);
        visit(child, depth + 1);
      });
    }
  }

  visit(value, 0);
  return value;
}

function bodyError(message, code) {
  return Object.assign(new Error(message), { code });
}

function decodeResourceId(value) {
  const id = decodeURIComponent(value);
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error("Action id is invalid.");
  return id;
}

function assertMemoryKey(key) {
  if (typeof key !== "string" || !MEMORY_KEY_PATTERN.test(key)) {
    throw new Error("memory key must be a non-empty safe identifier.");
  }
  return key;
}

function isBoundedToken(token) {
  return typeof token === "string"
    && token.length > 0
    && Buffer.byteLength(token, "utf8") <= MAX_AUTH_TOKEN_BYTES;
}

function isTenantId(tenantId) {
  return typeof tenantId === "string" && TENANT_ID_PATTERN.test(tenantId);
}

function digestToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function decodeMemoryEncryptionKey(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
    throw new Error("KPARENT_MEMORY_KEY_BASE64 must encode exactly 32 bytes.");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) {
    throw new Error("KPARENT_MEMORY_KEY_BASE64 must encode exactly 32 bytes.");
  }
  return key;
}

function safeErrorMessage(error, fallback) {
  const sanitized = sanitizeError(error);
  return typeof sanitized?.message === "string" && sanitized.message !== REDACTED
    ? sanitized.message
    : fallback;
}

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

function sendAuthError(response, code, message) {
  return sendJson(response, 401, { ok: false, error: code, message }, {
    "www-authenticate": "Bearer",
  });
}

function sendError(response, status, code, message) {
  return sendJson(response, status, { ok: false, error: code, message });
}

if (require.main === module) {
  const host = assertLoopbackHost(process.env.KPARENT_API_HOST || "127.0.0.1");
  const port = Number(process.env.KPARENT_API_PORT || 4030);
  const resolveTenant = createEnvTokenTenantResolver(process.env);
  const memoryConfig = createEnvMemoryStoreConfig(process.env);
  createKParentApiServer({ resolveTenant, ...memoryConfig }).listen(port, host, () => {
    console.log(`k-parent-api listening on http://${host}:${port}`);
  });
}

module.exports = {
  BODY_TIMEOUT_MS,
  LOOPBACK_HOSTS,
  MAX_AUTH_TOKEN_BYTES,
  MAX_BODY_BYTES,
  assertBoundedJson,
  assertLoopbackHost,
  authenticateRequest,
  createEnvMemoryStoreConfig,
  createEnvTokenTenantResolver,
  createKParentApiServer,
  createTokenTenantResolver,
  decodeMemoryEncryptionKey,
  getAction,
  isProtectedPath,
  readJsonBody,
  safeErrorMessage,
  storeAction,
  toAuditEnvelope,
  toTenantStorageKey,
};
