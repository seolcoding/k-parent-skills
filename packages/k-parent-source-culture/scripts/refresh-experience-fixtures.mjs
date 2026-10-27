// Regenerate experience-<dataset>.json fixtures from api.kcisa.kr.
// Needs KSKILL_CULTURE_KEY, or KSKILL_CULTURE_KEY_<dataset> per dataset.
//   KSKILL_CULTURE_KEY=... npm run refresh:experience-fixtures
// test/experience.test.js asserts on specific titles from the captured fixtures;
// update those assertions after refreshing.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { EXPERIENCE_DATASETS, fetchExperienceDataset } = require("../src/experience.js");
const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "test", "fixtures");

let failed = false;
for (const dataset of Object.keys(EXPERIENCE_DATASETS)) {
  try {
    const payload = await fetchExperienceDataset(dataset, { numOfRows: 10 });
    const target = path.join(fixturesDir, `experience-${dataset}.json`);
    fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`✔ ${dataset} → ${target}`);
  } catch (error) {
    failed = true;
    console.error(`✖ ${dataset} | ${error.status || "error"} | ${error.message}`);
  }
}
process.exit(failed ? 1 : 0);
