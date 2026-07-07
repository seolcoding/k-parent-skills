# 문화센터/행사 기능 문서

`k-parent-culture-center-events`는 문화센터, 도서관, 마트, 백화점, 공공기관의 아이 대상 강좌와 행사를 찾는 스킬이다.

## 현재 범위

- 지역, 아이 나이, 분야, 요일, 예산으로 조건 정리
- 모집 중/예정/마감 상태 구분
- 수강료, 재료비, 접수 기간, 신청 링크를 표준화

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-source-seoul` | 서울 공공서비스예약 문화/교육/체육 예약 후보 |
| `packages/k-parent-source-library` | 도서관 정보나루 도서관·프로그램 후보 |
| `packages/k-parent-source-culture` | 문화포털 공연·전시 행사 후보 |

## 환경변수

- `KSKILL_SEOUL_KEY` — 서울 열린데이터광장 인증키.
- `KSKILL_LIBRARY_KEY` — 도서관 정보나루 인증키.
- `KSKILL_CULTURE_KEY` — 문화포털 서비스키.

키 누락 시 source package는 `status: missing_config`를 반환하거나 fixture-first 테스트 경로를 사용한다.

## 픽스처 갱신

```bash
KSKILL_SEOUL_KEY=... npm run refresh:fixtures --workspace k-parent-source-seoul
KSKILL_LIBRARY_KEY=... npm run refresh:fixtures --workspace k-parent-source-library
KSKILL_CULTURE_KEY=... npm run refresh:fixtures --workspace k-parent-source-culture
```

## 남은 확장 후보

- 문화센터별 접수 페이지 패턴 수집
- 도서관 어린이 프로그램 공지 파서
- 연령 기준 normalization
