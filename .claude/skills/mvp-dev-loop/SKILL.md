---
name: mvp-dev-loop
description: 초등 퀴즈 MVP 병렬 개발 루프 운영 가이드. 트랙별 게이트 명령·worktree 절차·머지 순서·드리프트 체크를 담은 리포 전용 개발 스킬. "트랙 게이트 돌려줘", "MVP 개발 루프", "worktree로 트랙 시작" 같은 요청에 사용.
---

# MVP 개발 루프 (k-parent-skills 전용)

초등 퀴즈 MVP를 트랙 4개(A: quiz-core, B: proxy 라우트, C: Flutter 앱, 마감: docs-sync)로 병렬 개발할 때의 운영 절차다. 서브에이전트 정의는 `.claude/agents/track-*.md`, 계획 원문은 승인된 플랜 파일을 따른다.

## 트랙별 게이트 명령

| 트랙 | 게이트 |
| --- | --- |
| A (quiz-core) | `npm run lint --workspace k-parent-quiz-core && npm run test --workspace k-parent-quiz-core && npm pack --workspace k-parent-quiz-core --dry-run && node --test scripts/skill-docs.test.js` |
| B (proxy) | `npm run test --workspace k-parent-proxy && node --test scripts/skill-docs.test.js` + 로컬 기동 후 키 없이 curl → 503 확인 |
| C (Flutter) | `flutter analyze`(경고 0) + `flutter test` + 웹 프리뷰 3화면 스크린샷 |
| 마감 | `npm run ci` + 은행 드리프트 체크 + 키 유출 grep |

공통 규칙: **README/docs/skills 아래 마크다운을 하나라도 만졌으면 루트 `node --test scripts/skill-docs.test.js`를 즉시 실행한다** (proxy 라우트-문서, buildConfig env-문서, pack 커버리지, phase 계약이 전부 여기서 강제된다).

## worktree 절차

```bash
git worktree add ../k-parent-skills-track-a -b track/quiz-core   # A
git worktree add ../k-parent-skills-track-b -b track/proxy-neis  # B
git worktree add ../k-parent-skills-track-c -b track/flutter-app # C
# 각 worktree에서 npm install 후 작업. 완료 트랙부터 base 브랜치로 병합.
git worktree remove ../k-parent-skills-track-a                   # 병합 후 정리
```

## 머지 순서와 이유

**A → B → C → 마감.** A가 먼저여야 quiz-dev MCP의 `generate_template_quiz`가 활성화되고 문항 은행 제너레이터를 C·마감이 쓸 수 있다. 소유권이 배타적이라 충돌은 없어야 정상이며, 충돌이 나면 소유권 매트릭스 위반 신호다. 머지마다 `npm run ci`를 돌린다.

## 파일 소유권 (병렬 구간)

- A: `packages/k-parent-quiz-core/**`, `skills/k-parent-quiz-maker/SKILL.md` 본문만, 루트 `package.json`(pack 1줄)+lock
- B: `packages/k-parent-proxy/{src,test,README.md}`, `docs/features/k-parent-proxy.md`
- C: `apps/k-parent-quiz-app/**`, `.claude/launch.json`
- **동결(마감 소유)**: `docs/features/k-parent-quiz-maker.md`, `TODO.md`, 루트 `AGENTS.md`, SKILL.md frontmatter(phase·description)

## 문항 은행 드리프트 체크 (마감)

```bash
node packages/k-parent-quiz-core/scripts/generate-quiz-bank.mjs --out apps/k-parent-quiz-app/assets/data/quiz_bank.json
git diff --exit-code apps/k-parent-quiz-app/assets/data/quiz_bank.json  # 드리프트 0이어야 함
```

## quiz-dev MCP 조회 (개발 중 간편 조회)

`.mcp.json`의 `quiz-dev` 서버(도구: lookup_standards, search_standards, list_timetable_fixture, generate_template_quiz)를 쓴다. 트랙 A 머지 전에는 generate가 `quiz_core_not_available_yet`을 반환하는 것이 정상이다.
