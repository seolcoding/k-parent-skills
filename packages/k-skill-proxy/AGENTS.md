# k-skill-proxy 개발 규칙

루트 `AGENTS.md`를 상속한다. 이 파일은 proxy 디렉토리 전용 규칙만 담는다.

## 라우트 관례 (server.js 인라인)

- 경로는 `GET /v1/<domain>/<operation>`. 새 소스 파일을 만들지 말고 `src/server.js`에 인라인으로 추가한다.
- 처리 순서 고정: `normalize<X>Query(request.query)`(실패 시 400 `{error:"bad_request", message}`) → `makeCacheKey({route, ...normalized})` → cache hit 반환 → 필요한 `config.<key>` 없으면 503 `{error:"upstream_not_configured"}` → upstream 호출(timeout) → payload에 `proxy`(name/cache/requested_at)·`query` 메타 → `cache.set`.
- upstream 오류는 502로 매핑하고 `{error, message}` 형태를 유지한다.
- env는 `buildConfig`에서만 읽는다. **라우트나 buildConfig env를 추가하면 `README.md`와 `docs/features/k-skill-proxy.md` 양쪽 문서화가 `scripts/skill-docs.test.js`로 강제된다** — 같은 커밋에서 문서를 갱신하라.

## 테스트·검증

- 테스트는 `test/server.test.js`에 인라인 SAMPLE 상수 + mock fetch 방식으로 추가한다.
- focused 실행: `npm run test --workspace k-skill-proxy` (또는 `node --test packages/k-skill-proxy/test/server.test.js`).
- 문서를 만졌으면 루트에서 `node --test scripts/skill-docs.test.js`도 즉시 실행한다.
- 로컬 기동: `node packages/k-skill-proxy/src/server.js`. 키 없이 신규 라우트를 curl하면 503이 나와야 정상이다.

## 정책

- 무료 공개 API 전용, 무인증 기본. LLM 등 비무료 upstream 라우트는 금지(보류 목록 참고).
- main에 merge되기 전까지 프로덕션에 반영되지 않는다.
