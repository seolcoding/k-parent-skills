# 아이 건강·안전 컨셉 문서

`k-parent-child-health`는 아이 약·식품의 공식 안전 정보를 찾고, 위험 신호가 있으면 119·응급실 연결을 먼저 안내하는 컨셉 스킬이다. 진단·처방·용량 계산은 하지 않는다.

## 데이터 경로

| 경로 | 원천 | 키 |
| --- | --- | --- |
| k-skill 공개 프록시 `/v1/mfds/drug-safety/lookup` | 식약처 e약은요, 안전상비의약품 | 부모 쪽 없음 |
| k-skill 공개 프록시 `/v1/mfds/food-safety/search`, `/inspection-fail` | 식약처, 식품안전나라 회수·부적합 | 부모 쪽 없음 |
| `packages/k-parent-source-emergency` | 국립중앙의료원 E-Gen (data.go.kr) 응급실·야간약국 | `KSKILL_DATAGOKR_KEY` |

2026-10-27 키 없이 약·식품 라우트 200 확인. 프록시 사용 규칙은 `docs/kskill-proxy.md`.

## 현재 범위

- 증상·복용·섭취 상황을 먼저 묻는 인터뷰
- 소아 위험 신호 목록 (`skills/k-parent-child-health/references/red-flags.md`)
- 공식 문구 기반 약 정보 요약, 회수·부적합 여부 확인
- 키가 있으면 응급실·야간약국 목록, 없으면 E-Gen·119 안내

## 가드레일

- 진단, 처방, 용량 계산·조정을 하지 않는다. 설명서 표를 옮길 뿐이다.
- 공개 목록에 없으면 "찾지 못함"이라고 쓴다. "안전하다"고 말하지 않는다.
- 아이 증상·체중·복용 기록을 저장하지 않는다.

## 출처

NomaDamas/k-skill `mfds-drug-safety`, `mfds-food-safety`, `emergency-room-beds` (MIT)를 개작했다. `skills/k-parent-child-health/references/NOTICE.md` 참고.

## 다음 구현 후보

- 위험 신호 선별을 결정형 함수로 옮기고 회귀 테스트 (OpenAI Teen Safety Policy Pack 방식 참고)
- 달빛어린이병원 목록 연결
- 우리 `k-parent-proxy`로 라우트 이전 (배포 전 필수)
- 소아청소년과 전문의 검토
