"use strict";

const { createSeededRng, seededShuffle } = require("./rng");
const { filterStandards, gradeToBand, loadStandards } = require("./standards");

const QUESTION_TYPES = Object.freeze(["ox", "choice3", "blank"]);
const MAX_VARIANTS_PER_TYPE = 3;
const BLANK_MASK = "____";
const DEFAULT_SEED = "k-parent-quiz";

// blank 후보에서 제외하는 domain 기능어(내용어가 아니어서 답으로 부적절).
const DOMAIN_STOPWORDS = new Set(["그리고", "우리", "나의"]);

// 숫자·단위 토큰: "0", "100", "1cm", "1cm³", "1L", "1mL" 등.
const NUMERIC_TOKEN_RE = /[0-9][0-9.,/]*(?:[a-zA-Z°℃³²]+)?/g;
const ALNUM_GUARD = "[0-9a-zA-Z°℃³²]";

function validateStandard(standard) {
  const fields = ["code", "subject", "gradeBand", "domain", "statement"];
  if (!standard || typeof standard !== "object") {
    throw new TypeError("standard must be an achievement-standard object");
  }
  for (const field of fields) {
    if (typeof standard[field] !== "string" || standard[field].length === 0) {
      throw new TypeError(`standard.${field} must be a non-empty string`);
    }
  }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 토큰의 모든 등장을 마스킹한다. 숫자·단위 토큰은 인접 숫자/단위 문자가 없는 자리만
// 바꿔서 "100" 속의 "0" 같은 부분 매칭을 막는다.
function maskAllOccurrences(text, token) {
  const escaped = escapeRegExp(token);
  if (/^[0-9]/.test(token)) {
    return text.replace(new RegExp(`(?<!${ALNUM_GUARD})${escaped}(?!${ALNUM_GUARD})`, "g"), BLANK_MASK);
  }
  return text.replace(new RegExp(escaped, "g"), BLANK_MASK);
}

// domain 이름에서 blank 후보 어휘를 뽑는다. 구분자(공백·⋅·,)로 자르고
// 말미 조사(과/와/의)를 떼어 2글자 이상 어간만 남긴다.
function domainVocabulary(domain) {
  const tokens = [];
  const seen = new Set();
  for (const chunk of domain.split(/[\s⋅·,]+/)) {
    const cleaned = chunk.replace(/[^0-9가-힣a-zA-Z]/g, "");
    if (!cleaned) continue;
    const stem = cleaned.replace(/[과와의]$/, "");
    const token = stem.length >= 2 ? stem : cleaned;
    if (token.length < 2 || DOMAIN_STOPWORDS.has(token) || seen.has(token)) continue;
    seen.add(token);
    tokens.push(token);
  }
  return tokens;
}

// blank 토큰: 숫자·단위(등장 순) 우선, 그다음 statement에 실제로 나오는 domain 어휘.
// 마스킹했을 때 답이 완전히 사라지는 토큰만 남긴다.
function extractBlankTokens(standard) {
  const tokens = [];
  const seen = new Set();
  for (const match of standard.statement.matchAll(NUMERIC_TOKEN_RE)) {
    const token = match[0].replace(/[.,/]+$/, "");
    if (token && !seen.has(token)) {
      seen.add(token);
      tokens.push(token);
    }
  }
  for (const token of domainVocabulary(standard.domain)) {
    if (!seen.has(token) && standard.statement.includes(token)) {
      seen.add(token);
      tokens.push(token);
    }
  }
  return tokens.filter((token) => {
    const masked = maskAllOccurrences(standard.statement, token);
    return masked !== standard.statement && !masked.includes(token);
  });
}

// OX 거짓 변형·choice3 오답 후보: 같은 학년군 + 다른 domain(+중복 statement 제거).
// 같은 과목 후보가 2개 이상이면 같은 과목을 우선해 난이도를 살린다. code 순 정렬로 결정성 유지.
function eligibleDistractors(standard, distractorPool) {
  const seenStatements = new Set([standard.statement]);
  const eligible = [];
  for (const candidate of distractorPool) {
    if (!candidate || candidate.code === standard.code) continue;
    if (candidate.gradeBand !== standard.gradeBand) continue;
    if (candidate.domain === standard.domain) continue;
    if (seenStatements.has(candidate.statement)) continue;
    seenStatements.add(candidate.statement);
    eligible.push(candidate);
  }
  const sameSubject = eligible.filter((candidate) => candidate.subject === standard.subject);
  const base = sameSubject.length >= 2 ? sameSubject : eligible;
  return [...base].sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
}

// 유형별로 전수 생성 가능한 변형 수. generate-quiz-bank.mjs가 열거 상한으로 쓴다.
function countQuestionVariants(standard, { type, distractorPool = [] } = {}) {
  validateStandard(standard);
  if (!QUESTION_TYPES.includes(type)) {
    throw new RangeError(`type must be one of ${QUESTION_TYPES.join("|")}, got ${String(type)}`);
  }
  if (type === "blank") {
    return Math.min(MAX_VARIANTS_PER_TYPE, extractBlankTokens(standard).length);
  }
  const base = eligibleDistractors(standard, distractorPool);
  if (type === "ox") {
    return 1 + Math.min(MAX_VARIANTS_PER_TYPE - 1, base.length);
  }
  return Math.min(MAX_VARIANTS_PER_TYPE, Math.floor(base.length / 2));
}

function questionBase(standard, type, variant) {
  return {
    id: `${standard.code}:${type}:${variant}`,
    type,
    standard: {
      code: standard.code,
      subject: standard.subject,
      gradeBand: standard.gradeBand,
      domain: standard.domain,
    },
  };
}

function resolveVariant(variantCount, variant, rng) {
  if (variantCount <= 0) return null;
  const resolved = variant === null ? Math.floor(rng() * variantCount) : variant;
  return resolved >= variantCount ? null : resolved;
}

function generateOx(standard, rng, shuffled, variant) {
  const variantCount = 1 + Math.min(MAX_VARIANTS_PER_TYPE - 1, shuffled.length);
  const resolved = resolveVariant(variantCount, variant, rng);
  if (resolved === null) return null;

  if (resolved === 0) {
    return {
      ...questionBase(standard, "ox", resolved),
      prompt:
        `${standard.subject} 확인 문제예요. 잘 듣고 O나 X로 답해 보세요. ` +
        `"${standard.statement}" — 이 내용은 ${standard.subject} '${standard.domain}' 공부에서 배우는 것이 맞을까요?`,
      choices: null,
      answer: "O",
      explanation: `맞아요. ${standard.subject} '${standard.domain}' 영역의 성취기준(${standard.code})에서 배우는 내용이에요.`,
      difficulty: "기본",
    };
  }

  const distractor = shuffled[resolved - 1];
  return {
    ...questionBase(standard, "ox", resolved),
    prompt:
      `${standard.subject} 확인 문제예요. 잘 듣고 O나 X로 답해 보세요. ` +
      `"${distractor.statement}" — 이 내용은 ${standard.subject} '${standard.domain}' 공부에서 배우는 것이 맞을까요?`,
    choices: null,
    answer: "X",
    explanation:
      `아니에요. 이 문장은 ${distractor.subject} '${distractor.domain}' 영역에서 배우는 내용이에요. ` +
      `${standard.subject} '${standard.domain}'에서는 "${standard.statement}"라는 내용을 배워요.`,
    difficulty: "도전",
  };
}

function generateChoice3(standard, rng, shuffled, variant) {
  const variantCount = Math.min(MAX_VARIANTS_PER_TYPE, Math.floor(shuffled.length / 2));
  const resolved = resolveVariant(variantCount, variant, rng);
  if (resolved === null) return null;

  const first = shuffled[resolved * 2];
  const second = shuffled[resolved * 2 + 1];
  const position = Math.floor(rng() * 3);
  const choices = [first.statement, second.statement];
  choices.splice(position, 0, standard.statement);

  return {
    ...questionBase(standard, "choice3", resolved),
    prompt:
      `${standard.subject} 확인 문제예요. 다음 세 가지 중에서 ` +
      `${standard.subject} '${standard.domain}' 공부에서 배우는 내용은 무엇일까요?`,
    choices,
    answer: standard.statement,
    explanation: `정답은 "${standard.statement}" — ${standard.subject} '${standard.domain}' 영역에서 배우는 내용이에요.`,
    difficulty: "기본",
  };
}

function generateBlank(standard, rng, variant) {
  const tokens = extractBlankTokens(standard);
  const variantCount = Math.min(MAX_VARIANTS_PER_TYPE, tokens.length);
  const resolved = resolveVariant(variantCount, variant, rng);
  if (resolved === null) return null;

  const token = tokens[resolved];
  const masked = maskAllOccurrences(standard.statement, token);
  return {
    ...questionBase(standard, "blank", resolved),
    prompt: `${standard.subject} 확인 문제예요. 빈칸(${BLANK_MASK})에 들어갈 말을 맞혀 보세요. "${masked}"`,
    choices: null,
    answer: token,
    explanation: `완성한 문장: "${standard.statement}" (${standard.subject} '${standard.domain}' 영역)`,
    difficulty: "도전",
  };
}

// 성취기준 1건을 결정적 템플릿 문항으로 바꾼다. 같은 인자·같은 rng seed면 항상 같은 출력.
// blank 토큰이 없거나 오답 재료가 모자라면 null을 돌려주고, 호출부가 다른 유형으로 대체한다.
function generateQuestion(standard, { type, rng, distractorPool = [], variant = null } = {}) {
  validateStandard(standard);
  if (!QUESTION_TYPES.includes(type)) {
    throw new RangeError(`type must be one of ${QUESTION_TYPES.join("|")}, got ${String(type)}`);
  }
  if (typeof rng !== "function") {
    throw new TypeError("rng must be a function — create one with createSeededRng(seed)");
  }
  if (variant !== null && (!Number.isInteger(variant) || variant < 0)) {
    throw new RangeError(`variant must be null or a non-negative integer, got ${String(variant)}`);
  }

  if (type === "blank") {
    return generateBlank(standard, rng, variant);
  }
  const shuffled = seededShuffle(eligibleDistractors(standard, distractorPool), rng);
  if (type === "ox") {
    return generateOx(standard, rng, shuffled, variant);
  }
  return generateChoice3(standard, rng, shuffled, variant);
}

function pickBundleMeta(bundleMeta) {
  return {
    title: bundleMeta.title,
    source: bundleMeta.source,
    sourceUrl: bundleMeta.sourceUrl,
    license: bundleMeta.license,
    confirmedAt: bundleMeta.confirmedAt,
  };
}

function typeChain(types, index) {
  const chain = [types[index % types.length]];
  for (const type of [...types, ...QUESTION_TYPES]) {
    if (!chain.includes(type)) chain.push(type);
  }
  return chain;
}

// 과목·학년 기준 결정적 퀴즈 생성. Date.now()/Math.random() 없이 seed만으로 재현된다.
function generateQuiz({ subject, grade, count = 5, seed = DEFAULT_SEED, types = QUESTION_TYPES } = {}) {
  const { meta: bundleMeta, standards } = loadStandards();
  const subjects = [...new Set(standards.map((standard) => standard.subject))];
  if (!subjects.includes(subject)) {
    throw new RangeError(`subject must be one of ${subjects.join("|")}, got ${String(subject)}`);
  }
  const gradeBand = gradeToBand(grade);
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`count must be a positive integer, got ${String(count)}`);
  }
  if (!Array.isArray(types) || types.length === 0 || !types.every((type) => QUESTION_TYPES.includes(type))) {
    throw new RangeError(`types must be a non-empty array drawn from ${QUESTION_TYPES.join("|")}`);
  }

  const meta = {
    generator: "k-parent-quiz-core",
    subject,
    grade,
    gradeBand,
    requestedCount: count,
    count: 0,
    seed,
    types: [...types],
    bundle: pickBundleMeta(bundleMeta),
  };

  const pool = filterStandards(standards, { subject, gradeBand });
  if (pool.length === 0) {
    meta.warning = `${subject} ${gradeBand} 학년군 성취기준이 없어 문항을 만들지 못했습니다. 번들 수록 범위(과목·학년군)를 확인하세요.`;
    return { meta, questions: [] };
  }

  const bandPool = filterStandards(standards, { gradeBand });
  const rng = createSeededRng(seed);
  const selected = seededShuffle(pool, rng).slice(0, Math.min(count, pool.length));

  const questions = [];
  selected.forEach((standard, index) => {
    for (const type of typeChain(types, index)) {
      const question = generateQuestion(standard, { type, rng, distractorPool: bandPool });
      if (question) {
        questions.push(question);
        break;
      }
    }
  });

  meta.count = questions.length;
  if (questions.length < count) {
    meta.warning = `${subject} ${gradeBand} 학년군 성취기준이 ${pool.length}건이라 요청한 ${count}문항 중 ${questions.length}문항만 만들었습니다.`;
  }
  return { meta, questions };
}

