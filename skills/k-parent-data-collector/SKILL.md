---
name: k-parent-data-collector
description: 대한민국 부모 생활정보를 여러 소스에서 수집·정규화하는 내부 파이프라인 스킬. 출처·수집시각·freshness를 기록하며 학교·축제·행사·문화·트렌드 데이터를 모은다(packages/k-parent-source-naver runCollector). "여러 소스에서 부모 데이터 모아줘", "행사 수집 파이프라인 만들어줘" 같은 수집 작업에 사용. 최종 사용자용 단건 조회는 각 도메인 스킬(k-parent-school-info, k-parent-play-finder 등)을 쓴다.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: implemented
---

# 부모 데이터 수집기

## 핵심 동작

여러 공개/상용 출처(공식 API, 상용 API, 프록시, 캐시)에서 부모 생활정보를 수집·정규화하고,
provenance(출처)와 freshness(신선도)를 관리한다. 차단되거나 오래된(stale) 출처 실패를 **숨기지 않고 그대로 노출**한다.

## 사용 시점

- "실제 학교데이터가 필요해", "시간표 수집해야 해"
- "축제, 행사, 평생교육 크롤링하자", "지역 트렌드 데이터 모아줘"
- 여러 출처에서 같은 주제 데이터를 모아 비교/병합해야 할 때

## 범용 러너

`packages/k-parent-source-naver`의 `runCollector(tasks, options)`를 사용한다.
이 러너는 **의존성 주입** 방식이라 특정 source 패키지를 직접 require하지 않으며, 각 task가 자신의 `fetch()`를 제공한다.

```js
const { runCollector } = require("k-parent-source-naver");

const report = await runCollector([
  {
    name: "naver-shop",
    source: { name: "Naver Shopping", url: "https://openapi.naver.com/v1/search/shop.json", type: "commercial" },
    fetch: () => fetchShopping({ query: "물티슈" }).then((r) => r.items),
  },
  {
    name: "coupang",
    source: { name: "Coupang Partners", url: "https://api-gateway.coupang.com", type: "affiliate" },
    fetch: () => fetchProducts({ keyword: "물티슈" }).then((r) => r.items),
  },
], { now: new Date() });
```

반환값: `{ collectedAt, dedupeNote, okCount, failureCount, hasFailures, results, failures }`.
각 `result`에는 `source`(freshness 포함), `collectedAt`, `count`, `rows`가 들어 있다.

## 전형적 흐름

### 1. 출처 등록

source name, source type(API/HTML/PDF/RSS/calendar/screenshot), region/department,
crawl frequency, legal/robots/terms notes를 기록한다.

### 2. 러너로 수집

각 출처를 `{ name, source, fetch }` task로 감싸 `runCollector`로 실행한다.
raw payload는 출처별 원본 행으로 `rows`에 보존되고, source URL/fetched_at/freshness가 자동 기록된다.

### 3. 출처 우선순위 적용

1. 공식/공공 출처(NEIS 등) 우선
2. 상용/제휴 출처(네이버, 쿠팡) 보조
3. 동일 항목이 여러 출처에 있으면 더 권위 있고 더 신선한(fresh) 출처를 우선

### 4. 신선도와 출처 노출

모든 결과에 출처(이름/유형/URL)와 `fetchedAt`, freshness 상태(`fresh`/`stale`/`unknown`)를 표시한다.
stale 데이터는 stale임을 명시하고 출처 링크를 함께 제공한다.

### 5. 실패 출처 노출

차단(blocked)되거나 오류 난 출처는 `failures` 배열에 `blocked: true`, `error`, `status`와 함께 노출된다.
실패를 조용히 삼키거나 빈 결과로 위장하지 않고, 어떤 출처가 실패했는지 사용자에게 보고한다.

### 6. 중복 제거 책임 분리

러너는 출처별 원본 행을 보존한다. 중복 제거는 호출자가 `source`/`productId`/`link` 기준으로 수행한다(`dedupeNote` 참고).

## 출력 형식

- 대상 아이 나이/학년 또는 수집 대상 세그먼트
- 지역, source family, collection scope
- 날짜 범위, 수집 시각, 확인 기준일
- source URL, source type, freshness, 실패/차단 상태
- 비용, 마감일, 준비물, 필요 서류가 있는 normalized fields
- 신청/예약/구매/로그인 상태 후보
- 중복 기준과 confidence/review-needed flag
- 다음 수집/검증 행동

## 가드레일

- 로그인, 신청 제출, 결제, 취소, 자녀 개인정보 입력은 사용자 승인 전 수행하지 않는다
  (`packages/k-parent-core`의 `guardActionCandidate`).
- 불안정한 비공식 페이지는 fallback과 수동 확인 경로를 둔다.

## 완료 조건

- 수집 출처와 수집 시각이 남아 있다.
- 중복과 stale 상태를 판단할 수 있다.
- 차단/실패 출처가 숨겨지지 않고 노출된다.
- 모바일 에이전트가 신뢰 가능한 최신성 상태를 보여줄 수 있다.

## 참고

- 크롤링 실패를 숨기지 않는다.
- freshness와 출처는 항상 사용자 응답/제품 UI에 함께 노출한다.

## 관련 문서

- `docs/features/k-parent-data-collector.md`
