# k-parent-proxy

K-Parent Quiz 앱이 사용하는 NEIS 읽기 전용 allowlist proxy다. 이전
`k-skill-proxy`의 범용 생활정보 route를 가져오지 않고 다음 표면만 소유한다.

- `GET /health`
- `GET /v1/neis/school-search`
- `GET /v1/neis/classes`
- `GET /v1/neis/timetable`
- `GET /v1/neis/schedule`

서버에 `KEDU_INFO_KEY`가 필요하고 성공·빈 결과는 기본 24시간 process memory에
cache한다. client에는 API key를 노출하지 않는다. `/health`를 제외한 allowlist
route에는 client socket address 기준 fixed-window rate limit이 적용되며, 초과 시
`429`와 `Retry-After` header를 반환한다.

```bash
KEDU_INFO_KEY=... npm start --workspace k-parent-proxy
curl http://127.0.0.1:4020/health
```

기본 bind는 `127.0.0.1:4020`이다. 현재 상태는 local/self-host only다. 인증,
tenant isolation, durable cache, observability, deploy pipeline, production canary가
없으므로 공개 hosted endpoint나 production deployment를 주장하지 않는다.

## Runtime 설정

추가 dependency 없이 process 단위 보호 장치를 제공한다. 숫자 설정은 잘못된 값이면
기본값을 사용하고, 과도한 값이면 아래 hard cap으로 제한한다.

| 환경변수 | 기본값 | hard cap | 설명 |
| --- | ---: | ---: | --- |
| `KPARENT_PROXY_CACHE_TTL_MS` | `86400000` | `604800000` | cache TTL |
| `KPARENT_PROXY_CACHE_MAX_ENTRIES` | `500` | `5000` | LRU process cache entry 수 |
| `KPARENT_PROXY_RATE_LIMIT_WINDOW_MS` | `60000` | `3600000` | fixed-window 길이 |
| `KPARENT_PROXY_RATE_LIMIT_MAX_REQUESTS` | `60` | `10000` | window당 client 요청 수 |
| `KPARENT_PROXY_RATE_LIMIT_MAX_CLIENTS` | `1000` | `10000` | process가 추적할 client 수 |
| `KPARENT_PROXY_UPSTREAM_TIMEOUT_MS` | `8000` | `30000` | NEIS 시도당 timeout |
| `KPARENT_PROXY_UPSTREAM_MAX_RETRIES` | `2` | `3` | retryable 실패의 추가 시도 수 |
| `KPARENT_PROXY_RETRY_BACKOFF_MS` | `100` | `2000` | 최초 retry backoff |
| `KPARENT_PROXY_RETRY_BACKOFF_MAX_MS` | `1000` | `2000` | exponential backoff 상한 |

Retry 대상은 timeout, NEIS upstream 오류, `408`/`429`/`5xx`, 알려진 일시적 network
오류다. 각 시도는 별도 `AbortSignal`을 받고 backoff는 상한까지 지수 증가한다.
Cache와 rate-limit 상태는 process restart 시 초기화된다. 기본 client 식별은
`request.socket.remoteAddress`이며 전달된 proxy header를 신뢰하지 않는다.

## Health metadata

`GET /health`는 API key 값 자체를 노출하지 않고 `neisConfigured`만 보고한다. 또한
`capabilities`에 read-only method와 route prefix, cache 한도, rate-limit 정책,
upstream timeout/retry 설정을 싣고, `deployment.productionReady: false`로 현재 운영
posture를 명시한다. Health route 자체는 rate limit 대상이 아니다.
