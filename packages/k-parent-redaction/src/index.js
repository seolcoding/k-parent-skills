"use strict";

const REDACTED = "[REDACTED]";
const CIRCULAR = "[CIRCULAR]";
const DEPTH_LIMIT = "[TRUNCATED: depth limit]";
const ENTRY_LIMIT = "[TRUNCATED: entry limit]";
const PAYLOAD_LIMIT = "[TRUNCATED: payload limit]";
const UNAVAILABLE = "[UNAVAILABLE]";
const BINARY = "[BINARY]";

const DEFAULT_OPTIONS = Object.freeze({
  maxDepth: 8,
  maxEntries: 500,
  maxStringLength: 2048,
  maxPayloadBytes: 64 * 1024,
});

const FORBIDDEN_KEYS = Object.freeze([
  "authorization",
  "proxyauthorization",
  "cookie",
  "setcookie",
  "sessioncookie",
  "password",
  "passwd",
  "passcode",
  "pin",
  "otp",
  "secret",
  "apikey",
  "xapikey",
  "apisecret",
  "servicekey",
  "clientsecret",
  "accesstoken",
  "refreshtoken",
  "authtoken",
  "idtoken",
  "sessiontoken",
  "token",
  "sessionid",
  "credential",
  "credentials",
  "privatekey",
  "certificatepassword",
  "paymentpassword",
  "residentregistrationnumber",
  "rrn",
  "socialsecuritynumber",
  "birthdate",
  "dateofbirth",
  "dob",
  "childname",
  "childfullname",
  "childid",
  "childidentifier",
  "childbirthdate",
  "childbirthday",
  "childnumber",
  "childphone",
  "childemail",
  "childaddress",
  "childrennames",
  "studentname",
  "studentfullname",
  "studentid",
  "studentidentifier",
  "studentbirthdate",
  "studentbirthday",
  "studentnumber",
  "studentphone",
  "studentemail",
  "studentaddress",
  "minorname",
  "minorid",
  "parentname",
  "parentfullname",
  "parentid",
  "parentphone",
  "parentemail",
  "parentaddress",
  "guardianname",
  "guardianfullname",
  "guardianid",
  "guardianphone",
  "guardianemail",
  "guardianaddress",
  "mothername",
  "fathername",
  "familyname",
  "familyid",
  "familymembername",
  "rawconversation",
  "familyconversation",
  "parentchildconversation",
  "conversationtranscript",
  "rawtranscript",
  "documenttext",
  "rawdocumenttext",
  "documentbody",
  "ocrtext",
  "ocroutput",
  "schooldocument",
  "academydocument",
  "attachmentbody",
  "rawpayload",
  "requestbody",
  "responsebody",
  "주민등록번호",
  "생년월일",
  "학번",
  "대화원문",
  "가족대화",
  "부모자녀대화",
  "문서원문",
  "학교문서",
  "학원문서",
  "오씨알본문",
]);

const FORBIDDEN_KEY_SET = new Set(FORBIDDEN_KEYS);
const PROVENANCE_KEYS = new Set([
  "url",
  "sourceurl",
  "provenanceurl",
  "canonicalurl",
  "publicurl",
  "requesturl",
]);
const PRIORITY_KEYS = new Set([
  ...PROVENANCE_KEYS,
  "timestamp",
  "time",
  "fetchedat",
  "confirmedat",
  "createdat",
  "updatedat",
  "observedat",
]);

const FAMILY_IDENTITY_KEY = /^(?:child|children|student|minor|parent|guardian|caregiver|mother|father|family|familymember)\d*(?:name|fullname|firstname|lastname|id|identifier|number|birthdate|birthday|dateofbirth|dob|rrn|residentregistrationnumber|phone|mobile|email|address)$/;
const KOREAN_FAMILY_IDENTITY_KEY = /^(?:아이|자녀|아동|학생|보호자|부모|어머니|아버지|가족)(?:\d+)?(?:이름|성명|아이디|식별자|생년월일|주민등록번호|연락처|전화번호|휴대전화|이메일|주소)$/;
const FAMILY_CONTEXT_KEY = /^(?:child|children|student|students|minor|parent|parents|guardian|guardians|caregiver|caregivers|mother|father|family|familymember|familymembers)\d*$/;
const KOREAN_FAMILY_CONTEXT_KEY = /^(?:아이|자녀|아동|학생|보호자|부모|어머니|아버지|가족)(?:\d+)?$/;
const IDENTITY_LEAF_KEYS = new Set([
  "name",
  "fullname",
  "firstname",
  "lastname",
  "id",
  "identifier",
  "number",
  "birthdate",
  "birthday",
  "dateofbirth",
  "dob",
  "rrn",
  "residentregistrationnumber",
  "phone",
  "mobile",
  "email",
  "address",
  "이름",
  "성명",
  "아이디",
  "식별자",
  "학번",
  "생년월일",
  "주민등록번호",
  "연락처",
  "전화번호",
  "휴대전화",
  "이메일",
  "주소",
]);

