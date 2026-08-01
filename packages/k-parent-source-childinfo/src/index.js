const {
  ERROR_STATUS,
} = require("k-parent-core");
const {
  normalizeChildcareRows,
  normalizeKindergartenRows,
} = require("./parse");

// =============================================================================
// data.go.kr endpoint configuration.
//
// IMPORTANT: data.go.kr 서비스의 BASE/PATH 와 파라미터 명칭은 활용신청한 서비스
// 버전에 따라 달라질 수 있다(예: ChildCareInfo, 어린이집정보공개표준데이터,
// 유치원알리미 등 여러 제공처가 존재). 아래 값은 합리적 기본값이며, 실제 가입/활용신청
// 이후 포털의 "참고문서"(API 명세서)에서 정확한 경로/파라미터를 확인해 교체해야 한다.
//
// 어린이집정보공개포털 (한국사회보장정보원) - 어린이집 일반/상세
//   BASE: http://apis.data.go.kr/1383000/sftFddSttusService  (예시)
//   PATH: getDddSttusList / getDddInfo  (예시)
// 유치원알리미 (교육부/유아교육진흥원) - 유치원 현황
//   BASE: http://apis.data.go.kr/1613000/KindergartenStatusService  (예시)
//   PATH: getKindergartenStatus  (예시)
//
// 공통 인증 파라미터: serviceKey (KSKILL_DATAGOKR_KEY)
// 공통 응답 포맷: response.body.items.item (배열 또는 단일 객체)
// =============================================================================
const DATAGOKR_BASE_URL = "http://apis.data.go.kr";

const CHILDCARE_ENDPOINT = "/1383000/sftFddSttusService/getDddSttusList"; // 어린이집정보공개 (확인 필요)
const KINDERGARTEN_ENDPOINT = "/1613000/KindergartenStatusService/getKindergartenStatus"; // 유치원현황 (확인 필요)

async function requestDataGoKr(endpoint, params, options = {}) {
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

  const url = new URL(endpoint, DATAGOKR_BASE_URL);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("_type", "json");
  url.searchParams.set("numOfRows", String(options.numOfRows || 100));
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
      "user-agent": "k-parent-skills/childinfo",
      ...(options.headers || {}),
    },
    signal: options.signal,
  });

  if (!response.ok) {
    const error = new Error(`data.go.kr request failed with ${response.status} for ${endpoint}.`);
    error.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw error;
  }

  return response.json();
}

async function fetchChildcareCenters(options = {}) {
  // 파라미터명(sidoCode/sigunguCode 등)은 활용신청한 서비스 명세에서 확정해야 한다.
  const payload = options.payload || await requestDataGoKr(CHILDCARE_ENDPOINT, {
    arcode: options.sidoCode || options.arcode,
    sigunguCode: options.sigunguCode,
    crname: options.name,
  }, options);

  const centers = normalizeChildcareRows(payload, {
    fetchedAt: options.fetchedAt,
    now: options.now,
    sourceUrl: options.sourceUrl,
  });

  return {
    ok: true,
    status: "ok",
    items: centers,
    raw: payload,
  };
}

async function fetchKindergartens(options = {}) {
  // 파라미터명(sidoCode/sggCode 등)은 활용신청한 서비스 명세에서 확정해야 한다.
  const payload = options.payload || await requestDataGoKr(KINDERGARTEN_ENDPOINT, {
    sidoCode: options.sidoCode,
    sggCode: options.sggCode,
    kindername: options.name,
  }, options);

  const kindergartens = normalizeKindergartenRows(payload, {
    fetchedAt: options.fetchedAt,
    now: options.now,
    sourceUrl: options.sourceUrl,
  });

  return {
    ok: true,
    status: "ok",
    items: kindergartens,
    raw: payload,
  };
}

module.exports = {
  DATAGOKR_BASE_URL,
  CHILDCARE_ENDPOINT,
  KINDERGARTEN_ENDPOINT,
  requestDataGoKr,
  fetchChildcareCenters,
  fetchKindergartens,
  ...require("./parse"),
};
