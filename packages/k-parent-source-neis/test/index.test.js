const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  ERROR_STATUS,
  SOURCE_FRESHNESS,
} = require("k-parent-core");
const {
  getMeals,
  getSchedule,
  getTimetable,
  normalizeAcademyRows,
  normalizeDateInput,
  normalizeMealRows,
  normalizeSchoolRows,
  normalizeTimetableRows,
  parseAcademyLeave,
  parseAcademyTuition,
  parseDishName,
  requestNeisJson,
  resolveEducationOffice,
  resolveSchool,
  resolveTimetableDataset,
  searchAcademies,
} = require("../src/index");

const fixturesDir = path.join(__dirname, "fixtures");
const schoolPayload = readFixture("school-info.json");
const mealPayload = readFixture("meal.json");
const schedulePayload = readFixture("schedule.json");
const timetablePayload = readFixture("timetable.json");
const academyPayload = readFixture("academy.json");

test("normalizeDateInput accepts NEIS compact and dashed dates", () => {
  assert.equal(normalizeDateInput("20260501").isoDate, "2026-05-01");
  assert.equal(normalizeDateInput("2026-05-01").compactDate, "20260501");
  assert.throws(() => normalizeDateInput("2026-13-40"), /date must be a valid/);
});

test("resolveEducationOffice maps Korean region text and reports ambiguity", () => {
  assert.equal(resolveEducationOffice("서울특별시교육청").code, "B10");
  assert.equal(resolveEducationOffice("B10").code, "B10");
  const ambiguous = resolveEducationOffice("경상");
  assert.equal(ambiguous.ok, false);
  assert.equal(ambiguous.status, ERROR_STATUS.AMBIGUOUS);
});

test("school rows normalize official school fields with source freshness", () => {
  const schools = normalizeSchoolRows(schoolPayload, {
    fetchedAt: "2026-05-01T00:00:00.000Z",
    now: "2026-05-01T01:00:00.000Z",
  });

  assert.equal(schools.length, 2);
  assert.equal(schools[0].schoolCode, "7010123");
  assert.equal(schools[0].atptOfcdcScCode, "B10");
  assert.equal(schools[0].source.freshness.status, SOURCE_FRESHNESS.FRESH);
});

