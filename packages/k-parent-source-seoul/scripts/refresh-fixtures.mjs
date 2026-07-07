import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KEY = process.env.KSKILL_SEOUL_KEY;
if (!KEY) {
  console.error("KSKILL_SEOUL_KEY is required to refresh fixtures");
  console.error("   KSKILL_SEOUL_KEY=... npm run refresh:fixtures");
  process.exit(1);
}

const BASE_URL = "http://openapi.seoul.go.kr:8088";

const TARGETS = [
  ["ListPublicReservationCulture", "reservation-culture.json"],
  ["ListPublicReservationEducation", "reservation-education.json"],
  ["ListPublicReservationSport", "reservation-sport.json"],
];

async function refresh() {
  for (const [service, fixture] of TARGETS) {
    const url = `${BASE_URL}/${KEY}/json/${service}/1/5/`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Request failed for ${service}: ${response.status}`);
      process.exit(1);
    }
    const json = await response.json();
    const outPath = path.join(__dirname, "..", "test", "fixtures", fixture);
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2));
    console.log(`Wrote ${outPath}`);
  }
}

refresh();
