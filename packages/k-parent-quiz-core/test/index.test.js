const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  QUESTION_TYPES,
  buildQuizBank,
  countQuestionVariants,
  createSeededRng,
  filterStandards,
  generateQuestion,
  generateQuiz,
  gradeToBand,
  loadStandards,
} = require("../src/index");

const PACKAGE_DATA_PATH = path.join(__dirname, "..", "data", "achievement-standards-elementary.json");
const SSOT_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "skills",
  "k-parent-quiz-maker",
  "references",
  "achievement-standards-elementary.json",
);

function findStandard(standards, code) {
  const found = standards.find((standard) => standard.code === code);
  assert.ok(found, `fixture standard ${code} should exist in the bundle`);
  return found;
}

function assertQuestionShape(question) {
  assert.match(question.id, /^[^:]+:(ox|choice3|blank):\d+$/, `question id ${question.id} should be <code>:<type>:<variant>`);
  assert.ok(QUESTION_TYPES.includes(question.type), `unknown question type ${question.type}`);
  assert.deepEqual(
    Object.keys(question.standard).sort(),
    ["code", "domain", "gradeBand", "subject"],
    "question.standard should carry exactly code/subject/gradeBand/domain",
  );
  assert.equal(typeof question.prompt, "string");
  assert.ok(question.prompt.length > 0);
  assert.match(question.prompt, /[가-힣]/, "prompt should be Korean");
  if (question.type === "choice3") {
    assert.ok(Array.isArray(question.choices), "choice3 must carry choices");
    assert.equal(question.choices.length, 3);
    assert.equal(new Set(question.choices).size, 3, "choices must be unique");
    assert.ok(question.choices.includes(question.answer), "answer must be one of the choices");
  } else {
    assert.equal(question.choices, null, `${question.type} choices must be null`);
  }
  assert.equal(typeof question.answer, "string");
  assert.ok(question.answer.length > 0);
  assert.equal(typeof question.explanation, "string");
  assert.ok(question.explanation.length > 0);
  assert.ok(["기본", "도전"].includes(question.difficulty), `unknown difficulty ${question.difficulty}`);
}

test("createSeededRng is deterministic per seed and hashes string seeds", () => {
  const first = createSeededRng("golden");
  const second = createSeededRng("golden");
  const sequenceA = [first(), first(), first()];
  const sequenceB = [second(), second(), second()];

  assert.deepEqual(sequenceA, sequenceB);
  for (const value of sequenceA) {
    assert.ok(value >= 0 && value < 1, `rng value ${value} should be in [0, 1)`);
  }

  const other = createSeededRng("golden-2");
  assert.notDeepEqual(sequenceA, [other(), other(), other()]);

  const numeric = createSeededRng(42);
  const numericAgain = createSeededRng(42);
  assert.equal(numeric(), numericAgain());
});

test("gradeToBand maps elementary grades and rejects everything else", () => {
  assert.equal(gradeToBand(1), "1-2");
  assert.equal(gradeToBand(2), "1-2");
  assert.equal(gradeToBand(3), "3-4");
  assert.equal(gradeToBand(4), "3-4");
  assert.equal(gradeToBand(5), "5-6");
  assert.equal(gradeToBand(6), "5-6");
  assert.equal(gradeToBand("3"), "3-4");

  for (const invalid of [0, 7, 2.5, "중1", null, undefined, Number.NaN]) {
    assert.throws(() => gradeToBand(invalid), RangeError, `grade ${String(invalid)} should be rejected`);
  }
});

test("loadStandards returns the bundled meta and 399 frozen standards", () => {
  const { meta, standards } = loadStandards();

  assert.equal(standards.length, 399);
  assert.equal(meta.confirmedAt, "2026-07-07");
  assert.deepEqual(meta.coverage, ["국어", "수학", "사회", "과학", "영어"]);
  assert.ok(meta.sourceUrl);
  assert.ok(Object.isFrozen(standards), "standards array should be frozen");
  assert.ok(Object.isFrozen(standards[0]), "standard rows should be frozen");

  for (const standard of standards) {
    assert.deepEqual(Object.keys(standard).sort(), ["code", "domain", "gradeBand", "statement", "subject"]);
  }

  const explicit = loadStandards({ dataPath: PACKAGE_DATA_PATH });
  assert.deepEqual(explicit.standards, standards);
});

