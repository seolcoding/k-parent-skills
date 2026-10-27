const {
  ERROR_STATUS,
  createErrorResult,
  normalizeInstitution,
  normalizeMeal,
  normalizeScheduleItem,
  normalizeSourceMetadata,
} = require("k-parent-core");

const ALLERGEN_LABELS = Object.freeze({
  1: "난류",
  2: "우유",
  3: "메밀",
  4: "땅콩",
  5: "대두",
  6: "밀",
  7: "고등어",
  8: "게",
  9: "새우",
  10: "돼지고기",
  11: "복숭아",
  12: "토마토",
  13: "아황산류",
  14: "호두",
  15: "닭고기",
  16: "쇠고기",
  17: "오징어",
  18: "조개류",
  19: "잣",
});

const EDUCATION_OFFICES = Object.freeze([
  { code: "B10", name: "서울특별시교육청", aliases: ["서울", "서울시", "서울특별시"] },
  { code: "C10", name: "부산광역시교육청", aliases: ["부산", "부산시", "부산광역시"] },
  { code: "D10", name: "대구광역시교육청", aliases: ["대구", "대구시", "대구광역시"] },
  { code: "E10", name: "인천광역시교육청", aliases: ["인천", "인천시", "인천광역시"] },
  { code: "F10", name: "광주광역시교육청", aliases: ["광주", "광주시", "광주광역시"] },
  { code: "G10", name: "대전광역시교육청", aliases: ["대전", "대전시", "대전광역시"] },
  { code: "H10", name: "울산광역시교육청", aliases: ["울산", "울산시", "울산광역시"] },
  { code: "I10", name: "세종특별자치시교육청", aliases: ["세종", "세종시", "세종특별자치시"] },
  { code: "J10", name: "경기도교육청", aliases: ["경기", "경기도"] },
  { code: "K10", name: "강원특별자치도교육청", aliases: ["강원", "강원도", "강원특별자치도"] },
  { code: "M10", name: "충청북도교육청", aliases: ["충북", "충청북도"] },
  { code: "N10", name: "충청남도교육청", aliases: ["충남", "충청남도"] },
  { code: "P10", name: "전라북도교육청", aliases: ["전북", "전라북도"] },
  { code: "Q10", name: "전라남도교육청", aliases: ["전남", "전라남도"] },
  { code: "R10", name: "경상북도교육청", aliases: ["경북", "경상북도"] },
  { code: "S10", name: "경상남도교육청", aliases: ["경남", "경상남도"] },
  { code: "T10", name: "제주특별자치도교육청", aliases: ["제주", "제주도", "제주특별자치도"] },
]);

function normalizeDateInput(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("date must be a valid Date or YYYY-MM-DD string.");
    }

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(value).reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});
    return buildDateParts(parts.year, parts.month, parts.day);
  }

  const match = String(value || "").trim().match(/^(\d{4})[-.]?(\d{2})[-.]?(\d{2})$/);
  if (!match || !isValidCalendarDate(match[1], match[2], match[3])) {
    throw new Error("date must be a valid Date or YYYY-MM-DD string.");
  }

  return buildDateParts(match[1], match[2], match[3]);
}

function normalizeDateRange(startDate, endDate = startDate) {
  const start = normalizeDateInput(startDate);
  const end = normalizeDateInput(endDate);

  if (start.compactDate > end.compactDate) {
    throw new Error("startDate must be before or equal to endDate.");
  }

  return { start, end };
}

function resolveEducationOffice(input) {
  const text = normalizeToken(input);
  if (!text) {
    return { ok: false, status: ERROR_STATUS.NOT_FOUND, candidates: [] };
  }

  const exact = EDUCATION_OFFICES.find((office) => office.code === String(input).trim().toUpperCase());
  if (exact) {
    return { ok: true, ...exact, input };
  }

  const matches = EDUCATION_OFFICES.filter((office) => {
    const tokens = [office.name, ...office.aliases].map(normalizeToken);
    return tokens.some((token) => token.includes(text) || text.includes(token));
  });

  if (matches.length === 1) {
    return { ok: true, ...matches[0], input };
  }

  return {
    ok: false,
    status: matches.length ? ERROR_STATUS.AMBIGUOUS : ERROR_STATUS.NOT_FOUND,
    input,
    candidates: matches,
  };
}

