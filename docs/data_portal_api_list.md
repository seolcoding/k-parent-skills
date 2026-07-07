# 공공데이터포털 목록개방현황 API

공공데이터활용지원센터의 `공공데이터포털 목록개방현황`은 data.go.kr에 개방된 파일/API/표준데이터 목록을 월별 스냅샷으로 제공하는 카탈로그 API다. 부모 생활정보 스킬에서 새 공식 데이터 소스를 찾거나, 기존 source adapter의 제공기관/endpoint/활용신청 여부를 확인할 때 우선 조회해야 하는 핵심 인덱스다.

- 포털 상세: <https://www.data.go.kr/data/15062804/fileData.do>
- OpenAPI OAS: <https://infuser.odcloud.kr/oas/docs?namespace=15062804/v1>
- Base URL: `https://api.odcloud.kr/api`
- 인증: query `serviceKey` 우선. OAS에는 header `Authorization`도 표시되지만, 로컬 확인에서는 query `serviceKey`와 `Authorization: InfuserApiKey ...`만 키 검증 단계까지 도달했다.
- 로컬 env: `KSKILL_DATAGOKR_KEY`를 우선 사용한다. 프록시 운영 문맥에서는 기존 관례상 `DATA_GO_KR_API_KEY`도 같이 볼 수 있다.

## 현재 최신 스냅샷

2026-05-30 확인 기준 OAS에는 68개 월별 endpoint가 있고, 최신 endpoint는 2026-04-30 스냅샷이다.

```text
GET https://api.odcloud.kr/api/15062804/v1/uddi:27a52f84-d64f-438d-bc59-e4f705ebd386
```

이 `uddi`는 매월 새로 추가될 수 있다. 구현에서 고정 상수만 쓰면 다음 달부터 stale해지므로, 카탈로그 수집/검색 도구는 OAS를 먼저 읽어 최신 날짜 endpoint를 고른 뒤 호출하는 방식이 안전하다.

## 활용신청 상태

이 API도 별도의 활용신청이 필요하다. 일반 data.go.kr 인증키가 다른 표준 API에서 정상 동작하더라도, 이 목록개방현황 API에 활용신청되어 있지 않으면 `api.odcloud.kr`가 다음처럼 거절한다.

```json
{ "code": -4, "msg": "등록되지 않은 인증키 입니다." }
```

2026-05-30 로컬 `.env`의 `KSKILL_DATAGOKR_KEY`는 Decoding 인증키 형태로 확인했고, 공공데이터 표준 주차장 API에서는 정상(`NORMAL_SERVICE`)이었다. 목록개방현황 API는 별도 활용신청 전에는 위 `-4` 오류가 났고, 활용신청 후에는 정상 조회됐다. 즉 키 형식 문제가 아니라 해당 데이터셋 활용신청/승인 상태를 먼저 확인해야 한다.

## 요청 파라미터

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | 예 | data.go.kr 인증키. query 방식이 가장 단순하다. |
| `page` | 아니오 | 페이지 번호. 기본값 `1`. |
| `perPage` | 아니오 | 페이지 크기. 기본값 `10`. 대량 수집 시 너무 크게 잡지 말고 페이지네이션한다. |
| `returnType` | 아니오 | 기본 JSON. XML이 필요하면 `XML`. |

예시:

```bash
# .env에 KSKILL_DATAGOKR_KEY가 있을 때. 값은 출력하지 않는다.
set -a
. ./.env
set +a

node - <<'NODE'
const endpoint = "https://api.odcloud.kr/api/15062804/v1/uddi:27a52f84-d64f-438d-bc59-e4f705ebd386";
const key = process.env.KSKILL_DATAGOKR_KEY || process.env.DATA_GO_KR_API_KEY;
const decodedKey = decodeURIComponent(key);
const url = new URL(endpoint);
url.searchParams.set("page", "1");
url.searchParams.set("perPage", "100");
url.searchParams.set("serviceKey", decodedKey);
const res = await fetch(url);
const json = await res.json();
console.log({ status: res.status, currentCount: json.currentCount, totalCount: json.totalCount, msg: json.msg });
NODE
```

## 최신 endpoint 탐색

OAS의 `paths`에 월별 endpoint가 모두 들어 있다. 파일명/summary 끝의 `YYYYMMDD`를 기준으로 최신 스냅샷을 고른다.

```js
const specUrl = "https://infuser.odcloud.kr/oas/docs?namespace=15062804/v1";
const spec = await fetch(specUrl).then((res) => res.json());

const latest = Object.entries(spec.paths)
  .map(([path, value]) => {
    const summary = value.get?.summary || "";
    const date = summary.match(/_(\d{8})$/)?.[1] || null;
    return { path, summary, date };
  })
  .filter((entry) => entry.date)
  .sort((a, b) => a.date.localeCompare(b.date))
  .at(-1);

console.log(latest);
```

현재 확인된 최신값:

```json
{
  "path": "/15062804/v1/uddi:27a52f84-d64f-438d-bc59-e4f705ebd386",
  "summary": "공공데이터활용지원센터_공공데이터포털 목록개방현황_20260430",
  "date": "20260430"
}
```

## 응답 형태

JSON 응답의 top-level shape:

```json
{
  "page": 1,
  "perPage": 100,
  "totalCount": 0,
  "currentCount": 0,
  "matchCount": 0,
  "data": []
}
```

OAS 기준 2026-04-30 row column은 다음 36개다.

