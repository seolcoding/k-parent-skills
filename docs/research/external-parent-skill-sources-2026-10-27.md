# 외부 부모·아이 스킬 소싱 조사 (2026-10-27)

k-parent-skills에 가져오거나 참고할 외부 스킬을 네 갈래로 조사했다: NomaDamas/k-skill, Anthropic 공식, OpenAI 공식, 해외 커뮤니티.
모든 조사는 읽기 전용이었고 아무것도 설치하지 않았다. 별·커밋 날짜·라이선스는 2026-10-27 `gh api` 기준이다.

판정 기준:

- **차용**: 라이선스가 허용하고 거의 그대로 옮긴다. 원본 LICENSE/NOTICE를 함께 둔다.
- **개작**: 라이선스가 허용하고, 한국 출처·교육과정·우리 HITL/메모리 정책에 맞게 다시 쓴다. `skills/<skill>/references/NOTICE.md`에 원본 경로를 적는다.
- **참고만**: 아이디어·구조만 본다. 문장·코드를 옮기지 않는다.
- **불가**: 라이선스가 없거나 금지한다. 읽기만 한다.

## 요약

- 부모·아이를 직접 겨냥한 고품질 스킬은 해외에도 거의 없다. 학교 연락 정리, 부모용 소아 건강 선별, 아이 AI 사용 안전 경계는 공백이라 직접 만들 영역이다.
- 가장 쓸 만한 외부 자산은 세 묶음이다.
  1. k-skill의 학교·건강·공기질·도서관·공휴일 스킬 (MIT, 프록시 라우트로 재연결)
  2. 학습 튜터 패턴: Anthropic/Learning Commons k12 스킬(Apache-2.0), socratic-workshop(MIT)
  3. 미성년자 안전 정책: OpenAI Model Spec U18 원칙(CC0), Teen Safety Policy Pack(Apache-2.0)
- 피해야 할 것: k-skill proxy 코드(AGPL-3.0), Anthropic `pdf`/`docx`/`pptx`/`xlsx`(독점), 라이선스 없는 저장소(tradclaw 등), CC BY-SA 자료(GarethManning).

## 1. NomaDamas/k-skill

- 라이선스: 본체 MIT. 저작권 줄은 `Copyright (c) 2026`만 있어 "NomaDamas/k-skill contributors"로 표기한다.
- 예외: `packages/k-skill-proxy/`, `infra/k-skill-proxy-dashboard/`는 AGPL-3.0-only. 코드는 들여오지 않고 설계만 참고한다.
- 스킬 132개가 저장소 최상위에 있다. `SKILL.md`는 CLI stub이고 실제 지침은 `<스킬>/instruction.md`에 있다. 차용하더라도 `instruction.md`를 우리 `SKILL.md`로 옮겨 써야 한다.
- 프록시: 공개 엔드포인트 `https://k-skill-proxy.nomadamas.org`(Cloud Run). 운영자 키를 서버에 두고 allowlist, 5분 캐시, 분당 60회 제한. 제3자 프로젝트가 이 공개 서버를 기본값으로 써도 되는지는 약관에 없다. 쓰려면 NomaDamas에 문의한다.

| 스킬 | 의존 | 판정 | 우리 쪽 연결 |
| --- | --- | --- | --- |
| `k-schoollunch-menu` | 프록시(NEIS) | 개작 | `k-parent-school-info`/`k-parent-meal-planner`, 기존 NEIS 라우트 |
| `fine-dust-location`, `korea-weather` | 프록시(에어코리아·기상청) | 개작 | 등원·바깥놀이 판단. 새 프록시 라우트 필요 |
| `korean-holiday-calendar` | 프록시(공공데이터) | 개작 | `k-parent-schedule-manager` |
| `library-book-search` | 프록시(정보나루) | 개작 | 교과 연계 도서 추천 |
| `mfds-drug-safety`, `mfds-food-safety` | 프록시 + scripts | 개작 | 아이 약·식품 안전. 증상 먼저 묻는 인터뷰 구조 유지 |
| `emergency-room-beds` | MIT 패키지 | 개작 | 소아 응급실. `k-parent-source-emergency`와 비교 |
| `hwp` | 외부 `kordoc` | 차용에 가까움 | 가정통신문 HWP 읽기 → `k-parent-school-doc-capture` |
| `korean-spell-check`, `korean-character-count` | scripts만 | 차용에 가까움 | 수행평가·자기소개서 점검 |
| `kopis-performance-search`, `korean-heritage-search`, `foresttrip-vacancy` | 프록시/공개 화면 | 개작 | 놀거리·체험 계열 |
| 교통·쇼핑·일반 생활 | 다양 | 참고만 | 저장소 규칙상 upstream k-skill에 둔다 |

