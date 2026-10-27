const {
  ERROR_STATUS,
  createErrorResult,
} = require("k-parent-core");
const {
  extractTotalCount,
  normalizeAcademyRows,
  normalizeDateInput,
  normalizeDateRange,
  normalizeMealRows,
  normalizeScheduleRows,
  normalizeSchoolRows,
  normalizeTimetableRows,
  resolveEducationOffice,
  resolveSchoolFromRows,
  resolveTimetableDataset,
} = require("./parse");

const NEIS_BASE_URL = "https://open.neis.go.kr/hub";
// NEIS serves keyless "sample" requests but caps them at 5 rows per page.
const NEIS_KEYLESS_MAX_PAGE_SIZE = 5;

async function requestNeisJson(dataset, params, options = {}) {
  const apiKey = options.apiKey || process.env.KEDU_INFO_KEY;
  if (!apiKey && !options.allowKeyless) {
    const error = new Error("KEDU_INFO_KEY or options.apiKey is required for live NEIS requests.");
    error.status = ERROR_STATUS.MISSING_CONFIG;
    throw error;
  }

  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }

  const url = new URL(`${NEIS_BASE_URL}/${dataset}`);
  if (apiKey) {
    url.searchParams.set("KEY", apiKey);
  }
  const pageSize = options.pageSize || 100;
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", String(options.pageIndex || 1));
  url.searchParams.set("pSize", String(apiKey ? pageSize : Math.min(pageSize, NEIS_KEYLESS_MAX_PAGE_SIZE)));

  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetchImpl(url.toString(), {
    method: "GET",
    headers: {
      // Keyless NEIS sample requests return HTTP 500 when `accept: application/json`
      // is sent (verified 2026-10-27); `Type=json` already selects the format.
      ...(apiKey ? { accept: "application/json" } : {}),
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "user-agent": "k-parent-skills/neis",
      ...(options.headers || {}),
    },
    signal: options.signal,
  });

  if (!response.ok) {
    const error = new Error(`NEIS request failed with ${response.status} for ${dataset}.`);
    error.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw error;
  }

  return response.json();
}

async function searchSchools(options = {}) {
  if (!options.schoolName) {
    throw new Error("schoolName is required.");
  }

  const office = options.educationOfficeCode
    ? { ok: true, code: options.educationOfficeCode, name: null, input: options.educationOfficeCode }
    : resolveEducationOffice(options.region || options.educationOffice);

  if (!office.ok && (options.region || options.educationOffice)) {
    return createErrorResult(office.status, "교육청을 하나로 확정하지 못했습니다.", {
      candidates: office.candidates,
    });
  }

  const payload = options.payload || await requestNeisJson("schoolInfo", {
    ATPT_OFCDC_SC_CODE: office.ok ? office.code : undefined,
    SCHUL_NM: options.schoolName,
    SCHUL_KND_SC_NM: options.schoolLevel,
  }, options);

  const schools = normalizeSchoolRows(payload, {
    fetchedAt: options.fetchedAt,
    now: options.now,
  });

  return {
    ok: true,
    status: "ok",
    educationOffice: office.ok ? {
      input: office.input,
      code: office.code,
      name: office.name,
    } : null,
    schools,
  };
}

async function resolveSchool(options = {}) {
  const result = await searchSchools(options);
  if (!result.ok) {
    return result;
  }

  return resolveSchoolFromRows(
    { schoolInfo: [{ head: [{ LIST_TOTAL_COUNT: result.schools.length }] }, { row: result.schools.map((school) => school.raw) }] },
    {
      schoolName: options.schoolName,
      schoolLevel: options.schoolLevel,
      fetchedAt: options.fetchedAt,
      now: options.now,
    },
  );
}

async function getMeals(options = {}) {
  if (!options.schoolCode) {
    throw new Error("schoolCode is required.");
  }
  if (!options.educationOfficeCode && !options.atptOfcdcScCode) {
    throw new Error("educationOfficeCode is required.");
  }

  const date = normalizeDateInput(options.date || options.mealDate);
  const payload = options.payload || await requestNeisJson("mealServiceDietInfo", {
    ATPT_OFCDC_SC_CODE: options.educationOfficeCode || options.atptOfcdcScCode,
    SD_SCHUL_CODE: options.schoolCode,
    MLSV_YMD: date.compactDate,
    MMEAL_SC_CODE: options.mealKindCode,
  }, options);

  const meals = normalizeMealRows(payload, {
    fetchedAt: options.fetchedAt,
    now: options.now,
  });

  if (meals.length === 0) {
    return createErrorResult(ERROR_STATUS.NOT_FOUND, "해당 날짜의 급식 정보를 찾지 못했습니다.", { meals: [] });
  }

  return {
    ok: true,
    status: "ok",
    queryDate: date.isoDate,
    meals,
  };
}

