# 메모리 레이어

K-Parent 메모리는 대화를 전부 기억하는 데이터베이스가 아니다. 부모 workflow를
이어가기 위해 필요한 최소 상태만 목적별 scope와 보존 기간을 붙여 관리한다.

| Scope | 저장 가능 항목 | 기본 보존 | 저장 금지 |
| --- | --- | --- | --- |
| `session` | 지역, 날짜·날짜 범위, workflow 단계, locale/timezone, 공개 resource·selection reference | 30분 | 대화 원문, 자녀 식별자, credentials, 임의 필드 |
| `profile_ref` | `local://`, `vault://`, `user-store://` opaque reference | 명시 삭제 전 | profile 본문, 이름, 생년월일, 학교 식별자 |
| `knowledge` | HTTPS 출처 URL·확인 시각·resource ID·etag·payload digest만 있는 공개 metadata | 24시간 | API payload 원문, 가족·학생·계정 데이터 |
| `approval_audit` | action ID/type/status/risk, scope·approval digest, 결정·만료 metadata | 24시간 | action scope/label, password, token, cookie, 인증서, 결제 비밀번호 |

`packages/k-parent-memory`는 이 계약의 process-local in-memory 구현과 opt-in
encrypted local-file adapter를 제공한다. 레코드는 16 KiB로 제한되고 TTL은 최대
30일이다. 암호화 adapter는 호출자가 32-byte key와 파일 경로를 주입해야 하며,
AES-256-GCM envelope, atomic `0600` replacement, tenant/namespace 격리, TTL cleanup,
namespace export/delete와 consent revocation을 제공한다. key는 저장하지 않는다.
각 scope는 allowlist 밖의 필드를 거부하며 `knowledge`는 호출자가
`sensitivity: "public"`과 동일한 HTTPS `sourceRef`를 명시해야 한다.

## 서버 사용

`services/k-parent-api`는 session과 approval audit scope만 HTTP로 노출한다.
profile 본문이나 raw conversation을 받는 endpoint는 제공하지 않는다. 실제 사용자
profile은 사용자 소유 로컬·vault 저장소에 두고 opaque reference만 연결한다.

`services/k-parent-api`는 기본적으로 in-memory store를 쓰고 두 환경변수가 함께
설정될 때만 encrypted local-file adapter를 tenant별로 조합한다. 이 파일 adapter는
로컬 재시작 지속성을 제공하지만 동시 다중 프로세스 DB, key rotation, backup/restore,
운영 관측성을 제공하지 않는다.

운영 저장소로 승격하려면 다음이 모두 필요하다.

- 전송 암호화와 key rotation
- TTL 삭제, 사용자 직접 삭제, 보존정책 검증
- 접근 감사와 민감 필드 redaction
- backup/restore, 다중 프로세스 동시성, 운영 관측성 검증
- raw 가족 대화·학교 문서의 기본 비수집

이 조건을 만족하고 production evidence가 생기기 전에는 SSOT deployment를
`local-only` 또는 `deployment-unverified`보다 높이지 않는다.
