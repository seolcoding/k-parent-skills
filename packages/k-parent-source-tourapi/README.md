# k-parent-source-tourapi

한국관광공사 TourAPI 4.0 (`KorService2`, data.go.kr) 어댑터.

## Functions

- `searchFestival({ eventStartDate, eventEndDate?, areaCode?, sigunguCode? })` — `/searchFestival2` 행사/축제 검색.
- `areaBasedList({ areaCode, sigunguCode?, contentTypeId? })` — `/areaBasedList2` 지역 기반 관광지/문화시설/레포츠 목록 (contentTypeId 예: 12 관광지, 14 문화시설, 28 레포츠).
- `locationBasedList({ mapX, mapY, radius? })` — `/locationBasedList2` 좌표 반경 내 주변 관광지.

모든 함수는 `options.payload`를 받으면 HTTP 호출을 건너뜁니다(오프라인 테스트용).

## Usage

```js
const { searchFestival, areaBasedList, locationBasedList } = require("k-parent-source-tourapi");
const festivalPayload = require("./test/fixtures/festival.json");
const areaPayload = require("./test/fixtures/area-based.json");
const locationPayload = require("./test/fixtures/location-based.json");

async function main() {
  const festivals = await searchFestival({ eventStartDate: "20260601", areaCode: "1", payload: festivalPayload });
  const spots = await areaBasedList({ areaCode: "1", contentTypeId: "12", payload: areaPayload });
  const nearby = await locationBasedList({ mapX: "126.9780", mapY: "37.5665", radius: 1000, payload: locationPayload });
  return { festivals, spots, nearby };
}

main().then(console.log).catch(console.error);
```

## Configuration

- Env: `KSKILL_TOURAPI_KEY` (data.go.kr serviceKey). `options.apiKey`로도 전달 가능.
- BASE: `http://apis.data.go.kr/B551011/KorService2`
- 공통 파라미터: `MobileOS=ETC`, `MobileApp=k-parent`, `_type=json`, `serviceKey`.

## Response envelope

`response.body.items.item` — 배열 또는 단일 객체로 올 수 있으며 `extractItems`가 둘 다 처리합니다.

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

테스트는 `test/fixtures/`의 목 응답으로 완전히 오프라인 실행됩니다.

## Fixtures refresh

Run this command only when you are ready to call the live API and overwrite local fixtures.

```bash
KSKILL_TOURAPI_KEY=... npm run refresh:fixtures
```
