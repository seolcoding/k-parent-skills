const { randomUUID } = require("node:crypto");

const MEMORY_SCOPE = Object.freeze({
  SESSION: "session",
  PROFILE_REF: "profile_ref",
  KNOWLEDGE: "knowledge",
  APPROVAL_AUDIT: "approval_audit",
});

const DEFAULT_TTL_SECONDS = Object.freeze({
  session: 30 * 60,
  profile_ref: null,
  knowledge: 24 * 60 * 60,
  approval_audit: 24 * 60 * 60,
});

const FORBIDDEN_MEMORY_KEYS = Object.freeze([
  "password",
  "secret",
  "token",
  "cookie",
  "authorization",
  "apikey",
  "clientsecret",
  "accesstoken",
  "refreshtoken",
  "residentregistrationnumber",
  "rrn",
  "birthdate",
  "childname",
  "certificatepassword",
  "paymentpassword",
]);

const SESSION_FIELDS = Object.freeze([
  "region",
  "date",
  "dateRange",
  "workflowStep",
  "locale",
  "timezone",
  "publicResourceRefs",
  "selectionRefs",
]);

const KNOWLEDGE_FIELDS = Object.freeze([
  "sourceUrl",
  "fetchedAt",
  "resourceId",
  "etag",
  "payloadDigest",
]);

const APPROVAL_AUDIT_FIELDS = Object.freeze([
  "actionId",
  "type",
  "status",
  "risk",
  "scopeDigest",
  "approvalDigest",
  "decision",
  "actor",
  "createdAt",
  "decidedAt",
  "expiresAt",
]);

function createMemoryRecord(input = {}, options = {}) {
  const scope = input.scope;
  if (!Object.values(MEMORY_SCOPE).includes(scope)) {
    throw new Error(`unsupported memory scope: ${scope || "missing"}`);
  }
  if (!input.key || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(input.key)) {
    throw new Error("memory key must be a non-empty safe identifier.");
  }
  if (input.value === undefined) {
    throw new Error("memory value is required.");
  }

  assertSafeMemoryValue(input.value);
  assertScopeValue(scope, input.value, input);

  const sensitivity = input.sensitivity || "internal";
  if (scope === MEMORY_SCOPE.KNOWLEDGE && sensitivity !== "public") {
    throw new Error("knowledge memory requires explicit public sensitivity and provenance.");
  }

  const createdAt = toIso(options.now || input.createdAt || new Date());
  const ttlSeconds = input.ttlSeconds === undefined
    ? DEFAULT_TTL_SECONDS[scope]
    : normalizeTtl(input.ttlSeconds);
  const expiresAt = ttlSeconds === null
    ? null
    : toIso(new Date(Date.parse(createdAt) + ttlSeconds * 1000));
  const serialized = JSON.stringify(input.value);
  if (Buffer.byteLength(serialized, "utf8") > 16 * 1024) {
    throw new Error("memory value exceeds the 16 KiB per-record limit.");
  }

  return {
    id: input.id || randomUUID(),
    scope,
    key: input.key,
    value: clone(input.value),
    sensitivity,
    sourceRef: input.sourceRef || null,
    createdAt,
    updatedAt: createdAt,
    expiresAt,
  };
}

function createInMemoryStore(options = {}) {
  const records = new Map();
  const now = typeof options.now === "function" ? options.now : () => new Date();
  const compoundKey = (scope, key) => `${scope}:${key}`;

  return {
    set(record) {
      const normalized = createMemoryRecord(record, { now: record.createdAt || now() });
      const existing = records.get(compoundKey(normalized.scope, normalized.key));
      if (existing) {
        normalized.id = existing.id;
        normalized.createdAt = existing.createdAt;
        normalized.updatedAt = toIso(now());
      }
      records.set(compoundKey(normalized.scope, normalized.key), normalized);
      return clone(normalized);
    },

    get(scope, key) {
      const recordKey = compoundKey(scope, key);
      const record = records.get(recordKey);
      if (!record) return null;
      if (isExpired(record, now())) {
        records.delete(recordKey);
        return null;
      }
      return clone(record);
    },

    delete(scope, key) {
      return records.delete(compoundKey(scope, key));
    },

    list(scope) {
      const result = [];
      for (const [recordKey, record] of records.entries()) {
        if (isExpired(record, now())) {
          records.delete(recordKey);
        } else if (!scope || record.scope === scope) {
          result.push(clone(record));
        }
      }
      return result.sort((a, b) => a.key.localeCompare(b.key));
    },

    clear() {
      records.clear();
    },
  };
}

