#!/usr/bin/env node
// 문항 은행 전수 생성 CLI. 성취기준당 유형별 최대 3개 변형을 결정적으로 열거한다.
// 타임스탬프·난수를 쓰지 않아 같은 데이터에서는 항상 바이트 동일한 JSON이 나온다
// (문항 은행 드리프트 체크가 이 성질에 의존한다).
//
//   node scripts/generate-quiz-bank.mjs                 # stdout으로 출력
//   node scripts/generate-quiz-bank.mjs --out bank.json # 파일로 저장
//   node scripts/generate-quiz-bank.mjs --types ox,blank
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const { QUESTION_TYPES, buildQuizBank } = require(join(packageRoot, "src", "index.js"));

function parseArgs(argv) {
  const args = { out: null, types: null };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--out") {
      args.out = argv[index + 1];
      index += 1;
    } else if (flag === "--types") {
      args.types = String(argv[index + 1] || "")
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean);
      index += 1;
    } else if (flag === "--help" || flag === "-h") {
      args.help = true;
    } else {
      console.error(`unknown flag: ${flag}`);
      process.exit(1);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log("usage: node scripts/generate-quiz-bank.mjs [--out <path>] [--types ox,choice3,blank]");
  process.exit(0);
}

const bank = buildQuizBank(args.types ? { types: args.types } : {});
const json = `${JSON.stringify(bank, null, 2)}\n`;

if (args.out) {
  const outPath = resolve(args.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, json);
  console.error(`wrote ${outPath}`);
} else {
  process.stdout.write(json);
}

const { totals } = bank.meta;
console.error(
  `questions ${totals.questions} / standards ${totals.standards} ` +
    `(types ${bank.meta.types.join(",")} of ${QUESTION_TYPES.join(",")})`,
);
console.error(`byType ${JSON.stringify(totals.byType)}`);
for (const [subject, counts] of Object.entries(totals.bySubject)) {
  console.error(`  ${subject}: ${JSON.stringify(counts)}`);
}
console.error(
  `blank 가능 성취기준 ${totals.blankCapableStandards}/${totals.standards} ` +
    `(${((totals.blankCapableStandards / totals.standards) * 100).toFixed(1)}%)`,
);