test("package data copy stays in sync with the skill references SSOT", () => {
  const packageRaw = fs.readFileSync(PACKAGE_DATA_PATH, "utf8");
  const ssotRaw = fs.readFileSync(SSOT_PATH, "utf8");

  assert.deepEqual(
    JSON.parse(packageRaw),
    JSON.parse(ssotRaw),
    "package data drifted from skills/k-parent-quiz-maker/references — run scripts/sync-standards.mjs",
  );
  assert.equal(
    packageRaw,
    ssotRaw,
    "package data bytes drifted from the SSOT — run scripts/sync-standards.mjs",
  );
});

test("filterStandards applies AND filters and grade/gradeBand precedence", () => {
  const { standards } = loadStandards();

  const mathBand56 = filterStandards(standards, { subject: "수학", grade: 5 });
  assert.ok(mathBand56.length > 0);
  for (const standard of mathBand56) {
    assert.equal(standard.subject, "수학");
    assert.equal(standard.gradeBand, "5-6");
  }

  const explicitBand = filterStandards(standards, { subject: "수학", grade: 1, gradeBand: "5-6" });
  assert.deepEqual(explicitBand, mathBand56, "explicit gradeBand should win over grade");

  const domainFiltered = filterStandards(standards, { subject: "수학", gradeBand: "5-6", domain: "도형" });
  assert.ok(domainFiltered.length > 0);
  for (const standard of domainFiltered) {
    assert.ok(standard.domain.includes("도형"));
  }

  const keywordFiltered = filterStandards(standards, { keyword: "부피 단위" });
  assert.ok(keywordFiltered.some((standard) => standard.code === "6수03-18"));

  const codeKeyword = filterStandards(standards, { keyword: "6수03-18" });
  assert.equal(codeKeyword.length, 1);

  const none = filterStandards(standards, { subject: "영어", gradeBand: "1-2" });
  assert.deepEqual(none, []);

  assert.throws(() => filterStandards(standards, { grade: 9 }), RangeError);
});

test("generateQuestion ox variant 0 confirms the standard itself", () => {
  const { standards } = loadStandards();
  const standard = findStandard(standards, "6수03-18");
  const distractorPool = filterStandards(standards, { gradeBand: standard.gradeBand });

  const question = generateQuestion(standard, {
    type: "ox",
    rng: createSeededRng("ox-true"),
    distractorPool,
    variant: 0,
  });

  assertQuestionShape(question);
  assert.equal(question.id, "6수03-18:ox:0");
  assert.equal(question.answer, "O");
  assert.equal(question.difficulty, "기본");
  assert.ok(question.prompt.includes(standard.statement), "variant 0 should quote the standard statement");
  assert.ok(question.prompt.includes(standard.domain));
});

test("generateQuestion ox false variants use a same-band different-domain distractor", () => {
  const { standards } = loadStandards();
  const standard = findStandard(standards, "6수03-18");
  const distractorPool = filterStandards(standards, { gradeBand: standard.gradeBand });

  const question = generateQuestion(standard, {
    type: "ox",
    rng: createSeededRng("ox-false"),
    distractorPool,
    variant: 1,
  });

  assertQuestionShape(question);
  assert.equal(question.answer, "X");
  assert.equal(question.difficulty, "도전");
  assert.ok(!question.prompt.includes(standard.statement), "false variant should not quote the target statement");

  const quoted = distractorPool.find(
    (candidate) => candidate.code !== standard.code && question.prompt.includes(candidate.statement),
  );
  assert.ok(quoted, "false variant should quote a statement from the distractor pool");
  assert.equal(quoted.gradeBand, standard.gradeBand);
  assert.notEqual(quoted.domain, standard.domain);
  assert.ok(question.explanation.includes(quoted.domain), "explanation should name the real domain");
});

test("generateQuestion choice3 mixes the statement with two cross-domain distractors", () => {
  const { standards } = loadStandards();
  const standard = findStandard(standards, "4수03-17");
  const distractorPool = filterStandards(standards, { gradeBand: standard.gradeBand });

  const question = generateQuestion(standard, {
    type: "choice3",
    rng: createSeededRng("choice3"),
    distractorPool,
    variant: 0,
  });

  assertQuestionShape(question);
  assert.equal(question.type, "choice3");
  assert.equal(question.answer, standard.statement);
  assert.ok(question.choices.includes(standard.statement));

  for (const choice of question.choices) {
    if (choice === standard.statement) continue;
    const source = distractorPool.find((candidate) => candidate.statement === choice);
    assert.ok(source, "each distractor should come from the pool");
    assert.equal(source.gradeBand, standard.gradeBand);
    assert.notEqual(source.domain, standard.domain);
  }
});

