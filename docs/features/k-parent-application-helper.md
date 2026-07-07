# 각종 신청 기능 문서

`k-parent-application-helper`는 돌봄, 방과후, 바우처, 체험, 지자체 지원사업 신청을 체크리스트로 정리하는 스킬이다.

## 사용 패키지

현재 구현된 복지 신청 표면은 `packages/k-parent-source-welfare`가 담당한다.

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-source-welfare` | 아동수당, 부모급여, 양육수당, 아이돌봄, 방과후, 보육료, 유아학비 등 curated 복지 서비스 카탈로그 |

## 현재 범위

- 대상 조건, 신청 기간, 필요 서류, 로그인 필요 여부 정리
- 정부24, 복지로, 교육청, 지자체, 학교 등 공식 접수처 우선
- `listServices({ category })`, `getService(serviceId)`, `buildDeepLink(service, params)` 기반의 신청 후보·필요서류·공식 URL·포털 딥링크 정리
- 기본 curated catalog는 외부 API key 없이 오프라인으로 동작
- 개인정보 입력, 제출, 결제 전 사용자 확인

## 환경변수

- `KSKILL_DATAGOKR_KEY` — 선택적 live lookup stub용 data.go.kr 통합키. 현재 기본 복지 카탈로그 조회에는 필요하지 않다.

## 픽스처 갱신

`packages/k-parent-source-welfare`는 curated catalog 패키지라 `refresh:fixtures` 명령을 제공하지 않는다. 복지 금액, 자격, 서류는 매년 바뀔 수 있으므로 실제 신청 전 공식 사이트에서 최종 확인한다.

## 남은 확장 후보

- 신청 유형별 준비물 템플릿
- 마감일 캘린더 연동
- 접수 상태와 결과 발표일 추적
