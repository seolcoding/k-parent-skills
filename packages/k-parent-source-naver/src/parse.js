const { normalizeSourceMetadata } = require("k-parent-core");

const NAVER_BASE_URL = "https://openapi.naver.com/v1/search";

/**
 * Build the Naver OpenAPI auth headers from credentials.
 */
function buildNaverHeaders(clientId, clientSecret, extra = {}) {
  return {
    "X-Naver-Client-Id": clientId,
    "X-Naver-Client-Secret": clientSecret,
    accept: "application/json",
    "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "user-agent": "k-parent-skills/naver",
    ...extra,
  };
}

/**
 * Pure fetch helper. Accepts an injected fetchImpl and pre-built headers so it
 * stays unit-testable and offline-friendly.
 */
async function fetchNaverJson(endpoint, params, { fetchImpl, headers, signal } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }

  const url = new URL(`${NAVER_BASE_URL}/${endpoint}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return fetchImpl(url.toString(), {
    method: "GET",
    headers: headers || {},
    signal,
  });
}

function stripBoldTags(value) {
  return String(value || "")
    .replace(/<\/?b>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .trim();
}

function makeNaverSource(endpoint, options = {}) {
  return normalizeSourceMetadata({
    sourceName: `Naver Search ${endpoint}`,
    sourceType: "commercial",
    sourceUrl: options.sourceUrl || `${NAVER_BASE_URL}/${endpoint}`,
    fetchedAt: options.fetchedAt || new Date(),
    now: options.now,
    maxAgeHours: options.maxAgeHours == null ? 6 : options.maxAgeHours,
  });
}

function normalizeShoppingItems(payload, options = {}) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.map((row) => ({
    title: stripBoldTags(row.title),
    link: row.link || null,
    image: row.image || null,
    lprice: row.lprice || null,
    hprice: row.hprice || null,
    mallName: row.mallName || null,
    productId: row.productId || null,
    brand: row.brand || null,
    category: [row.category1, row.category2, row.category3, row.category4]
      .filter(Boolean)
      .join(" > ") || null,
    productType: row.productType || null,
    source: makeNaverSource("shop", options),
    raw: row,
  }));
}

function normalizeBlogItems(payload, options = {}) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.map((row) => ({
    title: stripBoldTags(row.title),
    link: row.link || null,
    bloggername: row.bloggername || null,
    bloggerlink: row.bloggerlink || null,
    postdate: row.postdate || null,
    source: makeNaverSource("blog", options),
    raw: row,
  }));
}

module.exports = {
  NAVER_BASE_URL,
  buildNaverHeaders,
  fetchNaverJson,
  stripBoldTags,
  normalizeShoppingItems,
  normalizeBlogItems,
};