const BEARER_PATTERN = /\bbearer\s+[a-z0-9._~+/-]+={0,2}\b/i;
const JWT_PATTERN = /\b[a-z0-9_-]{8,}\.[a-z0-9_-]{8,}\.[a-z0-9_-]{8,}\b/i;
const COOKIE_PATTERN = /(?:\b(?:set-cookie|cookie)\s*[:=]\s*[^\s,]+|\b(?:session[_-]?id|connect\.sid|sid)=[^;\s]+)/i;
const LABELED_CREDENTIAL_PATTERN = /\b(?:api[-_\s]?key|service[-_\s]?key|client[-_\s]?secret|access[-_\s]?token|refresh[-_\s]?token|auth[-_\s]?token|password|passwd|credential|authorization|private[-_\s]?key)\b\s*[:=]\s*\S+/i;
const KNOWN_CREDENTIAL_PATTERN = /(?:\b(?:sk|rk|pk)-(?:[a-z0-9_-]{16,})\b|\b(?:sk|pk)_(?:live|test)_[a-z0-9]{12,}\b|\bgh[pousr]_[a-z0-9]{20,}\b|\bAKIA[A-Z0-9]{16}\b|\bAIza[a-z0-9_-]{20,}\b)/i;
const SENSITIVE_FORMAT_PATTERN = /\b(?:api[-_\s]?key|service[-_\s]?key|client[-_\s]?secret|access[-_\s]?token|refresh[-_\s]?token|auth[-_\s]?token|password|passwd|credential|authorization|cookie)\b\s*[:=]\s*%[sdifjoOc]/i;

