# k-parent-source-emergency

응급의료포털 e-gen(국립중앙의료원) 데이터를 data.go.kr 공공데이터 API로 조회하는 어댑터입니다.

## Configuration

- `KSKILL_DATAGOKR_KEY` — data.go.kr 인증키 (모든 요청의 `serviceKey` 파라미터)

## 함수

- `fetchNightHolidayPharmacies({ sido, sgg, ... })` — 주말/공휴일·야간 운영 약국
- `fetchEmergencyRooms({ sido, sgg, ... })` — 응급실

각 항목은 `{ name, address, tel, latitude, longitude, hours }`로 정규화되며,
`{ ok, status, items, raw }` envelope를 반환합니다. `options.payload`를 넘기면 HTTP 호출을 건너뜁니다.
응급 정보는 변동성이 크므로 source freshness 기본 maxAge는 6시간입니다.

## Usage

```js
const { fetchNightHolidayPharmacies, fetchEmergencyRooms } = require("k-parent-source-emergency");
const pharmacyPayload = require("./test/fixtures/pharmacy.json");
const emergencyRoomPayload = require("./test/fixtures/emergency-room.json");

async function main() {
  const pharmacies = await fetchNightHolidayPharmacies({ sido: "서울특별시", sgg: "강남구", payload: pharmacyPayload });
  const emergencyRooms = await fetchEmergencyRooms({ sido: "서울특별시", sgg: "강남구", payload: emergencyRoomPayload });
  return { pharmacies, emergencyRooms };
}

main().then(console.log).catch(console.error);
```

## 주의: 서비스 경로/파라미터 확인 필요

`src/index.js`의 `PHARMACY_ENDPOINT` / `EMERGENCY_ROOM_ENDPOINT` 상수와 `Q0`(시도)/`Q1`(시군구)
파라미터 매핑은 e-gen 공개 명세 기준 합리적 기본값입니다. **활용신청 후 포털의 API 명세서에서
정확한 경로/파라미터로 교체**해야 합니다.

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
