"use strict";

// 교과 연계 체험학습용 문화데이터광장(api.kcisa.kr) 데이터셋.
// 다섯 API의 서로 다른 필드를 하나의 "experience" 형태로 정규화한다.

const {
  ERROR_STATUS,
  createErrorResult,
  normalizeSourceMetadata,
} = require("k-parent-core");

const {
  applyHeritageDetail,
  fetchHeritageDetail,
  fetchHeritageList,
  parseHeritageList,
} = require("./heritage");

const KCISA_BASE_URL = "https://api.kcisa.kr/openapi";

const EXPERIENCE_DATASETS = Object.freeze({
  598: {
    path: "/API_CCA_145/request",
    name: "전시정보(통합)",
    kind: "exhibition",
    detailUrl: "https://www.culture.go.kr/data/openapi/openapiView.do?id=598&category=I&gubun=B",
  },
  540: {
    path: "/service/CNV/API_CNV_043/request",
    name: "국립지방박물관 문화행사 통합정보",
    kind: "program",
    detailUrl: "https://www.culture.go.kr/data/openapi/openapiView.do?id=540&category=B&gubun=A",
  },
  84: {
    path: "/service/rest/meta/CHAheri",
    name: "문화재청_문화재정보",
    kind: "heritage",
    detailUrl: "https://www.culture.go.kr/data/openapi/openapiView.do?id=84&category=B&gubun=A",
  },
  495: {
    path: "/service/rest/meta2020/getMCHBedu",
    name: "대한민국역사박물관 교육프로그램",
    kind: "program",
    detailUrl: "https://www.culture.go.kr/data/openapi/openapiView.do?id=495&category=B&gubun=A",
  },
  639: {
    path: "/API_CCA_164/request",
    name: "국립한글박물관 문화행사",
    kind: "event",
    detailUrl: "https://www.culture.go.kr/data/openapi/openapiView.do?id=639&category=A&gubun=A",
  },
});

// 기관명 → 시도. 전시·행사 API는 주소 필드가 없어 기관 소재지로 지역을 정한다.
const INSTITUTION_SIDO = Object.freeze({
  국립중앙박물관: "서울",
  국립경주박물관: "경북",
  국립광주박물관: "광주",
  국립부여박물관: "충남",
  국립공주박물관: "충남",
  국립대구박물관: "대구",
  국립청주박물관: "충북",
  국립김해박물관: "경남",
  국립진주박물관: "경남",
  국립제주박물관: "제주",
  국립춘천박물관: "강원",
  국립전주박물관: "전북",
  국립익산박물관: "전북",
  국립나주박물관: "전남",
  국립한글박물관: "서울",
  대한민국역사박물관: "서울",
  국립어린이청소년도서관: "서울",
  국립박물관문화재단: "서울",
  국립현대미술관: "서울",
  국립아시아문화전당: "광주",
  국립중앙극장: "서울",
  예술의전당: "서울",
  한국예술종합학교: "서울",
  한국영상자료원: "서울",
  태권도진흥재단: "전북",
});

const SIDO_ALIASES = Object.freeze([
  ["서울", ["서울특별시", "서울시", "서울"]],
  ["부산", ["부산광역시", "부산"]],
  ["대구", ["대구광역시", "대구"]],
  ["인천", ["인천광역시", "인천"]],
  ["광주", ["광주광역시", "광주"]],
  ["대전", ["대전광역시", "대전"]],
  ["울산", ["울산광역시", "울산"]],
  ["세종", ["세종특별자치시", "세종"]],
  ["경기", ["경기도", "경기"]],
  ["강원", ["강원특별자치도", "강원도", "강원"]],
  ["충북", ["충청북도", "충북"]],
  ["충남", ["충청남도", "충남"]],
  ["전북", ["전북특별자치도", "전라북도", "전북"]],
  ["전남", ["전라남도", "전남"]],
  ["경북", ["경상북도", "경북"]],
  ["경남", ["경상남도", "경남"]],
  ["제주", ["제주특별자치도", "제주도", "제주"]],
]);