test("resolveSchool does not auto-pick ambiguous school names", async () => {
  const result = await resolveSchool({
    schoolName: "서울미래",
    region: "서울",
    payload: schoolPayload,
    fetchedAt: "2026-05-01T00:00:00.000Z",
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, ERROR_STATUS.AMBIGUOUS);
  assert.equal(result.candidates.length, 2);
});

test("resolveSchool resolves unique name and level", async () => {
  const result = await resolveSchool({
    schoolName: "서울미래초등학교",
    schoolLevel: "초등학교",
    region: "서울",
    payload: schoolPayload,
  });

  assert.equal(result.ok, true);
  assert.equal(result.school.schoolCode, "7010123");
});

test("parseDishName extracts menu items and allergen numbers", () => {
  const parsed = parseDishName("돈육김치찌개(5.9.10)<br/>계란말이(1)<br/>깍두기(9)");

  assert.deepEqual(parsed.allergyNumbers, [1, 5, 9, 10]);
  assert.equal(parsed.menuItems.length, 3);
});

test("meal rows normalize allergy labels, calories, nutrition, and source", () => {
  const meals = normalizeMealRows(mealPayload, {
    fetchedAt: "2026-05-01T00:00:00.000Z",
    now: "2026-05-01T01:00:00.000Z",
  });

  assert.equal(meals.length, 1);
  assert.equal(meals[0].date, "2026-05-01");
  assert.deepEqual(meals[0].allergyNumbers, [1, 5, 9, 10]);
  assert.ok(meals[0].allergens.includes("돼지고기"));
  assert.equal(meals[0].calories, "650.4 Kcal");
  assert.equal(meals[0].source.freshness.status, SOURCE_FRESHNESS.FRESH);
});

test("getMeals distinguishes no meal data", async () => {
  const result = await getMeals({
    schoolCode: "7010123",
    educationOfficeCode: "B10",
    date: "2026-05-01",
    payload: { mealServiceDietInfo: [{ head: [{ LIST_TOTAL_COUNT: 0 }] }] },
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, ERROR_STATUS.NOT_FOUND);
});

test("schedule rows normalize academic calendar items", async () => {
  const result = await getSchedule({
    schoolCode: "7010123",
    educationOfficeCode: "B10",
    startDate: "2026-05-01",
    endDate: "2026-05-02",
    payload: schedulePayload,
  });

  assert.equal(result.ok, true);
  assert.equal(result.scheduleItems.length, 2);
  assert.equal(result.scheduleItems[0].title, "현장체험학습");
  assert.equal(result.scheduleItems[0].date, "2026-05-01");
});

test("resolveTimetableDataset maps school level to NEIS dataset", () => {
  assert.equal(resolveTimetableDataset("초등학교"), "elsTimetable");
  assert.equal(resolveTimetableDataset("중학교"), "misTimetable");
  assert.equal(resolveTimetableDataset("고등학교"), "hisTimetable");
  assert.equal(resolveTimetableDataset("mis"), "misTimetable");
  assert.equal(resolveTimetableDataset("hisTimetable"), "hisTimetable");
  assert.equal(resolveTimetableDataset(""), "elsTimetable");
});

test("timetable rows normalize period and subject with source freshness", () => {
  const rows = normalizeTimetableRows(timetablePayload, {
    dataset: "elsTimetable",
    fetchedAt: "2026-05-01T00:00:00.000Z",
    now: "2026-05-01T01:00:00.000Z",
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0].date, "2026-05-01");
  assert.equal(rows[0].period, 1);
  assert.equal(rows[0].subject, "국어");
  assert.equal(rows[0].grade, "1");
  assert.equal(rows[0].className, "2");
  assert.equal(rows[0].title, "1교시 국어");
  assert.equal(rows[0].source.freshness.status, SOURCE_FRESHNESS.FRESH);
});

test("getTimetable selects dataset and returns normalized timetable", async () => {
  const result = await getTimetable({
    schoolCode: "7010123",
    educationOfficeCode: "B10",
    schoolLevel: "초등학교",
    startDate: "2026-05-01",
    payload: timetablePayload,
  });

  assert.equal(result.ok, true);
  assert.equal(result.dataset, "elsTimetable");
  assert.equal(result.startDate, "2026-05-01");
  assert.equal(result.timetable.length, 2);
  assert.equal(result.timetable[1].subject, "수학");
});

test("getTimetable builds dataset-specific URL with period params", async () => {
  let fetchedUrl = "";
  const result = await getTimetable({
    schoolCode: "7010123",
    educationOfficeCode: "B10",
    dataset: "mis",
    startDate: "2026-05-01",
    endDate: "2026-05-02",
    grade: "1",
    apiKey: "test-key",
    fetchImpl: async (url) => {
      fetchedUrl = String(url);
      return new Response(JSON.stringify({ misTimetable: [{ head: [{ LIST_TOTAL_COUNT: 0 }] }] }), { status: 200 });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.dataset, "misTimetable");
  assert.ok(fetchedUrl.includes("open.neis.go.kr/hub/misTimetable"));
  assert.ok(fetchedUrl.includes("TI_FROM_YMD=20260501"));
  assert.ok(fetchedUrl.includes("TI_TO_YMD=20260502"));
  assert.ok(fetchedUrl.includes("GRADE=1"));
});

test("live NEIS request requires API key by default", async () => {
  await assert.rejects(
    () => requestNeisJson("schoolInfo", {}, { apiKey: "" }),
    /KEDU_INFO_KEY/,
  );
});

test("live NEIS request builds official URL with key and Korean headers", async () => {
  let fetchedUrl = "";
  const payload = { schoolInfo: [{ head: [{ LIST_TOTAL_COUNT: 0 }] }] };

  const result = await requestNeisJson("schoolInfo", {
    ATPT_OFCDC_SC_CODE: "B10",
    SCHUL_NM: "미래초",
  }, {
    apiKey: "test-key",
    fetchImpl: async (url, options = {}) => {
      fetchedUrl = String(url);
      assert.ok(options.headers["accept-language"].includes("ko-KR"));
      // NEIS answers HTTP 500 when this header is present.
      assert.equal(options.headers.accept, undefined);
      return new Response(JSON.stringify(payload), { status: 200 });
    },
  });

  assert.deepEqual(result, payload);
  assert.ok(fetchedUrl.includes("open.neis.go.kr/hub/schoolInfo"));
  assert.ok(fetchedUrl.includes("KEY=test-key"));
  assert.ok(fetchedUrl.includes("ATPT_OFCDC_SC_CODE=B10"));
  assert.ok(decodeURIComponent(fetchedUrl).includes("SCHUL_NM=미래초"));
});

test("academy rows normalize registration, tuition, and placeholder phones", () => {
  const academies = normalizeAcademyRows(academyPayload, {
    fetchedAt: "2026-10-27T00:00:00.000Z",
    now: "2026-10-27T01:00:00.000Z",
  });

  assert.equal(academies.length, 5);
  const ig = academies.find((academy) => academy.name === "IG수학교습소");
  assert.equal(ig.type, "academy");
  assert.equal(ig.academyNumber, "3000012510");
  assert.equal(ig.kind, "교습소");
  assert.equal(ig.district, "강남구");
  assert.equal(ig.registrationStatus, "개원");
  assert.equal(ig.leave, null);
  assert.equal(ig.onLeaveToday, false);
  assert.deepEqual(ig.courseList, ["수학"]);
  assert.equal(ig.tuition.disclosed, true);
  assert.deepEqual(ig.tuition.items.map((item) => item.amountKrw), [540000, 800000, 400000]);
  assert.equal(ig.telephone, "02-558-6799");
  assert.equal(ig.updatedAt, "2025-06-08");
  assert.equal(ig.source.sourceName, "NEIS acaInsTiInfo");
  assert.equal(ig.source.freshness.status, SOURCE_FRESHNESS.FRESH);

  const bt = academies.find((academy) => academy.name === "BT수학전문수학교습소");
  assert.equal(bt.telephone, null);
  assert.deepEqual(bt.tuition.items, []);
});

test("academy leave and tuition parsing handles NEIS sentinels", () => {
  assert.equal(parseAcademyLeave("        ", "99991231"), null);
  const open = parseAcademyLeave("20261001", "99991231");
  assert.equal(open.startDate, "2026-10-01");
  assert.equal(open.endDate, null);
  const bounded = parseAcademyLeave("20261001", "20261031");
  assert.equal(bounded.endDate, "2026-10-31");

  assert.deepEqual(parseAcademyTuition("수학:540000", "N").items, []);
  assert.equal(parseAcademyTuition("수학:540000", "N").disclosed, false);
  assert.equal(parseAcademyTuition("상담 후 결정", "Y").items[0].amountKrw, null);

  // Live NEIS course names carry commas inside parentheses.
  const live = parseAcademyTuition(
    "초등주1회(4.2주)(주1회, 회당215분):170000, 초등영어A(4.2주)(주2회, 회당150분):240000",
    "Y",
  );
  assert.deepEqual(live.items.map((item) => item.course), [
    "초등주1회(4.2주)(주1회, 회당215분)",
    "초등영어A(4.2주)(주2회, 회당150분)",
  ]);
  assert.deepEqual(live.items.map((item) => item.amountKrw), [170000, 240000]);
});

test("academy on-leave flag uses the KST calendar date", () => {
  const row = { ...academyPayload.acaInsTiInfo[1].row[0], CAA_BEGIN_YMD: "20261027", CAA_END_YMD: "20261031" };
  const payload = { acaInsTiInfo: [academyPayload.acaInsTiInfo[0], { row: [row] }] };
  // 2026-10-26T16:00Z is 2026-10-27 01:00 KST.
  const [academy] = normalizeAcademyRows(payload, { now: "2026-10-26T16:00:00.000Z" });
  assert.equal(academy.onLeaveToday, true);
  const [before] = normalizeAcademyRows(payload, { now: "2026-10-26T14:00:00.000Z" });
  assert.equal(before.onLeaveToday, false);
});

test("searchAcademies resolves the education office and reports truncation", async () => {
  const result = await searchAcademies({
    region: "서울",
    district: "강남구",
    academyName: "수학",
    payload: academyPayload,
    now: "2026-10-27T01:00:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.educationOffice.code, "B10");
  assert.equal(result.totalCount, 514);
  assert.equal(result.truncated, true);
  assert.equal(result.keyless, false);
  assert.equal(result.academies.length, 5);
});

test("searchAcademies refuses ambiguous offices and reports empty results", async () => {
  const ambiguous = await searchAcademies({ region: "경상", payload: academyPayload });
  assert.equal(ambiguous.ok, false);
  assert.equal(ambiguous.status, ERROR_STATUS.AMBIGUOUS);

  const empty = await searchAcademies({
    educationOfficeCode: "B10",
    payload: { RESULT: { CODE: "INFO-200", MESSAGE: "해당하는 데이터가 없습니다." } },
  });
  assert.equal(empty.ok, false);
  assert.equal(empty.status, ERROR_STATUS.NOT_FOUND);
});

test("searchAcademies falls back to keyless NEIS sample requests capped at 5 rows", async () => {
  const savedKey = process.env.KEDU_INFO_KEY;
  delete process.env.KEDU_INFO_KEY;
  try {
    let fetchedUrl = "";
    const result = await searchAcademies({
      educationOfficeCode: "B10",
      district: "강남구",
      pageSize: 100,
      fetchImpl: async (url) => {
        fetchedUrl = String(url);
        return new Response(JSON.stringify(academyPayload), { status: 200 });
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.keyless, true);
    assert.ok(!fetchedUrl.includes("KEY="));
    assert.ok(fetchedUrl.includes("pSize=5"));
    assert.ok(fetchedUrl.includes("open.neis.go.kr/hub/acaInsTiInfo"));
    assert.ok(decodeURIComponent(fetchedUrl).includes("ADMST_ZONE_NM=강남구"));

    const refused = await searchAcademies({ educationOfficeCode: "B10", allowKeyless: false });
    assert.equal(refused.status, ERROR_STATUS.MISSING_CONFIG);
  } finally {
    if (savedKey !== undefined) process.env.KEDU_INFO_KEY = savedKey;
  }
});

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, fileName), "utf8"));
}