function normalizeKey(key) {
  return String(key)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function isForbiddenKey(key) {
  const normalized = normalizeKey(key);
  return FORBIDDEN_KEY_SET.has(normalized)
    || FAMILY_IDENTITY_KEY.test(normalized)
    || KOREAN_FAMILY_IDENTITY_KEY.test(normalized);
}

function isFamilyContextKey(key) {
  const normalized = normalizeKey(key);
  return FAMILY_CONTEXT_KEY.test(normalized) || KOREAN_FAMILY_CONTEXT_KEY.test(normalized);
}

function isIdentityLeafKey(key) {
  return IDENTITY_LEAF_KEYS.has(normalizeKey(key));
}

function containsSensitiveString(value) {
  if (typeof value !== "string") return false;
  return BEARER_PATTERN.test(value)
    || JWT_PATTERN.test(value)
    || COOKIE_PATTERN.test(value)
    || LABELED_CREDENTIAL_PATTERN.test(value)
    || KNOWN_CREDENTIAL_PATTERN.test(value);
}

function sanitize(value, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const state = {
    entries: 0,
    ancestors: new WeakSet(),
    options: normalizedOptions,
  };

  let sanitized;
  try {
    sanitized = visit(value, state, 0, null, false);
  } catch {
    sanitized = UNAVAILABLE;
  }

  return fitPayload(sanitized, normalizedOptions.maxPayloadBytes);
}

function sanitizeError(error, options = {}) {
  return sanitize(error, options);
}

function createSanitizedLogger(logger = console, options = {}) {
  if (!logger || (typeof logger !== "object" && typeof logger !== "function")) {
    throw new TypeError("logger must be an object with logging methods.");
  }

  const wrapper = {};
  for (const method of ["trace", "debug", "info", "log", "warn", "error"]) {
    if (typeof logger[method] !== "function") continue;
    wrapper[method] = function sanitizedLogMethod(...args) {
      const safeArgs = sanitizeLogArguments(args, options);
      return logger[method].apply(logger, safeArgs);
    };
  }
  return Object.freeze(wrapper);
}

function sanitizeLogArguments(args, options = {}) {
  const prepared = Array.from(args);
  const unsafeFormatIndex = prepared.findIndex(
    (argument) => typeof argument === "string" && SENSITIVE_FORMAT_PATTERN.test(argument),
  );
  if (unsafeFormatIndex !== -1) {
    for (let index = unsafeFormatIndex; index < prepared.length; index += 1) {
      prepared[index] = REDACTED;
    }
  }
  const sanitized = sanitize(prepared, options);
  return Array.isArray(sanitized) ? sanitized : [sanitized];
}

function visit(value, state, depth, keyContext, familyContext) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return sanitizeString(value, state.options, keyContext);
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "undefined") return "[UNDEFINED]";
  if (typeof value === "function") return "[FUNCTION]";
  if (typeof value === "symbol") return "[SYMBOL]";

  if (state.ancestors.has(value)) return CIRCULAR;
  if (depth >= state.options.maxDepth) return DEPTH_LIMIT;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
  }
  if (value instanceof URL) return sanitizePublicUrl(value.toString(), state.options);
  if (isBinary(value)) return `${BINARY}: ${binaryLength(value)} bytes`;
  if (value instanceof RegExp) return sanitizeString(value.toString(), state.options, keyContext);

  state.ancestors.add(value);
  try {
    if (value instanceof Error) return visitError(value, state, depth, familyContext);
    if (Array.isArray(value)) return visitArray(value, state, depth, familyContext);
    if (value instanceof Map) return visitMap(value, state, depth, familyContext);
    if (value instanceof Set) return visitArray(Array.from(value), state, depth, familyContext);
    return visitObject(value, state, depth, familyContext);
  } catch {
    return UNAVAILABLE;
  } finally {
    state.ancestors.delete(value);
  }
}

function visitArray(value, state, depth, familyContext) {
  const output = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!takeEntry(state)) {
      output.push(ENTRY_LIMIT);
      break;
    }
    let child;
    try {
      child = value[index];
    } catch {
      child = UNAVAILABLE;
    }
    output.push(visit(child, state, depth + 1, String(index), familyContext));
  }
  return output;
}

function visitObject(value, state, depth, familyContext) {
  const output = {};
  let keys;
  try {
    keys = Object.keys(value);
  } catch {
    return UNAVAILABLE;
  }

  for (const key of keys) {
    if (!takeEntry(state)) {
      defineSafe(output, "__truncated__", ENTRY_LIMIT);
      break;
    }
    const safeKey = truncateKey(key);
    const childFamilyContext = familyContext || isFamilyContextKey(key);
    if (isForbiddenKey(key) || (familyContext && isIdentityLeafKey(key))) {
      defineSafe(output, safeKey, REDACTED);
      continue;
    }
    let child;
    try {
      child = value[key];
    } catch {
      child = UNAVAILABLE;
    }
    if (childFamilyContext && isFamilyContextKey(key) && (child === null || typeof child !== "object")) {
      defineSafe(output, safeKey, REDACTED);
      continue;
    }
    defineSafe(output, safeKey, visit(child, state, depth + 1, key, childFamilyContext));
  }
  return output;
}

function visitMap(value, state, depth, familyContext) {
  const output = {};
  for (const [rawKey, child] of value.entries()) {
    if (!takeEntry(state)) {
      defineSafe(output, "__truncated__", ENTRY_LIMIT);
      break;
    }
    const key = String(rawKey);
    const safeKey = truncateKey(key);
    const childFamilyContext = familyContext || isFamilyContextKey(key);
    const mustRedact = isForbiddenKey(key)
      || (familyContext && isIdentityLeafKey(key))
      || (childFamilyContext && isFamilyContextKey(key) && (child === null || typeof child !== "object"));
    defineSafe(output, safeKey, mustRedact
      ? REDACTED
      : visit(child, state, depth + 1, key, childFamilyContext));
  }
  return output;
}

