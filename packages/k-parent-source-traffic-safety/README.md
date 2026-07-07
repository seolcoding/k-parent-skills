# k-parent-source-traffic-safety

CommonJS adapter for child traffic-safety data from data.go.kr.

Current wrapped surfaces:

- `15058311` 한국도로교통공단_어린이보호구역내 어린이 교통사고 다발지역
- `15143780` 경상북도_어린이보호구역 정보조회
- `15111660` 경기도 성남시_옐로우 카펫
- `15112089` 경상남도 의령군_어린이보호구역 서비스

## Configuration

Live calls require `KSKILL_DATAGOKR_KEY` or `options.apiKey`. Some APIs may return
`403` shortly after data.go.kr 활용신청 until approval propagates.

## Usage

```js
const {
  fetchSchoolZoneChildAccidentHotspots,
  fetchGyeongbukChildProtectionZones,
} = require("k-parent-source-traffic-safety");
const schoolZoneRiskPayload = require("./test/fixtures/schoolzone-risk.json");
const protectionZonesPayload = require("./test/fixtures/protection-zones.json");

async function main() {
  const hotspots = await fetchSchoolZoneChildAccidentHotspots({ sido: "서울특별시", sigungu: "강남구", payload: schoolZoneRiskPayload });
  const zones = await fetchGyeongbukChildProtectionZones({ sigungu: "경주시", payload: protectionZonesPayload });
  return { hotspots, zones };
}

main().then(console.log).catch(console.error);
```

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

Tests run fully offline from `test/fixtures/`.

## Fixtures refresh

Run this command only when you are ready to call the live API and overwrite local fixtures.

After service approval:

```bash
KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures
```
