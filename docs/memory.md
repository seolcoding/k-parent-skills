# 메모리 레이어

K-Parent 메모리는 대화를 전부 기억하는 데이터베이스가 아니다. 부모 workflow를
이어가기 위해 필요한 최소 상태만 목적별 scope와 보존 기간을 붙여 관리한다.

| Scope | 저장 가능 항목 | 기본 보존 | 저장 금지 |
| --- | --- | --- | --- |
| `session` | 지역, 날짜 범위, 화면 단계 같은 일시 context | 30분 | 대화 원문, 자녀 식별자, credentials |
| `profile_ref` | `local://`, `vault://`, `user-store://` opaque reference | 명시 삭제 전 | profile 본문, 이름, 생년월일, 학교 식별자 |
| `knowledge` | 출처가 있는 공개 API/cache metadata | 24시간 | 가족·학생·계정 데이터 |
| `approval_audit` | HITL 요청, scope digest, 결정, 만료 상태 | 24시간 | password, token, cookie, 인증서, 결제 비밀번호 |

`packages/k-parent-memory`는 이 계약과 process-local in-memory reference
implementation을 제공한다. 레코드는 16 KiB로 제한되고 TTL은 최대 30일이다.
이 구현은 재시작 시 모두 사라지므로 운영 persistence로 간주하지 않는다.

## 서버 사용

`services/k-parent-api`는 session과 approval audit scope만 HTTP로 노출한다.
profile 본문이나 raw conversation을 받는 endpoint는 제공하지 않는다. 실제 사용자
profile은 사용자 소유 로컬·vault 저장소에 두고 opaque reference만 연결한다.

운영 저장소 adapter를 붙이려면 다음이 모두 필요하다.

- 인증과 tenant별 namespace 격리
- 전송·저장 암호화와 key rotation
- TTL 삭제, 사용자 직접 삭제, 보존정책 검증
- 접근 감사와 민감 필드 redaction
- 목적별 동의 철회와 export/delete 흐름
- raw 가족 대화·학교 문서의 기본 비수집

이 조건을 만족하고 production evidence가 생기기 전에는 SSOT deployment를
`local-only` 또는 `deployment-unverified`보다 높이지 않는다.
