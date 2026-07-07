#!/usr/bin/env node
// SSOT(skills/k-parent-quiz-maker/references/achievement-standards-elementary.json)를
// 패키지 동봉 data/ 복사본으로 바이트 동일하게 동기화한다.
// 테스트(test/index.test.js)가 두 파일의 deep-equal·바이트 동일을 단언한다.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(packageRoot, "..", "..");

const SSOT_PATH = join(
  repoRoot,
  "skills",
  "k-parent-quiz-maker",
  "references",
  "achievement-standards-elementary.json",
);
const DATA_PATH = join(packageRoot, "data", "achievement-standards-elementary.json");

const bundle = JSON.parse(readFileSync(SSOT_PATH, "utf8"));
if (!bundle?.meta || !Array.isArray(bundle.standards)) {
  console.error(`SSOT bundle at ${SSOT_PATH} must have {meta, standards}`);
  process.exit(1);
}

mkdirSync(dirname(DATA_PATH), { recursive: true });
copyFileSync(SSOT_PATH, DATA_PATH);

console.log(`synced ${bundle.standards.length} standards (confirmedAt ${bundle.meta.confirmedAt})`);
console.log(`  from ${SSOT_PATH}`);
console.log(`  to   ${DATA_PATH}`);
