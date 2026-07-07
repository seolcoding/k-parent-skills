---
name: k-parent-play-finder
description: 대한민국 부모를 위한 아이 놀거리·실내외 놀이 장소 추천 스킬. packages/k-parent-source-playground와 packages/k-parent-source-tourapi를 결합해 연령·날씨·이동거리에 맞는 놀이 장소를 찾고 비용/연령대/주차 정보를 정리한다. "아이랑 갈 만한 곳", "주말 실내 놀이터", "근처 어린이공원", "비 오는 날 아이랑" 같은 요청에 사용. 날짜가 박힌 축제는 k-parent-festival-finder, 1박 이상·타지역 코스는 k-parent-travel-recommender, 접수형 강좌는 k-parent-culture-center-events.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: p0
---

# 아이 놀거리 찾기

아이와 함께 갈 놀이 장소(놀이터, 도시공원, 어린이 관광지/문화시설/레포츠)를 찾아 부모가 바로 결정할 수 있게 정리하는 스킬.

## 데이터 소스

- `packages/k-parent-source-playground`
  - `fetchPlaygrounds({ sido, sigungu })` → 행안부 어린이놀이시설 `{ name, address, latitude, longitude, facilities }`
  - `fetchUrbanParks({ sido, sigungu })` → 전국도시공원표준데이터 `{ name, address, latitude, longitude, facilities }`
- `packages/k-parent-source-tourapi`
  - `areaBasedList({ areaCode, sigunguCode, contentTypeId })` → 지역 기반 장소 (contentTypeId: 12 관광지, 14 문화시설, 28 레포츠)
  - `locationBasedList({ mapX, mapY, radius })` → 좌표 반경 내 주변 장소 (radius 단위: m)

환경변수: `KSKILL_DATAGOKR_KEY` (놀이시설/공원), `KSKILL_TOURAPI_KEY` (TourAPI). 키가 없으면 함수가 `status: missing_config` 에러를 던진다.

## 데이터 계약

- TourAPI 응답은 `response.body.items.item` 형태이며 **배열 또는 단일 객체** 모두 올 수 있다 → 패키지의 `extractItems`가 두 경우를 모두 처리.
- 모든 장소는 `normalizeInstitution` 형태(`name/address/latitude/longitude/source`)로 정규화되어 반환된다.
- 좌표(위경도)는 숫자 또는 null. 주소는 `addr1+addr2` / `도로명+지번` 결합.

## 신선도

- 각 결과의 `source.freshness.status`를 확인한다(`fresh`/`stale`/`unknown`).
- `stale`이면 사용자에게 "데이터가 최신이 아닐 수 있다"고 알리고 공식 페이지 확인을 권한다.
- 기본 `maxAgeHours`는 24h. 운영시간·휴무·요금은 변동이 잦으므로 항상 공식 출처 확인을 안내.

## 전형적 흐름

1. 위치 파악: 사용자가 좌표(현재 위치)를 주면 `locationBasedList({ mapX, mapY, radius })`로 주변 우선 탐색. 지역명만 주면 `areaCode`로 `areaBasedList`.
2. 카테고리 결합:
   - 실외/공원: `fetchUrbanParks` + `fetchPlaygrounds`
   - 실내/문화시설: `areaBasedList({ contentTypeId: 14 })`
   - 체험/레포츠: `areaBasedList({ contentTypeId: 28 })`
3. 필터 (스킬 레이어에서 수행, 데이터에 직접 필드가 없을 수 있음):
   - **연령**: 놀이시설 facilities(미끄럼틀/모래놀이 등) 및 시설 유형으로 영유아/유아/초등 적합도 추정. 단정하지 말고 "추정"임을 표기.
   - **날씨**: 비/미세먼지 시 실내(문화시설) 우선. 날씨 데이터는 이 스킬 범위 밖이므로 사용자 입력 또는 별도 날씨 스킬과 조합. **추정 가정은 명시**.
   - **날짜/이동거리**: 거리 정렬은 `locationBasedList`의 `dist`(m) 활용.
4. 출력 정리 — 각 후보에 대해:
   - **비용**: 공식 데이터에 요금 필드가 없으면 "요금 확인 필요(공식 페이지)"로 표기, 임의 금액 생성 금지.
   - **연령대 적합도**: 추정 근거와 함께.
   - **주차**: 도시공원 facilities에 주차장 포함 여부, 없으면 "확인 필요".
   - 주소, 좌표/지도 링크, source.freshness.

## 출력 형식

- 아이 나이/학년과 대상 연령 추정
- 지역, 장소, 이동거리, 실내/실외
- 방문 날짜/시간대와 확인 기준일
- 공식 출처 URL, source freshness, 수집 시각
- 비용, 준비물, 주차/교통, 안전 확인 항목
- 예약/신청 상태와 로그인/결제 필요 여부
- 부모의 다음 행동과 공식 최종 확인 링크

## 가드레일

- 이 스킬은 조회·추천만 수행한다.
- 예약/입장권 구매/신청은 실행하지 않는다. 필요한 경우 `normalizeActionCandidate`로 후보만 만들고 `requiresOfficialSiteHandoff`/`requiresConfirmation`를 사용자에게 노출, **명시적 승인** 없이 결제/신청/예약/취소를 진행하지 않는다.
- 아동 개인정보(생년월일, 주민번호 등)를 입력·저장하지 않는다.

## 관련 문서

- `docs/features/k-parent-play-finder.md`