function extractRows(payload, datasetName) {
  const block = payload?.[datasetName];
  if (!Array.isArray(block)) {
    return [];
  }

  const rowBlock = block.find((item) => Array.isArray(item?.row));
  return rowBlock?.row || [];
}

function normalizeSchoolRows(payload, options = {}) {
  const source = makeNeisSource("schoolInfo", options);
  return extractRows(payload, "schoolInfo").map((row) => {
    const school = normalizeInstitution({
      id: row.SD_SCHUL_CODE,
      type: "school",
      officialCode: row.SD_SCHUL_CODE,
      educationOfficeCode: row.ATPT_OFCDC_SC_CODE,
      name: row.SCHUL_NM,
      address: row.ORG_RDNMA || row.ORG_RDNDA || row.ORG_RDNMA,
      source,
      updatedAt: row.LOAD_DTM || null,
    });

    return {
      ...school,
      schoolCode: row.SD_SCHUL_CODE,
      atptOfcdcScCode: row.ATPT_OFCDC_SC_CODE,
      educationOfficeName: row.ATPT_OFCDC_SC_NM || null,
      schoolLevel: row.SCHUL_KND_SC_NM || null,
      homepage: row.HMPG_ADRES || null,
      telephone: row.ORG_TELNO || null,
      raw: row,
    };
  });
}

function resolveSchoolFromRows(payload, options = {}) {
  const candidates = normalizeSchoolRows(payload, options)
    .filter((school) => {
      if (!options.schoolName) {
        return true;
      }
      return normalizeToken(school.name).includes(normalizeToken(options.schoolName));
    })
    .filter((school) => {
      if (!options.schoolLevel) {
        return true;
      }
      return normalizeToken(school.schoolLevel).includes(normalizeToken(options.schoolLevel));
    });

  if (candidates.length === 1) {
    return {
      ok: true,
      status: "resolved",
      school: candidates[0],
      candidates,
    };
  }

  if (candidates.length > 1) {
    return createErrorResult(ERROR_STATUS.AMBIGUOUS, "학교명이 여러 후보와 일치합니다.", { candidates });
  }

  return createErrorResult(ERROR_STATUS.NOT_FOUND, "일치하는 학교를 찾지 못했습니다.", { candidates: [] });
}

function normalizeMealRows(payload, options = {}) {
  const source = makeNeisSource("mealServiceDietInfo", options);
  return extractRows(payload, "mealServiceDietInfo").map((row) => {
    const parsedMenu = parseDishName(row.DDISH_NM);
    return {
      ...normalizeMeal({
        date: compactDateToIso(row.MLSV_YMD),
        mealType: row.MMEAL_SC_NM || row.MMEAL_SC_CODE || null,
        institution: {
          schoolCode: row.SD_SCHUL_CODE,
          atptOfcdcScCode: row.ATPT_OFCDC_SC_CODE,
          name: row.SCHUL_NM || null,
        },
        menuItems: parsedMenu.menuItems,
        allergens: parsedMenu.allergyNumbers.map((number) => ALLERGEN_LABELS[number]).filter(Boolean),
        allergyNumbers: parsedMenu.allergyNumbers,
        origin: row.ORPLC_INFO || null,
        calories: row.CAL_INFO || null,
        nutrition: row.NTR_INFO || null,
        source,
      }),
      raw: row,
    };
  });
}

const TIMETABLE_DATASETS = Object.freeze({
  els: "elsTimetable",
  mis: "misTimetable",
  his: "hisTimetable",
  sps: "spsTimetable",
});

function resolveTimetableDataset(schoolLevelOrDataset) {
  const token = normalizeToken(schoolLevelOrDataset);
  if (!token) {
    return TIMETABLE_DATASETS.els;
  }

  if (Object.values(TIMETABLE_DATASETS).includes(String(schoolLevelOrDataset))) {
    return String(schoolLevelOrDataset);
  }

  if (TIMETABLE_DATASETS[token]) {
    return TIMETABLE_DATASETS[token];
  }

  if (token.includes("초")) {
    return TIMETABLE_DATASETS.els;
  }
  if (token.includes("중")) {
    return TIMETABLE_DATASETS.mis;
  }
  if (token.includes("고")) {
    return TIMETABLE_DATASETS.his;
  }
  if (token.includes("특수")) {
    return TIMETABLE_DATASETS.sps;
  }

  return TIMETABLE_DATASETS.els;
}