// 초등 사회 역사 단원과 맞추기 위한 시대 사전. 순서는 시대순.
// 흔한 낱말과 겹치지 않게 경계를 둔다: "선사합니다", "일제히", "가야금", 고조선의 "조선", 통일신라의 "신라".
const ERA_KEYWORDS = Object.freeze([
  ["선사", /구석기|신석기|청동기|선사\s?시대|선사\s?유적/],
  ["고조선", /고조선/],
  ["삼국", /삼국\s?시대|고구려|백제|(?<!통일\s?)신라|가야(?!금)/],
  ["통일신라·발해", /통일\s?신라|발해|남북국/],
  ["고려", /고려/],
  ["조선", /(?<!고)조선/],
  ["개항·대한제국", /개항|대한제국|갑오개혁|동학/],
  ["일제강점·독립운동", /일제\s?강점|일제\s?시대|독립운동|3[·.]1\s?운동|삼일\s?운동|임시정부/],
  ["광복·대한민국", /광복|6[·.]25|한국\s?전쟁|정부\s?수립|민주화|산업화/],
]);

async function fetchExperienceDataset(dataset, options = {}) {
  const spec = EXPERIENCE_DATASETS[dataset];
  if (!spec) {
    throw new Error(`Unknown experience dataset: ${dataset}`);
  }
  if (options.payload) {
    return options.payload;
  }

  const apiKey = resolveDatasetKey(dataset, options);
  if (!apiKey) {
    const err = new Error(
      `Culture data API key is required (set KSKILL_CULTURE_KEY_${dataset} or KSKILL_CULTURE_KEY)`
    );
    err.status = ERROR_STATUS.MISSING_CONFIG;
    throw err;
  }

  const fetchImpl = options.fetchImpl || global.fetch;
  const url = new URL(`${KCISA_BASE_URL}${spec.path}`);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("numOfRows", String(options.numOfRows || 100));
  url.searchParams.set("pageNo", String(options.pageNo || 1));

  const response = await fetchImpl(url.toString(), {
    headers: { accept: "application/json" },
    signal: options.signal,
  });
  if (!response.ok) {
    const err = new Error(`Culture data API request failed with status ${response.status} for ${dataset}`);
    err.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw err;
  }
  return response.json();
}

function resolveDatasetKey(dataset, options = {}) {
  return options.apiKey
    || process.env[`KSKILL_CULTURE_KEY_${dataset}`]
    || process.env.KSKILL_CULTURE_KEY
    || null;
}

function parseExperiences(dataset, payload, options = {}) {
  const spec = EXPERIENCE_DATASETS[dataset];
  if (!spec) {
    throw new Error(`Unknown experience dataset: ${dataset}`);
  }
  const body = payload?.response?.body || {};
  const rawItems = body.items?.item ?? body.items ?? [];
  const rows = Array.isArray(rawItems) ? rawItems : [rawItems].filter(Boolean);
  const today = kstToday(options.now);
  const source = normalizeSourceMetadata({
    sourceName: `문화공공데이터광장 ${spec.name}`,
    sourceType: "official",
    sourceUrl: spec.detailUrl,
    fetchedAt: options.fetchedAt || new Date(),
    now: options.now,
    maxAgeHours: options.maxAgeHours == null ? 24 : options.maxAgeHours,
  });

  const items = rows
    .map((row) => NORMALIZERS[dataset](cleanRow(row)))
    .filter((item) => item.title && !isTestRecord(item))
    .map((item) => ({
      eraSource: item.eras.length ? "description" : null,
      ...item,
      dataset: Number(dataset),
      kind: spec.kind,
      status: itemStatus(item, today),
      source,
    }));

  return {
    items,
    totalCount: Number(body.totalCount) || null,
    pageNo: Number(body.pageNo) || null,
    source,
  };
}

