#!/usr/bin/env node
// Regenerate NEIS fixtures (school-info, meal, schedule, timetable, academy) from the live API.
// Requires KEDU_INFO_KEY (NEIS open API key). Run from this package:
//   KEDU_INFO_KEY=... npm run refresh:fixtures
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const apiKey = process.env.KEDU_INFO_KEY;
if (!apiKey) {
  console.error("KEDU_INFO_KEY is required to refresh NEIS fixtures.");
  console.error("");
  console.error("1. Visit https://open.neis.go.kr and sign up / log in.");
  console.error("2. 신청하기 > 인증키 신청 to issue an open API key.");
  console.error("3. Export it before running this script:");
  console.error("   export KEDU_INFO_KEY=<your-neis-key>");
  console.error("   KEDU_INFO_KEY=... npm run refresh:fixtures");
  process.exit(1);
}

const BASE_URL = "https://open.neis.go.kr/hub";
const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "test", "fixtures");

// Representative sample. Override via env to target a different school/date.
const ATPT = process.env.NEIS_ATPT_OFCDC_SC_CODE || "B10"; // 서울특별시교육청
const SCHOOL_NAME = process.env.NEIS_SCHUL_NM || "서울대학교사범대학부설초등학교";
const SCHOOL_CODE = process.env.NEIS_SD_SCHUL_CODE || "7081492";
const SAMPLE_DATE = process.env.NEIS_SAMPLE_YMD || "20260501";
const TIMETABLE_DATASET = process.env.NEIS_TIMETABLE_DATASET || "elsTimetable";

async function fetchJson(dataset, params) {
  const url = new URL(`${BASE_URL}/${dataset}`);
  url.searchParams.set("KEY", apiKey);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", "100");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    // No `accept: application/json` header: NEIS returns HTTP 500 to it.
    headers: {
      "accept-language": "ko-KR,ko;q=0.9",
      "user-agent": "k-parent-skills/neis-refresh",
    },
  });
  if (!response.ok) {
    throw new Error(`NEIS ${dataset} request failed with ${response.status}`);
  }
  return response.json();
}

async function writeFixture(name, payload) {
  const target = path.join(fixturesDir, name);
  await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`updated ${target}`);
}

async function main() {
  const school = await fetchJson("schoolInfo", {
    ATPT_OFCDC_SC_CODE: ATPT,
    SCHUL_NM: SCHOOL_NAME,
  });
  await writeFixture("school-info.json", school);

  const meal = await fetchJson("mealServiceDietInfo", {
    ATPT_OFCDC_SC_CODE: ATPT,
    SD_SCHUL_CODE: SCHOOL_CODE,
    MLSV_YMD: SAMPLE_DATE,
  });
  await writeFixture("meal.json", meal);

  const schedule = await fetchJson("SchoolSchedule", {
    ATPT_OFCDC_SC_CODE: ATPT,
    SD_SCHUL_CODE: SCHOOL_CODE,
    AA_FROM_YMD: SAMPLE_DATE,
    AA_TO_YMD: SAMPLE_DATE,
  });
  await writeFixture("schedule.json", schedule);

  const timetable = await fetchJson(TIMETABLE_DATASET, {
    ATPT_OFCDC_SC_CODE: ATPT,
    SD_SCHUL_CODE: SCHOOL_CODE,
    TI_FROM_YMD: SAMPLE_DATE,
    TI_TO_YMD: SAMPLE_DATE,
  });
  await writeFixture("timetable.json", timetable);

  const academy = await fetchJson("acaInsTiInfo", {
    ATPT_OFCDC_SC_CODE: ATPT,
    ADMST_ZONE_NM: process.env.NEIS_ACA_ZONE || "강남구",
    ACA_NM: process.env.NEIS_ACA_NM || "수학",
  });
  // Tests expect the first page of 5 rows; keep the fixture small.
  const rowBlock = academy.acaInsTiInfo?.find((item) => Array.isArray(item?.row));
  if (rowBlock) rowBlock.row = rowBlock.row.slice(0, 5);
  await writeFixture("academy.json", academy);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
