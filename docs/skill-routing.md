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
| "근처 유치원 비교", "국공립 모집 언제", "어린이집 방과후" | `k-parent-kindergarten-info` | 학교 |
| "아이랑 갈 만한 곳", "주말 실내 놀이터", "근처 어린이공원" | `k-parent-play-finder` | 놀이 |
| "이번 주말 가족 축제", "다음 달 동네 행사" | `k-parent-festival-finder` | 놀이 |
| "백화점 문화센터 강좌", "도서관 프로그램 신청" | `k-parent-culture-center-events` | 놀이 |
| "아이랑 1박2일 여행", "가족 여행 코스" | `k-parent-travel-recommender` | 놀이 |
| "차에서 들려줄 거", "교과 연계 영상", "대화 주제" | `k-parent-content-recommender` | 놀이 |
| "아동수당 자격", "부모급여 신청 서류", "아이돌봄 마감" | `k-parent-application-helper` | 생활 |
| "자녀 일정 정리", "가족 캘린더", "ICS로 내보내기" | `k-parent-schedule-manager` | 생활 |
| "학원 휴강/보강", "학원 숙제·시험 정리" | `k-parent-academy-connector` | 학원 |
| "초등 입학 준비물", "교재 가격 비교", "장난감 추천" | `k-parent-shopping-recommender` | 쇼핑 |
| "예방접종 일반 정보", "입학 전 준비", 분류 안 되는 질문 | `k-parent-knowledge-helper` | 생활 |
| 여러 소스 데이터 수집·정규화(내부) | `k-parent-data-collector` | 트렌드 |
| 모바일 부모 에이전트 설계·라우팅 | `k-parent-mobile-agent` | 생활 |

## 보조 예제 스킬

아래 스킬은 `examples/`에 있는 상속 예제지만, 기본 hosted proxy를 경유해 사용자 API key 없이 바로 쓸 수 있는 생활 정보 라우팅 후보로 유지한다. parent 제품 스킬과 겹치면 제품 스킬을 우선하고, 사용자가 특정 표면이나 결과 형식을 말하면 아래 예제를 직접 선택한다.

| 사용자 신호 | 스킬 | 선택 기준 |
| --- | --- | --- |
| "블루리본 맛집", "근처 맛집", "리본 받은 식당" | `blue-ribbon-nearby` | 위치를 먼저 묻고 블루리본 기준 근처 식당만 찾을 때 |
| "근처 공영주차장", "주차장 찾아줘" | `parking-lot-search` | 현재 위치를 먼저 묻고 공영주차장 후보와 요금/운영시간을 정리할 때 |
| "네이버 쇼핑 가격", "상품 가격비교" | `naver-shopping-search` | 쇼핑 가격 후보를 네이버 쇼핑 검색 기반으로 비교할 때 |
| "네이버 뉴스", "최신 기사", "최근 뉴스 링크" | `naver-news-search` | 뉴스 검색어를 받아 기사 제목·요약·발행시각·링크를 정리할 때 |
| "LH 청약 공고", "임대주택 공고", "분양 공고" | `lh-notice-search` | LH 청약 공고 목록/상세를 공고 상태와 지역 조건으로 확인할 때 |

## 겹침 해소 규칙 (놀이 계열)

데이터 소스가 겹치는 4개는 아래 기준으로 분기한다.

- **상시·근거리 놀거리/실내외 장소** → `k-parent-play-finder` (날짜 없음, 위치·날씨 기준)
- **시작·종료일이 있는 명명된 축제·행사** → `k-parent-festival-finder`
- **1박 이상·타지역 여행 코스** → `k-parent-travel-recommender`
- **접수기간이 있는 강좌·체험·예약형 프로그램** → `k-parent-culture-center-events`

판단이 애매하면 사용자에게 "당일 vs 여행", "상시 vs 접수형"을 되물어 분기한다.

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
| "준비물 사기" | `k-parent-shopping-recommender` |
| "여행지 추천" | `k-parent-travel-recommender` |

쓰기(캘린더 등록·신청·예약·취소·결제·아이 개인정보 입력)는 항상 사용자 확인 후 실행한다.