const NORMALIZERS = {
  598(row) {
    const period = parsePeriod(row.PERIOD);
    const institution = row.CNTC_INSTT_NM || row.CONTRIBUTOR;
    const text = joinText(row.TITLE, row.DESCRIPTION);
    return {
      id: `598:${row.LOCAL_ID || row.URL || row.TITLE}`,
      title: row.TITLE,
      institution,
      sido: INSTITUTION_SIDO[institution] || null,
      place: row.EVENT_SITE,
      description: row.DESCRIPTION,
      ...period,
      audienceText: row.AUDIENCE,
      grades: parseGrades(row.AUDIENCE),
      charge: parseCharge(row.CHARGE),
      eras: detectEras(text),
      url: row.URL,
      image: row.IMAGE_OBJECT,
      contact: row.CONTACT_POINT,
    };
  },
  540(row) {
    const period = parsePeriod(row.period);
    const institution = row.creater;
    const text = joinText(row.title, row.description);
    return {
      id: `540:${row.url || row.title}`,
      title: row.title,
      institution,
      sido: INSTITUTION_SIDO[institution] || null,
      place: row.spatialCoverage,
      description: row.description,
      ...period,
      audienceText: null,
      grades: parseGrades(row.description),
      charge: parseCharge(row.charge),
      eras: detectEras(text),
      url: row.url,
      image: row.imageObject,
      contact: row.contactPoint,
    };
  },
  84(row) {
    // 시대 필드(extent)를 우선한다. 설명문에는 "일제시대 때 넘어졌다" 같은 부수 일화가 섞인다.
    const fieldEras = detectEras(joinText(row.extent, row.temporal));
    const eras = fieldEras.length ? fieldEras : detectEras(row.description);
    return {
      id: `84:${row.uci || row.title}`,
      title: row.title,
      institution: "문화재청",
      sido: sidoFromAddress(row.spatial),
      place: row.spatial,
      description: row.description,
      startDate: null,
      endDate: null,
      periodText: null,
      audienceText: null,
      grades: [],
      charge: { free: null, text: null },
      designation: row.subjectKeyword,
      eras,
      eraSource: fieldEras.length ? "field" : eras.length ? "description" : null,
      eraText: row.extent || row.temporal,
      url: null,
      image: null,
      contact: null,
    };
  },
  495(row) {
    const period = parsePeriod(row.temporalCoverage);
    const text = joinText(row.title, row.description);
    return {
      id: `495:${row.url || row.title}`,
      title: row.title,
      institution: "대한민국역사박물관",
      sido: "서울",
      place: row.spatialCoverage,
      description: row.description,
      ...period,
      audienceText: row.grade,
      grades: parseGrades(row.grade),
      charge: parseCharge(row.charge),
      application: parseApplication(row.subDescription, row.state),
      eras: detectEras(text),
      url: row.url,
      image: row.referenceIdentifier,
      contact: row.sourceTitle,
    };
  },
  639(row) {
    return {
      id: `639:${row.LOCAL_ID || row.URL || row.TITLE}`,
      title: row.TITLE,
      institution: "국립한글박물관",
      sido: "서울",
      place: row.EVENT_SITE,
      description: row.SUB_DESCRIPTION,
      startDate: null,
      endDate: null,
      periodText: null,
      issuedDate: row.ISSUED_DATE,
      audienceText: row.AUDIENCE,
      grades: parseGrades(row.AUDIENCE),
      charge: parseCharge(row.CHARGE),
      eras: detectEras(joinText(row.TITLE, row.SUB_DESCRIPTION)),
      url: row.URL,
      image: null,
      contact: row.CONTACT_POINT,
    };
  },
};

function cleanRow(row = {}) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = cleanText(value);
  }
  return out;
}

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = decodeEntities(String(value))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*/g, "\n")
    .trim();
  return !text || text === "None" || text === "null" ? null : text;
}

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, "\"")
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function isTestRecord(item) {
  return /^test$/i.test(String(item.title).trim());
}

function joinText(...parts) {
  return parts.filter(Boolean).join(" ");
}

// "2018-10-23~2019-12-29", "20210121~20210204", "2021-05-05 ~ 2021-05-05 12시/16시(2회)"
function parsePeriod(text) {
  if (!text) return { startDate: null, endDate: null, periodText: null };
  const dates = Array.from(String(text).matchAll(/(\d{4})[-.]?(\d{2})[-.]?(\d{2})/g))
    .map((match) => `${match[1]}-${match[2]}-${match[3]}`)
    .filter(isValidIsoDate);
  return {
    startDate: dates[0] || null,
    endDate: dates[1] || dates[0] || null,
    periodText: text,
  };
}

function isValidIsoDate(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso;
}

// 행사 기간이 없으면 접수기간으로 판단한다(접수가 끝났으면 참여 불가).
function itemStatus(item, today) {
  const status = periodStatus(item.startDate, item.endDate, today);
  if (status !== "unknown" || !item.application?.endDate) return status;
  return item.application.endDate < today ? "ended" : "upcoming";
}

