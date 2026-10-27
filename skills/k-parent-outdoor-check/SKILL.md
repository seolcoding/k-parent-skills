---
name: k-parent-outdoor-check
description: 대한민국 부모가 등원·등교, 바깥놀이, 체육 수업 전에 미세먼지·초미세먼지와 기상청 단기예보를 함께 보고 아이 기준 행동(마스크, 우산, 겉옷, 실내 대체)을 정리하는 스킬. API 키 없이 k-skill 공개 프록시로 조회한다. "오늘 놀이터 가도 돼?", "내일 아침 등원할 때 우산 챙겨야 해?", "미세먼지 때문에 바깥놀이 괜찮아?" 같은 요청에 사용. 비 오는 날 갈 실내 장소 추천은 k-parent-play-finder.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: concept
---

# 바깥활동 체크

## 핵심 동작

아이가 밖에 나가기 전에 공기질과 날씨를 한 번에 확인해, 부모가 바로 할 일로 바꿔 준다.
에어코리아 미세먼지와 기상청 단기예보를 [k-skill 공개 프록시](../../docs/kskill-proxy.md)로 조회하므로 부모에게 API 키가 필요 없다.

원본: NomaDamas/k-skill `fine-dust-location`, `korea-weather` (MIT). 바꾼 내용은 `references/NOTICE.md`.

## 사용 시점

- "오늘 놀이터 가도 돼?"
- "내일 아침 등원할 때 우산 챙겨야 해?"
- "미세먼지 나쁨이면 체육 수업 실내로 하나?"
- "주말 오후 공원 소풍 괜찮을까?"

## 준비 사항

- `curl` (선택: `jq`)
- 선택: `KSKILL_PROXY_BASE_URL` (비우면 공개 프록시)

## 전형적 흐름

### 1. 입력 확인

없으면 짧게 묻는다. 추측하지 않는다.

- 지역: 구·동 단위 (예: `서울 강남구`). 정확한 집 주소는 받지 않는다.
- 시각: 지금 / 내일 아침 등원 시각 / 특정 시간대
- 아이 연령대: 영유아 / 초등 저학년 / 초등 고학년 이상
- 호흡기 민감 여부 (천식·비염 등). 있다고 하면 기준을 한 단계 엄격하게 본다. 이 정보는 저장하지 않는다.

### 2. 미세먼지 조회

```bash
BASE="${KSKILL_PROXY_BASE_URL:-https://k-skill-proxy.nomadamas.org}"; BASE="${BASE%/}"
curl -fsS --get "${BASE}/v1/fine-dust/report" --data-urlencode "regionHint=서울 강남구"
```

- `ambiguous_location`이면 `candidate_stations`를 보여 주고 고르게 한 뒤 `stationName=...`으로 다시 조회한다.
- 미세먼지는 측정값(현재)이다. 내일 예보가 필요하면 에어코리아 예보 페이지 확인을 안내한다.

### 3. 날씨 조회

```bash
curl -fsS --get "${BASE}/v1/korea-weather/forecast" --data-urlencode "lat=37.5172" --data-urlencode "lon=127.0473"
```

- 위도·경도는 구청·주민센터 같은 공공 지점 좌표를 쓴다. 집 좌표를 쓰지 않는다.
- 주로 볼 항목: `TMP` 기온, `POP` 강수확률, `PTY` 강수형태, `PCP` 강수량, `WSD` 풍속, `SKY` 하늘상태.
- 원하는 시간대(`fcstDate`, `fcstTime`)만 골라 읽는다.

### 4. 아이 기준 행동으로 정리

판단표는 `references/outdoor-guide.md`를 따른다. 핵심만:

- 미세먼지 등급이 `나쁨` 이상이면 바깥놀이를 줄이거나 실내 대체를 권한다. `매우나쁨`이면 실내 활동을 권한다.
- 강수확률 60% 이상 또는 강수형태가 비·눈이면 우산·우비를 챙긴다.
- 기온·풍속에 따라 겉옷을 권한다.
- 학교·유치원의 실외 수업 여부는 기관이 정한다. "기관 공지를 확인하라"고 덧붙인다.

## 출력 형식

- 지역 / 측정소 / 조회 시각(KST) / 예보 발표 시각(`baseDate` `baseTime`)
- PM10·PM2.5 값과 등급, 통합대기등급
- 해당 시간대 기온, 강수확률, 강수형태, 풍속
- 한 줄 결론: "바깥놀이 괜찮음 / 짧게 / 실내 권장"
- 챙길 것: 마스크, 우산, 겉옷, 물
- 실내 대안이 필요하면 `k-parent-play-finder`로 넘긴다고 안내

## 완료 조건

- 지역과 시간대를 확인했다.
- 공기질과 날씨를 모두 조회했거나, 실패한 쪽을 분명히 알렸다.
- 조회 시각과 원천(에어코리아, 기상청)을 적었다.
- 결론과 챙길 것을 아이 연령 기준으로 정리했다.

## 실패 모드

- 공개 프록시 `429`/`5xx`: 원천 호출 한도나 장애. 에어코리아(airkorea.or.kr)·기상청(weather.go.kr) 직접 확인을 안내한다.
- 측정소가 애매함: 후보를 보여 주고 고르게 한다.
- 예보 발표 직후 데이터 미준비: 직전 발표 시각으로 다시 조회한다.

## 참고

- 의학적 판단을 하지 않는다. 아이가 기침·호흡곤란 같은 증상을 보이면 `k-parent-child-health`와 의료진 상담으로 넘긴다.
- 위치, 아이 건강 정보는 저장하지 않는다.
- 프록시 사용 규칙: `docs/kskill-proxy.md`

## 관련 문서

- `docs/features/k-parent-outdoor-check.md`
