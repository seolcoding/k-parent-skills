# Life Department

생활 디파트먼트는 돌봄, 복지, 병원, 예방접종, 행정 신청, 가족 일정, 반복 체크리스트를 다룬다.

## Skills

- `k-parent-application-helper`
- `k-parent-mobile-agent`
- `k-parent-schedule-manager`
- `k-parent-knowledge-helper`
- `k-parent-outdoor-check`
- `k-parent-child-health`

## Related skills

- `k-parent-school-doc-capture`
- `k-parent-academy-connector`
- `k-parent-kindergarten-info`

## Shared patterns

- 대상 조건, 신청 기간, 필요 서류, 로그인 필요 여부, 결과 발표일, 문의처를 분리한다.
- 신청, 제출, 결제, 취소 같은 side effect는 사용자 승인 전 실행하지 않는다.
- 정부24, 복지로, 돌봄, certificate-login이 필요한 영역은 최종 제출자가 아니라 준비·가이던스 시스템으로 제한한다.
- 마감 임박 항목은 캘린더 후보와 체크리스트 후보로 분리한다.
- 일반 사용자가 모바일에서 쓸 수 있는 서버 배포형 표면을 우선한다.
- 자녀별 일정, 가족 캘린더, 리마인더, 일반 지식 질의응답을 연결한다.

## Next candidates

- 예방접종·건강검진 일정 확인
- 어린이 병원·약국 야간/휴일 진료 확인 (컨셉: `k-parent-child-health`)
- 육아종합지원센터/장난감도서관 프로그램 확인
- 정부24/복지로/돌봄 신청 준비물과 공식 링크 가이던스
- 모바일 홈과 에이전틱 명령 입력
- 자녀 스케줄 conflict detection
