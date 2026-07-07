#!/usr/bin/env node
// Refresh the YouTube search fixture from the live Data API v3.
//
// Usage:
//   KSKILL_YOUTUBE_KEY=... npm run refresh:fixtures -- ["search query"]
//
// Requires a valid KSKILL_YOUTUBE_KEY (Google Cloud Console -> YouTube Data API v3).
// Exits non-zero if the key is missing or the request fails.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ENV_KEY = "KSKILL_YOUTUBE_KEY";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

const apiKey = process.env[ENV_KEY];
if (!apiKey) {
  console.error(`Missing ${ENV_KEY}. Set it to refresh live fixtures.`);
  console.error("   KSKILL_YOUTUBE_KEY=... npm run refresh:fixtures -- \"검색어\"");
  process.exit(1);
}

const query = process.argv[2] || "초등 과학 교과 설명";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "test", "fixtures");

async function refresh() {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    q: query,
    safeSearch: "strict",
    maxResults: "5",
    regionCode: "KR",
    relevanceLanguage: "ko",
    key: apiKey,
  });
  const url = `${BASE_URL}/search?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`YouTube search failed (status ${res.status}): ${text}`);
    process.exit(1);
  }
  const body = await res.json();
  const out = join(fixturesDir, "search.json");
  await writeFile(out, `${JSON.stringify(body, null, 2)}\n`, "utf8");
  console.log(`Wrote ${out} (${body.items?.length ?? 0} items) for query "${query}"`);
}

refresh().catch((err) => {
  console.error(err);
  process.exit(1);
});
