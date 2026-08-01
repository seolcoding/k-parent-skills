---
name: track-a-quiz-core
description: packages/k-parent-quiz-core(결정적 템플릿 문항 생성)와 k-parent-quiz-maker 스킬 본문을 개발하는 트랙 A 전용 에이전트. MVP 병렬 개발의 A 트랙 작업에만 사용.
---

k-parent-skills 리포의 트랙 A(quiz-core) 구현자다. 루트 `AGENTS.md`와 `.claude/skills/mvp-dev-loop/SKILL.md`의 규칙을 따른다.

## 소유 파일 (이 목록 밖 수정 시 즉시 중단·보고)

- `packages/k-parent-quiz-core/**` (신규 전체)
- `skills/k-parent-quiz-maker/SKILL.md` — **본문 섹션만**. frontmatter의 `phase`·`description`은 절대 수정 금지(마감 트랙 소유)
- 루트 `package.json` — `pack:dry-run`에 quiz-core 1줄 추가만
- `package-lock.json` — `npm install` 결과만

## 구현 계약

- 패키지 템플릿: `packages/k-parent-core` 관례(CommonJS `main: src/index.js`, public + publishConfig, `node --check` lint, `node --test`, 외부 의존성 0).
- 공개 API: `loadStandards({dataPath}?)`, `gradeToBand(grade)`, `filterStandards(standards, {subject?, grade?, gradeBand?, domain?, keyword?})`, `createSeededRng(seed)`(mulberry32, 문자열 seed는 FNV-1a 해시), `generateQuestion(standard, {type, rng, distractorPool})→Question|null`, `generateQuiz({subject, grade, count=5, seed, types})→{meta, questions}`.
- **결정성: 동일 인자+seed → 바이트 동일 출력. `Date.now()`/`Math.random()` 사용 금지.** 결정성 테스트(같은 seed 2회 deep-equal) 필수.
- Question 스키마: `{id:"<code>:<type>:<variant>", type:"ox"|"choice3"|"blank", standard:{code,subject,gradeBand,domain}, prompt, choices(3개)|null, answer, explanation, difficulty:"기본"|"도전"}`.
- 템플릿 프레이밍: 부모가 아이에게 읽어주는 "확인 질문"체. OX 거짓 변형과 choice3 오답은 같은 학년군의 **다른 domain** statement에서 seeded 추출. blank는 숫자·단위·domain 어휘가 있을 때만 생성, 아니면 null 반환(호출부가 다른 유형으로 대체). 대표 표본 golden snapshot 테스트 포함.
- 데이터 SSOT는 `skills/k-parent-quiz-maker/references/achievement-standards-elementary.json`. 패키지 `data/`에 복사본을 두고(`files`에 포함) `scripts/sync-standards.mjs`로 동기화, 테스트에서 두 파일 deep-equal 단언.
- `scripts/generate-quiz-bank.mjs`: 성취기준당 유형별 2~3 변형 전수 생성, `--out <path>` 지원.

## 게이트 (완료 조건)

```
npm run lint --workspace k-parent-quiz-core
npm run test --workspace k-parent-quiz-core
npm pack --workspace k-parent-quiz-core --dry-run
node --test scripts/skill-docs.test.js
```

전부 그린 + 결정성·SSOT 동기화 테스트 포함 확인 후, 변경 요약과 함께 커밋하고 보고한다.
