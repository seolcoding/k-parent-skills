# 아이 놀거리 찾기 기능 문서

아이와 함께 갈 놀이 장소(어린이놀이시설, 도시공원, 어린이 관광지/문화시설/레포츠)를 찾아 부모가 바로 결정할 수 있도록 정리하는 스킬.

## 목적

- 연령·날씨·이동거리에 맞는 놀이 장소 후보를 모아 비용/연령대/주차 정보와 함께 제시한다.
- 조회·추천만 수행하고 예약/결제/신청은 사용자 승인 후 공식 사이트로 핸드오프한다.

## 사용 패키지

| 패키지 | 함수 | 출력 |
| --- | --- | --- |
| `packages/k-parent-source-playground` | `fetchPlaygrounds({ sido, sigungu })` | 어린이놀이시설 `{ name, address, latitude, longitude, facilities }` |
| `packages/k-parent-source-playground` | `fetchUrbanParks({ sido, sigungu })` | 도시공원 `{ name, address, latitude, longitude, facilities }` |
| `packages/k-parent-source-tourapi` | `areaBasedList({ areaCode, sigunguCode, contentTypeId })` | 지역 기반 장소 (12 관광지 / 14 문화시설 / 28 레포츠) |
| `packages/k-parent-source-tourapi` | `locationBasedList({ mapX, mapY, radius })` | 좌표 반경(m) 내 주변 장소, `dist` 포함 |

## 환경변수

- `KSKILL_DATAGOKR_KEY` — 행안부 어린이놀이시설 / 전국도시공원표준데이터 (data.go.kr serviceKey)
- `KSKILL_TOURAPI_KEY` — 한국관광공사 TourAPI 4.0 (data.go.kr serviceKey)

키 누락 시 함수는 `status: missing_config` 에러를 던진다. 오프라인 테스트는 `options.payload` 주입으로 가능.

## 데이터 계약

- TourAPI 봉투 `response.body.items.item`는 배열/단일 객체 모두 가능 → `extractItems`로 정규화.
- 장소는 `normalizeInstitution`(`name/address/latitude/longitude/source`) 형태. 좌표는 숫자 또는 null.
- 각 결과는 `source.freshness`(fresh/stale/unknown, 기본 maxAge 24h)를 포함.

## 필터 로직 (스킬 레이어)

- 연령: facilities/시설 유형으로 영유아·유아·초등 적합도 **추정**(단정 금지).
- 날씨: 비/미세먼지 시 실내(문화시설) 우선. 날씨 입력은 사용자/별도 스킬과 조합하고 가정은 명시.
- 거리: `locationBasedList`의 `dist`(m)로 정렬.

## 출력 항목

- 비용(데이터에 없으면 "확인 필요(공식)" — 임의 금액 생성 금지)
- 연령대 적합도(추정 근거 포함)
- 주차(도시공원 facilities 기준, 불명확 시 "확인 필요")
- 주소, 좌표/지도, freshness 상태

## 가드레일

- 조회·추천 전용. 예약/입장권 구매/신청은 `normalizeActionCandidate` 후보로만 제시, `requiresConfirmation`/`requiresOfficialSiteHandoff`를 사용자에게 노출하고 명시적 승인 후 진행.
- 아동 개인정보(생년월일/주민번호 등) 입력·저장 금지.

## 픽스처 갱신

```
KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures --workspace k-parent-source-playground
KSKILL_TOURAPI_KEY=... npm run refresh:fixtures --workspace k-parent-source-tourapi
```

## 남은 확장 후보

- 실내 키즈카페/박물관/체험관 source package 분리
- 날씨·미세먼지·주차 가능성 기반 후보 재정렬
- 유모차/수유실/화장실 같은 영유아 편의시설 보강
