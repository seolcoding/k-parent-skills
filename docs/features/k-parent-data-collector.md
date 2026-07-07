# 부모 데이터 수집 기능 문서

여러 공개/상용 출처에서 부모 생활정보를 수집하는 범용 러너 스킬이다. 현재는
`packages/k-parent-source-naver`의 `runCollector` 기반 구현으로 동작한다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-source-naver` | dependency-injected `runCollector(tasks, options)` 범용 수집 러너와 Naver 검색/쇼핑 API 어댑터 |

## 환경변수

- `KSKILL_NAVER_CLIENT_ID`, `KSKILL_NAVER_CLIENT_SECRET` — Naver Developers 검색 API credentials.

## 개요

출처별 fetcher를 주입받아 실행하고, 수집 시각/출처/freshness를 기록하며, 차단·오류 출처를
숨기지 않고 그대로 노출한다. 정규화·중복 제거는 호출자가 일관 기준으로 수행한다.

## 범용 러너

`packages/k-parent-source-naver`의 `runCollector(tasks, options)`를 사용한다. 의존성 주입 방식이라
특정 source 패키지를 직접 require하지 않으며, 각 task가 자신의 `fetch()`를 제공한다.

- 입력: `[{ name, source: { name, url, type }, fetch: () => Promise<rows>, maxAgeHours? }]`
- 출력: `{ collectedAt, dedupeNote, okCount, failureCount, hasFailures, results, failures }`
- 각 `result`: `source`(freshness 포함), `collectedAt`, `count`, `rows`

## 출처 우선순위

1. 공식/공공 출처(NEIS 등) 우선
2. 상용/제휴 출처(네이버, 쿠팡) 보조
3. 중복 시 더 권위 있고 더 신선한 출처 우선

## 신선도 / 출처 기록

모든 결과에 출처 메타데이터와 freshness 상태(`fresh`/`stale`/`unknown`)를 기록한다.
stale 데이터는 명시하고 출처 링크를 함께 제공한다.

## 실패 노출

차단(blocked)되거나 오류 난 출처는 `failures` 배열에 `blocked: true`, `error`, `status`와 함께
노출된다. 실패를 조용히 삼키거나 빈 결과로 위장하지 않는다.

## 중복 제거

러너는 출처별 원본 행을 보존하며, 중복 제거는 호출자가 `source`/`productId`/`link` 기준으로
수행한다(`dedupeNote`).

## 가드레일

로그인/신청/결제/취소/자녀 개인정보 입력은 사용자 승인 전 수행하지 않는다
(`packages/k-parent-core`의 `guardActionCandidate`). 불안정한 비공식 페이지는 fallback과 수동 확인 경로를 둔다.

## 테스트

- `npm test --workspace k-parent-source-naver` (오프라인, fake fetcher 포함)

## 픽스처 갱신

```bash
KSKILL_NAVER_CLIENT_ID=... KSKILL_NAVER_CLIENT_SECRET=... npm run refresh:fixtures --workspace k-parent-source-naver
```

## 상태

`packages/k-parent-source-naver`의 `runCollector` 기반 범용 러너로 구현되었다.

## 남은 확장 후보

- NEIS/TourAPI/문화센터 source task preset 추가
- 지역 부모 커뮤니티·계절 키워드 수집 큐 분리
- 실패 출처 재시도 정책과 수집 리포트 포맷 고정