function assertSafeMemoryValue(value, currentPath = "value") {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeMemoryValue(item, `${currentPath}[${index}]`));
    return;
  }
  if (typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (FORBIDDEN_MEMORY_KEYS.includes(normalizedKey)) {
      throw new Error(`${currentPath}.${key} is forbidden in K-Parent memory.`);
    }
    assertSafeMemoryValue(child, `${currentPath}.${key}`);
  }
}

function assertProfileReference(value) {
  if (typeof value !== "string" || !/^(local|vault|user-store):\/\/[a-zA-Z0-9._:/-]+$/.test(value)) {
    throw new Error("profile_ref memory must be an opaque local://, vault://, or user-store:// reference.");
  }
}

function assertScopeValue(scope, value, input) {
  if (scope === MEMORY_SCOPE.PROFILE_REF) {
    assertProfileReference(value);
    return;
  }
  if (scope === MEMORY_SCOPE.SESSION) {
    assertAllowlistedObject(value, SESSION_FIELDS, "session");
    for (const [key, child] of Object.entries(value)) assertSessionField(key, child);
    return;
  }
  if (scope === MEMORY_SCOPE.KNOWLEDGE) {
    assertAllowlistedObject(value, KNOWLEDGE_FIELDS, "knowledge");
    if (!isHttpsUrl(value.sourceUrl) || !isIsoTimestamp(value.fetchedAt)) {
      throw new Error("knowledge memory requires sourceUrl (HTTPS) and fetchedAt (ISO timestamp).");
    }
    if (input.sourceRef !== value.sourceUrl) {
      throw new Error("knowledge memory sourceRef must match value.sourceUrl provenance.");
    }
    for (const [key, child] of Object.entries(value)) assertBoundedScalar(key, child);
    return;
  }
  if (scope === MEMORY_SCOPE.APPROVAL_AUDIT) {
    assertAllowlistedObject(value, APPROVAL_AUDIT_FIELDS, "approval_audit");
    for (const field of ["actionId", "type", "status", "risk", "scopeDigest", "approvalDigest", "createdAt"]) {
      if (typeof value[field] !== "string" || !value[field]) {
        throw new Error(`approval_audit.${field} is required.`);
      }
    }
    for (const [key, child] of Object.entries(value)) assertBoundedScalar(key, child);
  }
}

function assertAllowlistedObject(value, allowedFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} memory must be a structured object.`);
  }
  const unknown = Object.keys(value).filter((key) => !allowedFields.includes(key));
  if (unknown.length) throw new Error(`${label} memory field is not allowed: ${unknown[0]}`);
}

function assertSessionField(key, value) {
  if (key === "dateRange") {
    assertAllowlistedObject(value, ["start", "end"], "session.dateRange");
    for (const [rangeKey, child] of Object.entries(value)) assertBoundedScalar(rangeKey, child);
    return;
  }
  if (key === "publicResourceRefs" || key === "selectionRefs") {
    if (!Array.isArray(value) || value.length > 20) throw new Error(`session.${key} must be an array of at most 20 references.`);
    value.forEach((child) => assertBoundedScalar(key, child));
    return;
  }
  assertBoundedScalar(key, value);
}

function assertBoundedScalar(key, value) {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value === "string" && value.length <= 256 && !/[\r\n]/.test(value)) return;
  throw new Error(`${key} must be a bounded scalar value.`);
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isIsoTimestamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
}

function isExpired(record, now) {
  return Boolean(record.expiresAt && Date.parse(record.expiresAt) <= new Date(now).getTime());
}

function normalizeTtl(value) {
  if (value === null) return null;
  const ttl = Number(value);
  if (!Number.isInteger(ttl) || ttl <= 0 || ttl > 30 * 24 * 60 * 60) {
    throw new Error("ttlSeconds must be a positive integer no greater than 30 days.");
  }
  return ttl;
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("invalid timestamp.");
  return date.toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  APPROVAL_AUDIT_FIELDS,
  DEFAULT_TTL_SECONDS,
  FORBIDDEN_MEMORY_KEYS,
  KNOWLEDGE_FIELDS,
  MEMORY_SCOPE,
  SESSION_FIELDS,
  assertProfileReference,
  assertSafeMemoryValue,
  createInMemoryStore,
  createMemoryRecord,
  isExpired,
};
