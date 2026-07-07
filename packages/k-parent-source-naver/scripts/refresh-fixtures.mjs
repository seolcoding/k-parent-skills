#!/usr/bin/env node
// Refresh Naver Search fixtures against the live API.
// Requires KSKILL_NAVER_CLIENT_ID and KSKILL_NAVER_CLIENT_SECRET in the env.
//
//   KSKILL_NAVER_CLIENT_ID=... KSKILL_NAVER_CLIENT_SECRET=... npm run refresh:fixtures

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientId = process.env.KSKILL_NAVER_CLIENT_ID;
const clientSecret = process.env.KSKILL_NAVER_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("KSKILL_NAVER_CLIENT_ID and KSKILL_NAVER_CLIENT_SECRET are required to refresh fixtures.");
  console.error("   KSKILL_NAVER_CLIENT_ID=... KSKILL_NAVER_CLIENT_SECRET=... npm run refresh:fixtures");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "..", "test", "fixtures");
const query = process.env.NAVER_FIXTURE_QUERY || "물티슈";

const headers = {
  "X-Naver-Client-Id": clientId,
  "X-Naver-Client-Secret": clientSecret,
  accept: "application/json",
};

async function pull(endpoint, fileName) {
  const url = new URL(`https://openapi.naver.com/v1/search/${endpoint}`);
  url.searchParams.set("query", query);
  url.searchParams.set("display", "2");

  const response = await fetch(url, { headers });
  if (!response.ok) {
    console.error(`Naver ${endpoint} failed with ${response.status}`);
    process.exit(1);
  }
  const json = await response.json();
  fs.writeFileSync(path.join(fixturesDir, fileName), `${JSON.stringify(json, null, 2)}\n`);
  console.log(`Wrote ${fileName}`);
}

await pull("shop.json", "shop.json");
await pull("blog.json", "blog.json");
console.log("Naver fixtures refreshed.");
