---
name: k-parent-shopping-recommender
description: 대한민국 부모가 준비물·교재·장난감·육아용품을 살 때 쓰는 스킬. 네이버 쇼핑(packages/k-parent-source-naver)으로 가격·배송·리뷰·재고를 비교하고 쿠팡 파트너스(packages/k-parent-source-coupang)는 제휴 고지와 함께 보조로 제공한다. "초등 입학 준비물 추천해줘", "○○ 교재 어디가 싸", "유아 장난감 가격 비교해줘" 같은 요청에 사용. 결제·구매는 사용자 승인 전 실행하지 않는다.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: implemented
---

# 준비물 쇼핑 추천

## 핵심 동작

부모가 학교·학원·놀이·영양 문맥에서 필요한 물건(준비물/교재/육아용품)을 구매 후보로 정리하도록 돕는다.
네이버 쇼핑 가격 비교를 핵심으로 두고, 쿠팡 파트너스 제휴 링크는 구매 의도가 있을 때 붙는 보조 기능이다.
제휴 링크에는 **필수 고지**를 반드시 함께 표시한다.

## 사용 시점

- "이 준비물 어디서 사면 돼?", "초등 1학년 준비물 가격 비교해줘"
- "학교 안내문 준비물 쿠팡 링크로 찾아줘"
- "학원 교재 구매 후보 정리해줘", "아이 장난감 추천해줘"
- "알레르기 없는 간식 후보 찾아줘"

## 데이터 소스 / 함수

- 네이버 쇼핑/블로그: `packages/k-parent-source-naver`
  - `fetchShopping({ query, display })` → `title`, `link`, `image`, `lprice`, `hprice`, `mallName`, `productId`, `brand`, `category`
  - `fetchBlog({ query })` → 사용 후기/리뷰 참고용 (`title`, `link`, `bloggername`, `postdate`)
  - 인증: `KSKILL_NAVER_CLIENT_ID`, `KSKILL_NAVER_CLIENT_SECRET`
- 쿠팡 파트너스 제휴: `packages/k-parent-source-coupang`
  - `fetchProducts({ keyword, limit })` → `productName`, `productPrice`, `productImage`, `productUrl`, `isRocket`, `categoryName`
  - 결과의 모든 항목과 상단에 제휴 고지 필드 `disclosure`가 자동 포함된다.
  - 인증: `KSKILL_COUPANG_ACCESS_KEY`, `KSKILL_COUPANG_SECRET_KEY`

## 전형적 흐름

### 1. 구매 맥락 확인

구매 필요가 실제로 있는지, 출처(학교문서/학원알림/행사준비물/식단/직접요청), 수량, 마감일/필요일,
아이 나이·학년, 예산, 배송 가능 기한, 피해야 할 성분/재질/브랜드를 확인한다.

### 2. 물품 요구사항 정규화

상품명만 바로 검색하지 말고 required/optional, size/spec, age suitability, safety constraints,
deadline fit, 재사용/중고/오프라인 대안 여부로 요구사항을 구조화한다.

### 3. 네이버 가격 비교 우선

`fetchShopping`으로 가격을 비교하고, `fetchBlog`로 리뷰/후기 신호를 보강한다.
판매처(`mallName`)와 최저가(`lprice`)를 출처/수집 시각과 함께 제시한다.

### 4. 쿠팡 제휴 고지 추가

구매 의도가 확인되면 `fetchProducts`로 쿠팡 제휴 후보를 추가한다.
쿠팡 링크/상품을 사용자에게 보여줄 때는 반드시 다음 고지를 함께 표시한다(누락 금지):

> 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 받을 수 있음

`fetchProducts` 결과의 `disclosure` 필드가 이 문구를 담고 있다.

### 5. 부작용 있는 행동 차단

결제(payment/purchase), 장바구니 담기/주문(application), 예약(reservation), 로그인, 취소,
자녀 개인정보 입력은 **사용자 명시 승인 후에만** 진행한다. 자동 실행하지 않는다.
행동 후보는 `packages/k-parent-core`의 `guardActionCandidate({ type })`로 검사하고,
`requiresConfirmation: true`이면 실행 전 사용자 승인을 받는다(`purchase`/`payment`/`application` 등은 `executable: false`).

## 출력 형식

각 추천 품목마다 다음을 정리한다:

- 가격: 최저가(`lprice`/`productPrice`), 판매처(`mallName`), 가능하면 가격 범위
- 배송: 로켓배송 여부(`isRocket`), 배송비/무료배송, 마감일 대비 도착 가능성
- 리뷰: 네이버 블로그 후기 또는 상품 리뷰 요약 (참고 링크)
- 재고: 확인 가능 시 표기, 불확실하면 "확인 필요"로 명시
- 대체품: 더 저렴/적합한 대안 1~2개 (비제휴/오프라인/중고 포함)
- 출처/수집 시각 + 쿠팡 제휴 고지
- 아이 나이/학년, 대상 연령, 지역/배송 조건
- 준비물 출처 문서, 마감일, 비용 범위, 필요 서류가 있으면 분리
- 부모의 다음 행동과 사용자 확인 필요 여부

## 완료 조건

- 구매 필요와 출처를 확인했다.
- 네이버 가격 비교를 우선 제시하고 쿠팡 제휴는 보조로 붙였다.
- 제휴 링크가 있으면 필수 고지를 표시했다.
- 결제/장바구니 등 side effect를 실행하지 않았다(승인 전 차단).

## 실패 모드

- 학교 준비물/교재 ISBN·판본이 불명확함 → 확인 요청
- 배송일이 마감일보다 늦을 수 있음 → 명시
- 건강/영양/알레르기 상품을 의학적 판단처럼 단정하지 않음

## 참고

- 제휴 수익보다 부모에게 맞는 상품 적합성을 우선한다.
- 가격/재고는 변동성이 크므로 stale 가능성을 명시하고 출처 링크를 제공한다.
- 아이 안전/연령 적합성/알레르기는 단정하지 말고 보호자 확인 항목으로 남긴다.

## 관련 문서

- `docs/features/k-parent-shopping-recommender.md`