function visitError(error, state, depth, familyContext) {
  const output = {};
  const standardKeys = ["name", "message", "stack", "cause"];
  for (const key of standardKeys) {
    let child;
    try {
      child = error[key];
    } catch {
      child = UNAVAILABLE;
    }
    if (child === undefined || (key === "cause" && child === undefined)) continue;
    if (!takeEntry(state)) {
      defineSafe(output, "__truncated__", ENTRY_LIMIT);
      return output;
    }
    defineSafe(output, key, visit(child, state, depth + 1, key, familyContext));
  }

  let keys;
  try {
    keys = Object.keys(error);
  } catch {
    return output;
  }
  for (const key of keys) {
    if (standardKeys.includes(key)) continue;
    if (!takeEntry(state)) {
      defineSafe(output, "__truncated__", ENTRY_LIMIT);
      break;
    }
    const safeKey = truncateKey(key);
    const childFamilyContext = familyContext || isFamilyContextKey(key);
    if (isForbiddenKey(key) || (familyContext && isIdentityLeafKey(key))) {
      defineSafe(output, safeKey, REDACTED);
      continue;
    }
    let child;
    try {
      child = error[key];
    } catch {
      child = UNAVAILABLE;
    }
    if (childFamilyContext && isFamilyContextKey(key) && (child === null || typeof child !== "object")) {
      defineSafe(output, safeKey, REDACTED);
      continue;
    }
    defineSafe(output, safeKey, visit(child, state, depth + 1, key, childFamilyContext));
  }
  return output;
}

function sanitizeString(value, options, keyContext) {
  if (keyContext && PROVENANCE_KEYS.has(normalizeKey(keyContext)) && isHttpUrl(value)) {
    return sanitizePublicUrl(value, options);
  }
  if (containsSensitiveString(value)) return REDACTED;
  return truncateString(value, options.maxStringLength);
}

function sanitizePublicUrl(value, options) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return sanitizeString(value, options, null);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return REDACTED;
  }

  url.username = "";
  url.password = "";
  const pathSegments = url.pathname.split("/").map((segment) => {
    let decoded = segment;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      // Keep the original encoded segment when it cannot be decoded.
    }
    return containsSensitiveString(decoded) ? encodeURIComponent(REDACTED) : segment;
  });
  url.pathname = pathSegments.join("/");

  for (const [key, child] of Array.from(url.searchParams.entries())) {
    if (isForbiddenKey(key) || containsSensitiveString(child)) {
      url.searchParams.set(key, REDACTED);
    }
  }
  if (url.hash && containsSensitiveString(url.hash.slice(1))) {
    url.hash = REDACTED;
  }
  return truncateString(url.toString(), options.maxStringLength);
}

function fitPayload(value, maxBytes) {
  const built = buildWithinBudget(value, maxBytes);
  if (!built.included) return PAYLOAD_LIMIT;
  if (built.complete) return built.value;
  return addPayloadMarker(built.value, maxBytes);
}

function buildWithinBudget(value, budget) {
  if (value === null || typeof value !== "object") {
    const bytes = jsonBytes(value);
    if (bytes <= budget) return { value, bytes, included: true, complete: true };
    const markerBytes = jsonBytes(PAYLOAD_LIMIT);
    if (markerBytes <= budget) {
      return { value: PAYLOAD_LIMIT, bytes: markerBytes, included: true, complete: false };
    }
    return { included: false, bytes: 0, complete: false };
  }

  if (budget < 2) return { included: false, bytes: 0, complete: false };
  if (Array.isArray(value)) return buildArrayWithinBudget(value, budget);
  return buildObjectWithinBudget(value, budget);
}

function buildArrayWithinBudget(value, budget) {
  const output = [];
  let bytes = 2;
  let complete = true;
  for (const child of value) {
    const prefixBytes = output.length ? 1 : 0;
    const built = buildWithinBudget(child, budget - bytes - prefixBytes);
    if (!built.included) {
      complete = false;
      break;
    }
    output.push(built.value);
    bytes += prefixBytes + built.bytes;
    if (!built.complete) {
      complete = false;
      break;
    }
  }
  if (output.length !== value.length) complete = false;
  return { value: output, bytes, included: true, complete };
}

