# k-parent-quiz-core

Deterministic template quiz generator for K-Parent Skill, built on the 2022 revised
elementary achievement standards bundle (국어·수학·사회·과학·영어, 399 standards).

Same arguments + same seed always produce byte-identical output. The package never
calls `Date.now()` or `Math.random()`, has zero external dependencies, and ships its
own copy of the standards bundle so it works offline.

## API (CommonJS)

```js
const {
  loadStandards,        // ({dataPath}?) => {meta, standards} — frozen, cached bundle
  gradeToBand,          // (1..6) => "1-2" | "3-4" | "5-6"
  filterStandards,      // (standards, {subject?, grade?, gradeBand?, domain?, keyword?}) => rows
  createSeededRng,      // (seed) => () => float in [0,1) — mulberry32, string seeds via FNV-1a
  generateQuestion,     // (standard, {type, rng, distractorPool, variant?}) => Question | null
  generateQuiz,         // ({subject, grade, count=5, seed, types}) => {meta, questions}
  countQuestionVariants,// (standard, {type, distractorPool}) => enumerable variant count
  buildQuizBank,        // ({types?}) => {meta, questions} — full deterministic bank
  QUESTION_TYPES,       // ["ox", "choice3", "blank"]
} = require("k-parent-quiz-core");

const quiz = generateQuiz({ subject: "수학", grade: 5, count: 5, seed: "2026-07-07" });
```

### Question schema

```json
{
  "id": "<code>:<type>:<variant>",
  "type": "ox | choice3 | blank",
  "standard": { "code": "...", "subject": "...", "gradeBand": "...", "domain": "..." },
  "prompt": "부모가 아이에게 읽어주는 확인 질문",
  "choices": ["choice3만 3개, 그 외 null"],
  "answer": "O|X, 정답 보기 원문, 또는 빈칸 토큰",
  "explanation": "한 줄 해설",
  "difficulty": "기본 | 도전"
}
```

### Template rules

- `ox` variant 0 quotes the target statement (answer `O`, 기본). Variants 1-2 quote a
  statement from the **same grade band but a different domain** (answer `X`, 도전).
- `choice3` mixes the target statement with two seeded cross-domain distractors from
  the same grade band; the answer is the correct statement text (기본).
- `blank` masks a numeric/unit token or a domain-vocabulary token that actually appears
  in the statement (도전). When no such token exists it returns `null`, and
  `generateQuiz` substitutes another type from `types`.

## Data SSOT and sync

The single source of truth is
`skills/k-parent-quiz-maker/references/achievement-standards-elementary.json`
(국가교육위원회 고시 제2026-1호 【별책 2】, confirmedAt 2026-07-07). The packaged copy in
`data/` is a byte-identical mirror:

```bash
npm run sync-standards --workspace k-parent-quiz-core
```

`test/index.test.js` fails when the two files drift.

## Quiz bank generation

```bash
node packages/k-parent-quiz-core/scripts/generate-quiz-bank.mjs --out quiz_bank.json
```

Enumerates up to 3 variants per standard per type with per-question seeds
(`<code>:<type>:<variant>`), so the file is byte-stable across runs and safe to use in
drift checks (`git diff --exit-code`). Summary statistics are printed to stderr.

## Verify

```bash
npm run lint --workspace k-parent-quiz-core
npm run test --workspace k-parent-quiz-core
```
