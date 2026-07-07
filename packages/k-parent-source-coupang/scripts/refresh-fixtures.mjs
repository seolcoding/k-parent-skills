#!/usr/bin/env node
// Refresh Coupang Partners product fixtures against the live API.
// Requires KSKILL_COUPANG_ACCESS_KEY and KSKILL_COUPANG_SECRET_KEY in the env.
//
//   KSKILL_COUPANG_ACCESS_KEY=... KSKILL_COUPANG_SECRET_KEY=... npm run refresh:fixtures

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { signRequest, COUPANG_BASE_URL } = require("../src/parse.js");

const accessKey = process.env.KSKILL_COUPANG_ACCESS_KEY;
const secretKey = process.env.KSKILL_COUPANG_SECRET_KEY;

if (!accessKey || !secretKey) {
  console.error("KSKILL_COUPANG_ACCESS_KEY and KSKILL_COUPANG_SECRET_KEY are required to refresh fixtures.");
  console.error("   KSKILL_COUPANG_ACCESS_KEY=... KSKILL_COUPANG_SECRET_KEY=... npm run refresh:fixtures");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "..", "test", "fixtures");
const keyword = process.env.COUPANG_FIXTURE_KEYWORD || "물티슈";

const requestPath = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";
const params = new URLSearchParams();
params.set("keyword", keyword);
params.set("limit", "2");
const query = params.toString();

const { authorization } = signRequest({
  method: "GET",
  path: requestPath,
  query,
  accessKey,
  secretKey,
});

const response = await fetch(`${COUPANG_BASE_URL}${requestPath}?${query}`, {
  method: "GET",
  headers: {
    Authorization: authorization,
    "Content-Type": "application/json;charset=UTF-8",
  },
});

if (!response.ok) {
  console.error(`Coupang products search failed with ${response.status}`);
  process.exit(1);
}

const json = await response.json();
fs.writeFileSync(path.join(fixturesDir, "products.json"), `${JSON.stringify(json, null, 2)}\n`);
console.log("Coupang fixtures refreshed.");
