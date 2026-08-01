const http = require("node:http");
const { URL } = require("node:url");
const defaultAdapter = require("k-parent-source-neis");

const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const TIMETABLE_LEVELS = new Set(["els", "mis", "his", "sps"]);

function createKParentProxyServer(options = {}) {
  const adapter = options.adapter || defaultAdapter;
  const apiKey = options.apiKey ?? process.env.KEDU_INFO_KEY;
  const cache = options.cache || new Map();
  const now = typeof options.now === "function" ? options.now : () => new Date();
  const ttlMs = options.cacheTtlMs || DEFAULT_CACHE_TTL_MS;

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
          routes: ["school-search", "classes", "timetable", "schedule"],
        });
      }
      if (request.method !== "GET") return sendError(response, 405, "method_not_allowed", "GET only.");

      const handler = ROUTES[url.pathname];
      if (!handler) return sendError(response, 404, "not_found", "Route not found.");
      if (!apiKey) return sendError(response, 503, "upstream_not_configured", "KEDU_INFO_KEY is required.");

      const cacheKey = normalizedCacheKey(url);
      const cached = cache.get(cacheKey);
      if (cached && cached.expiresAt > now().getTime()) {
        return sendJson(response, 200, { ...cached.body, cache: { hit: true, ttlMs } });
      }

      const body = await handler(url.searchParams, { adapter, apiKey, now });
      cache.set(cacheKey, { body, expiresAt: now().getTime() + ttlMs });
      return sendJson(response, 200, { ...body, cache: { hit: false, ttlMs } });
    } catch (error) {
      const status = error.code === "BAD_QUERY" ? 400 : 502;
      return sendError(response, status, status === 400 ? "bad_request" : "upstream_error", error.message);
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
    }, { apiKey: context.apiKey });
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
    }, { apiKey: context.apiKey });
    const rows = context.adapter.extractRows(payload, "SchoolSchedule").map((row) => ({
      date: context.adapter.compactDateToIso(row.AA_YMD),
      event_name: row.EVENT_NM || row.EVENT_CNTNT || "학사일정",
      day_off: /휴업|방학|공휴일/.test(`${row.SBTR_DD_SC_NM || ""} ${row.EVENT_NM || ""}`),
    }));
    return emptyAware(rows, "학사일정이 아직 공개되지 않았습니다.");
  },
});

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

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

function sendError(response, status, code, message) {
  sendJson(response, status, { ok: false, error: code, message });
}

if (require.main === module) {
  const host = process.env.KPARENT_PROXY_HOST || "127.0.0.1";
  const port = Number(process.env.KPARENT_PROXY_PORT || 4020);
  createKParentProxyServer().listen(port, host, () => {
    console.log(`k-parent-proxy listening on http://${host}:${port}`);
  });
}

module.exports = {
  DEFAULT_CACHE_TTL_MS,
  createKParentProxyServer,
  normalizedCacheKey,
};
