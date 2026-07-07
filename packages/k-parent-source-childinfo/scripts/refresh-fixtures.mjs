import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchChildcareCenters, fetchKindergartens } from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "test", "fixtures");

const KEY = process.env.KSKILL_DATAGOKR_KEY;

async function main() {
  if (!KEY) {
    console.error("Set KSKILL_DATAGOKR_KEY to refresh fixtures from live data.go.kr services.");
    console.error("   KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures");
    process.exit(1);
  }

  await mkdir(fixturesDir, { recursive: true });

  // NOTE: sidoCode/sigunguCode/sggCode 값과 서비스 경로/파라미터는 활용신청한 명세에 맞게 조정한다.
  const childcare = await fetchChildcareCenters({ sidoCode: "11", sigunguCode: "11110", apiKey: KEY });
  await writeFile(join(fixturesDir, "childcare.json"), JSON.stringify(childcare.raw, null, 2) + "\n");

  const kindergarten = await fetchKindergartens({ sidoCode: "11", sggCode: "11110", apiKey: KEY });
  await writeFile(join(fixturesDir, "kindergarten.json"), JSON.stringify(kindergarten.raw, null, 2) + "\n");

  console.log("childinfo fixtures refreshed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