// 문항 은행 전수 생성: 성취기준 × 유형 × 변형(유형별 최대 3개)을
// `<code>:<type>:<variant>` seed로 열거해 순서·시간에 무관하게 같은 결과를 만든다.
function buildQuizBank({ types = QUESTION_TYPES, dataPath } = {}) {
  if (!Array.isArray(types) || types.length === 0 || !types.every((type) => QUESTION_TYPES.includes(type))) {
    throw new RangeError(`types must be a non-empty array drawn from ${QUESTION_TYPES.join("|")}`);
  }
  const { meta: bundleMeta, standards } = loadStandards(dataPath ? { dataPath } : {});
  const sorted = [...standards].sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));

  const bandPools = new Map();
  for (const standard of sorted) {
    if (!bandPools.has(standard.gradeBand)) {
      bandPools.set(standard.gradeBand, filterStandards(standards, { gradeBand: standard.gradeBand }));
    }
  }

  const questions = [];
  const byType = Object.fromEntries(types.map((type) => [type, 0]));
  const bySubject = {};
  let blankCapableStandards = 0;

  for (const standard of sorted) {
    const distractorPool = bandPools.get(standard.gradeBand);
    if (!bySubject[standard.subject]) {
      bySubject[standard.subject] = Object.fromEntries([...types.map((type) => [type, 0]), ["total", 0]]);
    }
    if (extractBlankTokens(standard).length > 0) {
      blankCapableStandards += 1;
    }
    for (const type of types) {
      const variantCount = countQuestionVariants(standard, { type, distractorPool });
      for (let variant = 0; variant < variantCount; variant += 1) {
        const rng = createSeededRng(`${standard.code}:${type}:${variant}`);
        const question = generateQuestion(standard, { type, rng, distractorPool, variant });
        if (!question) continue;
        questions.push(question);
        byType[type] += 1;
        bySubject[standard.subject][type] += 1;
        bySubject[standard.subject].total += 1;
      }
    }
  }

  return {
    meta: {
      generator: "k-parent-quiz-core",
      kind: "quiz-bank",
      seedPolicy: "createSeededRng(`<code>:<type>:<variant>`)",
      types: [...types],
      bundle: pickBundleMeta(bundleMeta),
      totals: {
        standards: standards.length,
        questions: questions.length,
        byType,
        bySubject,
        blankCapableStandards,
      },
    },
    questions,
  };
}

module.exports = {
  QUESTION_TYPES,
  buildQuizBank,
  countQuestionVariants,
  generateQuestion,
  generateQuiz,
};