function periodStatus(startDate, endDate, today) {
  if (!today || (!startDate && !endDate)) return "unknown";
  if (endDate && endDate < today) return "ended";
  if (startDate && startDate > today) return "upcoming";
  return "ongoing";
}

// 학년·연령 표기를 { level, from, to } 목록으로 바꾼다. level: 유아·초등·중등·고등·성인·전체
function parseGrades(text) {
  if (!text) return [];
  const source = String(text);
  const grades = [];
  const push = (level, from = null, to = from) => {
    if (!grades.some((g) => g.level === level && g.from === from && g.to === to)) {
      grades.push({ level, from, to });
    }
  };

  for (const match of source.matchAll(/초(?:등)?\s*(\d)\s*(?:학년)?\s*[~-]\s*(?:초(?:등)?\s*)?(\d)\s*(?:학년)?/g)) {
    push("초등", Number(match[1]), Number(match[2]));
  }
  for (const match of source.matchAll(/초등\s*(\d)\s*학년/g)) {
    push("초등", Number(match[1]));
  }
  if (/초등\s*(?:학생|생)?(?![\d\s]*학년)/.test(source) && !grades.some((g) => g.level === "초등")) {
    push("초등");
  }
  for (const match of source.matchAll(/중\s*(\d)\s*[~-]\s*중?\s*(\d)/g)) {
    push("중등", Number(match[1]), Number(match[2]));
  }
  if (/중학생|중등/.test(source) && !grades.some((g) => g.level === "중등")) push("중등");
  if (/고등학생|고교|고\s*\d\s*[~-]/.test(source)) push("고등");
  for (const match of source.matchAll(/(\d)\s*세\s*유아/g)) {
    push("유아", Number(match[1]));
  }
  if (/유아|미취학/.test(source) && !grades.some((g) => g.level === "유아")) push("유아");
  if (/가족|보호자\s*동반/.test(source)) push("가족");
  // 라이브 598에서 본 표기: "전체관람", "모든 연령"
  if (/^\s*(전체|전체\s?관람가?|누구나|모든\s?연령|전\s?연령)\s*$/.test(source)) push("전체");
  return grades;
}

function parseCharge(text) {
  if (!text) return { free: null, text: null };
  const value = String(text).trim();
  if (/^(0|무료)$/.test(value) || /무료/.test(value) && !/유료/.test(value)) {
    return { free: true, text: value === "0" ? "무료" : value };
  }
  if (/유료|\d{3,}\s*원/.test(value)) return { free: false, text: value };
  return { free: null, text: value };
}

// "접수기간:20170215~20170226||선정방법:추첨제||정원:20", "진행상태:교육신청마감"
function parseApplication(subDescription, state) {
  const fields = {};
  for (const part of String(subDescription || "").split("||")) {
    const [key, ...rest] = part.split(":");
    if (key && rest.length) fields[key.trim()] = rest.join(":").trim();
  }
  const period = parsePeriod(fields["접수기간"]);
  const capacity = Number(fields["정원"]);
  return {
    startDate: period.startDate,
    endDate: period.endDate,
    method: fields["선정방법"] || null,
    capacity: Number.isFinite(capacity) && fields["정원"] ? capacity : null,
    state: state ? String(state).replace(/^진행상태:/, "") : null,
  };
}

function detectEras(text) {
  if (!text) return [];
  return ERA_KEYWORDS.filter(([, pattern]) => pattern.test(text)).map(([era]) => era);
}

function sidoFromAddress(address) {
  const text = String(address || "").trim();
  for (const [sido, aliases] of SIDO_ALIASES) {
    if (aliases.some((alias) => text.startsWith(alias))) return sido;
  }
  return null;
}

function normalizeSido(value) {
  if (!value) return null;
  return sidoFromAddress(value) || null;
}

