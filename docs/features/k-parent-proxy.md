# K-Parent NEIS Proxy

## 현재 범위

`packages/k-parent-proxy`는 Flutter 퀴즈 앱을 위한 부모 전용 read-only Tool
레이어다. 이전 범용 `k-skill-proxy`의 주식·부동산·대기질·주유소 route는 이
저장소에 포함하지 않는다.

```text
GET /v1/neis/school-search
GET /v1/neis/classes
GET /v1/neis/timetable
GET /v1/neis/schedule
```

`KEDU_INFO_KEY`는 서버에만 둔다. 성공·빈 결과는 process memory에서 기본 24시간
cache하고, 입력 누락은 400, 키 미설정은 503, upstream 실패는 502로 구분한다.

## 로컬 실행

```bash
KEDU_INFO_KEY=... npm start --workspace k-parent-proxy
curl http://127.0.0.1:4020/health
```

Flutter Android emulator에서는 `--dart-define=PROXY_BASE_URL=http://10.0.2.2:4020`
처럼 명시한다. 공개 hosted URL은 제공하지 않으며 production deployment도 아직
검증되지 않았다.

## 운영 승격 조건

- rate limit과 abuse protection
- durable/managed cache와 timeout/retry 정책
- production secret store와 rotation
- deploy pipeline, observability, live canary evidence

위 조건을 충족하기 전에는 SSOT deployment를 `local-only`보다 높이지 않는다.
