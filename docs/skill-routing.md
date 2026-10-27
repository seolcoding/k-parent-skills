# 스킬 라우팅 인덱스

부모 질의를 어떤 `k-parent-*` 스킬로 보낼지 정리한 표다. 에이전트가 스킬을 고를 때, 그리고
`k-parent-mobile-agent`가 복합 명령을 분해할 때 근거로 쓴다. 각 스킬의 1차 신호는 `SKILL.md`
frontmatter `description`이며, 이 문서는 겹침 해소 규칙을 한곳에 모은다.

## 질의 → 스킬

| 부모 질의 예시 | 스킬 | 디파트먼트 |
| --- | --- | --- |
| "이번 주 급식 뭐야", "알레르기 빼고 식단" | `k-parent-meal-planner` | 영양 |
| "이번 달 학교 일정", "○○초 공지", "방과후 언제까지" | `k-parent-school-info` | 학교 |
| "가정통신문 사진 정리", "알림장 일정 캘린더로" | `k-parent-school-doc-capture` | 학교 |
| "오늘 배운 거 퀴즈 내줘", "복습 문제 만들어줘" | `k-parent-quiz-maker` | 학교 |
| "4학년 지역 문화유산 단원 체험", "고려 시대 배우는데 관련 전시", "독립운동 단원 박물관 교육" | `k-parent-field-trip` | 학교 |
| "근처 유치원 비교", "국공립 모집 언제", "어린이집 방과후" | `k-parent-kindergarten-info` | 학교 |
| "아이랑 갈 만한 곳", "주말 실내 놀이터", "근처 어린이공원" | `k-parent-play-finder` | 놀이 |
| "이번 주말 가족 축제", "다음 달 동네 행사" | `k-parent-festival-finder` | 놀이 |
| "백화점 문화센터 강좌", "도서관 프로그램 신청" | `k-parent-culture-center-events` | 놀이 |
| "아이랑 1박2일 여행", "가족 여행 코스" | `k-parent-travel-recommender` | 놀이 |
| "차에서 들려줄 거", "교과 연계 영상", "대화 주제" | `k-parent-content-recommender` | 놀이 |
| "아동수당 자격", "부모급여 신청 서류", "아이돌봄 마감" | `k-parent-application-helper` | 생활 |
| "자녀 일정 정리", "가족 캘린더", "ICS로 내보내기" | `k-parent-schedule-manager` | 생활 |
| "학원 휴강/보강", "학원 숙제·시험 정리", "동네 영어학원 신고 교습비", "교육청 등록 학원이야" | `k-parent-academy-connector` | 학원 |
| "초등 입학 준비물", "교재 가격 비교", "장난감 추천" | `k-parent-shopping-recommender` | 쇼핑 |
| "오늘 놀이터 가도 돼", "등원할 때 우산 챙겨야 해", "미세먼지 괜찮아" | `k-parent-outdoor-check` | 생활 |
| "어린이 해열제 주의사항", "먹은 과자 회수됐어", "밤에 문 연 소아 응급실" | `k-parent-child-health` | 생활 |
| "구름빵 동네 도서관에 있어", "2학년 공룡 책", "이 책 대출 가능한 곳" | `k-parent-library-finder` | 놀이 |
| "다음 달 공휴일이랑 겹치는 일정" | `k-parent-schedule-manager` | 생활 |
| "예방접종 일반 정보", "입학 전 준비", 분류 안 되는 질문 | `k-parent-knowledge-helper` | 생활 |
| 여러 소스 데이터 수집·정규화(내부) | `k-parent-data-collector` | 트렌드 |
| 모바일 부모 에이전트 설계·라우팅 | `k-parent-mobile-agent` | 생활 |
| "K-Parent 설치 확인", "NEIS 키 설정", "fixture 모드 점검" | `k-parent-setup` | 공통 환경·시크릿 파일 권한 진단 |

## 겹침 해소 규칙 (놀이 계열)

데이터 소스가 겹치는 4개는 아래 기준으로 분기한다.

- **상시·근거리 놀거리/실내외 장소** → `k-parent-play-finder` (날짜 없음, 위치·날씨 기준)
- **시작·종료일이 있는 명명된 축제·행사** → `k-parent-festival-finder`
- **1박 이상·타지역 여행 코스** → `k-parent-travel-recommender`
- **접수기간이 있는 강좌·체험·예약형 프로그램** → `k-parent-culture-center-events`

판단이 애매하면 사용자에게 "당일 vs 여행", "상시 vs 접수형"을 되물어 분기한다.

## 겹침 해소 규칙 (k-skill 개작 계열)

- **밖에 나가도 되나(공기질·날씨)** → `k-parent-outdoor-check`. 실내 대안 장소가 필요하면 이어서 `k-parent-play-finder`.
- **아이 약·식품 안전, 야간·휴일 진료 경로** → `k-parent-child-health`. 예방접종·발달 같은 일반 육아 지식은 `k-parent-knowledge-helper`. 위험 신호가 보이면 어떤 스킬에서든 119·응급실 안내를 먼저 한다.
- **배우는 단원과 이어지는 체험** → `k-parent-field-trip`. 단원과 무관한 놀거리는 `k-parent-play-finder`, 날짜가 박힌 축제는 `k-parent-festival-finder`.
- **책 소장·대출** → `k-parent-library-finder`. 도서관 강좌·프로그램 신청은 `k-parent-culture-center-events`.
- **급식** → `k-parent-meal-planner` (키 없으면 k-skill 공개 프록시 경로). 학사일정·재량휴업일은 `k-parent-school-info`, 공휴일 겹침은 `k-parent-schedule-manager`.

## 공통 출력 신호

스킬을 고른 뒤 결과를 만들 때는 부모가 바로 의사결정할 수 있도록 아래 신호를 우선 확인한다.

- 아이 나이/학년, 지역, 날짜 범위
- 출처 URL과 확인 기준일
- 신청/예약 마감, 비용, 필요 서류
- 예약·신청 가능 여부와 다음 확인 단계

## 복합 명령 분해 (mobile-agent)

| 명령 | 호출 스킬 |
| --- | --- |
| "이번 주 챙길 것" | `k-parent-brief` + `k-parent-school-info` + `k-parent-application-helper` |
| "주말 갈 곳" | `k-parent-play-finder` / `k-parent-festival-finder` / `k-parent-travel-recommender` |
| "학교 일정 정리" | `k-parent-school-info` + `k-parent-school-doc-capture` |
| "학원 숙제 확인" | `k-parent-academy-connector` |
| "오늘 복습 시켜줘" | `k-parent-quiz-maker` |
| "준비물 사기" | `k-parent-shopping-recommender` |
| "여행지 추천" | `k-parent-travel-recommender` |

쓰기(캘린더 등록·신청·예약·취소·결제·아이 개인정보 입력)는 항상 사용자 확인 후 실행한다.
