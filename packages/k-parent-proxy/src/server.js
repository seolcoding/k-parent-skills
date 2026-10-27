const http = require("node:http");
const { URL } = require("node:url");
const defaultAdapter = require("k-parent-source-neis");
const { REDACTED, sanitizeError } = require("../../k-parent-redaction");

const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CACHE_MAX_ENTRIES = 500;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 60;
const DEFAULT_RATE_LIMIT_MAX_CLIENTS = 1_000;
const DEFAULT_UPSTREAM_TIMEOUT_MS = 8_000;
const DEFAULT_UPSTREAM_MAX_RETRIES = 2;
const DEFAULT_RETRY_BACKOFF_MS = 100;
const DEFAULT_RETRY_BACKOFF_MAX_MS = 1_000;
const MAX_CACHE_ENTRIES = 5_000;
const MAX_RATE_LIMIT_CLIENTS = 10_000;
const MAX_UPSTREAM_TIMEOUT_MS = 30_000;
const MAX_UPSTREAM_RETRIES = 3;
const MAX_RETRY_BACKOFF_MS = 2_000;
const TIMETABLE_LEVELS = new Set(["els", "mis", "his", "sps"]);
const ROUTE_NAMES = Object.freeze(["school-search", "classes", "timetable", "schedule", "academies"]);
const ACADEMY_MAX_PAGE_SIZE = 100;
const RETRYABLE_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET",
]);

function createKParentProxyServer(options = {}) {
  const adapter = options.adapter || defaultAdapter;
  const apiKey = options.apiKey ?? process.env.KEDU_INFO_KEY;
  const cache = options.cache || new Map();
  const now = typeof options.now === "function" ? options.now : () => new Date();
  const nowMs = () => now().getTime();
  const ttlMs = boundedInteger(options.cacheTtlMs ?? process.env.KPARENT_PROXY_CACHE_TTL_MS,
    DEFAULT_CACHE_TTL_MS, 1, 7 * DEFAULT_CACHE_TTL_MS);
  const cacheMaxEntries = boundedInteger(
    options.cacheMaxEntries ?? process.env.KPARENT_PROXY_CACHE_MAX_ENTRIES,
    DEFAULT_CACHE_MAX_ENTRIES,
    1,
    MAX_CACHE_ENTRIES,
  );
  const rateLimitWindowMs = boundedInteger(
    options.rateLimitWindowMs ?? process.env.KPARENT_PROXY_RATE_LIMIT_WINDOW_MS,
    DEFAULT_RATE_LIMIT_WINDOW_MS,
    1,
    60 * 60 * 1000,
  );
  const rateLimitMaxRequests = boundedInteger(
    options.rateLimitMaxRequests ?? process.env.KPARENT_PROXY_RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    1,
    10_000,
  );
  const rateLimitMaxClients = boundedInteger(
    options.rateLimitMaxClients ?? process.env.KPARENT_PROXY_RATE_LIMIT_MAX_CLIENTS,
    DEFAULT_RATE_LIMIT_MAX_CLIENTS,
    1,
    MAX_RATE_LIMIT_CLIENTS,
  );
  const upstreamTimeoutMs = boundedInteger(
    options.upstreamTimeoutMs ?? process.env.KPARENT_PROXY_UPSTREAM_TIMEOUT_MS,
    DEFAULT_UPSTREAM_TIMEOUT_MS,
    1,
    MAX_UPSTREAM_TIMEOUT_MS,
  );
  const upstreamMaxRetries = boundedInteger(
    options.upstreamMaxRetries ?? process.env.KPARENT_PROXY_UPSTREAM_MAX_RETRIES,
    DEFAULT_UPSTREAM_MAX_RETRIES,
    0,
    MAX_UPSTREAM_RETRIES,
  );
  const retryBackoffMs = boundedInteger(
    options.retryBackoffMs ?? process.env.KPARENT_PROXY_RETRY_BACKOFF_MS,
    DEFAULT_RETRY_BACKOFF_MS,
    0,
    MAX_RETRY_BACKOFF_MS,
  );
  const retryBackoffMaxMs = boundedInteger(
    options.retryBackoffMaxMs ?? process.env.KPARENT_PROXY_RETRY_BACKOFF_MAX_MS,
    Math.max(DEFAULT_RETRY_BACKOFF_MAX_MS, retryBackoffMs),
    retryBackoffMs,
    MAX_RETRY_BACKOFF_MS,
  );
  const sleep = typeof options.sleep === "function"
    ? options.sleep
    : (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs));
  const setTimer = typeof options.setTimer === "function" ? options.setTimer : setTimeout;
  const clearTimer = typeof options.clearTimer === "function" ? options.clearTimer : clearTimeout;
  const getClientId = typeof options.getClientId === "function"
    ? options.getClientId
    : (request) => request.socket.remoteAddress || "unknown";
  const rateLimiter = createFixedWindowRateLimiter({
    maxClients: rateLimitMaxClients,
    maxRequests: rateLimitMaxRequests,
    nowMs,
    windowMs: rateLimitWindowMs,
  });

  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, {
          ok: true,
          service: "k-parent-proxy",
          mode: "local-or-self-host",
          readOnly: true,
          neisConfigured: Boolean(apiKey),
          routes: ROUTE_NAMES,
          capabilities: {
            routePrefix: "/v1/neis",
            methods: ["GET"],
            cache: { kind: "process-memory", ttlMs, maxEntries: cacheMaxEntries },
            rateLimit: {
              algorithm: "fixed-window",
              scope: "per-client-address",
              windowMs: rateLimitWindowMs,
              maxRequests: rateLimitMaxRequests,
              maxClients: rateLimitMaxClients,
              retryAfter: true,
            },
            upstream: {
              provider: "NEIS",
              timeoutMs: upstreamTimeoutMs,
              maxRetries: upstreamMaxRetries,
              retryBackoffMs,
              retryBackoffMaxMs,
            },
          },
          deployment: { posture: "local-or-self-host-only", productionReady: false },
        });
      }
      if (request.method !== "GET") return sendError(response, 405, "method_not_allowed", "GET only.");

      const handler = ROUTES[url.pathname];
      if (!handler) return sendError(response, 404, "not_found", "Route not found.");
      if (!apiKey) return sendError(response, 503, "upstream_not_configured", "KEDU_INFO_KEY is required.");

      const rateLimit = rateLimiter.consume(getClientId(request));
      if (!rateLimit.allowed) {
        return sendError(response, 429, "rate_limited", "Too many requests.", {
          "retry-after": String(rateLimit.retryAfterSeconds),
        });
      }

      const cacheKey = normalizedCacheKey(url);
      const cached = cache.get(cacheKey);
      if (cached && cached.expiresAt > nowMs()) {
        touchCacheEntry(cache, cacheKey, cached);
        return sendJson(response, 200, { ...cached.body, cache: { hit: true, ttlMs } });
      }
      if (cached) cache.delete(cacheKey);

      const body = await executeWithRetry(
        (signal) => handler(url.searchParams, { adapter, apiKey, now, signal }),
        {
          clearTimer,
          maxRetries: upstreamMaxRetries,
          retryBackoffMaxMs,
          retryBackoffMs,
          setTimer,
          sleep,
          timeoutMs: upstreamTimeoutMs,
        },
      );
      setBoundedCacheEntry(cache, cacheKey, { body, expiresAt: nowMs() + ttlMs }, {
        maxEntries: cacheMaxEntries,
        nowMs: nowMs(),
      });
      return sendJson(response, 200, { ...body, cache: { hit: false, ttlMs } });
    } catch (error) {
      if (error.code === "BAD_QUERY") {
        return sendError(response, 400, "bad_request", safeErrorMessage(error, "Request query is invalid."));
      }
      if (error.code === "UPSTREAM_TIMEOUT") {
        return sendError(response, 504, "upstream_timeout", "The upstream request timed out.");
      }
      return sendError(response, 502, "upstream_error", "The upstream request failed.");
    }
  });
}

