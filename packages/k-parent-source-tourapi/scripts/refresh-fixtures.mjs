#!/usr/bin/env node
// Refresh TourAPI fixtures from the live data.go.kr KorService2 endpoints.
// Requires KSKILL_TOURAPI_KEY in the environment.
//
//   KSKILL_TOURAPI_KEY=... npm run refresh:fixtures
//
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { searchFestival, areaBasedList, locationBasedList } = require("../src/index.js");

const apiKey = process.env.KSKILL_TOURAPI_KEY;
if (!apiKey) {
  console.error("KSKILL_TOURAPI_KEY is required to refresh TourAPI fixtures.");
  console.error("   KSKILL_TOURAPI_KEY=... npm run refresh:fixtures");
  process.exit(1);
}

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "test", "fixtures");

function rawRequest(fnName, fn) {
  // The public funcs normalize; for fixtures we need raw payloads, so we capture
  // them via a fetchImpl wrapper that records the JSON response.
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
  const festival = await rawRequest("searchFestival", (fetchImpl) =>
    searchFestival({ apiKey, fetchImpl, eventStartDate: "20260601", areaCode: 1 }));
  writeFileSync(join(fixturesDir, "festival.json"), JSON.stringify(festival, null, 2) + "\n");
  console.log("wrote festival.json");

  const area = await rawRequest("areaBasedList", (fetchImpl) =>
    areaBasedList({ apiKey, fetchImpl, areaCode: 1, contentTypeId: 12 }));
  writeFileSync(join(fixturesDir, "area-based.json"), JSON.stringify(area, null, 2) + "\n");
  console.log("wrote area-based.json");

  const location = await rawRequest("locationBasedList", (fetchImpl) =>
    locationBasedList({ apiKey, fetchImpl, mapX: 126.9970, mapY: 37.5772, radius: 2000 }));
  writeFileSync(join(fixturesDir, "location-based.json"), JSON.stringify(location, null, 2) + "\n");
  console.log("wrote location-based.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
