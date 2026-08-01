const {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
} = require("node:crypto");
const {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} = require("node:fs");
const { basename, dirname, resolve } = require("node:path");

const ENCRYPTED_FILE_VERSION = 1;
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENVELOPE_AAD = Buffer.from("k-parent-memory/encrypted-file/v1", "utf8");
const SAFE_CONTEXT_IDENTIFIER = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

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

function createEncryptedFileStore(options = {}) {
  const filePath = normalizeFilePath(options.filePath);
  const encryptionKey = normalizeEncryptionKey(options.encryptionKey);
  const tenantId = normalizeContextIdentifier(options.tenantId, "tenantId");
  const namespace = normalizeContextIdentifier(options.namespace, "namespace");
  const now = typeof options.now === "function" ? options.now : () => new Date();

  function readState() {
    if (!existsSync(filePath)) return createEmptyFileState();

    let envelope;
    try {
      envelope = JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      throw new Error("encrypted memory file is invalid.");
    }

    const state = decryptFileState(envelope, encryptionKey);
    assertFileState(state);
    chmodSync(filePath, 0o600);
    return state;
  }

  function writeState(state) {
    const envelope = encryptFileState(state, encryptionKey);
    atomicWriteJson(filePath, envelope);
  }

  function belongsToNamespace(entry) {
    return entry.tenantId === tenantId && entry.namespace === namespace;
  }

  function removeExpiredEntries(state) {
    let deleted = 0;
    state.entries = state.entries.filter((entry) => {
      if (belongsToNamespace(entry) && isExpired(entry.record, now())) {
        deleted += 1;
        return false;
      }
      return true;
    });
    return deleted;
  }

  function scopedRecords(state) {
    return state.entries
      .filter(belongsToNamespace)
      .map((entry) => clone(entry.record))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  function findRecordIndex(state, scope, key) {
    return state.entries.findIndex((entry) => (
      belongsToNamespace(entry)
      && entry.record.scope === scope
      && entry.record.key === key
    ));
  }

  function deleteCurrentNamespace() {
    const state = readState();
    const initialCount = state.entries.length;
    state.entries = state.entries.filter((entry) => !belongsToNamespace(entry));
    const deleted = initialCount - state.entries.length;
    if (deleted > 0) writeState(state);
    return deleted;
  }

  return {
    set(record) {
      const state = readState();
      removeExpiredEntries(state);

      const normalized = createMemoryRecord(record, { now: record.createdAt || now() });
      const existingIndex = findRecordIndex(state, normalized.scope, normalized.key);
      if (existingIndex >= 0) {
        const existing = state.entries[existingIndex].record;
        normalized.id = existing.id;
        normalized.createdAt = existing.createdAt;
        normalized.updatedAt = toIso(now());
        state.entries[existingIndex].record = normalized;
      } else {
        state.entries.push({ tenantId, namespace, record: normalized });
      }

      writeState(state);
      return clone(normalized);
    },

    get(scope, key) {
      const state = readState();
      const deleted = removeExpiredEntries(state);
      const recordIndex = findRecordIndex(state, scope, key);
      if (deleted > 0) writeState(state);
      return recordIndex < 0 ? null : clone(state.entries[recordIndex].record);
    },

    delete(scope, key) {
      const state = readState();
      const expiredDeleted = removeExpiredEntries(state);
      const recordIndex = findRecordIndex(state, scope, key);
      if (recordIndex >= 0) state.entries.splice(recordIndex, 1);
      if (recordIndex >= 0 || expiredDeleted > 0) writeState(state);
      return recordIndex >= 0;
    },

    list(scope) {
      const state = readState();
      const deleted = removeExpiredEntries(state);
      if (deleted > 0) writeState(state);
      return scopedRecords(state).filter((record) => !scope || record.scope === scope);
    },

    cleanupExpired() {
      const state = readState();
      const deleted = removeExpiredEntries(state);
      if (deleted > 0) writeState(state);
      return deleted;
    },

    exportNamespace() {
      const state = readState();
      const deleted = removeExpiredEntries(state);
      if (deleted > 0) writeState(state);
      return scopedRecords(state);
    },

    deleteNamespace: deleteCurrentNamespace,
    revokeConsent: deleteCurrentNamespace,
    clear: deleteCurrentNamespace,
  };
}

function createEmptyFileState() {
  return { version: ENCRYPTED_FILE_VERSION, entries: [] };
}

function normalizeFilePath(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("filePath is required for encrypted durable memory.");
  }
  return resolve(value);
}

