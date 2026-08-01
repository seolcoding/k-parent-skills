# Services

`services/*`는 기존 레이어를 서버 프로세스로 조합하는 Runtime 영역이다. Skill,
HITL, Memory, Domain 규칙의 원본은 각각의 canonical package에 남기고 서비스에서
복제하지 않는다.

현재 서비스는 다음과 같으며 모두 local-only prototype이다.

- [`k-parent-api`](k-parent-api/README.md): Bearer 인증, tenant 격리,
  HITL 요청·결정, 기본 휘발성/선택적 암호화 로컬 메모리 조합
- [`k-parent-refresh`](k-parent-refresh/README.md): allowlisted adapter/crawler의
  process-local 스케줄, 중복 실행 방지, 제한 재시도, provenance/freshness 상태
