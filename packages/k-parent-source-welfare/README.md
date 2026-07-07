# k-parent-source-welfare

Curated catalog of Korean parenting welfare services for K-Parent Skill.

Works fully offline. No API key required.

- `listServices({ category? })` -> curated `application_service` list
  (아동수당, 부모급여, 양육수당, 가정양육수당, 아이돌봄, 방과후, 보육료, 유아학비).
- `getService(serviceId)` -> a single service or a `not_found` error result.
- `buildDeepLink(service, params?)` -> 정부24 / 복지로 / 아이사랑 / 아이돌봄
  portal URL plus `requiresOfficialSiteHandoff: true`.

Each service includes `serviceId`, `title`, `agency`, `eligibility`,
`requiredDocs[]`, `officialUrl`, `contact`, and `deadline`.

## Usage

```js
const { listServices, getService, buildDeepLink } = require("k-parent-source-welfare");

const services = listServices({ category: "현금지원" });
const service = getService("child-allowance").service;
const link = buildDeepLink(service, { region: "서울" });
```

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

Tests run fully offline from the curated catalog and fixtures.

## Configuration

A live data.go.kr lookup can be gated behind the `KSKILL_DATAGOKR_KEY`
environment variable. It is optional — the curated catalog is the default and
tests stay offline. `describeLiveLookup()` returns a `missing_config` error
result when the key is absent.

Welfare figures and eligibility change annually; always confirm on the official
site before applying. Application submission requires explicit user approval and
is never automated (no NPKI / 공동인증서 auto-submit).
