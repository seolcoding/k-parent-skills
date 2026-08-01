# 레이어 모델

K-Parent Skills는 대화 지침, 승인 판단, 실행 코드, 외부 API, 데이터를 분리한다.

```text
Experience    apps/*, user-facing surfaces
     ↓
Skill         skills/* — intent routing and workflow
     ↓
Policy/HITL   packages/k-parent-core — consent, risk, approval state
     ↓
Memory        packages/k-parent-memory — bounded context and audit records
     ↓
Tool          tools/*, scripts/*, proxy routes — callable operations
     ↓
Domain        brief, calendar, document extraction, quiz logic
     ↓
Adapter       packages/k-parent-source-* and external API contracts
     ↓
Data          fixtures, generated banks, crawl outputs, public datasets

Governance    ssot/* — IDs, ownership, paths, layer, status (cross-cutting)
Runtime       services/* — API/worker composition and hosting (cross-cutting)
```

## Experience 레이어

`apps/*`와 향후 웹·모바일·메신저 표면이다. 사용자 입력과 결과 표현을 소유하지만
공식 데이터 파싱, 위험도 판단, 승인 로직을 자체 구현하지 않는다.

## Skill 레이어

`skills/*/SKILL.md`가 사용자 의도를 기능에 라우팅하고 질문 순서, 소스 우선순위,
실패 모드, 출력 필드를 정의한다. 스킬은 시크릿 값이나 장기 상태를 저장하지 않는다.

## Policy/HITL 레이어

`packages/k-parent-core`가 데이터 최소화, source freshness, 위험 작업 분류와
HITL 상태를 소유한다. 외부 부작용은 이 레이어를 우회할 수 없다. 상세 계약은
[HITL 레이어](hitl.md)를 본다.

## Memory 레이어

`packages/k-parent-memory`가 대화 중 임시 context, 사용자 소유 profile의 opaque
reference, 공개 지식 cache, 승인·감사 기록의 최소 계약을 소유한다. 메모리에는
비밀번호·토큰·쿠키·주민등록번호·생년월일·자녀 이름을 넣을 수 없다. 실제 가족
대화 원문과 학교·학원 문서 원문도 장기 메모리 대상이 아니다. 저장 범위와 보존
정책은 [메모리 레이어](memory.md)를 본다.

## Tool 레이어

`tools/*`, operator/crawler `scripts/*`, 제한된 proxy route가 에이전트 또는 앱이
호출할 수 있는 결정적 작업을 제공한다. 도구는 정규화된 입력과 구조화된 출력을
사용하고, 사람 승인 여부를 스스로 추정하거나 승인 범위를 넓히지 않는다.

읽기 전용으로 매우 얇은 작업은 별도 wrapper 없이 domain/adapter 패키지를 직접
호출할 수 있다. 외부 쓰기·로그인·개인정보 입력이 생기면 명시적 tool contract와
HITL gate가 필수다.

## Domain 레이어

`k-parent-brief`, `k-parent-calendar`, `k-parent-doc-extract`,
`k-parent-quiz-core`처럼 외부 전송 없이 부모 판단 단위로 합성·추출하는 순수 로직이다.

## Adapter 레이어

`packages/k-parent-source-*`와 API 계약이 외부 응답을 공통 필드로 정규화한다.
사용자 대화 흐름, 승인 UI, 제품 화면을 소유하지 않는다. fixture 테스트와 live probe
상태를 분리한다.

## Data 레이어

작은 공개 fixture와 결정적 생성 데이터는 Git에 두고, 대형 raw crawl은 `tmp/`에
ignored 상태로 둔다. 실제 가족 대화·학생 기록·자녀 식별자는 어느 데이터 레이어에도
저장하지 않는다.

## Runtime 레이어

`services/*`는 Skill, Policy/HITL, Memory, Tool을 HTTP API, worker, scheduler로
조합하는 실행 평면이다. 현재 `services/k-parent-api`는 localhost 전용 prototype이며
HITL 요청·결정과 session memory만 제공한다. 인증, 영구 DB, tenant 격리, 실제
부작용 executor는 아직 없으므로 운영 서버로 표시하지 않는다.

## 의존성 규칙

- 아래 레이어는 위 레이어를 import하지 않는다.
- Adapter는 Skill 또는 Experience를 알지 못한다.
- Tool은 승인 결정을 만들지 않고 승인 envelope만 검증한다.
- Skill은 외부 부작용 전에 Policy/HITL을 호출한다.
- Memory는 workflow를 결정하거나 tool을 직접 실행하지 않는다.
- Runtime은 각 레이어의 계약을 조합할 뿐 도메인·승인 규칙을 다시 구현하지 않는다.
- Experience는 SSOT 상태를 배포 상태로 추정하지 않는다.
- 각 SSOT registry의 `defaultLayer`와 항목별 `layer` override가 현재 분류의 기준이다.
