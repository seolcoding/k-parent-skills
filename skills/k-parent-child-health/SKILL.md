---
name: k-parent-child-health
description: 대한민국 부모가 아이 약·식품 안전 정보와 야간·휴일 진료 경로를 확인할 때 쓰는 스킬. 증상부터 묻고 위험 신호면 119·응급실 안내를 먼저 하며, 식약처 e약은요·안전상비의약품·회수/부적합 식품을 API 키 없이 k-skill 공개 프록시로 조회한다(응급실·야간약국은 packages/k-parent-source-emergency). "어린이 해열제 성분이 뭐야", "아이가 먹은 과자 회수된 거야?", "밤에 문 연 소아 응급실 어디야" 같은 요청에 사용. 예방접종·발달 등 일반 육아 지식은 k-parent-knowledge-helper.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: concept
---

# 아이 건강·안전 확인

## 핵심 동작

아이 약과 먹거리의 **공식 안전 정보**를 찾아 주고, 급할 때 **어디로 가야 하는지** 알려 준다.
진단·처방·용량 계산은 하지 않는다. 공식 문서에 있는 문구만 근거로 쓰고, 판단은 약사·의사에게 넘긴다.

원본: NomaDamas/k-skill `mfds-drug-safety`, `mfds-food-safety`, `emergency-room-beds` (MIT). 바꾼 내용은 `references/NOTICE.md`.

## 사용 시점

- "어린이 해열제 성분이랑 주의사항 알려줘"
- "아이가 먹은 과자 회수된 제품이야?"
- "감기약이랑 해열제 같이 먹여도 돼?"
- "밤에 문 연 소아 응급실이나 약국 어디야?"

## 준비 사항

- `curl`
- 선택: `KSKILL_PROXY_BASE_URL` (비우면 공개 프록시, `docs/kskill-proxy.md`)
- 응급실·야간약국 목록을 데이터로 받으려면 `KSKILL_DATAGOKR_KEY` (없으면 공식 사이트 안내로 대체)

## 전형적 흐름

### 1. 먼저 묻는다 (생략 금지)

증상이나 복용·섭취 상황이 나오면 결론 전에 묻는다.

- 아이 나이(개월 수)와 대략 체중 범위
- 무엇을, 언제, 얼마나 먹었는지 / 먹이려는지
- 지금 증상과 시작 시각, 열이 있으면 체온
- 이미 먹은 다른 약, 알레르기, 기저질환

### 2. 위험 신호면 조회보다 연결이 먼저

`references/red-flags.md`의 신호가 하나라도 있으면 조회를 멈추고 바로 안내한다.

- 119 신고 또는 가까운 응급실
- 119 구급상황관리센터 의료상담(119)
- 응급실 찾기: https://www.e-gen.or.kr

### 3. 약 정보 조회

```bash
BASE="${KSKILL_PROXY_BASE_URL:-https://k-skill-proxy.nomadamas.org}"; BASE="${BASE%/}"
curl -fsS --get "${BASE}/v1/mfds/drug-safety/lookup" --data-urlencode "itemName=어린이타이레놀"
```

- 여러 약은 `itemName`을 반복해서 넣는다.
- 제품명, 업체명, 효능, 사용법, 주의사항, 상호작용, 이상반응, 보관법을 짧게 정리한다.
- "같이 먹여도 되나"에는 공식 상호작용 문구만 보여 주고, 최종 판단은 약사·의사 확인이 필요하다고 적는다.
- 용량은 제품 설명서 표의 연령·체중 구간을 그대로 옮길 뿐 계산하거나 조정하지 않는다.

### 4. 식품 안전 조회

```bash
curl -fsS --get "${BASE}/v1/mfds/food-safety/search" --data-urlencode "query=제품명" --data-urlencode "limit=5"
curl -fsS --get "${BASE}/v1/mfds/food-safety/inspection-fail" --data-urlencode "query=제품명" --data-urlencode "limit=5"
```

- `search`: 회수·판매중지·부적합 공개 목록
- `inspection-fail`: 국내 검사부적합 이력
- 결과가 없으면 "공개 목록에서 찾지 못함"이라고 쓴다. "안전하다"고 말하지 않는다.
- 응답 `warnings`에 sample feed 안내가 있으면 그대로 알린다.

### 5. 야간·휴일 진료 경로

- 키가 있으면 `packages/k-parent-source-emergency`로 응급실·야간약국을 조회한다.

```js
const { fetchEmergencyRooms, fetchNightHolidayPharmacies } = require("k-parent-source-emergency");
const rooms = await fetchEmergencyRooms({ sido: "서울특별시", sgg: "강남구" });
```

- 키가 없으면 E-Gen(응급실·달빛어린이병원·야간약국 찾기)과 119를 안내한다.
- 병상·운영 상태는 바뀐다. 출발 전 병원에 전화로 확인하라고 적는다.

## 데이터 소스

| 경로 | 원천 | 키 |
| --- | --- | --- |
| `/v1/mfds/drug-safety/lookup` | 식약처 e약은요, 안전상비의약품 | 없음 (공개 프록시) |
| `/v1/mfds/food-safety/search`, `/inspection-fail` | 식약처, 식품안전나라 | 없음 (공개 프록시) |
| `packages/k-parent-source-emergency` `fetchEmergencyRooms`, `fetchNightHolidayPharmacies` | 국립중앙의료원 E-Gen (data.go.kr) | `KSKILL_DATAGOKR_KEY` |

## 출력 형식

- 먼저 확인한 상황 요약 (아이 개월 수, 증상, 먹은 것)
- 위험 신호 여부와 연결 안내
- 공식 정보: 제품명, 업체명, 주의사항, 상호작용 / 회수·부적합 사유와 공개일
- 출처 이름, 조회 시각(KST)
- "진단이 아니며 약사·의사 확인이 필요합니다" 한 줄

## 완료 조건

- 증상·상황을 먼저 물었다.
- 위험 신호를 확인했다.
- 공식 원천을 조회했거나, 실패를 알리고 공식 사이트를 안내했다.
- 진단·처방·용량 조정을 하지 않았다.

## 실패 모드

- 공개 프록시 장애·`429`: 의약품안전나라(nedrug.mfds.go.kr), 식품안전나라(foodsafetykorea.go.kr) 직접 확인 안내
- 제품명이 모호함: 후보를 보여 주고 고르게 한다.
- 키 없음: 응급실 목록 대신 E-Gen·119 안내

## 참고

- 아이 증상, 체중, 복용 기록은 저장하지 않는다. 호출 단위로만 쓴다.
- 이 스킬은 정보 제공 도구다. 의료진을 대신하지 않는다.

## 관련 문서

- `docs/features/k-parent-child-health.md`
