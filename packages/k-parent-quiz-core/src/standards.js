"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_DATA_PATH = path.join(__dirname, "..", "data", "achievement-standards-elementary.json");

const GRADE_TO_BAND = Object.freeze({
  1: "1-2",
  2: "1-2",
  3: "3-4",
  4: "3-4",
  5: "5-6",
  6: "5-6",
});

const bundleCache = new Map();

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze(value[key]);
    }
  }
  return value;
}

// 성취기준 번들({meta, standards})을 읽는다. 기본 경로는 패키지 동봉 data/ 복사본.
// SSOT는 skills/k-parent-quiz-maker/references/achievement-standards-elementary.json이며
// scripts/sync-standards.mjs로 동기화한다. 반환값은 deep-freeze되어 캐시된다.
function loadStandards({ dataPath } = {}) {
  const resolved = path.resolve(dataPath || DEFAULT_DATA_PATH);
  if (!bundleCache.has(resolved)) {
    const bundle = JSON.parse(fs.readFileSync(resolved, "utf8"));
    if (!bundle || !Array.isArray(bundle.standards) || !bundle.meta) {
      throw new TypeError(`achievement standards bundle at ${resolved} must have {meta, standards}`);
    }
    bundleCache.set(resolved, deepFreeze(bundle));
  }
  return bundleCache.get(resolved);
}

// 초등 학년(1..6)을 성취기준 학년군("1-2"|"3-4"|"5-6")으로 바꾼다.
function gradeToBand(grade) {
  const numeric = typeof grade === "string" && grade.trim() !== "" ? Number(grade) : grade;
  if (!Number.isInteger(numeric) || !GRADE_TO_BAND[numeric]) {
    throw new RangeError(`grade must be an integer between 1 and 6, got ${String(grade)}`);
  }
  return GRADE_TO_BAND[numeric];
}

// subject(정확 일치)·grade/gradeBand(gradeBand 우선)·domain(부분 일치)·keyword(statement/domain/code 부분 일치)
// 조건의 AND 필터. 항상 새 배열을 돌려준다.
function filterStandards(standards, { subject, grade, gradeBand, domain, keyword } = {}) {
  if (!Array.isArray(standards)) {
    throw new TypeError("standards must be an array");
  }
  const band = gradeBand || (grade === undefined || grade === null ? undefined : gradeToBand(grade));
  return standards.filter((standard) => {
    if (subject && standard.subject !== subject) return false;
    if (band && standard.gradeBand !== band) return false;
    if (domain && !standard.domain.includes(domain)) return false;
    if (
      keyword &&
      !(
        standard.statement.includes(keyword) ||
        standard.domain.includes(keyword) ||
        standard.code.includes(keyword)
      )
    ) {
      return false;
    }
    return true;
  });
}

module.exports = {
  DEFAULT_DATA_PATH,
  GRADE_TO_BAND,
  filterStandards,
  gradeToBand,
  loadStandards,
};
