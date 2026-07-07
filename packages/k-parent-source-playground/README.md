# k-parent-source-playground

행안부 어린이놀이시설 + 전국도시공원표준데이터 (data.go.kr) 어댑터.

## Functions

- `fetchPlaygrounds({ sido?, sigungu? })` — 어린이놀이시설 목록 → `{ name, address, latitude, longitude, facilities }`.
- `fetchUrbanParks({ sido?, sigungu? })` — 전국도시공원 표준데이터 → `{ name, address, latitude, longitude, facilities }`.

모든 함수는 `options.payload`를 받으면 HTTP 호출을 건너뜁니다(오프라인 테스트용).

## Usage

```js
const { fetchPlaygrounds, fetchUrbanParks } = require("k-parent-source-playground");
const playgroundPayload = require("./test/fixtures/playgrounds.json");
const urbanParkPayload = require("./test/fixtures/urban-parks.json");

async function main() {
  const playgrounds = await fetchPlaygrounds({ sido: "서울특별시", sigungu: "강남구", payload: playgroundPayload });
  const parks = await fetchUrbanParks({ sido: "서울특별시", sigungu: "강남구", payload: urbanParkPayload });
  return { playgrounds, parks };
}

main().then(console.log).catch(console.error);
```

## Configuration

- Env: `KSKILL_DATAGOKR_KEY` (data.go.kr serviceKey). `options.apiKey`로도 전달 가능.
- BASE: `http://apis.data.go.kr`

## Uncertain service paths (verify before live use)

data.go.kr의 데이터셋마다 service id / endpoint path / 파라미터명이 버전별로 다릅니다.
`src/index.js`에 명시된 다음 상수는 **활용신청한 서비스의 상세 페이지(참고문서/엔드포인트)에서 반드시 확인**하세요:

- `PLAYGROUND_PATH = "/B551014/SRVC_TODZ_PLAYGRND/todz_playgrnd"` (행안부 어린이놀이시설)
- `URBAN_PARK_PATH = "/15012890/v1/uddi:urban-park-standard"` (전국도시공원표준데이터)

파라미터명도 버전에 따라 다르므로, `parse.js`의 `pick()`은 여러 후보 키
(`pfctNm`/`facltNm`/`name`, `ronaAddr`/`rdnmadr`/`address`, `latitude`/`la`/`lat` 등)를 폭넓게 매핑합니다.

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

테스트는 `test/fixtures/`의 목 응답으로 완전히 오프라인 실행됩니다.

## Fixtures refresh

Run this command only when you are ready to call the live API and overwrite local fixtures.

```bash
KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures
```
