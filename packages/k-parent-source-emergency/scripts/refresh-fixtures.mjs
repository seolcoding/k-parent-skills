import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchNightHolidayPharmacies, fetchEmergencyRooms } from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "test", "fixtures");

const KEY = process.env.KSKILL_DATAGOKR_KEY;

async function main() {
  if (!KEY) {
    console.error("Set KSKILL_DATAGOKR_KEY to refresh fixtures from the live e-gen service.");
    console.error("   KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures");
    process.exit(1);
  }

  await mkdir(fixturesDir, { recursive: true });

  // NOTE: Q0(시도)/Q1(시군구) 값과 서비스 경로는 활용신청한 명세에 맞게 조정한다.
  const pharmacy = await fetchNightHolidayPharmacies({ sido: "서울특별시", sgg: "종로구", apiKey: KEY });
  await writeFile(join(fixturesDir, "pharmacy.json"), JSON.stringify(pharmacy.raw, null, 2) + "\n");

  const er = await fetchEmergencyRooms({ sido: "서울특별시", sgg: "종로구", apiKey: KEY });
  await writeFile(join(fixturesDir, "emergency-room.json"), JSON.stringify(er.raw, null, 2) + "\n");

  console.log("emergency fixtures refreshed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
