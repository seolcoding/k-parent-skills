# Services

`services/*`는 기존 레이어를 서버 프로세스로 조합하는 Runtime 영역이다. Skill,
HITL, Memory, Domain 규칙의 원본은 각각의 canonical package에 남기고 서비스에서
복제하지 않는다.

현재 서비스는 [`k-parent-api`](k-parent-api/README.md) 하나이며 localhost 전용
prototype이다.