test("generateQuestion blank masks numeric and domain-vocabulary tokens", () => {
  const { standards } = loadStandards();
  const numeric = findStandard(standards, "6수03-18");
  const numericQuestion = generateQuestion(numeric, {
    type: "blank",
    rng: createSeededRng("blank-number"),
    distractorPool: [],
    variant: 0,
  });

  assertQuestionShape(numericQuestion);
  assert.equal(numericQuestion.answer, "1cm³");
  assert.ok(numericQuestion.prompt.includes("____"));
  assert.ok(!numericQuestion.prompt.includes("1cm³"), "masked prompt must not leak the answer");
  assert.ok(numericQuestion.prompt.includes("1m³"), "other tokens should stay readable");

  const vocab = findStandard(standards, "2국02-05");
  const vocabQuestion = generateQuestion(vocab, {
    type: "blank",
    rng: createSeededRng("blank-vocab"),
    distractorPool: [],
    variant: 0,
  });

  assertQuestionShape(vocabQuestion);
  assert.equal(vocabQuestion.answer, "읽기");
  assert.ok(vocabQuestion.prompt.includes("____"));
  assert.ok(!vocabQuestion.prompt.includes("읽기"), "every occurrence of the token should be masked");
});

test("generateQuestion blank returns null when no maskable token exists", () => {
  const { standards } = loadStandards();
  const standard = findStandard(standards, "2국01-01");

  const question = generateQuestion(standard, {
    type: "blank",
    rng: createSeededRng("blank-null"),
    distractorPool: filterStandards(standards, { gradeBand: standard.gradeBand }),
  });

  assert.equal(question, null);
  assert.equal(countQuestionVariants(standard, { type: "blank", distractorPool: [] }), 0);
});

test("generateQuestion validates inputs and variant bounds", () => {
  const { standards } = loadStandards();
  const standard = findStandard(standards, "6수03-18");
  const rng = createSeededRng("validation");

  assert.throws(() => generateQuestion(standard, { type: "essay", rng }), RangeError);
  assert.throws(() => generateQuestion(standard, { type: "ox" }), TypeError);
  assert.throws(() => generateQuestion(null, { type: "ox", rng }), TypeError);

  const beyond = generateQuestion(standard, {
    type: "blank",
    rng: createSeededRng("beyond"),
    variant: 99,
  });
  assert.equal(beyond, null, "variant beyond variant count should return null");
});

test("countQuestionVariants reports enumerable variants per type", () => {
  const { standards } = loadStandards();
  const standard = findStandard(standards, "6수03-18");
  const distractorPool = filterStandards(standards, { gradeBand: standard.gradeBand });

  assert.equal(countQuestionVariants(standard, { type: "ox", distractorPool }), 3);
  assert.equal(countQuestionVariants(standard, { type: "choice3", distractorPool }), 3);
  assert.equal(countQuestionVariants(standard, { type: "blank", distractorPool }), 2);
  assert.equal(countQuestionVariants(standard, { type: "ox", distractorPool: [] }), 1);
  assert.equal(countQuestionVariants(standard, { type: "choice3", distractorPool: [] }), 0);
});

test("generateQuiz is deterministic for the same arguments and seed", () => {
  const args = { subject: "수학", grade: 5, count: 5, seed: "same-seed", types: ["ox", "choice3", "blank"] };
  const first = generateQuiz(args);
  const second = generateQuiz(args);

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(first), JSON.stringify(second), "output should be byte-identical");

  const differentSeed = generateQuiz({ ...args, seed: "other-seed" });
  assert.notDeepEqual(
    first.questions.map((question) => question.id),
    differentSeed.questions.map((question) => question.id),
    "a different seed should reorder the selection",
  );
});

