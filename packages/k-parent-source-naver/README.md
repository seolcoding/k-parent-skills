# k-parent-source-naver

Naver Search/Shopping API adapter for K-Parent Skill, plus the generic
dependency-injected data-collector runner.

## Functions

- `fetchShopping({ query, display })` — `/v1/search/shop.json` price-compare rows
  (`title`, `link`, `image`, `lprice`, `hprice`, `mallName`, `productId`, `brand`, `category`).
- `fetchBlog({ query })` — `/v1/search/blog.json` rows (`title`, `link`, `bloggername`, `postdate`).
- `runCollector(tasks, options)` — runs an array of `{ name, source, fetch }` tasks,
  stamps `collectedAt`/source/freshness, keeps a dedupe note, and surfaces failures
  (blocked/stale sources are never hidden). Tasks inject their own fetchers; this
  runner requires no sibling source package.

## Configuration

Set `KSKILL_NAVER_CLIENT_ID` and `KSKILL_NAVER_CLIENT_SECRET` (sent as the
`X-Naver-Client-Id` / `X-Naver-Client-Secret` headers). Create an application at
the Naver Developers console and enable the 검색 API.

## Usage

```js
const { fetchShopping, fetchBlog } = require("k-parent-source-naver");

async function main() {
  const shopping = await fetchShopping({ query: "초등 준비물", display: 10 });
  const blogs = await fetchBlog({ query: "주말 아이 체험", display: 10 });
  return { shopping, blogs };
}

main().then(console.log).catch(console.error);
```

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

Tests run fully offline from `test/fixtures/*.json`.

## Fixtures refresh

Run against the live API:

```bash
KSKILL_NAVER_CLIENT_ID=... KSKILL_NAVER_CLIENT_SECRET=... npm run refresh:fixtures
```