## 2. Anthropic 공식

| 후보 | 위치 | 라이선스 | 판정 | 쓰임 |
| --- | --- | --- | --- | --- |
| k12-check-for-understanding | `anthropics/k12-teacher-skills` (= `learning-commons-org/agent-skills`) | Apache-2.0, NOTICE 공동저작(Anthropic·Learning Commons) | 개작 | 오개념 기반 오답 보기 → `k-parent-quiz-maker` |
| k12-lesson-differentiation + `evals/` | 같은 저장소 | Apache-2.0 | 개작 | 하·중·상 3단계 학습지, 품질 평가 루브릭 |
| discernment-nudge | `anthropics/skills` | Apache-2.0 | 개작 | 마감·입학 정보 답한 뒤 공식 출처 재확인 유도 |
| pdf-viewer | `anthropics/knowledge-work-plugins` | Apache-2.0 | 개작 | 통신문·동의서 열람/양식. 서명·제출은 HITL 필수 |
| productivity (task/memory) | 같은 저장소 | Apache-2.0 | 개작 | 가족 할 일·준비물. 아이 식별정보 저장 금지로 수정 |
| cookbooks OCR·PDF 요약 | `anthropics/claude-cookbooks` | MIT | 개작 | 통신문 사진 → 날짜·준비물·마감 추출 |
| canvas-design, algorithmic-art | `anthropics/skills` | Apache-2.0 (폰트 별도 미확인) | 참고만 | 미술·코딩 놀이 |
| learning-output-style | `anthropics/claude-plugins-official` | Apache-2.0 | 참고만 | "답 대신 질문" 원칙 |
| skill-creator | `anthropics/skills` | Apache-2.0 | 개발 도구로만 | 저장소 스킬 제작·평가 |
| pdf / docx / pptx / xlsx | `anthropics/skills` | 독점(파생물 금지) | 불가 | 직접 새로 작성 |

## 3. OpenAI 공식

OpenAI에는 교육·가족 전용 스킬이 없다. `openai/skills`는 deprecated이고 `openai/plugins`로 옮겨 가는 중이다.

| 후보 | 위치 | 라이선스 | 판정 | 쓰임 |
| --- | --- | --- | --- | --- |
| Model Spec U18 원칙 | `openai/model_spec` | CC0-1.0 | 차용 | 아이 대상 응답 정책의 기준 문서 |
| Teen Safety Policy Pack | `openai/teen-safety-policy-pack` | Apache-2.0 + USAGE_POLICY | 개작 | 위험 분류 정책 + 검증 CSV → 한국어·초등 기준으로 회귀 테스트 |
| `pdf`, `transcribe` | `openai/skills/.curated` | Apache-2.0 | 개작 | 통신문 PDF, 상담 녹음 요약 |
| `define-goal` | 같은 곳 | Apache-2.0 | 개작 | 아이 학습 목표·방학 계획 |
| Apps SDK 예제 | `openai/openai-apps-sdk-examples` | MIT | 개작(나중) | ChatGPT 앱으로 낼 때 퀴즈·할 일 위젯 |
| Study mode | 공식 발표만, 프롬프트 비공개 | 없음 | 참고만 | 원칙만 다시 쓴다. 원문 복제 금지 |
| 보호자 통제, Teen Safety Blueprint | help.openai.com, PDF | 없음 | 참고만 | 조용한 시간, 메모리 끄기, 알림에 대화 원문 미포함 |

