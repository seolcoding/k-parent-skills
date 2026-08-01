const { ERROR_STATUS } = require("k-parent-core");
const {
  normalizeFestivals,
  normalizeSpots,
  extractItems,
} = require("./parse");

// Korea Tourism Organization TourAPI 4.0 (KorService2), served via data.go.kr.
// Each operation lives under this base; the serviceKey is the data.go.kr key.
const BASE = "http://apis.data.go.kr/B551011/KorService2";

// Common required query params for every TourAPI 4.0 call.
function commonParams(serviceKey, options = {}) {
  return {
    serviceKey,
    MobileOS: "ETC",
    MobileApp: "k-parent",
    _type: "json",
    numOfRows: options.numOfRows || 30,
    pageNo: options.pageNo || 1,
  };
}

async function requestTourapiJson(operation, params, options = {}) {
  const apiKey = options.apiKey || process.env.KSKILL_TOURAPI_KEY;
  if (!apiKey) {
    const error = new Error("KSKILL_TOURAPI_KEY or options.apiKey is required for live TourAPI requests.");
    error.status = ERROR_STATUS.MISSING_CONFIG;
    throw error;
  }

  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }

  const url = new URL(`${BASE}/${operation}`);
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
      "user-agent": "k-parent-skills/tourapi",
      ...(options.headers || {}),
    },
    signal: options.signal,
  });

  if (!response.ok) {
    const error = new Error(`TourAPI request failed with ${response.status} for ${operation}.`);
    error.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw error;
  }

  return response.json();
}

// /searchFestival2 — festivals by start date (and optional area).
async function searchFestival(options = {}) {
  if (!options.eventStartDate) {
    throw new Error("eventStartDate (YYYYMMDD) is required.");
  }

  const payload = options.payload || await requestTourapiJson("searchFestival2", {
    eventStartDate: String(options.eventStartDate),
    eventEndDate: options.eventEndDate ? String(options.eventEndDate) : undefined,
    areaCode: options.areaCode,
    sigunguCode: options.sigunguCode,
    arrange: options.arrange || "C",
  }, options);

  return {
    ok: true,
    status: "ok",
    festivals: normalizeFestivals(payload, {
      operation: "searchFestival2",
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
  };
}

// /areaBasedList2 — tourist spots by area and content type (12 관광지, 14 문화시설, 28 레포츠 ...).
async function areaBasedList(options = {}) {
  if (!options.areaCode) {
    throw new Error("areaCode is required.");
  }

  const payload = options.payload || await requestTourapiJson("areaBasedList2", {
    areaCode: options.areaCode,
    sigunguCode: options.sigunguCode,
    contentTypeId: options.contentTypeId,
    arrange: options.arrange || "C",
  }, options);

  return {
    ok: true,
    status: "ok",
    spots: normalizeSpots(payload, {
      operation: "areaBasedList2",
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
  };
}

// /locationBasedList2 — spots near a coordinate within a radius (meters).
async function locationBasedList(options = {}) {
  if (options.mapX === undefined || options.mapY === undefined) {
    throw new Error("mapX and mapY are required.");
  }

  const payload = options.payload || await requestTourapiJson("locationBasedList2", {
    mapX: options.mapX,
    mapY: options.mapY,
    radius: options.radius || 5000,
    contentTypeId: options.contentTypeId,
    arrange: options.arrange || "E",
  }, options);

  return {
    ok: true,
    status: "ok",
    spots: normalizeSpots(payload, {
      operation: "locationBasedList2",
      fetchedAt: options.fetchedAt,
      now: options.now,
    }),
  };
}

module.exports = {
  BASE,
  requestTourapiJson,
  searchFestival,
  areaBasedList,
  locationBasedList,
  extractItems,
  ...require("./parse"),
};