const ROUTES = Object.freeze({
  "/v1/neis/school-search": async (query, context) => {
    const schoolName = required(query, "schoolName");
    const result = await context.adapter.searchSchools({
      schoolName,
      educationOffice: query.get("educationOffice") || undefined,
      educationOfficeCode: query.get("educationOfficeCode") || undefined,
      apiKey: context.apiKey,
      signal: context.signal,
    });
    if (!result.ok) return { rows: [], error: result.status, candidates: result.candidates || [] };
    return {
      rows: result.schools.map((school) => ({
        education_office_code: school.atptOfcdcScCode,
        school_code: school.schoolCode,
        school_name: school.name,
        school_level: school.schoolLevel,
        address: school.address,
      })),
    };
  },

  "/v1/neis/classes": async (query, context) => {
    const educationOfficeCode = required(query, "educationOfficeCode");
    const schoolCode = required(query, "schoolCode");
    const year = query.get("year") || String(context.now().getUTCFullYear());
    const grade = query.get("grade");
    const payload = await context.adapter.requestNeisJson("classInfo", {
      ATPT_OFCDC_SC_CODE: educationOfficeCode,
      SD_SCHUL_CODE: schoolCode,
      AY: year,
      GRADE: grade || undefined,
    }, { apiKey: context.apiKey, signal: context.signal });
    const rows = context.adapter.extractRows(payload, "classInfo")
      .map((row) => ({ ay: String(row.AY || year), grade: String(row.GRADE || ""), class_nm: String(row.CLASS_NM || "") }))
      .filter((row) => row.class_nm)
      .sort((left, right) => Number(left.grade) - Number(right.grade) || Number(left.class_nm) - Number(right.class_nm));
    return emptyAware(rows, "학급 정보가 아직 공개되지 않았습니다.");
  },

  "/v1/neis/timetable": async (query, context) => {
    const level = query.get("level") || "els";
    if (!TIMETABLE_LEVELS.has(level)) throw badQuery("level must be els, mis, his, or sps.");
    const date = required(query, "date");
    assertValidDate(context.adapter, date, "date");
    const result = await context.adapter.getTimetable({
      educationOfficeCode: required(query, "educationOfficeCode"),
      schoolCode: required(query, "schoolCode"),
      date,
      dataset: level,
      grade: query.get("grade") || undefined,
      className: query.get("classNm") || undefined,
      schoolYear: query.get("ay") || undefined,
      semester: query.get("sem") || undefined,
      apiKey: context.apiKey,
      signal: context.signal,
    });
    const rows = result.timetable.map((item) => ({
      date: item.date,
      period: item.period,
      subject: item.subject,
      grade: item.grade,
      class_nm: item.className,
    }));
    return emptyAware(rows, "휴업일이거나 시간표가 아직 공개되지 않았습니다.");
  },

  "/v1/neis/schedule": async (query, context) => {
    const from = required(query, "from");
    const to = query.get("to") || from;
    const range = validDateRange(context.adapter, from, to);
    if ((Date.parse(range.end.isoDate) - Date.parse(range.start.isoDate)) / 86_400_000 > 30) {
      throw badQuery("schedule range must be 31 days or less.");
    }
    const payload = await context.adapter.requestNeisJson("SchoolSchedule", {
      ATPT_OFCDC_SC_CODE: required(query, "educationOfficeCode"),
      SD_SCHUL_CODE: required(query, "schoolCode"),
      AA_FROM_YMD: range.start.compactDate,
      AA_TO_YMD: range.end.compactDate,
    }, { apiKey: context.apiKey, signal: context.signal });
    const rows = context.adapter.extractRows(payload, "SchoolSchedule").map((row) => ({
      date: context.adapter.compactDateToIso(row.AA_YMD),
      event_name: row.EVENT_NM || row.EVENT_CNTNT || "학사일정",
      day_off: /휴업|방학|공휴일/.test(`${row.SBTR_DD_SC_NM || ""} ${row.EVENT_NM || ""}`),
    }));
    return emptyAware(rows, "학사일정이 아직 공개되지 않았습니다.");
  },

  "/v1/neis/academies": async (query, context) => {
    const educationOffice = optional(query, "educationOffice");
    const educationOfficeCode = optional(query, "educationOfficeCode");
    if (!educationOffice && !educationOfficeCode) throw badQuery("educationOffice or educationOfficeCode is required.");
    const district = optional(query, "district");
    const academyName = optional(query, "academyName");
    const course = optional(query, "course");
    // Parent lookups are local; refuse whole-office scans.
    if (!district && !academyName) throw badQuery("district or academyName is required.");
    const pageSize = boundedInteger(query.get("pageSize"), 20, 1, ACADEMY_MAX_PAGE_SIZE);
    const pageIndex = boundedInteger(query.get("page"), 1, 1, 1_000);

    const result = await context.adapter.searchAcademies({
      educationOffice,
      educationOfficeCode,
      district,
      academyName,
      course,
      pageSize,
      pageIndex,
      allowKeyless: false,
      apiKey: context.apiKey,
      now: context.now(),
      signal: context.signal,
    });
    if (!result.ok) {
      if (result.status === "not_found") return emptyAware([], "조건에 맞는 학원·교습소가 없습니다.");
      return { rows: [], error: result.status, candidates: result.candidates || [] };
    }
    return {
      total_count: result.totalCount,
      page: pageIndex,
      rows: result.academies.map((academy) => ({
        academy_number: academy.academyNumber,
        name: academy.name,
        kind: academy.kind,
        district: academy.district,
        registration_status: academy.registrationStatus,
        on_leave_today: academy.onLeaveToday,
        leave: academy.leave ? { start: academy.leave.startDate, end: academy.leave.endDate } : null,
        field: academy.field,
        course: academy.course,
        capacity: academy.capacity,
        tuition_disclosed: academy.tuition.disclosed,
        tuition: academy.tuition.items.map((item) => ({ course: item.course, amount_krw: item.amountKrw })),
        address: academy.address,
        telephone: academy.telephone,
        updated_at: academy.updatedAt,
      })),
    };
  },
});

