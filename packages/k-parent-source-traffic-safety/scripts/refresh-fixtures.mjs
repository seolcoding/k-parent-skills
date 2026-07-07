#!/usr/bin/env node
// Refresh child traffic-safety fixtures from live data.go.kr endpoints.
// Requires KSKILL_DATAGOKR_KEY in the environment.
//
//   KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures
//
// NOTE: data.go.kr services can require separate 활용신청 approval per service.
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  fetchSchoolZoneChildAccidentHotspots,
  fetchGyeongbukChildProtectionZones,
  fetchSeongnamYellowCarpets,
} = require("../src/index.js");

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "test", "fixtures");
const apiKey = process.env.KSKILL_DATAGOKR_KEY;

async function main() {
  if (!apiKey) {
    console.error("KSKILL_DATAGOKR_KEY is required to refresh traffic-safety fixtures.");
    console.error("   KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures");
    process.exit(1);
  }

  await mkdir(fixturesDir, { recursive: true });

  const risk = await fetchSchoolZoneChildAccidentHotspots({
    apiKey,
    sido: "서울특별시",
    sigungu: "종로구",
  });
  await writeFile(join(fixturesDir, "schoolzone-risk.json"), JSON.stringify(risk.raw, null, 2) + "\n");
  console.log("wrote schoolzone-risk.json");

  const zones = await fetchGyeongbukChildProtectionZones({
    apiKey,
    sigungu: "영천시",
  });
  await writeFile(join(fixturesDir, "protection-zones.json"), JSON.stringify(zones.raw, null, 2) + "\n");
  console.log("wrote protection-zones.json");

  const yellowCarpets = await fetchSeongnamYellowCarpets({ apiKey });
  await writeFile(join(fixturesDir, "yellow-carpets.json"), JSON.stringify(yellowCarpets.raw, null, 2) + "\n");
  console.log("wrote yellow-carpets.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
