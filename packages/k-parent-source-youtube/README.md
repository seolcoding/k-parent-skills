# k-parent-source-youtube

YouTube Data API v3 source connector for `k-parent-skill`. Provides
parent-friendly video search used by the content-recommender skill.

## Configuration

Set an API key from the Google Cloud Console (enable **YouTube Data API v3**):

```bash
export KSKILL_YOUTUBE_KEY="your-api-key"
```

## Usage

```js
const { searchVideos } = require("k-parent-source-youtube");

async function main() {
  const videos = await searchVideos({
    q: "초등 4학년 과학 물의 상태 변화",
    safeSearch: "strict", // default
    maxResults: 10,
  });
  return videos;
}

main().then(console.log).catch(console.error);
// -> [{ videoId, title, channelTitle, publishedAt, description, thumbnail, url, source, source_id, fetched_at }, ...]
```

Each result includes `url: https://youtu.be/<videoId>`.

### Options

| option | default | notes |
| --- | --- | --- |
| `q` | (required) | search query |
| `apiKey` | `process.env.KSKILL_YOUTUBE_KEY` | API key |
| `safeSearch` | `"strict"` | `none` \| `moderate` \| `strict` |
| `maxResults` | `10` | 1-50 |
| `regionCode` | `"KR"` | |
| `relevanceLanguage` | `"ko"` | |
| `order` | (api default) | `relevance` \| `date` \| `viewCount` ... |
| `publishedAfter` | — | RFC 3339 timestamp |
| `fetchImpl` | `global.fetch` | inject for tests |
| `payload` | — | pre-fetched payload; bypasses HTTP |

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

Tests run fully offline using the fixture in `test/fixtures/search.json`.

## Fixtures refresh

Run this command only when you are ready to call the live API and overwrite local fixtures.

```bash
KSKILL_YOUTUBE_KEY=... npm run refresh:fixtures -- "검색어"
```
