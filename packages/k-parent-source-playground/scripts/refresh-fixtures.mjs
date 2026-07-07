#!/usr/bin/env node
// Refresh playground / urban-park fixtures from live data.go.kr endpoints.
// Requires KSKILL_DATAGOKR_KEY in the environment.
//
//   KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures
//
// NOTE: confirm the service paths in src/index.js (PLAYGROUND_PATH / URBAN_PARK_PATH)
// against your approved data.go.kr service detail page before running.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { fetchPlaygrounds, fetchUrbanParks } = require("../src/index.js");

const apiKey = process.env.KSKILL_DATAGOKR_KEY;
if (!apiKey) {
  console.error("KSKILL_DATAGOKR_KEY is required to refresh playground fixtures.");
  console.error("   KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures");
  process.exit(1);
}

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "test", "fixtures");

function rawRequest(fn) {
  let captured = null;
  const fetchImpl = async (url, opts) => {
    const res = await fetch(url, opts);
    const text = await res.text();
    try {
      captured = JSON.parse(text);
    } catch {
      captured = { raw: text };
    }
    return new Response(text, { status: res.status });
  };
  return fn(fetchImpl).then(() => captured);
}

async function main() {
  const playgrounds = await rawRequest((fetchImpl) =>
    fetchPlaygrounds({ apiKey, fetchImpl, sido: "서울특별시" }));
  writeFileSync(join(fixturesDir, "playgrounds.json"), JSON.stringify(playgrounds, null, 2) + "\n");
  console.log("wrote playgrounds.json");

  const parks = await rawRequest((fetchImpl) =>
    fetchUrbanParks({ apiKey, fetchImpl, sido: "서울특별시" }));
  writeFileSync(join(fixturesDir, "urban-parks.json"), JSON.stringify(parks, null, 2) + "\n");
  console.log("wrote urban-parks.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
