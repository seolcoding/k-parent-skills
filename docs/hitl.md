# Human-in-the-loop(HITL) 레이어

K-Parent Skills는 정보 조회와 외부 부작용을 분리한다. 로그인, 자녀 개인정보
입력, 외부 전송, 신청·예약·취소, 캘린더 쓰기, 메시지 발송, 구매·결제는
`packages/k-parent-core/src/hitl.js`의 승인 상태를 통과하기 전에는 실행할 수 없다.

## 상태 모델

```text
proposed
  ├─ low-risk policy ───────────────> approved
  └─ side effect ─> awaiting_approval
                        ├─ human reject ─> rejected
                        └─ human approve ─> approved ─> executed
                                                  └───> expired
```

승인은 한 번만 사용할 수 있고, 요청 ID·작업 유형·안전한 scope의 SHA-256 digest에
묶인다. 승인 후 scope가 달라지면 실행을 거부한다. 고위험 승인은 기본 15분,
결제·자격증명·자녀 개인정보 같은 critical 작업은 기본 5분 뒤 만료된다.

## 정책

| 위험 | 작업 예 | 사람 승인 | 공식 사이트 handoff |
| --- | --- | --- | --- |
| low | 체크리스트 생성 | 불필요 | 불필요 |
| medium | 캘린더 쓰기 | 필수 | 선택 |
| high | 로그인, 신청, 예약, 취소, 메시지 발송 | 필수 | 거래형 작업은 필수 |
| critical | 결제, 구매, 자격증명 입력, 자녀 개인정보 입력·외부 전송 | 필수 | 가능한 경우 필수 |

등록되지 않은 새 작업 유형은 기본 `high`로 분류해 승인 없이는 실행하지 않는다.

## 런타임 계약

```js
const {
  createActionRequest,
  decideActionRequest,
  assertActionExecutable,
  markActionExecuted,
} = require("k-parent-core");

const request = createActionRequest({
  type: "application",
  label: "돌봄 신청",
  scope: {
    target: "official-service-code",
    childProfileRef: "local-profile-1",
    fields: ["region", "serviceCode"],
  },
});

// UI나 에이전트가 사람에게 scope와 공식 URL을 보여준 뒤 결정만 기록한다.
const approved = decideActionRequest(request, {
  decision: "approved",
  actor: "parent-session",
});

assertActionExecutable(approved, { scope: approved.scope });
const completed = markActionExecuted(approved, {
  actor: "official-site-handoff",
  scope: approved.scope,
  resultRef: "local-confirmation-ref",
});
```

이 라이브러리는 실제 로그인·제출·결제를 수행하지 않는다. 호출 표면은 승인된
요청을 검증한 뒤 별도 공식 사이트 handoff 또는 제한된 실행기를 호출해야 한다.

## 감사·데이터 최소화

- 승인 기록에는 actor reference, 시각, 결정, 만료, constraints, scope digest만 둔다.
- 비밀번호, 토큰, 쿠키, 주민등록번호, 정확한 생년월일, 자녀 이름은 persisted
  approval scope에서 거부한다.
- 실제 입력값·가족 대화·학생 기록을 audit trail이나 SSOT에 저장하지 않는다.
- `resultRef`는 로컬 확인 레퍼런스만 허용하고 원문 영수증·신청서를 Git에 넣지 않는다.