function buildObjectWithinBudget(value, budget) {
  const output = {};
  let bytes = 2;
  let complete = true;
  const keys = Object.keys(value).sort(comparePayloadKeys);
  for (const key of keys) {
    const prefixBytes = (Object.keys(output).length ? 1 : 0) + jsonBytes(key) + 1;
    const built = buildWithinBudget(value[key], budget - bytes - prefixBytes);
    if (!built.included) {
      complete = false;
      break;
    }
    defineSafe(output, key, built.value);
    bytes += prefixBytes + built.bytes;
    if (!built.complete) {
      complete = false;
      break;
    }
  }
  if (Object.keys(output).length !== keys.length) complete = false;
  return { value: output, bytes, included: true, complete };
}

function addPayloadMarker(value, maxBytes) {
  if (Array.isArray(value)) {
    const output = value.slice();
    output.push(PAYLOAD_LIMIT);
    while (jsonBytes(output) > maxBytes && output.length > 1) output.splice(output.length - 2, 1);
    return jsonBytes(output) <= maxBytes ? output : PAYLOAD_LIMIT;
  }
  if (value && typeof value === "object") {
    const output = { ...value, __truncated__: PAYLOAD_LIMIT };
    while (jsonBytes(output) > maxBytes) {
      const removable = Object.keys(output)
        .filter((key) => key !== "__truncated__")
        .reverse()
        .find((key) => !PRIORITY_KEYS.has(normalizeKey(key)))
        || Object.keys(output).filter((key) => key !== "__truncated__").pop();
      if (!removable) break;
      delete output[removable];
    }
    return jsonBytes(output) <= maxBytes ? output : PAYLOAD_LIMIT;
  }
  return PAYLOAD_LIMIT;
}

function comparePayloadKeys(left, right) {
  const leftPriority = PRIORITY_KEYS.has(normalizeKey(left));
  const rightPriority = PRIORITY_KEYS.has(normalizeKey(right));
  if (leftPriority === rightPriority) return 0;
  return leftPriority ? -1 : 1;
}

function normalizeOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("redaction options must be an object.");
  }
  return {
    maxDepth: boundedInteger(options.maxDepth, DEFAULT_OPTIONS.maxDepth, 1, 100, "maxDepth"),
    maxEntries: boundedInteger(options.maxEntries, DEFAULT_OPTIONS.maxEntries, 1, 100000, "maxEntries"),
    maxStringLength: boundedInteger(
      options.maxStringLength,
      DEFAULT_OPTIONS.maxStringLength,
      16,
      1024 * 1024,
      "maxStringLength",
    ),
    maxPayloadBytes: boundedInteger(
      options.maxPayloadBytes,
      DEFAULT_OPTIONS.maxPayloadBytes,
      64,
      16 * 1024 * 1024,
      "maxPayloadBytes",
    ),
  };
}

function boundedInteger(value, fallback, minimum, maximum, label) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be an integer from ${minimum} to ${maximum}.`);
  }
  return value;
}

function takeEntry(state) {
  if (state.entries >= state.options.maxEntries) return false;
  state.entries += 1;
  return true;
}

function truncateString(value, maxLength) {
  if (value.length <= maxLength) return value;
  const suffix = "…[TRUNCATED]";
  return `${value.slice(0, Math.max(0, maxLength - suffix.length))}${suffix}`;
}

function truncateKey(value) {
  const key = String(value);
  return key.length <= 256 ? key : `${key.slice(0, 243)}…[TRUNCATED]`;
}

function defineSafe(target, key, value) {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isBinary(value) {
  return Buffer.isBuffer(value)
    || value instanceof ArrayBuffer
    || ArrayBuffer.isView(value);
}

function binaryLength(value) {
  if (Buffer.isBuffer(value)) return value.length;
  return value.byteLength;
}

function jsonBytes(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

module.exports = {
  CIRCULAR,
  DEFAULT_OPTIONS,
  DEPTH_LIMIT,
  ENTRY_LIMIT,
  FORBIDDEN_KEYS,
  PAYLOAD_LIMIT,
  REDACTED,
  containsSensitiveString,
  createSanitizedLogger,
  isForbiddenKey,
  normalizeKey,
  sanitize,
  sanitizeError,
  sanitizeLogArguments,
};
