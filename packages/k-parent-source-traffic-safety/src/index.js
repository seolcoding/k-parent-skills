const { ERROR_STATUS } = require("k-parent-core");
const {
  extractItems,
  normalizeSchoolZoneRisk,
  normalizeProtectionZones,
  normalizeYellowCarpets,
} = require("./parse");

const BASE = "http://apis.data.go.kr";

const SCHOOLZONE_CHILD_ACCIDENT_PATH = "/B552061/schoolzoneChild/getRestSchoolzoneChild";
const GYEONGBUK_CHILD_PROTECTION_ZONE_PATH = "/6470000/ChildProtectionZone/child";
const SEONGNAM_YELLOW_CARPET_PATH = "/3780000/yellowCarpetService/yellowCarpetList";
const UIRYEONG_CHILD_PROTECTION_ZONE_PATH = "/5390000/uiryeongcdkidssafe/getUiryeongkidssafeNew";

function commonParams(serviceKey, options = {}) {
  return {
    serviceKey,
    type: options.type || options.returnType || "json",
    numOfRows: options.numOfRows || 100,
    pageNo: options.pageNo || 1,
  };
}

async function requestDatagokrJson(servicePath, params, options = {}) {
  const apiKey = options.apiKey || process.env.KSKILL_DATAGOKR_KEY;
  if (!apiKey) {
    const error = new Error("KSKILL_DATAGOKR_KEY or options.apiKey is required for live data.go.kr requests.");
    error.status = ERROR_STATUS.MISSING_CONFIG;
    throw error;
  }

  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }

  const url = new URL(`${BASE}${servicePath}`);
  const merged = { ...commonParams(apiKey, options), ...(params || {}) };
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetchImpl(url.toString(), {
    method: "GET",
    headers: {
      accept: "application/json",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "user-agent": "k-parent-skill/traffic-safety",
      ...(options.headers || {}),
    },
    signal: options.signal,
  });

  if (!response.ok) {
    const error = new Error(`data.go.kr request failed with ${response.status} for ${servicePath}.`);
    error.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw error;
  }

  return response.json();
}

async function fetchSchoolZoneChildAccidentHotspots(options = {}) {
  const payload = options.payload || await requestDatagokrJson(SCHOOLZONE_CHILD_ACCIDENT_PATH, {
    siDo: options.sido || options.siDo,
    guGun: options.sigungu || options.guGun,
    searchYearCd: options.year || options.searchYearCd,
  }, options);

  return {
    ok: true,
    status: "ok",
    hotspots: normalizeSchoolZoneRisk(payload, {
      sourcePath: SCHOOLZONE_CHILD_ACCIDENT_PATH,
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
    raw: payload,
  };
}

async function fetchGyeongbukChildProtectionZones(options = {}) {
  const payload = options.payload || await requestDatagokrJson(GYEONGBUK_CHILD_PROTECTION_ZONE_PATH, {
    signguNm: options.sigungu || options.signguNm,
    fcltyTy: options.facilityType || options.fcltyTy,
  }, options);

  return {
    ok: true,
    status: "ok",
    zones: normalizeProtectionZones(payload, {
      sourcePath: GYEONGBUK_CHILD_PROTECTION_ZONE_PATH,
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
    raw: payload,
  };
}

async function fetchUiryeongChildProtectionZones(options = {}) {
  const payload = options.payload || await requestDatagokrJson(UIRYEONG_CHILD_PROTECTION_ZONE_PATH, {}, options);

  return {
    ok: true,
    status: "ok",
    zones: normalizeProtectionZones(payload, {
      sourcePath: UIRYEONG_CHILD_PROTECTION_ZONE_PATH,
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
    raw: payload,
  };
}

async function fetchSeongnamYellowCarpets(options = {}) {
  const payload = options.payload || await requestDatagokrJson(SEONGNAM_YELLOW_CARPET_PATH, {}, options);

  return {
    ok: true,
    status: "ok",
    yellowCarpets: normalizeYellowCarpets(payload, {
      sourcePath: SEONGNAM_YELLOW_CARPET_PATH,
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
    raw: payload,
  };
}

module.exports = {
  BASE,
  SCHOOLZONE_CHILD_ACCIDENT_PATH,
  GYEONGBUK_CHILD_PROTECTION_ZONE_PATH,
  SEONGNAM_YELLOW_CARPET_PATH,
  UIRYEONG_CHILD_PROTECTION_ZONE_PATH,
  requestDatagokrJson,
  fetchSchoolZoneChildAccidentHotspots,
  fetchGyeongbukChildProtectionZones,
  fetchUiryeongChildProtectionZones,
  fetchSeongnamYellowCarpets,
  extractItems,
  ...require("./parse"),
};