| 컬럼 | 용도 |
| --- | --- |
| `목록키` | 포털 내부 목록 식별자. |
| `목록유형` | 파일/API/표준 등 목록 유형. |
| `목록명` | 데이터 목록명. 검색/분류의 핵심 필드. |
| `파일데이터명` | 파일데이터 상세명. API 목록에서는 비어 있을 수 있다. |
| `분류체계` | 공공데이터 분류. |
| `제공기관코드` | 제공기관 코드. |
| `제공기관` | 제공기관명. |
| `관리 부서명` | 담당 부서. |
| `관리부서 전화번호` | 담당 연락처. 개인정보/미보유 값은 공란일 수 있다. |
| `보유근거` | 데이터 보유근거. |
| `수집방법` | 데이터 수집방법. |
| `업데이트 주기` | 갱신 주기. freshness 판단에 사용. |
| `차기 등록 예정일` | 다음 갱신 예정일. |
| `매체유형` | 텍스트 등 매체 유형. |
| `전체행` | 원천 데이터 전체 행 수. |
| `확장자(데이터포맷)` | JSON/XML/CSV 등 형식. |
| `키워드` | 검색 키워드. |
| `다운로드_활용신청건수` | 다운로드 또는 활용신청 수. 인기도 보조 신호. |
| `등록일` | 등록일. |
| `수정일` | 수정일. |
| `데이터 한계` | 데이터 한계/누락 안내. |
| `제공형태` | 다운로드, OpenAPI 등 제공 방식. |
| `설명` | 상세 설명. source 후보 판단의 핵심 필드. |
| `기타 유의사항` | 이용 시 주의사항. |
| `공간범위` | 지역 범위. 부모용 지역 필터링에 중요. |
| `시간범위` | 데이터 시간 범위. |
| `비용부과유무` | 무료/유료 여부. 이 repo proxy는 무료 API만 대상으로 한다. |
| `비용부과기준 및 단위` | 유료일 때 기준. |
| `이용허락범위` | 라이선스/이용허락. |
| `API 유형` | REST 등 API 유형. |
| `신청가능 트래픽` | 활용신청 시 허용 트래픽. |
| `심의 유형` | 자동승인/심의승인 여부. |
| `조회수` | 포털 조회수. |
| `목록 URL` | data.go.kr 상세 페이지 URL. 후속 활용신청/명세 확인 링크. |
| `국가중점여부` | 국가중점데이터 여부. |
| `표준데이터여부` | 표준데이터 여부. |

## k-parent-skill 활용 패턴

1. 최신 OAS에서 `YYYYMMDD`가 가장 큰 endpoint를 선택한다.
2. `목록명`, `설명`, `키워드`, `분류체계`, `제공기관`, `공간범위`를 대상으로 검색한다.
3. `목록유형`이 API이거나 `제공형태`/`확장자(데이터포맷)`이 OpenAPI/JSON/XML인 항목을 우선 본다.
4. `비용부과유무`가 무료인지 확인한다. 이 repo의 `k-skill-proxy`는 무료 API만 붙인다.
5. `심의 유형`, `신청가능 트래픽`, `업데이트 주기`, `데이터 한계`, `기타 유의사항`을 기록한다.
6. `목록 URL`로 상세 페이지를 열어 실제 endpoint, request parameter, 활용신청 필요 여부를 확인한다.
7. 부모용 정규화 필드(`child age/grade`, `region`, `date range`, `source URL`, `deadline`, `cost`, `required documents`, `reservation/application status`, `confirmation date`)에 매핑 가능한지 판단한다.

## 구현 주의사항

- data.go.kr의 인증키는 Encoding/Decoding 두 형태가 있다. `URLSearchParams`에 넣을 때는 Decoding 인증키를 넣는 편이 안전하다. 이미 percent-encoded된 값을 `URLSearchParams`에 그대로 넣으면 double-encoding으로 다른 API에서 `SERVICE KEY IS NOT REGISTERED ERROR`가 날 수 있다.
- `api.odcloud.kr` 계열은 OAS상 `serviceKey` query 인증을 지원하지만, API별 활용신청이 안 되어 있으면 `-4`를 반환한다. 이 경우 같은 키가 다른 data.go.kr API에서 성공해도 해당 API는 호출할 수 없다.
- 월별 스냅샷마다 column이 바뀔 수 있다. 포털 설명에 따르면 2025년 7월 데이터부터 제공 column이 개선되었고 상세페이지 항목이 추가되었다. 파서는 알 수 없는 column을 버리지 말고 raw row를 같이 보관한다.
- 이 API는 카탈로그 인덱스다. 실제 서비스 API 호출 가능 여부는 각 `목록 URL` 상세 페이지의 활용신청/명세/서비스 상태를 다시 확인해야 한다.
- 대량 수집 시 `page`/`perPage` 페이지네이션과 로컬 캐시를 사용한다. 매월 스냅샷이므로 매 요청마다 전량 조회할 필요가 없다.

## 2026-05-30 확인 로그

- OAS fetch: 성공.
- OAS endpoint 수: 68.
- 최신 endpoint: `/15062804/v1/uddi:27a52f84-d64f-438d-bc59-e4f705ebd386` (`20260430`).
- 최신 row schema column 수: 36.
- 로컬 `KSKILL_DATAGOKR_KEY`는 Decoding 인증키 형태.
- 활용신청 전 로컬 `KSKILL_DATAGOKR_KEY`로 `api.odcloud.kr` 최신 endpoint 호출: query `serviceKey`, `Authorization` raw, `Authorization: InfuserApiKey ...`, `Authorization: Bearer ...`를 확인했고 query/InfuserApiKey 방식에서 `400 { code: -4, msg: "등록되지 않은 인증키 입니다." }`.
- 활용신청 후 같은 키로 최신 endpoint 호출: `200`, `currentCount: 5`, `matchCount: 95805`, `totalCount: 95805`.
- 같은 키로 `https://api.data.go.kr/openapi/tn_pubr_prkplce_info_api` 호출: `NORMAL_SERVICE`.
