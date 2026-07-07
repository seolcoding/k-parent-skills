# k-parent-source-culture

문화포털(culture.go.kr) 공연전시정보 source adapter for k-parent-skill.

## Usage

```js
const { fetchCultureEvents, parseCultureEvents } = require("k-parent-source-culture");
```

`fetchCultureEvents({ from, to, area, rows })` calls the culture portal
공연전시정보 endpoint and returns `response.msgBody.perforList`.

## Configuration

- `KSKILL_CULTURE_KEY` — 문화포털 서비스키 (https://www.culture.go.kr).

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

Tests run fully offline from `test/fixtures/`.

## Fixtures refresh

Run this command only when you are ready to call the live API and overwrite local fixtures.

```bash
KSKILL_CULTURE_KEY=... npm run refresh:fixtures
```
