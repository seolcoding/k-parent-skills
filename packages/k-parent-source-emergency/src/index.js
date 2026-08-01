const {
  ERROR_STATUS,
} = require("k-parent-core");
const {
  normalizeFacilityRows,
} = require("./parse");

// =============================================================================
// 응급의료포털 e-gen (국립중앙의료원) - data.go.kr
//
// IMPORTANT: BASE/PATH 및 파라미터명(Q0=시도, Q1=시군구 등)은 활용신청한 서비스
// 명세에 따라 달라질 수 있다. 아래 값은 e-gen 공개 명세 기준 합리적 기본값이며,
// 가입/활용신청 후 포털 "참고문서"에서 정확한 경로/파라미터를 확인해 교체한다.
//
//   BASE: http://apis.data.go.kr/B552657
//   약국(주말/공휴일 야간 운영) : /ErmctInsttInfoInqireService/getParmacyListInfoInqire
//   응급실 실시간 정보         : /ErmctInsttInfoInqireService/getEgytListInfoInqire
//   공통 시도/시군구 파라미터  : Q0 (시도), Q1 (시군구)
//   공통 인증 파라미터         : serviceKey (KSKILL_DATAGOKR_KEY)
//   공통 응답 포맷             : response.body.items.item (배열 또는 단일 객체)
// =============================================================================
const EGEN_BASE_URL = "http://apis.data.go.kr/B552657";

const PHARMACY_ENDPOINT = "/ErmctInsttInfoInqireService/getParmacyListInfoInqire"; // 확인 필요
const EMERGENCY_ROOM_ENDPOINT = "/ErmctInsttInfoInqireService/getEgytListInfoInqire"; // 확인 필요

async function requestEgen(endpoint, params, options = {}) {
  const apiKey = options.apiKey || process.env.KSKILL_DATAGOKR_KEY;
  if (!apiKey) {
    const error = new Error("KSKILL_DATAGOKR_KEY or options.apiKey is required for live e-gen requests.");
    error.status = ERROR_STATUS.MISSING_CONFIG;
    throw error;
  }

  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }

  const url = new URL(endpoint, EGEN_BASE_URL);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("_type", "json");
  url.searchParams.set("numOfRows", String(options.numOfRows || 50));
  url.searchParams.set("pageNo", String(options.pageNo || 1));

  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetchImpl(url.toString(), {
    method: "GET",
    headers: {
      accept: "application/json",
      "user-agent": "k-parent-skills/emergency",
      ...(options.headers || {}),
    },
    signal: options.signal,
  });

  if (!response.ok) {
    const error = new Error(`e-gen request failed with ${response.status} for ${endpoint}.`);
    error.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw error;
  }

  return response.json();
}

async function fetchNightHolidayPharmacies(options = {}) {
  const payload = options.payload || await requestEgen(PHARMACY_ENDPOINT, {
    Q0: options.sido,
    Q1: options.sgg,
  }, options);

  const items = normalizeFacilityRows(payload, {
    label: "e-gen 약국",
    type: "facility",
    fetchedAt: options.fetchedAt,
    now: options.now,
    sourceUrl: options.sourceUrl,
  });

  return { ok: true, status: "ok", items, raw: payload };
}

async function fetchEmergencyRooms(options = {}) {
  const payload = options.payload || await requestEgen(EMERGENCY_ROOM_ENDPOINT, {
    Q0: options.sido,
    Q1: options.sgg,
  }, options);

  const items = normalizeFacilityRows(payload, {
    label: "e-gen 응급실",
    type: "clinic",
    fetchedAt: options.fetchedAt,
    now: options.now,
    sourceUrl: options.sourceUrl,
  });

  return { ok: true, status: "ok", items, raw: payload };
}

module.exports = {
  EGEN_BASE_URL,
  PHARMACY_ENDPOINT,
  EMERGENCY_ROOM_ENDPOINT,
  requestEgen,
  fetchNightHolidayPharmacies,
  fetchEmergencyRooms,
  ...require("./parse"),
};
