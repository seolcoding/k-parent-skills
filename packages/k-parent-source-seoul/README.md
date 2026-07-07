# k-parent-source-seoul

서울 열린데이터광장 공공서비스예약(OpenAPI) source adapter for k-parent-skill.

## Usage

```js
const {
  fetchReservations,
  parseReservations,
  RESERVATION_SERVICES,
} = require("k-parent-source-seoul");
```

`fetchReservations({ service, start, end })` calls
`http://openapi.seoul.go.kr:8088/{KEY}/json/{SERVICE}/{START}/{END}/`.

Supported services (`RESERVATION_SERVICES`):

- `ListPublicReservationCulture` — 문화/체험 강좌
- `ListPublicReservationEducation` — 교육 프로그램
- `ListPublicReservationSport` — 체육 강습

## Configuration

- `KSKILL_SEOUL_KEY` — 서울 열린데이터광장 인증키 (https://data.seoul.go.kr).

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

Tests run fully offline from `test/fixtures/`.

## Fixtures refresh

Run this command only when you are ready to call the live API and overwrite local fixtures.

```bash
KSKILL_SEOUL_KEY=... npm run refresh:fixtures
```
