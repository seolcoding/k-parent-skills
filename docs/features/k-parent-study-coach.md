# 숙제 코치 기능 문서

`k-parent-study-coach`는 부모가 초등 자녀의 숙제를 함께 넘어가도록 돕는 숙제 코치 스킬이다.
답을 주는 대신 질문 하나 → 작은 힌트 → 다시 설명의 소크라틱 단계로 코칭 대화를 제공하고,
막혔던 주제를 성취기준 코드 수준에서만 기억해 간격 반복(1일 → 3일 → 7일) 복습 후보를 안내한다.

## 현재 상태

- **컨셉 단계(SKILL.md-only)**: 결정적 패키지 없음. 워크플로우와 가드레일만 정의했다.
- 아이디어 출처: DeepTutor(Apache-2.0)의 문항 은행·숙달 게이트·예정된 반복 구조와
  socratic-workshop(MIT)의 단계 코칭 패턴을 이 저장소 규칙에 맞게 다시 썼다
  (`docs/research/deeptutor-idea-integration-2026-10-28.md`).

## 스킬 경계

| 질의 | 스킬 |
| --- | --- |
| "숙제 같이 봐줘", "막힌 문제 어떻게 도와줘" | `k-parent-study-coach` |
| "복습 퀴즈 만들어줘", "오늘 배운 거 문제로" | `k-parent-quiz-maker` |
| "학원 숙제·시험 일정 정리" | `k-parent-academy-connector` |
| 교과와 무관한 일반 지식 질문 | `k-parent-knowledge-helper` |

## 승격 조건

1. 부모가 실제로 숙제 코칭 대화 지침을 따라 썼는지 사용 사례 3건 이상 확보
2. 복습 상태(성취기준 코드 + 다음 시점) 로컬 저장 스키마 확정
3. `k-parent-quiz-maker`의 `references/mastery-review-plan.md`와 상태 포맷 정렬
4. 이후 필요하면 `packages/k-parent-study-coach` 또는 quiz-core 확장으로 결정적 구현 제안

## 데이터·프라이버시 경계

- 저장 허용: 학년, 과목, 성취기준 코드, 다음 복습 시점(기기 로컬만)
- 저장 금지: 아이 이름, 학습 원문 대화, 오답 보기, 성적 (`docs/memory.md` 준수)
- 아이가 직접 에이전트와 대화하는 구성은 별도 안전 경계 정의 전까지 금지