function normalizeTimetableRows(payload, options = {}) {
  const dataset = options.dataset || TIMETABLE_DATASETS.els;
  const source = makeNeisSource(dataset, options);
  return extractRows(payload, dataset).map((row) => {
    const date = compactDateToIso(row.ALL_TI_YMD);
    const period = row.PERIO != null && row.PERIO !== "" ? Number(row.PERIO) : null;
    const subject = row.ITRT_CNTNT || null;
    return {
      ...normalizeScheduleItem({
        id: [row.SD_SCHUL_CODE, row.ALL_TI_YMD, row.GRADE, row.CLASS_NM, row.PERIO].filter((value) => value != null && value !== "").join(":") || null,
        title: period != null ? `${period}교시 ${subject || "수업"}`.trim() : (subject || "수업"),
        description: subject,
        date,
        startsAt: date,
        endsAt: date,
        institution: {
          schoolCode: row.SD_SCHUL_CODE,
          atptOfcdcScCode: row.ATPT_OFCDC_SC_CODE,
          name: row.SCHUL_NM || null,
        },
        source,
      }),
      dataset,
      grade: row.GRADE != null && row.GRADE !== "" ? String(row.GRADE) : null,
      className: row.CLASS_NM != null && row.CLASS_NM !== "" ? String(row.CLASS_NM) : null,
      period,
      subject,
      semester: row.SEM || null,
      schoolYear: row.AY || null,
      raw: row,
    };
  });
}

function normalizeScheduleRows(payload, options = {}) {
  const source = makeNeisSource("SchoolSchedule", options);
  return extractRows(payload, "SchoolSchedule").map((row) => normalizeScheduleItem({
    id: [row.SD_SCHUL_CODE, row.AA_YMD, row.EVENT_NM].filter(Boolean).join(":") || null,
    title: row.EVENT_NM || row.EVENT_CNTNT || "학사일정",
    description: row.EVENT_CNTNT || null,
    date: compactDateToIso(row.AA_YMD),
    startsAt: compactDateToIso(row.AA_YMD),
    endsAt: compactDateToIso(row.AA_YMD),
    institution: {
      schoolCode: row.SD_SCHUL_CODE,
      atptOfcdcScCode: row.ATPT_OFCDC_SC_CODE,
      name: row.SCHUL_NM || null,
    },
    source,
  }));
}

function parseDishName(value) {
  const menuItems = String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s+/g, " "));

  const allergyNumbers = Array.from(new Set(
    menuItems.flatMap((item) => {
      const matches = Array.from(item.matchAll(/\(([\d.]+)\)/g));
      return matches.flatMap((match) => match[1].split(".").map(Number).filter((number) => Number.isInteger(number) && number >= 1 && number <= 19));
    }),
  )).sort((left, right) => left - right);

  return {
    menuItems,
    allergyNumbers,
  };
}

const NO_LEAVE_END_DATE = "99991231";
const PLACEHOLDER_TELEPHONE = /^0\d{1,2}-0{3,4}-0{4}$/;

function normalizeAcademyRows(payload, options = {}) {
  const source = makeNeisSource("acaInsTiInfo", {
    ...options,
    maxAgeHours: options.maxAgeHours == null ? 7 * 24 : options.maxAgeHours,
  });
  const today = compactToday(options.now);

  return extractRows(payload, "acaInsTiInfo").map((row) => {
    const academy = normalizeInstitution({
      id: row.ACA_ASNUM,
      type: "academy",
      officialCode: row.ACA_ASNUM,
      educationOfficeCode: row.ATPT_OFCDC_SC_CODE,
      name: row.ACA_NM,
      address: [cleanText(row.FA_RDNMA), cleanText(row.FA_RDNDA)].filter(Boolean).join(" ") || null,
      source,
      updatedAt: compactDateToIso(row.LOAD_DTM),
    });
    const leave = parseAcademyLeave(row.CAA_BEGIN_YMD, row.CAA_END_YMD);

    return {
      ...academy,
      academyNumber: row.ACA_ASNUM,
      kind: cleanText(row.ACA_INSTI_SC_NM),
      educationOfficeName: cleanText(row.ATPT_OFCDC_SC_NM),
      district: cleanText(row.ADMST_ZONE_NM),
      registrationStatus: cleanText(row.REG_STTUS_NM),
      establishedDate: compactDateToIso(row.ESTBL_YMD),
      registeredDate: compactDateToIso(row.REG_YMD),
      leave,
      onLeaveToday: Boolean(leave && today && leave.startCompact <= today && today <= leave.endCompact),
      field: cleanText(row.REALM_SC_NM),
      track: cleanText(row.LE_ORD_NM),
      course: cleanText(row.LE_CRSE_NM),
      courseList: splitList(row.LE_CRSE_LIST_NM),
      capacity: finiteNumberOrNull(row.TOFOR_SMTOT),
      tuition: parseAcademyTuition(row.PSNBY_THCC_CNTNT, row.THCC_OTHBC_YN),
      dormitory: row.BRHS_ACA_YN === "Y",
      postalCode: cleanText(row.FA_RDNZC),
      telephone: PLACEHOLDER_TELEPHONE.test(cleanText(row.FA_TELNO) || "") ? null : cleanText(row.FA_TELNO),
      raw: row,
    };
  });
}

