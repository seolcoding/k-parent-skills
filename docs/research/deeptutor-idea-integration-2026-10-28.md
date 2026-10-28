# DeepTutor 아이디어 통합 조사 (2026-10-28)

[HKUDS/DeepTutor](https://github.com/HKUDS/DeepTutor)에서 이 저장소 하니스로 가져올 아이디어를
정리했다. 모든 조사는 읽기 전용이었고 아무것도 설치하지 않았다. 별·릴리즈 정보는 2026-10-28
기준(v1.6.15, 47k★, Apache-2.0, Python 3.11+ / Next.js 16).

판정 기준은 [external-parent-skill-sources-2026-10-27.md](external-parent-skill-sources-2026-10-27.md)와 같다.

## 요약 판정

DeepTutor는 약 20만 줄 규모의 에이전트 네이티브 학습 워크스페이스 앱이다. 라이선스(Apache-2.0)상
개작은 가능하지만, 이 저장소 규칙(단일 앱으로 평탄화 금지, 스킬 컬렉션 유지)때문에 **코드·문장을
가져오지 않고 구조·아이디어만 참고한다(참고만)**. 단, 기능 개념을 우리 규칙에 맞게 다시 쓴
산출물(②③)은 DeepTutor를 원천으로 하는 개작에 해당하므로 각 문서에 출처를 표기한다.

## DeepTutor에서 확인한 구조 (README 기준)

- **하나의 런타임, 여러 학습 모드**: Chat, Quiz, Research, Solve, Mastery Path, Immersive Reading,
  Practice가 하나의 capability runtime과 세션 컨텍스트를 공유한다. 모드마다 목적에 맞는 루프만
  다르다. → 우리 `docs/layers.md` 레이어 모델과 같은 방향이라 설계을 바꿀 필요는 없다.
- **문항 은행(Question Bank)**: 문항마다 정답·해설을 붙여 저장하고, 채점된 Mastery Path 문항이
  은행으로 흘러들어 간다. Practice는 은행 선택에서 시작한다.
- **Practice(복습)**: 리뷰 세션, 오답 추적(mistake tracking), 예정된 반복(scheduled repetition)을
  문항 은행 위에서 돌린다.
- **Mastery Path(숙달 경로)**: 유형(per-type)별 강한 숙달 게이트를 두고, 게이트를 통과해야 다음
  단계 도구가 열린다. `/learning` 대시보드에서 진행 상황을 본다.
- **3층 메모리**: L1 작업공간 미러+append-only 이벤트 trace(jsonl), L2 표면별 큐레이션 사실(L1 근거
  참조 포함), L3 표면 간 종합(기여한 L2 표면 기록). "감춰진 벡터 저장소가 아니라 읽고 검사하고
  편집할 수 있는" 파일 기반이 핵심 설계다.
- **Immersive Reading**: 문서를 스레드 옆에 펴고 페이지 단위로 인용하며 튜터링한다.
- **Partners/서브에이전트**: 채팅 중 Claude Code, Codex 등 라이브 하니스에 협의를 요청할 수 있다.

## 통합 결정 (2026-10-28, 소유자 승인)

| DeepTutor 아이디어 | 이 저장소 접점 | 형태 | 산출물 |
| --- | --- | --- | --- |
| 문항 은행·오답 추적·숙달 게이트·예정된 반복 | `k-parent-quiz-maker` 확장 | 개념 개작 | `skills/k-parent-quiz-maker/references/mastery-review-plan.md` |
| 소크라틱 숙제 코치 + 간격 반복 | 신규 컨셉 스킬 | 개념 개작 | `skills/k-parent-study-coach/SKILL.md` |
| 3층 메모리(L1/L2/L3) | `k-parent-memory` 설계 | 참고만 (이번 변경 제외) | — |
| 문서 페이지 근거 튜터링 | `k-parent-school-doc-capture` | 참고만 (향후 검토) | — |
| 하나의 런타임·여러 모드 | `docs/layers.md` | 이미 일치 (변경 없음) | — |

## 우리 쪽으로 가져올 때 지킬 경계

1. **아이 학습 데이터 최소화**: DeepTutor는 학습자 계정·진행 상황을 저장하는 제품이지만, 이 저장소
   메모리 정책(`docs/memory.md`)은 아이 식별정보·학습 원문 대화를 저장하지 않는다. 문항 은행·복습
   일정은 식별 없는 로컬 상태(성취기준 코드, 문항 seed, 다음 복습 시점)로만 표현한다.
2. **성취기준 SSOT 유지**: 문항은 `k-parent-quiz-core`의 결정적 템플릿·seed 방식을 그대로 쓴다.
   DeepTutor식 LLM 자유 생성 문항은 도입하지 않는다.
3. **성적 판단 금지**: 숙달 게이트는 "다음 단계 추천"용이지 평가·비교가 아니다. 기존 가드레일 유지.
4. **코드 미복제**: Apache-2.0이라도 이 저장소는 Node 제로의존성 패키지 구조라 Python/Next.js
   구성요소를 들여오지 않는다.

## 확인하지 못한 것

- arXiv 논문 본문(구조 상세는 README·릴리즈 노트 기준)
- DeepTutor 서버를 실제 구동해본 검증 (조사는 읽기 전용)