test("generateQuiz returns subject/grade-scoped questions with source meta", () => {
  const quiz = generateQuiz({ subject: "과학", grade: 4, seed: "meta" });

  assert.equal(quiz.meta.subject, "과학");
  assert.equal(quiz.meta.grade, 4);
  assert.equal(quiz.meta.gradeBand, "3-4");
  assert.equal(quiz.meta.requestedCount, 5);
  assert.equal(quiz.meta.count, quiz.questions.length);
  assert.equal(quiz.meta.seed, "meta");
  assert.equal(quiz.meta.generator, "k-parent-quiz-core");
  assert.equal(quiz.meta.bundle.confirmedAt, "2026-07-07");
  assert.ok(quiz.meta.bundle.sourceUrl);
  assert.equal(quiz.questions.length, 5);

  const seenCodes = new Set();
  for (const question of quiz.questions) {
    assertQuestionShape(question);
    assert.equal(question.standard.subject, "과학");
    assert.equal(question.standard.gradeBand, "3-4");
    assert.ok(!seenCodes.has(question.standard.code), "standards should not repeat within one quiz");
    seenCodes.add(question.standard.code);
  }
});

test("generateQuiz substitutes another type when blank is impossible", () => {
  const quiz = generateQuiz({ subject: "국어", grade: 1, count: 10, seed: "fallback", types: ["blank"] });

  assert.equal(quiz.questions.length, 10);
  for (const question of quiz.questions) {
    assertQuestionShape(question);
  }
  assert.ok(
    quiz.questions.some((question) => question.type !== "blank"),
    "standards without blank tokens should fall back to another type",
  );
});

test("generateQuiz explains empty subject/grade combinations instead of failing", () => {
  const quiz = generateQuiz({ subject: "영어", grade: 1, seed: "empty" });

  assert.deepEqual(quiz.questions, []);
  assert.equal(quiz.meta.count, 0);
  assert.match(quiz.meta.warning, /성취기준이 없/);
});

test("generateQuiz validates subject, grade, count, and types", () => {
  assert.throws(() => generateQuiz({ subject: "체육", grade: 3, seed: "x" }), RangeError);
  assert.throws(() => generateQuiz({ subject: "수학", grade: 7, seed: "x" }), RangeError);
  assert.throws(() => generateQuiz({ subject: "수학", grade: 3, count: 0, seed: "x" }), RangeError);
  assert.throws(() => generateQuiz({ subject: "수학", grade: 3, types: [], seed: "x" }), RangeError);
  assert.throws(() => generateQuiz({ subject: "수학", grade: 3, types: ["essay"], seed: "x" }), RangeError);
});

test("buildQuizBank enumerates every standard deterministically", () => {
  const bank = buildQuizBank();
  const again = buildQuizBank();

  assert.equal(JSON.stringify(bank), JSON.stringify(again), "quiz bank must be byte-stable");
  assert.equal(bank.meta.totals.standards, 399);
  assert.equal(bank.meta.totals.questions, bank.questions.length);
  assert.ok(bank.questions.length >= 399 * 2, "bank should hold multiple variants per standard");

  const byStandardType = new Map();
  const ids = new Set();
  for (const question of bank.questions) {
    assertQuestionShape(question);
    assert.ok(!ids.has(question.id), `duplicate question id ${question.id}`);
    ids.add(question.id);
    const key = `${question.standard.code}:${question.type}`;
    byStandardType.set(key, (byStandardType.get(key) || 0) + 1);
  }

  const { standards } = loadStandards();
  for (const standard of standards) {
    assert.ok(byStandardType.get(`${standard.code}:ox`) >= 2, `${standard.code} should have >=2 ox variants`);
    assert.ok(byStandardType.get(`${standard.code}:choice3`) >= 2, `${standard.code} should have >=2 choice3 variants`);
  }

  const byType = { ox: 0, choice3: 0, blank: 0 };
  for (const question of bank.questions) {
    byType[question.type] += 1;
  }
  assert.deepEqual(bank.meta.totals.byType, byType);
});

test("golden snapshot: 수학 5학년 seed=golden stays byte-stable", () => {
  const quiz = generateQuiz({ subject: "수학", grade: 5, count: 2, seed: "golden" });
  const goldenPath = path.join(__dirname, "fixtures", "golden-quiz-math-5.json");
  const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));

  assert.deepEqual(quiz, golden, "regenerate test/fixtures/golden-quiz-math-5.json only for intentional template changes");
});
