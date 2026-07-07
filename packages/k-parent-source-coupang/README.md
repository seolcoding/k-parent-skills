# k-parent-source-coupang

Coupang Partners affiliate API adapter for K-Parent Skill.

## Functions

- `fetchProducts({ keyword, limit })` — product search rows
  (`productName`, `productPrice`, `productImage`, `productUrl`, `isRocket`, `categoryName`).
  Every row and the top-level result carry the mandatory affiliate disclosure
  `쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 받을 수 있음`.
- `signRequest({ method, path, query, accessKey, secretKey, signedDate|date })` — pure,
  deterministic CEA HMAC-SHA256 signer (`Authorization: CEA algorithm=HmacSHA256, access-key=..., signed-date=..., signature=...`).
- `formatSignedDate(date)` — UTC `YYMMDDTHHMMSSZ` signed-date stamp.

## Configuration

Set `KSKILL_COUPANG_ACCESS_KEY` and `KSKILL_COUPANG_SECRET_KEY`. Sign up for
Coupang Partners and issue an API access key / secret key.

## Usage

```js
const { fetchProducts } = require("k-parent-source-coupang");

async function main() {
  return fetchProducts({ keyword: "물티슈", limit: 10 });
}

main().then(console.log).catch(console.error);
```

## Disclosure (required)

Any user-facing surface that shows Coupang Partners links MUST display the
disclosure text above. It is attached to every normalized item so it cannot be
dropped accidentally.

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

Tests run fully offline from `test/fixtures/products.json`.

## Fixtures refresh

Run against the live API:

```bash
KSKILL_COUPANG_ACCESS_KEY=... KSKILL_COUPANG_SECRET_KEY=... npm run refresh:fixtures
```
