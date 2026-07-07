# k-parent-source-childinfo

어린이집정보공개 / 유치원현황 데이터를 data.go.kr 공공데이터 API로 조회하는 어댑터입니다.

## Configuration

- `KSKILL_DATAGOKR_KEY` — data.go.kr 인증키 (모든 요청의 `serviceKey` 파라미터)

## 함수

- `fetchChildcareCenters({ sidoCode, sigunguCode, name, ... })`
  -> `{ centerId, name, kind(국공립/민간/가정...), address, tel, capacity, currentCount, hasVehicle, hasCctv, operatingHours }`
- `fetchKindergartens({ sidoCode, sggCode, name, ... })`
  -> `{ kdgId, name, establish(공립/사립), address, tel, classCount, pupilCount, busOperate }`

두 함수 모두 `{ ok, status, items, raw }` envelope를 반환합니다. `options.payload`를 넘기면 HTTP 호출을 건너뜁니다.

## Usage

```js
const { fetchChildcareCenters, fetchKindergartens } = require("k-parent-source-childinfo");
const childcarePayload = require("./test/fixtures/childcare.json");
const kindergartenPayload = require("./test/fixtures/kindergarten.json");

async function main() {
  const childcare = await fetchChildcareCenters({ sidoCode: "11", sigunguCode: "110", payload: childcarePayload });
  const kindergartens = await fetchKindergartens({ sidoCode: "11", sggCode: "110", payload: kindergartenPayload });
  return { childcare, kindergartens };
}

main().then(console.log).catch(console.error);
```

## 주의: 서비스 경로/파라미터 확인 필요

data.go.kr는 어린이집/유치원 데이터를 여러 제공처(한국사회보장정보원 어린이집정보공개,
교육부 유치원알리미 등)로 노출하며 BASE/PATH 및 파라미터명이 서비스 버전마다 다릅니다.
`src/index.js`의 `CHILDCARE_ENDPOINT` / `KINDERGARTEN_ENDPOINT` 상수와 파라미터 매핑은
합리적 기본값이며, **활용신청 후 포털의 API 명세서에서 정확한 값으로 교체**해야 합니다.

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
