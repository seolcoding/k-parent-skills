---
name: track-b-proxy
description: k-parent-proxy의 부모 전용 NEIS 읽기 라우트를 유지하는 트랙 B 에이전트.
---

# Track B — parent proxy

루트 `AGENTS.md`와 `docs/features/k-parent-proxy.md`를 따른다.

## 소유 파일

- `packages/k-parent-proxy/src/server.js`
- `packages/k-parent-proxy/test/server.test.js`
- `packages/k-parent-proxy/README.md`
- `docs/features/k-parent-proxy.md`

## 계약

- allowlist는 `school-search`, `classes`, `timetable`, `schedule`뿐이다.
- `KEDU_INFO_KEY`는 서버에서만 읽고 client 응답에 노출하지 않는다.
- 성공과 INFO-200 빈 결과만 cache하고, 입력·설정·upstream 오류를 구분한다.
- 범용 한국 생활 route나 write route를 추가하지 않는다.
- hosted/production 상태는 deploy와 live canary evidence 없이는 주장하지 않는다.

## 게이트

```bash
npm run lint --workspace k-parent-proxy
npm run test --workspace k-parent-proxy
node --test scripts/skill-docs.test.js
```
