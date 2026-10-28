"use strict";

// 국가유산청 국가유산 검색 OpenAPI (키 없음, XML).
// 목록은 시도(ccbaCtcd)·종목(ccbaKdcd)·이름(ccbaMnm1)으로 서버에서 거르고,
// 시대(ccceName)는 상세에만 있어 필요한 항목만 상세를 받는다.
// 짧은 시간에 요청이 몰리면 연결을 끊으므로(2026-10-28 확인) 순차·소량으로 부른다.

const { ERROR_STATUS, normalizeSourceMetadata } = require("k-parent-core");

const KHS_BASE_URL = "https://www.khs.go.kr/cha";
const KHS_DETAIL_PAGE = "https://www.khs.go.kr/heritage/selectHeritageDetail.do";

// 시도 → ccbaCtcd. 경남(38)·제주(50)는 응답 확인 전이다(요청 제한에 걸려 미검증).
// 광주(24)와 전남(36)은 서버가 "전남광주"로 묶어 같은 목록을 준다.
const KHS_SIDO_CODES = Object.freeze({
  서울: "11", 부산: "21", 대구: "22", 인천: "23", 광주: "24", 대전: "25", 울산: "26",
  세종: "45", 경기: "31", 강원: "32", 충북: "33", 충남: "34", 전북: "35", 전남: "36",
  경북: "37", 경남: "38", 제주: "50",
});

// 종목 코드 (ccbaKdcd)
const KHS_KIND_CODES = Object.freeze({
  국보: "11", 보물: "12", 사적: "13", 명승: "15", 천연기념물: "16",
  국가무형유산: "17", 국가민속문화유산: "18",
});

async function fetchHeritageList(options = {}) {
  if (options.payload) return options.payload;
  const url = new URL(`${KHS_BASE_URL}/SearchKindOpenapiList.do`);
  url.searchParams.set("pageUnit", String(options.pageUnit || 20));
  url.searchParams.set("pageIndex", String(options.pageIndex || 1));
  const sidoCode = options.sidoCode || KHS_SIDO_CODES[options.sido];
  if (sidoCode) url.searchParams.set("ccbaCtcd", sidoCode);
  const kindCode = options.kindCode || KHS_KIND_CODES[options.kind];
  if (kindCode) url.searchParams.set("ccbaKdcd", kindCode);
  if (options.name) url.searchParams.set("ccbaMnm1", options.name);
  return requestXml(url, options);
}

async function fetchHeritageDetail(item, options = {}) {
  if (options.payload) return options.payload;
  const url = new URL(`${KHS_BASE_URL}/SearchKindOpenapiDt.do`);
  url.searchParams.set("ccbaKdcd", item.kindCode);
  url.searchParams.set("ccbaAsno", item.assetNo);
  url.searchParams.set("ccbaCtcd", item.sidoCode);
  return requestXml(url, options);
}

async function requestXml(url, options) {
  const fetchImpl = options.fetchImpl || global.fetch;
  let response;
  try {
    response = await fetchImpl(url.toString(), { headers: { "user-agent": "k-parent-skills/culture" }, signal: options.signal });
  } catch (cause) {
    const err = new Error(`Heritage API request failed: ${cause.message}`);
    err.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw err;
  }
  if (!response.ok) {
    const err = new Error(`Heritage API request failed with status ${response.status}`);
    err.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw err;
  }
  const text = await response.text();
  if (!text.trim()) {
    const err = new Error("Heritage API returned an empty body (likely rate limited)");
    err.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw err;
  }
  return text;
}

function xmlValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))\\s*</${tag}>`));
  const value = (match?.[1] ?? match?.[2] ?? "").trim();
  return value || null;
}

function parseHeritageList(xml, options = {}) {
  const text = String(xml || "");
  const totalCount = Number(xmlValue(text, "totalCnt")) || 0;
  const source = normalizeSourceMetadata({
    sourceName: "국가유산청 국가유산 검색 OpenAPI",
    sourceType: "official",
    sourceUrl: `${KHS_BASE_URL}/SearchKindOpenapiList.do`,
    fetchedAt: options.fetchedAt || new Date(),
    now: options.now,
    maxAgeHours: options.maxAgeHours == null ? 24 * 7 : options.maxAgeHours,
  });
  const items = Array.from(text.matchAll(/<item>([\s\S]*?)<\/item>/g)).map(([, block]) => {
    const kindCode = xmlValue(block, "ccbaKdcd");
    const assetNo = xmlValue(block, "ccbaAsno");
    const sidoCode = xmlValue(block, "ccbaCtcd");
    const sidoName = xmlValue(block, "ccbaCtcdNm");
    const district = xmlValue(block, "ccsiName");
    const latitude = Number(xmlValue(block, "latitude"));
    const longitude = Number(xmlValue(block, "longitude"));
    return {
      id: `khs:${kindCode}-${assetNo}-${sidoCode}`,
      dataset: "khs",
      kind: "heritage",
      title: xmlValue(block, "ccbaMnm1"),
      institution: xmlValue(block, "ccbaAdmin"),
      sido: sidoName === "전남광주" ? options.requestedSido || null : sidoName,
      sidoLabel: sidoName,
      district,
      place: [sidoName, district].filter(Boolean).join(" ") || null,
      description: null,
      startDate: null,
      endDate: null,
      periodText: null,
      status: "unknown",
      audienceText: null,
      grades: [],
      charge: { free: null, text: null },
      designation: xmlValue(block, "ccmaName"),
      eras: [],
      eraSource: null,
      eraText: null,
      latitude: Number.isFinite(latitude) && latitude !== 0 ? latitude : null,
      longitude: Number.isFinite(longitude) && longitude !== 0 ? longitude : null,
      cancelled: xmlValue(block, "ccbaCncl") === "Y",
      kindCode,
      assetNo,
      sidoCode,
      url: `${KHS_DETAIL_PAGE}?ccbaKdcd=${kindCode}&ccbaAsno=${assetNo}&ccbaCtcd=${sidoCode}`,
      image: null,
      contact: null,
      source,
    };
  }).filter((item) => item.title && !item.cancelled);
  return { items, totalCount, source };
}

// 상세에서 시대·분류·설명·이미지를 붙인다. detectEras는 experience.js에서 주입한다.
function applyHeritageDetail(item, xml, detectEras) {
  const text = String(xml || "");
  const eraText = xmlValue(text, "ccceName");
  const description = xmlValue(text, "content");
  const fieldEras = detectEras(eraText || "");
  return {
    ...item,
    eraText,
    eras: fieldEras,
    eraSource: fieldEras.length ? "field" : null,
    description: description || item.description,
    category: [xmlValue(text, "gcodeName"), xmlValue(text, "bcodeName"), xmlValue(text, "mcodeName")].filter(Boolean).join(" > ") || null,
    address: xmlValue(text, "ccbaLcad"),
    image: xmlValue(text, "imageUrl"),
  };
}

module.exports = {
  KHS_KIND_CODES,
  KHS_SIDO_CODES,
  applyHeritageDetail,
  fetchHeritageDetail,
  fetchHeritageList,
  parseHeritageList,
};
