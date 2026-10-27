"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  EXPERIENCE_DATASETS,
  detectEras,
  fetchExperienceDataset,
  matchesGrade,
  parseApplication,
  parseCharge,
  parseExperiences,
  parseGrades,
  parsePeriod,
  searchExperiences,
  sidoFromAddress,
} = require("../src/index");

// Fixtures are real api.kcisa.kr responses captured from the culture.go.kr preview (2026-10-27).
function readFixture(dataset) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", `experience-${dataset}.json`), "utf8"));
}

const NOW = "2026-10-28T00:00:00.000Z";
const payloads = Object.fromEntries(Object.keys(EXPERIENCE_DATASETS).map((id) => [id, readFixture(id)]));

test("598 exhibitions decode entities, map institution to sido, and mark past periods ended", () => {
  const { items, totalCount } = parseExperiences("598", payloads[598], { now: NOW });
  assert.equal(totalCount, 389);
  const item = items.find((entry) => entry.title === "영주 금강사 터에서 만난 보물");
  assert.equal(item.kind, "exhibition");
  assert.equal(item.institution, "국립대구박물관");
  assert.equal(item.sido, "대구");
  assert.equal(item.startDate, "2018-10-23");
  assert.equal(item.endDate, "2019-12-29");
  assert.equal(item.status, "ended");
  assert.deepEqual(item.eras, ["고려"]);
  assert.match(item.source.sourceName, /전시정보\(통합\)/);
  assert.ok(items.every((entry) => !/&#\d+;/.test(entry.contact || "")));
});

test("540 museum programs drop 'None' strings and parse spaced periods", () => {
  const { items } = parseExperiences("540", payloads[540], { now: NOW });
  const childrensDay = items.find((entry) => entry.title.startsWith("박물관과 함께하는 신나는 어린이날!"));
  assert.equal(childrensDay.title.includes("&#"), false);
  assert.equal(childrensDay.sido, "강원");
  assert.equal(childrensDay.startDate, "2021-05-05");
  assert.equal(childrensDay.place, null);
  assert.equal(childrensDay.charge.free, null);
});

test("84 heritage prefers the era field over incidental description mentions", () => {
  const { items } = parseExperiences("84", payloads[84], { now: NOW });
  const palace = items.find((entry) => entry.title.startsWith("덕수궁 중화전"));
  assert.equal(palace.sido, "서울");
  assert.equal(palace.designation, "보물");
  assert.deepEqual(palace.eras, ["조선"]);
  assert.equal(palace.eraSource, "field");
  assert.equal(palace.status, "unknown");

  const noField = items.find((entry) => entry.title.startsWith("무량사김시습부도"));
  assert.equal(noField.eraSource, "description");
  assert.equal(items.find((entry) => entry.title.startsWith("남해 화방사")).sido, null);
});

test("495 history museum programs expose grades, application, and closed status", () => {
  const { items } = parseExperiences("495", payloads[495], { now: NOW });
  const independence = items.find((entry) => entry.title === "(온라인) 대한독립을 외치다");
  assert.deepEqual(independence.grades, [{ level: "중등", from: 1, to: 3 }]);
  assert.deepEqual(independence.eras, ["일제강점·독립운동"]);
  assert.equal(independence.charge.free, true);
  assert.equal(independence.application.capacity, 30);
  assert.equal(independence.application.method, "선착순");

  const opening = items.find((entry) => entry.title === "개항의 물결 속에서");
  assert.deepEqual(opening.grades, [{ level: "초등", from: 5, to: 5 }, { level: "초등", from: 6, to: 6 }]);
  assert.equal(opening.startDate, null);
  assert.equal(opening.status, "ended", "application closed in 2017");
});

test("639 hangeul events skip test records", () => {
  const { items } = parseExperiences("639", payloads[639], { now: NOW });
  assert.equal(items.some((entry) => entry.title === "test"), false);
  assert.ok(items.every((entry) => entry.sido === "서울"));
});

test("period, grade, charge, and application parsers handle observed formats", () => {
  assert.deepEqual(parsePeriod("20210121~20210204").endDate, "2021-02-04");
  assert.equal(parsePeriod("2021-05-05 ~ 2021-05-05 12시/16시(2회)").endDate, "2021-05-05");
  assert.equal(parsePeriod("2026-13-40").startDate, null);

  assert.deepEqual(parseGrades("초3~초6"), [{ level: "초등", from: 3, to: 6 }]);
  assert.deepEqual(parseGrades("7세유아"), [{ level: "유아", from: 7, to: 7 }]);
  assert.deepEqual(parseGrades("전체관람가"), [{ level: "전체", from: null, to: null }]);
  assert.deepEqual(parseGrades("초등학생 및 보호자 동반"), [
    { level: "초등", from: null, to: null },
    { level: "가족", from: null, to: null },
  ]);

  assert.equal(parseCharge("0").free, true);
  assert.equal(parseCharge("유료(5,000원)").free, false);
  assert.equal(parseApplication("", "진행상태:접수중").state, "접수중");
});

test("era dictionary avoids common-word false positives", () => {
  assert.deepEqual(detectEras("즐거움을 선사합니다"), []);
  assert.deepEqual(detectEras("일제히 입장"), []);
  assert.deepEqual(detectEras("가야금 연주"), []);
  assert.deepEqual(detectEras("고조선의 건국"), ["고조선"]);
  assert.deepEqual(detectEras("통일신라 석탑"), ["통일신라·발해"]);
  assert.deepEqual(detectEras("백제와 신라의 금관"), ["삼국"]);
  assert.deepEqual(detectEras("3·1운동과 임시정부"), ["일제강점·독립운동"]);
});

test("sido and grade matching", () => {
  assert.equal(sidoFromAddress("충청남도 부여군"), "충남");
  assert.equal(sidoFromAddress("서울 중구 세종대로 99"), "서울");
  assert.equal(matchesGrade([], "초등", 3), true, "no audience info passes");
  assert.equal(matchesGrade([{ level: "초등", from: 5, to: 6 }], "초등", 3), false);
  assert.equal(matchesGrade([{ level: "가족", from: null, to: null }], "초등", 3), true);
});

test("searchExperiences filters by sido, grade, era and hides ended items by default", async () => {
  const all = await searchExperiences({ payloads, now: NOW, includeEnded: true });
  assert.equal(all.ok, true);
  assert.equal(all.datasets.length, 5);
  assert.ok(all.datasets.find((entry) => entry.dataset === 84).partial);

  const joseonSeoul = await searchExperiences({ payloads, now: NOW, sido: "서울특별시", eras: ["조선"], includeEnded: true });
  assert.ok(joseonSeoul.items.length >= 1);
  assert.ok(joseonSeoul.items.every((item) => item.sido === "서울" || item.sido === null));
  assert.ok(joseonSeoul.items.every((item) => item.eras.includes("조선")));

  const grade5 = await searchExperiences({ payloads, now: NOW, datasets: ["495"], gradeLevel: "초등", grade: 5, includeEnded: true });
  assert.deepEqual(grade5.items.map((item) => item.title), ["개항의 물결 속에서"]);

  const current = await searchExperiences({ payloads, now: NOW, datasets: ["598", "540", "495"] });
  assert.deepEqual(current.items, [], "all fixture exhibitions and programs are in the past");
});

test("fetchExperienceDataset uses per-dataset key override and the kcisa path", async () => {
  const saved = { all: process.env.KSKILL_CULTURE_KEY, one: process.env.KSKILL_CULTURE_KEY_598 };
  delete process.env.KSKILL_CULTURE_KEY;
  process.env.KSKILL_CULTURE_KEY_598 = "key-598";
  try {
    let calledUrl = "";
    await fetchExperienceDataset("598", {
      numOfRows: 10,
      fetchImpl: async (url) => {
        calledUrl = String(url);
        return new Response(JSON.stringify(payloads[598]), { status: 200 });
      },
    });
    assert.ok(calledUrl.startsWith("https://api.kcisa.kr/openapi/API_CCA_145/request?"));
    assert.ok(calledUrl.includes("serviceKey=key-598"));
    assert.ok(calledUrl.includes("numOfRows=10"));

    await assert.rejects(() => fetchExperienceDataset("540", {}), (err) => err.status === "missing_config");
    const result = await searchExperiences({ datasets: ["540"] });
    assert.equal(result.ok, false);
    assert.equal(result.status, "missing_config");
  } finally {
    if (saved.all !== undefined) process.env.KSKILL_CULTURE_KEY = saved.all;
    if (saved.one !== undefined) process.env.KSKILL_CULTURE_KEY_598 = saved.one;
    else delete process.env.KSKILL_CULTURE_KEY_598;
  }
});
