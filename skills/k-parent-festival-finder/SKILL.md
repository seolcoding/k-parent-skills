---
name: k-parent-festival-finder
description: 대한민국 부모를 위한 가족 축제·행사 찾기 스킬. packages/k-parent-source-tourapi의 searchFestival로 날짜·지역 기준 축제를 검색하고, 가족(아이) 동반 적합도를 정리해 추천한다. "이번 주말 가족 축제", "다음 달 우리 동네 행사", "아이랑 갈 만한 봄 축제" 같은 요청에 사용. 시작·종료일이 있는 명명된 축제·행사 전용이며, 상시 놀거리·실내 장소는 k-parent-play-finder, 여행 코스는 k-parent-travel-recommender.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: p0
---

# 가족 축제 찾기

날짜와 지역으로 진행 중/예정 축제를 찾아, 아이 동반 가족 관점에서 정리해 추천하는 스킬.

## 데이터 소스

- `packages/k-parent-source-tourapi`
  - `searchFestival({ eventStartDate, eventEndDate, areaCode, sigunguCode })` → `/searchFestival2`
  - 반환 항목: `{ contentId, title, addr, startDate, endDate, image, mapx, mapy, tel, areaCode }`

환경변수: `KSKILL_TOURAPI_KEY` (data.go.kr serviceKey). 없으면 `status: missing_config` 에러.

## 데이터 계약

- 응답 봉투: `response.body.items.item` — **배열 또는 단일 객체** 모두 처리(`extractItems`).
- 날짜는 `YYYYMMDD` → `YYYY-MM-DD`로 정규화(`startDate`/`endDate`).
- `eventStartDate`는 `YYYYMMDD` 형식 필수. 누락 시 함수가 에러를 던진다.
- `areaCode`는 TourAPI 지역코드(예: 1=서울). 시군구는 `sigunguCode`.

## 신선도

- 각 축제의 `source.freshness.status` 확인. `stale`이면 일정 변동 가능성을 안내.
- 축제 일정/운영은 변동이 잦으므로 결과에 항상 공식 출처(주최/관광공사) 확인 안내 포함.

## 전형적 흐름

1. 기간 결정: 사용자가 "이번 주말/다음 달" 등으로 말하면 오늘 날짜(시스템 제공) 기준으로 `eventStartDate`(YYYYMMDD) 계산. 종료일 필터가 필요하면 `eventEndDate`.
2. 지역 결정: 지역명 → `areaCode` 매핑(필요 시 사용자 확인). 전국이면 areaCode 생략 후 결과를 지역별로 묶음.
3. `searchFestival(...)` 호출(키 없으면 오프라인 불가 → 사용자에게 키 발급 안내).
4. **가족 적합도(family suitability)** 정리 — 각 축제에 대해:
   - 제목/주소/카테고리로 아이 동반 적합도 추정(예: "어린이/가족/체험" 키워드). 단정하지 말고 추정 표기.
   - 기간(startDate~endDate)과 현재 날짜 비교해 진행중/예정/종료 표시.
   - 위치(mapx/mapy)와 주소, 연락처(tel), 대표 이미지.
   - 비용/입장료는 데이터에 없으면 "확인 필요(공식)", 임의 생성 금지.
5. 정렬: 시작일 임박 순 또는 거리(좌표) 순.

## 출력 형식

- 아이 나이/학년과 대상 연령 추정
- 지역, 장소, 이동거리
- 축제 기간, 방문 후보 날짜, 마감/예약 필요 여부, 확인 기준일
- 공식 출처 URL, source freshness, 수집 시각
- 비용, 준비물, 주차/교통, 필요 서류
- 예약/신청 상태와 로그인/결제 필요 여부
- 부모의 다음 행동과 공식 최종 확인 링크

## 가드레일

- 조회·추천만 수행. 예매/티켓 구매/신청은 실행하지 않는다.
- 결제·신청·예약·취소는 `normalizeActionCandidate` 후보로만 제시하고 **명시적 승인** 후 공식 사이트로 핸드오프.
- 아동 개인정보를 입력·저장하지 않는다.

## 관련 문서

- `docs/features/k-parent-festival-finder.md`
