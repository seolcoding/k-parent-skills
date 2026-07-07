---
name: k-parent-travel-recommender
description: 대한민국 부모를 위한 아이 동반 여행지 추천 스킬. packages/k-parent-source-tourapi의 지역기반(areaBasedList)·위치기반(locationBasedList)으로 아이와 가기 좋은 관광지·문화시설·레포츠를 모아 가족 여행 코스를 제안한다. "아이랑 1박2일 여행", "가족 여행지 추천", "근처 아이랑 갈 코스" 같은 요청에 사용. 1박 이상·타지역 여행 코스 전용이며, 당일 근처 놀거리는 k-parent-play-finder, 날짜 있는 축제는 k-parent-festival-finder.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: p0
---

# 아이 동반 여행 추천

아이 동반 가족 여행지/코스를 한국관광공사 데이터로 모아 추천하는 스킬.

## 데이터 소스

- `packages/k-parent-source-tourapi`
  - `areaBasedList({ areaCode, sigunguCode, contentTypeId })` → 지역 기반 장소
    - contentTypeId: 12 관광지, 14 문화시설, 28 레포츠 (가족형 코스 구성에 조합)
  - `locationBasedList({ mapX, mapY, radius })` → 좌표 반경(m) 내 주변 장소, `dist`로 거리 정렬
  - (선택) `searchFestival(...)`로 여행 기간 중 축제를 코스에 끼워넣기

환경변수: `KSKILL_TOURAPI_KEY`. 없으면 `status: missing_config` 에러.

## 데이터 계약

- 봉투: `response.body.items.item` — **배열 또는 단일 객체** 모두 처리(`extractItems`).
- 각 장소는 `normalizeInstitution`(`name/address/latitude/longitude/source`)으로 정규화 + `contentTypeId/image/tel/dist/cat1~3`.

## 신선도

- `source.freshness.status` 확인, `stale`이면 운영시간/요금 변동 가능 안내.
- 여행 코스 출력에 항상 "공식 페이지에서 운영시간·휴무·요금 최종 확인" 문구 포함.

## 전형적 흐름

1. 목적지/반경 파악:
   - 지역명만 있으면 `areaBasedList`로 지역 전체 후보 수집.
   - 숙소 좌표/거점이 있으면 `locationBasedList({ mapX, mapY, radius })`로 거점 주변 코스.
2. 코스 구성: contentTypeId를 조합해 하루 동선을 만든다(예: 오전 관광지 12 → 점심 인근 → 오후 문화시설 14 또는 레포츠 28). 거리(`dist`/좌표)로 동선 최적화.
3. 아이 친화 필터(추정): 제목/카테고리(cat)로 어린이·가족 적합도 추정, 단정 금지. 영유아/유아/초등 등 연령 가정은 명시.
4. 기간(1박2일 등) 동안의 축제가 있으면 `searchFestival`로 보강.
5. 출력: 코스별로 장소명·주소·좌표/지도·예상 동선·연락처·대표 이미지. **비용/입장료는 데이터에 없으면 "확인 필요(공식)"**, 임의 금액 생성 금지. 각 항목에 freshness 표시.

## 출력 형식

- 아이 나이/학년과 대상 연령 추정
- 지역, 장소, 이동거리, 여행 기간
- 방문 날짜/시간대와 확인 기준일
- 공식 출처 URL, source freshness, 수집 시각
- 비용, 준비물, 주차/교통, 숙박/예약 확인 항목
- 예약/신청 상태와 로그인/결제 필요 여부
- 부모의 다음 행동과 공식 최종 확인 링크

## 가드레일

- 조회·추천만 수행. 숙소/입장권 예약·결제·신청은 실행하지 않는다.
- 예약/결제/신청/취소는 `normalizeActionCandidate` 후보로만 제시하고 **명시적 승인** 후 공식 사이트 핸드오프(`requiresOfficialSiteHandoff`).
- 아동 개인정보를 입력·저장하지 않는다.

## 관련 문서

- `docs/features/k-parent-travel-recommender.md`
