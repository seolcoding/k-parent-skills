const { ERROR_STATUS } = require("k-parent-core");
const {
  normalizePlaygrounds,
  normalizeUrbanParks,
  extractItems,
} = require("./parse");

// data.go.kr open data hosts. Two different standard datasets are used here.
//
// NOTE (uncertain service paths — verify against your data.go.kr 활용신청 detail page):
//   data.go.kr exposes each dataset under a provider-specific service id, and the
//   exact endpoint path + parameter names differ per dataset version. The paths
//   below are the commonly-published endpoints; confirm them in your approved
//   service's "참고문서"/"엔드포인트" section before going live.
const BASE = "http://apis.data.go.kr";

// 행안부 어린이놀이시설 정보 (Ministry of the Interior and Safety — children's playground facilities).
// Provider service id + operation. Param names vary by version (commonly facltNm/ronaAddr or rdnmadr/latitude/longitude).
const PLAYGROUND_PATH = "/B551014/SRVC_TODZ_PLAYGRND/todz_playgrnd"; // verify on data.go.kr

// 전국도시공원표준데이터 (nationwide urban park standard data).
// Standard data API typically: /15012890/v1/uddi:... OR /openapi/tn_pubr_public_cty_park_info_api.
const URBAN_PARK_PATH = "/15012890/v1/uddi:urban-park-standard"; // verify on data.go.kr

function commonParams(serviceKey, options = {}) {
  return {
    serviceKey,
    type: options.type || "json",
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
      "user-agent": "k-parent-skills/playground",
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

async function fetchPlaygrounds(options = {}) {
  const payload = options.payload || await requestDatagokrJson(PLAYGROUND_PATH, {
    // Filter params vary by dataset version; pass through what the caller provides.
    ctprvnNm: options.sido || options.ctprvnNm,
    signguNm: options.sigungu || options.signguNm,
  }, options);

  return {
    ok: true,
    status: "ok",
    playgrounds: normalizePlaygrounds(payload, {
      sourcePath: PLAYGROUND_PATH,
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
  };
}

async function fetchUrbanParks(options = {}) {
  const payload = options.payload || await requestDatagokrJson(URBAN_PARK_PATH, {
    ctprvnNm: options.sido || options.ctprvnNm,
    signguNm: options.sigungu || options.signguNm,
  }, options);

  return {
    ok: true,
    status: "ok",
    parks: normalizeUrbanParks(payload, {
      sourcePath: URBAN_PARK_PATH,
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
  };
}

module.exports = {
  BASE,
  PLAYGROUND_PATH,
  URBAN_PARK_PATH,
  requestDatagokrJson,
  fetchPlaygrounds,
  fetchUrbanParks,
  extractItems,
  ...require("./parse"),
};
