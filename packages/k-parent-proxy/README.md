# k-parent-proxy

K-Parent Quiz 앱이 사용하는 NEIS 읽기 전용 allowlist proxy다. 이전
`k-skill-proxy`의 범용 생활정보 route를 가져오지 않고 다음 표면만 소유한다.

- `GET /health`
- `GET /v1/neis/school-search`
- `GET /v1/neis/classes`
- `GET /v1/neis/timetable`
- `GET /v1/neis/schedule`

서버에 `KEDU_INFO_KEY`가 필요하고 성공·빈 결과는 기본 24시간 process memory에
cache한다. client에는 API key를 노출하지 않는다.

```bash
KEDU_INFO_KEY=... npm start --workspace k-parent-proxy
curl http://127.0.0.1:4020/health
```

기본 bind는 `127.0.0.1:4020`이다. 현재 상태는 local/self-host only다. 인증,
rate limit, durable cache, production canary가 없으므로 공개 hosted endpoint나
production deployment를 주장하지 않는다.
