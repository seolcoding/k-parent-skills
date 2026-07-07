---
name: k-parent-mobile-agent
description: 모바일에서 쓰는 서버 배포형 부모 에이전트의 제품·라우팅 설계 스킬. 사용자 명령을 적절한 k-parent 스킬로 라우팅하고 packages/k-parent-brief로 합성한다. "모바일 부모 에이전트 설계해줘", "서버 배포형 부모 비서 구조 잡아줘" 같은 제품/아키텍처 작업에 사용. 단일 도메인 조회는 개별 스킬을 직접 쓴다.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: concept
---

# 모바일 부모 에이전트

## 핵심 동작

일반 사용자가 모바일에서 접속해 자녀 일정, 학교/학원 정보, 추천, 리마인더를 에이전틱하게 사용할 수 있는 서버 배포형 제품 표면을 정의한다.

## 사용 시점

- "모바일에서 부모가 바로 쓰게 하고 싶어"
- "일반 사용자도 에이전트처럼 쓸 수 있게 해줘"
- "오늘 자녀 일정과 챙길 것을 보여줘"
- "주말 갈 곳 추천하고 캘린더에 넣어줘"

## 전형적 흐름

### 1. 부모 세션 모델링

- 보호자 계정
- 자녀 프로필
- 학교, 학년, 학원, 지역
- 가족 캘린더 연결 여부
- 알림 선호

### 2. 명령 라우팅

에이전틱 명령을 적절한 스킬로 라우팅한다. 전체 매핑은 `docs/skill-routing.md`를 따른다.

| 명령 | 호출 스킬 |
| --- | --- |
| "이번 주 챙길 것" | `packages/k-parent-brief` + `k-parent-school-info` + `k-parent-application-helper` |
| "주말 갈 곳" | `k-parent-play-finder` / `k-parent-festival-finder` / `k-parent-travel-recommender` |
| "학교 일정 정리" | `k-parent-school-info` + `k-parent-school-doc-capture` |
| "학원 숙제 확인" | `k-parent-academy-connector` |
| "준비물 사기" | `k-parent-shopping-recommender` |
| "여행지 추천" | `k-parent-travel-recommender` |

### 3. 모바일 홈 표시

첫 화면은 설명보다 실행 가능한 정보를 보여준다.

- 오늘 자녀 일정
- 학교 시간표와 공지
- 학원 일정/숙제
- 마감 임박 신청/준비물
- 지역 행사/체험 추천
- 에이전틱 명령 입력창

### 3. 확인 우선 행동 유지

캘린더 쓰기, 신청, 예약, 메시지 전송, 구매는 후보를 먼저 만들고 사용자 확인 후 실행한다.

## 출력 형식

- 선택된 아이 나이/학년과 프로필 범위
- 지역, 학교/학원/기관, 관심사
- 오늘/이번 주 날짜 범위와 확인 기준일
- 데이터 출처 URL, source freshness, 수집/갱신 시각
- 일정, 마감일, 비용, 준비물, 필요 서류
- 신청/예약/구매/캘린더 후보 상태와 사용자 확인 필요 여부
- 추천 이유와 confidence/review-needed flag
- 부모의 다음 행동

## 완료 조건

- 모바일 사용자가 오늘 할 일을 이해할 수 있다.
- 데이터 출처와 갱신 시각이 보인다.
- 에이전트가 제안한 쓰기 작업은 확인 전 실행되지 않는다.

## 참고

- 서버 배포와 일반 사용자 접근성을 제품 코어로 둔다.
- 로컬 개발자 스킬만으로 끝내지 않는다.

## 관련 문서

- `docs/features/k-parent-mobile-agent.md`