function parseAcademyLeave(begin, end) {
  const startCompact = String(begin || "").trim();
  const endCompact = String(end || "").trim();
  if (!/^\d{8}$/.test(startCompact)) {
    return null;
  }
  const hasEnd = /^\d{8}$/.test(endCompact) && endCompact !== NO_LEAVE_END_DATE;
  return {
    startDate: compactDateToIso(startCompact),
    endDate: hasEnd ? compactDateToIso(endCompact) : null,
    startCompact,
    endCompact: hasEnd ? endCompact : NO_LEAVE_END_DATE,
  };
}

function parseAcademyTuition(text, disclosedFlag) {
  const disclosed = disclosedFlag === "Y";
  const items = splitList(text)
    .map((part) => {
      const match = part.match(/^(.*?):\s*([\d]+)$/);
      if (!match) {
        return { course: null, amountKrw: null, text: part };
      }
      return { course: match[1].trim() || null, amountKrw: Number(match[2]), text: part };
    });
  return { disclosed, items: disclosed ? items : [] };
}

function extractTotalCount(payload, datasetName) {
  const block = payload?.[datasetName];
  if (!Array.isArray(block)) {
    return 0;
  }
  const head = block.find((item) => Array.isArray(item?.head))?.head || [];
  const countEntry = head.find((item) => item && ("list_total_count" in item || "LIST_TOTAL_COUNT" in item));
  return Number(countEntry?.list_total_count ?? countEntry?.LIST_TOTAL_COUNT ?? 0) || 0;
}

function compactToday(now) {
  const date = now ? new Date(now) : new Date();
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  // NEIS dates are KST calendar dates.
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, "");
}

function cleanText(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

// Splits on commas outside parentheses: course names look like
// "초등영어A(4.2주)(주2회, 회당150분):240000".
function splitList(value) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of String(value || "")) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map((item) => item.trim()).filter(Boolean);
}

function finiteNumberOrNull(value) {
  const number = Number(value);
  return value === null || value === undefined || value === "" || !Number.isFinite(number) ? null : number;
}

function makeNeisSource(dataset, options = {}) {
  const endpoint = options.sourceUrl || `https://open.neis.go.kr/hub/${dataset}`;
  return normalizeSourceMetadata({
    sourceName: `NEIS ${dataset}`,
    sourceType: "official",
    sourceUrl: endpoint,
    fetchedAt: options.fetchedAt || new Date(),
    now: options.now,
    maxAgeHours: options.maxAgeHours == null ? 24 : options.maxAgeHours,
  });
}

function compactDateToIso(value) {
  const match = String(value || "").match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function buildDateParts(year, month, day) {
  return {
    isoDate: `${year}-${month}-${day}`,
    compactDate: `${year}${month}${day}`,
  };
}

function isValidCalendarDate(year, month, day) {
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  return date.getUTCFullYear() === Number(year)
    && date.getUTCMonth() + 1 === Number(month)
    && date.getUTCDate() === Number(day);
}

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

module.exports = {
  ALLERGEN_LABELS,
  EDUCATION_OFFICES,
  compactDateToIso,
  extractRows,
  extractTotalCount,
  normalizeAcademyRows,
  normalizeDateInput,
  normalizeDateRange,
  normalizeMealRows,
  normalizeScheduleRows,
  normalizeSchoolRows,
  normalizeTimetableRows,
  parseAcademyLeave,
  parseAcademyTuition,
  parseDishName,
  resolveEducationOffice,
  resolveSchoolFromRows,
  resolveTimetableDataset,
  TIMETABLE_DATASETS,
};
