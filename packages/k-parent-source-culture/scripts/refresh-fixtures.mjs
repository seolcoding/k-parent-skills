import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KEY = process.env.KSKILL_CULTURE_KEY;
if (!KEY) {
  console.error("KSKILL_CULTURE_KEY is required to refresh fixtures");
  console.error("   KSKILL_CULTURE_KEY=... npm run refresh:fixtures");
  process.exit(1);
}

const BASE_URL =
  "http://www.culture.go.kr/openapi/rest/publicperformancedisplays";

async function refresh() {
  const params = new URLSearchParams({
    serviceKey: KEY,
    rows: "10",
  });
  const url = `${BASE_URL}/area?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Request failed: ${response.status}`);
    process.exit(1);
  }
  const json = await response.json();
  const outPath = path.join(
    __dirname,
    "..",
    "test",
    "fixtures",
    "culture-events.json"
  );
  fs.writeFileSync(outPath, JSON.stringify(json, null, 2));
  console.log(`Wrote ${outPath}`);
}

refresh();