function optional(query, key) {
  const value = query.get(key)?.trim();
  if (!value) return undefined;
  if (value.length > 120 || /[\r\n]/.test(value)) throw badQuery(`${key} is invalid.`);
  return value;
}

function emptyAware(rows, message) {
  return rows.length ? { rows } : { rows: [], info: { code: "INFO-200", message } };
}

function required(query, key) {
  const value = query.get(key)?.trim();
  if (!value) throw badQuery(`${key} is required.`);
  if (value.length > 120 || /[\r\n]/.test(value)) throw badQuery(`${key} is invalid.`);
  return value;
}

function badQuery(message) {
  return Object.assign(new Error(message), { code: "BAD_QUERY" });
}

function assertValidDate(adapter, value, label) {
  try {
    adapter.normalizeDateInput(value);
  } catch {
    throw badQuery(`${label} must be a valid YYYY-MM-DD or YYYYMMDD date.`);
  }
}

function validDateRange(adapter, from, to) {
  try {
    return adapter.normalizeDateRange(from, to);
  } catch (error) {
    throw badQuery(error.message);
  }
}

function normalizedCacheKey(url) {
  const entries = [...url.searchParams.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) =>
    leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue));
  return `${url.pathname}?${new URLSearchParams(entries).toString()}`;
}