async function getSchedule(options = {}) {
  if (!options.schoolCode) {
    throw new Error("schoolCode is required.");
  }
  if (!options.educationOfficeCode && !options.atptOfcdcScCode) {
    throw new Error("educationOfficeCode is required.");
  }

  const range = normalizeDateRange(options.startDate || options.date, options.endDate || options.startDate || options.date);
  const payload = options.payload || await requestNeisJson("SchoolSchedule", {
    ATPT_OFCDC_SC_CODE: options.educationOfficeCode || options.atptOfcdcScCode,
    SD_SCHUL_CODE: options.schoolCode,
    AA_FROM_YMD: range.start.compactDate,
    AA_TO_YMD: range.end.compactDate,
  }, options);

  return {
    ok: true,
    status: "ok",
    startDate: range.start.isoDate,
    endDate: range.end.isoDate,
    scheduleItems: normalizeScheduleRows(payload, {
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
  };
}

async function getTimetable(options = {}) {
  if (!options.schoolCode) {
    throw new Error("schoolCode is required.");
  }
  if (!options.educationOfficeCode && !options.atptOfcdcScCode) {
    throw new Error("educationOfficeCode is required.");
  }

  const dataset = resolveTimetableDataset(options.dataset || options.schoolLevel);
  const range = normalizeDateRange(
    options.startDate || options.date,
    options.endDate || options.startDate || options.date,
  );
  const payload = options.payload || await requestNeisJson(dataset, {
    ATPT_OFCDC_SC_CODE: options.educationOfficeCode || options.atptOfcdcScCode,
    SD_SCHUL_CODE: options.schoolCode,
    TI_FROM_YMD: range.start.compactDate,
    TI_TO_YMD: range.end.compactDate,
    AY: options.schoolYear,
    SEM: options.semester,
    GRADE: options.grade,
    CLASS_NM: options.className,
  }, options);

  return {
    ok: true,
    status: "ok",
    dataset,
    startDate: range.start.isoDate,
    endDate: range.end.isoDate,
    timetable: normalizeTimetableRows(payload, {
      dataset,
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
  };
}

async function searchAcademies(options = {}) {
  const office = options.educationOfficeCode
    ? { ok: true, code: options.educationOfficeCode, name: null, input: options.educationOfficeCode }
    : resolveEducationOffice(options.region || options.educationOffice);

  if (!office.ok) {
    return createErrorResult(office.status || ERROR_STATUS.AMBIGUOUS, "교육청을 하나로 확정하지 못했습니다.", {
      candidates: office.candidates || [],
      academies: [],
    });
  }

  const keyless = !(options.apiKey || process.env.KEDU_INFO_KEY);
  if (keyless && options.allowKeyless === false && !options.payload) {
    return createErrorResult(ERROR_STATUS.MISSING_CONFIG, "KEDU_INFO_KEY가 없어 학원 정보를 조회할 수 없습니다.", {
      academies: [],
    });
  }

  const payload = options.payload || await requestNeisJson("acaInsTiInfo", {
    ATPT_OFCDC_SC_CODE: office.code,
    ADMST_ZONE_NM: options.district,
    ACA_NM: options.academyName,
    REALM_SC_NM: options.field,
    LE_ORD_NM: options.track,
    LE_CRSE_NM: options.course,
  }, { ...options, allowKeyless: true });

  const academies = normalizeAcademyRows(payload, {
    fetchedAt: options.fetchedAt,
    now: options.now,
  });
  const totalCount = extractTotalCount(payload, "acaInsTiInfo");

  if (academies.length === 0) {
    return createErrorResult(ERROR_STATUS.NOT_FOUND, "조건에 맞는 학원·교습소를 찾지 못했습니다.", {
      academies: [],
      totalCount,
    });
  }

  return {
    ok: true,
    status: "ok",
    educationOffice: { input: office.input, code: office.code, name: office.name },
    totalCount,
    keyless: keyless && !options.payload,
    truncated: totalCount > academies.length,
    academies,
  };
}

module.exports = {
  requestNeisJson,
  resolveSchool,
  searchAcademies,
  searchSchools,
  getMeals,
  getSchedule,
  getTimetable,
  ...require("./parse"),
};