function normalizeEncryptionKey(value) {
  if (!(Buffer.isBuffer(value) || value instanceof Uint8Array) || value.byteLength !== 32) {
    throw new Error("encryptionKey must be an injected 32-byte key.");
  }
  return Buffer.from(value);
}

function normalizeContextIdentifier(value, label) {
  if (typeof value !== "string" || !SAFE_CONTEXT_IDENTIFIER.test(value)) {
    throw new Error(`${label} must be a non-empty safe identifier.`);
  }
  return value;
}

function encryptFileState(state, encryptionKey) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);
  cipher.setAAD(ENVELOPE_AAD);
  const plaintext = Buffer.from(JSON.stringify(state), "utf8");

  try {
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return {
      version: ENCRYPTED_FILE_VERSION,
      algorithm: ENCRYPTION_ALGORITHM,
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    };
  } finally {
    plaintext.fill(0);
  }
}

function decryptFileState(envelope, encryptionKey) {
  assertEnvelope(envelope);
  const iv = decodeBase64(envelope.iv, "iv");
  const authTag = decodeBase64(envelope.authTag, "authTag");
  const ciphertext = decodeBase64(envelope.ciphertext, "ciphertext");
  if (iv.length !== 12 || authTag.length !== 16) {
    throw new Error("encrypted memory file is invalid.");
  }

  let plaintext;
  try {
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);
    decipher.setAAD(ENVELOPE_AAD);
    decipher.setAuthTag(authTag);
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error("encrypted memory file authentication failed.");
  }

  try {
    return JSON.parse(plaintext.toString("utf8"));
  } catch {
    throw new Error("encrypted memory file is invalid.");
  } finally {
    plaintext.fill(0);
  }
}

function assertEnvelope(envelope) {
  if (
    !envelope
    || typeof envelope !== "object"
    || Array.isArray(envelope)
    || envelope.version !== ENCRYPTED_FILE_VERSION
    || envelope.algorithm !== ENCRYPTION_ALGORITHM
    || typeof envelope.iv !== "string"
    || typeof envelope.authTag !== "string"
    || typeof envelope.ciphertext !== "string"
  ) {
    throw new Error("encrypted memory file is invalid.");
  }
}

function decodeBase64(value, label) {
  if (!/^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(value)) {
    throw new Error(`encrypted memory file ${label} is invalid.`);
  }
  return Buffer.from(value, "base64");
}

function assertFileState(state) {
  if (
    !state
    || typeof state !== "object"
    || Array.isArray(state)
    || state.version !== ENCRYPTED_FILE_VERSION
    || !Array.isArray(state.entries)
  ) {
    throw new Error("encrypted memory file is invalid.");
  }

  for (const entry of state.entries) {
    if (
      !entry
      || typeof entry !== "object"
      || !SAFE_CONTEXT_IDENTIFIER.test(entry.tenantId || "")
      || !SAFE_CONTEXT_IDENTIFIER.test(entry.namespace || "")
      || !isStoredRecord(entry.record)
    ) {
      throw new Error("encrypted memory file is invalid.");
    }
  }
}

function isStoredRecord(record) {
  return Boolean(
    record
    && typeof record === "object"
    && Object.values(MEMORY_SCOPE).includes(record.scope)
    && typeof record.key === "string"
    && SAFE_CONTEXT_IDENTIFIER.test(record.key)
    && typeof record.id === "string"
    && isIsoTimestamp(record.createdAt)
    && isIsoTimestamp(record.updatedAt)
    && (record.expiresAt === null || isIsoTimestamp(record.expiresAt)),
  );
}

function atomicWriteJson(filePath, value) {
  const directory = dirname(filePath);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporaryPath = resolve(
    directory,
    `.${basename(filePath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let descriptor;

  try {
    descriptor = openSync(temporaryPath, "wx", 0o600);
    writeFileSync(descriptor, JSON.stringify(value), { encoding: "utf8" });
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporaryPath, filePath);
    chmodSync(filePath, 0o600);
    syncDirectory(directory);
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    throw error;
  }
}

function syncDirectory(directory) {
  let descriptor;
  try {
    descriptor = openSync(directory, "r");
    fsyncSync(descriptor);
  } catch (error) {
    if (!error || !["EINVAL", "ENOTSUP", "EBADF"].includes(error.code)) throw error;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
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
  createEncryptedFileStore,
  createInMemoryStore,
  createMemoryRecord,
  isExpired,
};