function kstToday(now) {
  const date = now ? new Date(now) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// 라이브 조회 페이지 계획 (캐시 없음). 2026-10-28 실측 기준:
// - 598: 진행 중·예정 전시가 1~5페이지에 몰려 있다 → 앞에서 3페이지
// - 540: 29만 건, 정렬이 섞여 있고 뒤쪽이 최근에 가깝다, 100건 요청은 504가 잦다 → 끝에서 50건씩 2페이지
// - 495: 708건 → 앞에서 2페이지
// - 639: 100건 안쪽 → 1페이지
// - 84: 서버 필터가 없다 → 기본 목록에서 빼고 국가유산청(khs)을 쓴다
const PAGE_PLANS = Object.freeze({
  598: { from: "start", pages: 3, rows: 100 },
  540: { from: "end", pages: 2, rows: 50 },
  84: { from: "start", pages: 1, rows: 100 },
  495: { from: "start", pages: 2, rows: 100 },
  639: { from: "start", pages: 1, rows: 100 },
});
const DEFAULT_DATASETS = Object.freeze(["598", "540", "khs", "495", "639"]);

async function fetchWithRetry(fn, options = {}) {
  try {
    return await fn();
  } catch (error) {
    if (options.retries === 0 || !/status 50[234]/.test(error.message)) throw error;
    await (options.sleep || defaultSleep)(options.retryDelayMs ?? 1500);
    return fn();
  }
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 계획에 따라 여러 페이지를 받아 합친다. 테스트는 options.payloads[dataset]에 페이지 배열(또는 한 페이지)을 넣는다.
async function fetchPlannedItems(dataset, options) {
  const injected = options.payloads?.[dataset];
  if (injected) {
    const pages = Array.isArray(injected) ? injected : [injected];
    return mergePages(dataset, pages, options);
  }
  const plan = { ...PAGE_PLANS[dataset], ...(options.pagePlans?.[dataset] || {}) };
  let pageNumbers = Array.from({ length: plan.pages }, (_, index) => index + 1);
  if (plan.from === "end") {
    const head = await fetchWithRetry(() => fetchExperienceDataset(dataset, { ...options, numOfRows: 1, pageNo: 1 }), options);
    const total = Number(head?.response?.body?.totalCount) || 0;
    const last = Math.max(1, Math.ceil(total / plan.rows));
    pageNumbers = Array.from({ length: plan.pages }, (_, index) => last - index).filter((page) => page >= 1);
  }
  const pages = [];
  for (const pageNo of pageNumbers) {
    try {
      pages.push(await fetchWithRetry(() => fetchExperienceDataset(dataset, { ...options, numOfRows: plan.rows, pageNo }), options));
    } catch (error) {
      if (!pages.length && pageNo === pageNumbers[pageNumbers.length - 1]) throw error;
    }
  }
  if (!pages.length) {
    const err = new Error(`No pages fetched for ${dataset}`);
    err.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw err;
  }
  return mergePages(dataset, pages, options);
}

function mergePages(dataset, pages, options) {
  const parsed = pages.map((page) => parseExperiences(dataset, page, options));
  return {
    items: parsed.flatMap((entry) => entry.items),
    totalCount: parsed.find((entry) => entry.totalCount)?.totalCount ?? null,
  };
}

// 국가유산청: 시도로 서버에서 거른다. 시대 조건이 있으면 상세를 detailLimit건까지 순차로 받는다.
async function fetchHeritageItems(sido, options) {
  if (!sido) {
    const err = new Error("Heritage search needs sido");
    err.status = ERROR_STATUS.AMBIGUOUS;
    throw err;
  }
  const listXml = options.payloads?.khs?.list
    ?? await fetchWithRetry(() => fetchHeritageList({ ...options, sido, kind: options.heritageKind, name: options.keyword, pageUnit: options.heritageRows || 30 }), options);
  const parsed = parseHeritageList(listXml, { ...options, requestedSido: sido });
  if (!options.eras?.length) return { items: parsed.items, totalCount: parsed.totalCount };

  const limit = options.detailLimit ?? 15;
  const enriched = [];
  for (const [index, item] of parsed.items.slice(0, limit).entries()) {
    try {
      const detailXml = options.payloads?.khs?.details?.[item.id]
        ?? await fetchHeritageDetail(item, options);
      enriched.push(applyHeritageDetail(item, detailXml, detectEras));
    } catch {
      enriched.push(item);
    }
    if (!options.payloads && index < limit - 1) await (options.sleep || defaultSleep)(options.detailDelayMs ?? 300);
  }
  return { items: enriched, totalCount: parsed.totalCount, detailed: enriched.length };
}

// 여러 데이터셋을 실시간으로 받아 지역·학년·시대·키워드로 거른다(캐시 없음).
// 서버 쪽 필터가 없는 데이터셋은 계획한 페이지 안에서만 찾는다(partial 표시).
async function searchExperiences(options = {}) {
  const datasets = (options.datasets || DEFAULT_DATASETS).map(String);
  const sido = normalizeSido(options.sido);
  const results = [];
  const datasetStatus = [];

  // 데이터셋끼리는 동시에, 한 데이터셋 안의 페이지는 순서대로 부른다.
  const settled = await Promise.all(datasets.map(async (dataset) => {
    try {
      const fetched = dataset === "khs"
        ? await fetchHeritageItems(sido, options)
        : await fetchPlannedItems(dataset, options);
      return { dataset, fetched };
    } catch (error) {
      return { dataset, error };
    }
  }));

  for (const { dataset, fetched, error } of settled) {
    if (error) {
      datasetStatus.push({ dataset, ok: false, status: error.status || ERROR_STATUS.UPSTREAM_ERROR });
      continue;
    }
    datasetStatus.push({
      dataset,
      ok: true,
      fetched: fetched.items.length,
      totalCount: fetched.totalCount,
      partial: Boolean(fetched.totalCount && fetched.totalCount > fetched.items.length),
      ...(fetched.detailed != null ? { detailed: fetched.detailed } : {}),
    });
    results.push(...fetched.items);
  }

  const today = kstToday(options.now);
  const seen = new Set();
  const filtered = results.map((item) => withRecentStatus(item, today)).filter((item) => {
    const key = `${item.title}|${item.institution || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (!options.includeEnded && item.status === "ended") return false;
    // 기간 없는 전시·행사는 대부분 지난 기록이라 기본으로 뺀다. 문화재(heritage)는 원래 기간이 없다.
    if (!options.includeUndated && item.status === "unknown" && item.kind !== "heritage") return false;
    if (sido && item.sido && item.sido !== sido) return false;
    if (sido && !item.sido && options.requireSido) return false;
    if (options.eras?.length && !options.eras.some((era) => item.eras.includes(era))) return false;
    if (options.gradeLevel && !matchesGrade(item.grades, options.gradeLevel, options.grade)) return false;
    if (options.keyword && !joinText(item.title, item.description).includes(options.keyword)) return false;
    return true;
  });

  if (datasetStatus.every((entry) => !entry.ok)) {
    return createErrorResult(datasetStatus[0]?.status || ERROR_STATUS.UPSTREAM_ERROR,
      "문화데이터를 하나도 받지 못했습니다.", { items: [], datasets: datasetStatus });
  }

  return { ok: true, status: "ok", items: filtered, datasets: datasetStatus };
}

const RECENT_ISSUED_DAYS = 90;

// 기간 필드가 없는 행사(639)는 등록일이 최근이면 "recent"로 남긴다. 일정은 원문에서 확인해야 한다.
function withRecentStatus(item, today) {
  if (item.status !== "unknown" || !item.issuedDate || !today) return item;
  const issued = Date.parse(`${String(item.issuedDate).slice(0, 10)}T00:00:00Z`);
  const days = (Date.parse(`${today}T00:00:00Z`) - issued) / 86_400_000;
  return Number.isFinite(days) && days >= 0 && days <= RECENT_ISSUED_DAYS ? { ...item, status: "recent" } : item;
}

// 학년 정보가 없는 항목은 통과시키고(대상 미표기), 명시된 경우만 맞춰 본다.
function matchesGrade(grades, level, grade) {
  if (!grades.length) return true;
  return grades.some((entry) => {
    if (entry.level === "전체" || entry.level === "가족") return true;
    if (entry.level !== level) return false;
    if (grade == null || entry.from == null) return true;
    return entry.from <= grade && grade <= (entry.to ?? entry.from);
  });
}

module.exports = {
  DEFAULT_DATASETS,
  ERA_KEYWORDS,
  EXPERIENCE_DATASETS,
  PAGE_PLANS,
  INSTITUTION_SIDO,
  detectEras,
  fetchExperienceDataset,
  matchesGrade,
  parseApplication,
  parseCharge,
  parseExperiences,
  parseGrades,
  parsePeriod,
  searchExperiences,
  sidoFromAddress,
};
