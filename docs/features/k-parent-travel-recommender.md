# 아이 동반 여행 추천 기능 문서

아이 동반 가족 여행지/코스를 한국관광공사 데이터로 모아 추천하는 스킬.

## 목적

- TourAPI 지역기반/위치기반 데이터를 조합해 가족 여행 코스(관광지·문화시설·레포츠)를 제안한다.
- 조회·추천만 수행하고 숙소/입장권 예약은 승인 후 공식 사이트로 핸드오프한다.

## 사용 패키지

| 패키지 | 함수 | 출력 |
| --- | --- | --- |
| `packages/k-parent-source-tourapi` | `areaBasedList({ areaCode, sigunguCode, contentTypeId })` | 지역 기반 장소 (12/14/28) |
| `packages/k-parent-source-tourapi` | `locationBasedList({ mapX, mapY, radius })` | 좌표 반경(m) 내 주변 장소, `dist` 포함 |
| `packages/k-parent-source-tourapi` | `searchFestival(...)` (선택) | 여행 기간 중 축제 보강 |

## 환경변수

- `KSKILL_TOURAPI_KEY` — data.go.kr serviceKey. 누락 시 `status: missing_config`.

## 데이터 계약

- 봉투 `response.body.items.item` — 배열/단일 객체 모두 처리(`extractItems`).
- 장소는 `normalizeInstitution`(`name/address/latitude/longitude/source`) + `contentTypeId/image/tel/dist/cat1~3`.
- 각 결과는 `source.freshness` 포함(기본 maxAge 24h).

## 코스 구성 로직 (스킬 레이어)

- 지역명 → `areaBasedList`, 거점 좌표 → `locationBasedList`로 주변 동선 구성.
- contentTypeId 조합으로 하루 동선(오전 관광지 12 → 오후 문화시설 14/레포츠 28). 거리(`dist`/좌표)로 동선 최적화.
- 아이 친화 적합도는 제목/cat로 **추정**(단정 금지), 연령 가정 명시.
- 기간 중 축제는 `searchFestival`로 보강.

## 출력 항목

- 코스별 장소명·주소·좌표/지도·예상 동선·연락처·대표 이미지.
- 비용/입장료는 데이터에 없으면 "확인 필요(공식)" — 임의 금액 생성 금지.
- 각 항목 freshness 표시 및 공식 운영시간/요금 확인 안내.

## 가드레일

- 조회·추천 전용. 예약/결제/신청/취소는 `normalizeActionCandidate` 후보로만 제시 후 명시적 승인 → 공식 사이트 핸드오프(`requiresOfficialSiteHandoff`).
- 아동 개인정보 입력·저장 금지.

## 픽스처 갱신

```
KSKILL_TOURAPI_KEY=... npm run refresh:fixtures --workspace k-parent-source-tourapi
```

## 남은 확장 후보

- 무장애·수유실·공중화장실·역 편의시설 source 보강
- 숙박/교통 예약 후보는 공식 사이트 handoff만 제공하는 가드레일 확장
- 다일정 코스의 이동시간·휴식시간·아이 연령대 적합도 점수화
