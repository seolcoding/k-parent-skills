# k-parent-source-library

도서관정보나루(data4library.kr) source adapter for k-parent-skill.

## Usage

```js
const { fetchLibraries, parseLibraries } = require("k-parent-source-library");
```

`fetchLibraries({ region, dtlRegion })` calls
`https://data4library.kr/api/libSrch?authKey=...&format=json`.

## Configuration

- `KSKILL_LIBRARY_KEY` — 도서관정보나루 인증키
  (https://data4library.kr/apiUtilization).

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

Tests run fully offline from `test/fixtures/`.

## Fixtures refresh

Run this command only when you are ready to call the live API and overwrite local fixtures.

```bash
KSKILL_LIBRARY_KEY=... npm run refresh:fixtures
```