U18 원칙은 13~17세 대상이다. 초등생 기준은 우리가 더 엄격하게 정해야 한다.

## 4. 해외 커뮤니티

| 후보 | 라이선스 | ★ / 최근 push | 판정 | 쓰임 |
| --- | --- | --- | --- | --- |
| [smashburger-dev/socratic-workshop](https://github.com/smashburger-dev/socratic-workshop) | MIT | 22 / 2026-10-20 | 개작 | 초등 숙제 코치: 질문 하나 → 작은 힌트 → 다시 설명 |
| [yarikleto/claude-teacher-plugin](https://github.com/yarikleto/claude-teacher-plugin) | MIT | 14 / 2026-09-21 | 개작 | 오개념 추적 구조(불투명 참조로 변경) |
| [serenakeyitan/open-exam-skills](https://github.com/serenakeyitan/open-exam-skills) | MIT | 161 / 2026-02-02 | 개작 | 플래시카드·퀴즈 형식 |
| [riverventures/peer-reviewed-parent](https://github.com/riverventures/peer-reviewed-parent) | MIT | 3 / 2026-03-30 | 개작 | 근거 등급(합의/논쟁/폐기) 패턴 → 국내 공식 출처로 |
| [libohan-ha/fsrs-review](https://github.com/libohan-ha/fsrs-review) | MIT | 0 / 2026-09-11 | 참고만 | 대화형 간격 반복 |
| [Gonzih/screen-time-mcp](https://github.com/Gonzih/screen-time-mcp) | MIT | 0 / 2026-03-22 | 참고만 | 아이 AI 사용시간 정책 |
| [Lahari99-cloud/paga-eval](https://github.com/Lahari99-cloud/paga-eval) | MIT | 0 / 2026-06-29 | 참고만 | 읽기 코치: 발달상 정상 패턴은 고치지 않음 |
| [ChatPRD/tradclaw](https://github.com/ChatPRD/tradclaw) | 없음 | 332 / 2026-04-15 | 불가 | 가정 운영 구상이 가장 비슷. 아이디어만 |
| [GarethManning/education-agent-skills](https://github.com/GarethManning/education-agent-skills) | CC BY-SA 4.0 | 916 / 2026-10-22 | 참고만 | 동일조건 의무 때문에 MIT 저장소에 섞지 않음 |

대형 어그리게이터(VoltAgent, ComposioHQ, travisvn awesome 목록)에는 부모·아이 카테고리가 사실상 없다.

## 5. 직접 만들 공백 영역

1. 가정통신문·알림장 사진/PDF/HWP → 마감·준비물·비용 → 캘린더 후보 (기존 `k-parent-school-doc-capture` 강화)
2. 연령·학년별 발달·검진 시기 안내 + 공식 출처·확인 날짜
3. 부모용 "병원/응급실에 가야 하나" 선별 안내 (진단·용량 계산 없음)
4. 아이가 에이전트를 직접 쓸 때의 안전 경계 (대화 필터, 개인정보 차단, 원문 없는 부모 리포트)
5. 아이 학습 데이터를 남기지 않는 간격 반복 (메모리 정책 준수)
6. 연령 적합성 검사가 있는 잠자리 동화·창작 놀이
7. 가족 일정·집안일·용돈
8. 성취기준 기반 "부모가 집에서 쓰는 지도" (교사용 자료를 부모용으로)

## 확인하지 못한 것

- k-skill 공개 프록시를 제3자가 써도 되는지에 대한 약관
- Anthropic `canvas-fonts` 폰트별 라이선스, `doc-coauthoring` 라이선스(근거 없음)
- openai.com 일부 페이지(403)와 Study mode 공식 프롬프트
- skills.sh, CaseMark/skills 라이선스. GitHub 코드 검색 한도로 일부 키워드 누락 가능