function boundedInteger(value, fallback, minimum, maximum) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.min(Math.max(number, minimum), maximum);
}

function createFixedWindowRateLimiter({ maxClients, maxRequests, nowMs, windowMs }) {
  const clients = new Map();

  return {
    consume(clientId) {
      const timestamp = nowMs();
      const key = String(clientId || "unknown");
      let state = clients.get(key);

      if (!state || state.resetAt <= timestamp) {
        if (!state) evictOldestEntries(clients, maxClients - 1);
        state = { count: 1, resetAt: timestamp + windowMs };
        touchCacheEntry(clients, key, state);
        return { allowed: true, retryAfterSeconds: 0 };
      }

      touchCacheEntry(clients, key, state);
      if (state.count >= maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - timestamp) / 1000)),
        };
      }

      state.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

function touchCacheEntry(cache, key, value) {
  cache.delete(key);
  cache.set(key, value);
}

function setBoundedCacheEntry(cache, key, value, { maxEntries, nowMs }) {
  for (const [candidateKey, candidate] of cache) {
    if (candidate.expiresAt <= nowMs) cache.delete(candidateKey);
  }
  cache.delete(key);
  evictOldestEntries(cache, maxEntries - 1);
  cache.set(key, value);
}

function evictOldestEntries(map, maximumBeforeInsert) {
  while (map.size > maximumBeforeInsert) {
    const oldestKey = map.keys().next().value;
    map.delete(oldestKey);
  }
}

async function executeWithRetry(task, options) {
  let attempt = 0;
  while (true) {
    try {
      return await executeWithTimeout(task, options);
    } catch (error) {
      if (attempt >= options.maxRetries || !isRetryableError(error)) throw error;
      const backoffMs = Math.min(options.retryBackoffMs * (2 ** attempt), options.retryBackoffMaxMs);
      attempt += 1;
      await options.sleep(backoffMs);
    }
  }
}

async function executeWithTimeout(task, { clearTimer, setTimer, timeoutMs }) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimer(() => {
      controller.abort();
      const error = new Error(`NEIS request exceeded ${timeoutMs}ms.`);
      error.code = "UPSTREAM_TIMEOUT";
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve().then(() => task(controller.signal)), timeout]);
  } finally {
    clearTimer(timer);
  }
}

function isRetryableError(error) {
  if (!error) return false;
  if (error.code === "UPSTREAM_TIMEOUT" || error.status === "upstream_error" || error.retryable === true) {
    return true;
  }
  const statusCode = Number(error.statusCode || error.status);
  if (statusCode === 408 || statusCode === 429 || statusCode >= 500) return true;
  if (RETRYABLE_ERROR_CODES.has(error.code)) return true;
  return error instanceof TypeError;
}

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

function sendError(response, status, code, message, headers) {
  sendJson(response, status, { ok: false, error: code, message }, headers);
}

function safeErrorMessage(error, fallback) {
  const sanitized = sanitizeError(error);
  return typeof sanitized?.message === "string" && sanitized.message !== REDACTED
    ? sanitized.message
    : fallback;
}

if (require.main === module) {
  const host = process.env.KPARENT_PROXY_HOST || "127.0.0.1";
  const port = Number(process.env.KPARENT_PROXY_PORT || 4020);
  createKParentProxyServer().listen(port, host, () => {
    console.log(`k-parent-proxy listening on http://${host}:${port}`);
  });
}

module.exports = {
  DEFAULT_CACHE_MAX_ENTRIES,
  DEFAULT_CACHE_TTL_MS,
  DEFAULT_RATE_LIMIT_MAX_REQUESTS,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  DEFAULT_UPSTREAM_MAX_RETRIES,
  DEFAULT_UPSTREAM_TIMEOUT_MS,
  createKParentProxyServer,
  normalizedCacheKey,
  safeErrorMessage,
};
