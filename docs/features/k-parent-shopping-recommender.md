# 준비물 쇼핑 추천 기능 문서

부모를 위한 자녀 준비물/교재/육아용품 쇼핑 추천 스킬이다. 현재는
`packages/k-parent-source-naver` + `packages/k-parent-source-coupang` 어댑터 기반 구현으로 동작한다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-source-naver` | 네이버 쇼핑 가격 비교와 블로그 후기 검색 |
| `packages/k-parent-source-coupang` | 쿠팡 파트너스 상품 후보, HMAC 서명, 필수 제휴 고지 |

## 개요

네이버 쇼핑 가격 비교를 핵심으로 두고, 구매 의도가 있을 때 쿠팡 파트너스 제휴 데이터를 보조로
결합한다. 가격/배송/리뷰/재고/대체품을 신뢰 가능한 출처·수집 시각과 함께 정리한다.

## 데이터 소스 / 함수

- `packages/k-parent-source-naver`
  - `fetchShopping({ query, display })` → `title`, `link`, `image`, `lprice`, `hprice`, `mallName`, `productId`, `brand`, `category`
  - `fetchBlog({ query })` → 리뷰/후기 참고 (`title`, `link`, `bloggername`, `postdate`)
- `packages/k-parent-source-coupang`
  - `fetchProducts({ keyword, limit })` → `productName`, `productPrice`, `productImage`, `productUrl`, `isRocket`, `categoryName`, `disclosure`

## 환경변수

- `KSKILL_NAVER_CLIENT_ID`, `KSKILL_NAVER_CLIENT_SECRET` — Naver Developers 검색 API credentials.
- `KSKILL_COUPANG_ACCESS_KEY`, `KSKILL_COUPANG_SECRET_KEY` — Coupang Partners API credentials.

## 제휴 고지 (필수)

쿠팡 파트너스 상품/링크를 노출할 때는 반드시 다음 문구를 표시한다:

> 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 받을 수 있음

이 문구는 `fetchProducts` 결과의 모든 항목 및 상단 `disclosure` 필드에 자동 포함되어 누락을 방지한다.

## 가드레일

- 결제/주문/장바구니/예약/로그인/취소/자녀 개인정보 입력은 사용자 승인 후에만 진행한다.
- 행동 후보는 `packages/k-parent-core`의 `guardActionCandidate({ type })`로 검사하며,
  `purchase`/`payment`/`application` 등 민감 행동은 `executable: false`, `requiresConfirmation: true`로 반환된다.

## 출력 형식

품목별: 가격(최저가/판매처/범위), 배송(로켓배송/배송비/도착 가능성), 리뷰(요약+링크),
재고(확인 가능 시), 대체품(1~2개, 비제휴/오프라인/중고 포함), 출처/수집 시각, 쿠팡 제휴 고지.

## 테스트

- `npm test --workspace k-parent-source-naver` (오프라인)
- `npm test --workspace k-parent-source-coupang` (오프라인)
- 각 source package는 내부 fixture로 오프라인 정규화 테스트를 수행한다.

## 픽스처 갱신

```bash
KSKILL_NAVER_CLIENT_ID=... KSKILL_NAVER_CLIENT_SECRET=... npm run refresh:fixtures --workspace k-parent-source-naver
KSKILL_COUPANG_ACCESS_KEY=... KSKILL_COUPANG_SECRET_KEY=... npm run refresh:fixtures --workspace k-parent-source-coupang
```

## 상태

`packages/k-parent-source-naver`, `packages/k-parent-source-coupang` 어댑터 기반으로 구현되었다.

## 남은 확장 후보

- 중고/오프라인 대체품 source 후보 추가
- 가격 변동·품절·배송비 freshness 경고 강화
- 학년/준비물 목록 기반 묶음 구매 후보 생성
