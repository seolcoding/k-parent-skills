"use strict";

const { ERROR_STATUS } = require("k-parent-core");
const parse = require("./parse");
const experience = require("./experience");

const BASE_URL = "http://www.culture.go.kr/openapi/rest/publicperformancedisplays";

async function fetchCultureEvents(options = {}) {
  const apiKey = options.apiKey || process.env.KSKILL_CULTURE_KEY;
  if (!apiKey) {
    const err = new Error(
      "Culture portal API key is required (set KSKILL_CULTURE_KEY or pass options.apiKey)"
    );
    err.status = ERROR_STATUS.MISSING_CONFIG;
    throw err;
  }

  if (options.payload) {
    return options.payload;
  }

  const fetchImpl = options.fetchImpl || global.fetch;
  const params = new URLSearchParams({
    serviceKey: apiKey,
  });
  if (options.from) {
    params.set("from", options.from);
  }
  if (options.to) {
    params.set("to", options.to);
  }
  if (options.area) {
    params.set("sido", options.area);
  }
  if (options.rows) {
    params.set("rows", String(options.rows));
  }

  const url = `${BASE_URL}/area?${params.toString()}`;
  const response = await fetchImpl(url);
  if (!response.ok) {
    const err = new Error(`Culture portal API request failed with status ${response.status}`);
    err.status = ERROR_STATUS.UPSTREAM_ERROR;
    throw err;
  }
  return response.json();
}

module.exports = {
  fetchCultureEvents,
  ...parse,
  ...experience,
};
