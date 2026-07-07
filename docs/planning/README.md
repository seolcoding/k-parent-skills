# Planning Index

이 디렉토리는 연구 결과를 제품 실행 단위로 바꾸기 위한 계획 문서입니다. 현재는 일부 `packages/k-parent-*` 런타임이 구현되어 있으므로, 남은 스캐폴딩/기능 계획은 새 패키지를 추가하기 전 경계와 검증 조건을 정리하는 역할을 합니다.

## Documents

| 문서 | 목적 |
| --- | --- |
| [PRD](prd.md) | 대한민국 부모용 AI 에이전트 스킬 제품 요구사항 |
| [스캐폴딩 계획](scaffolding-plan.md) | 향후 코드와 데이터 구조를 어떤 순서로 만들지 정리 |
| [기능별 플래닝](feature-plans.md) | 기능 단위 입력, 원천, 출력, 위험, 단계 |
| [OMC 에이전트 계획](omc-agent-plan.md) | OMC 에이전트 역할 분담과 운영 루프 |

## Current OMC Baseline

2026-05-01 현재 로컬에서 확인한 OMC 상태:

- `omc` command: installed
- package: `oh-my-codex@0.15.1`
- reported suite version: `Oh-My-ClaudeCode 3.7.15`
- useful commands checked: `omc --help`, `omc info`, `omc config`, `omc test-prompt`
- available planning agents observed: `planner`, `architect`, `researcher`, `analyst`, `writer`, `critic`, `designer`, `executor`
- enabled features observed: parallel execution, LSP tools, AST tools, continuation enforcement, auto context injection

The current CLI surface exposes planning metadata and prompt validation, but does not expose a direct `omc run agent` command in the checked help output. Until that is added or configured separately, OMC is used here as a structured planning convention and agent-role map rather than as an automated subagent executor.

## Planning Rules

- Keep product skill folders flat inside `skills/`, with inherited upstream demos isolated under `examples/`.
- Keep departments as taxonomy and ownership, not nested install paths.
- Start with official data MVP before private scraping.
- Treat government, booking, payment, and identity flows as official-site handoff.
- Keep child data minimal and consent-bound.
- Do not add runtime packages before a feature has a deterministic adapter boundary.
