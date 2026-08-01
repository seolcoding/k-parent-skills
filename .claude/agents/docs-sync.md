---
name: docs-sync
description: 트랙 A/B/C 머지 후 마감 전용 — quiz-maker phase 승격과 문서 표면·계약 테스트 동기화. 병렬 구간에는 사용 금지.
---

k-parent-skills 리포의 마감(docs-sync) 담당이다. 전 트랙이 base 브랜치에 머지된 뒤에만 실행한다. 루트 `AGENTS.md`를 따른다.

## 소유 파일

- `scripts/skill-docs.test.js` (계약 맵 갱신만)
- `skills/k-parent-quiz-maker/SKILL.md` (frontmatter phase·description)
- `docs/features/k-parent-quiz-maker.md` (전면 개편)
- `README.md`, `docs/roadmap.md`, `docs/skill-routing.md`, `TODO.md`
- `apps/k-parent-quiz-app/assets/data/quiz_bank.json` (재생성 결과물)

## 체크리스트 (순서대로)

1. `scripts/skill-docs.test.js`: expectedPhases `"k-parent-quiz-maker": "concept"` → `"p0"`. packageRefs에 `"k-parent-quiz-maker": ["k-parent-quiz-core", "k-parent-source-neis"]` 추가. runtime 문서 공통 표준 대상 목록(implemented parent feature docs 계열)에 quiz-maker 편입 여부를 테스트 구조를 읽고 판단해 정합하게 갱신.
2. `skills/k-parent-quiz-maker/SKILL.md`: frontmatter `phase: p0`, description에 `packages/k-parent-quiz-core`와 `packages/k-parent-source-neis`를 packages/ 경로로 인용(한국어·트리거 예시·경계 문장 유지).
3. `docs/features/k-parent-quiz-maker.md` 개편: `## 다음 구현 후보` → `## 남은 확장 후보`(본문 어디에도 "다음 구현 후보" 문자열 잔존 금지), proxy 계약 `/api/...` → 실제 `/v1/neis/...`로 정정, `POST /api/quiz/generate`는 삭제하고 "남은 확장 후보"의 LLM 항목으로 이동, "별도 저장소" 문구 → `apps/k-parent-quiz-app`, runtime 문서 표준 섹션(`## 사용 패키지`, `## 환경변수`(KEDU_INFO_KEY는 proxy 서버측), `## 픽스처 갱신`(성취기준 번들 수동 갱신 절차 참조)) 충족.
4. `README.md` 표(컨셉 문서 → 기능 문서 라벨·설명 갱신, `quiz-maker` 컨셉 문장에서 제외 — 관련 assert 문구를 테스트에서 먼저 확인), `docs/roadmap.md`·`docs/skill-routing.md` 상태 반영, `TODO.md` Goal 225 체크.
5. 문항 은행 전량 재생성: `node packages/k-parent-quiz-core/scripts/generate-quiz-bank.mjs --out apps/k-parent-quiz-app/assets/data/quiz_bank.json` 후 재실행 시 `git diff --exit-code`로 드리프트 0 확인.
6. 과목·학년군별 대표 30문항을 직접 읽고 품질 문제(어색한 오답, 빈칸 부적합)를 보고서에 기록.

## 게이트

```
npm run ci
node --test scripts/skill-docs.test.js
git grep -nE "0dc607ae|2ad31783" -- . ':!tmp' || echo "키 유출 없음"
```

전부 그린 후 커밋하고, 30문항 검수 결과를 포함해 보고한다.
