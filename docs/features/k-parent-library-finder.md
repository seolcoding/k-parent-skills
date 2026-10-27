# 아이 책 도서관 찾기 컨셉 문서

`k-parent-library-finder`는 아이 책을 찾고, 가까운 공공도서관의 소장·대출 가능 여부를 확인하는 컨셉 스킬이다.

## 데이터 경로

| 경로 | 원천 | 키 |
| --- | --- | --- |
| k-skill 공개 프록시 `/v1/data4library/book-search`, `book-detail`, `libraries-by-book`, `book-exists`, `library-search` | 도서관 정보나루(국립중앙도서관) | 부모 쪽 없음 |
| `packages/k-parent-source-library` `fetchLibraries` | 도서관 정보나루 도서관 목록 | `KSKILL_LIBRARY_KEY` |

2026-10-27 키 없이 `book-search`, `libraries-by-book`, `library-search`(17개 시·도 코드) 200 확인. 프록시 사용 규칙은 `docs/kskill-proxy.md`.

## 현재 범위

- 키워드·ISBN으로 책 확정
- 지역코드 기준 소장 도서관, 특정 도서관 대출 가능 여부
- 학년 적합성은 추정으로 표시

## 가드레일

- 조회만 한다. 대출 예약·상호대차·도서관 로그인은 하지 않는다.
- 아이 이름, 도서관 회원번호는 받지 않는다.

## 출처

NomaDamas/k-skill `library-book-search` (MIT)를 개작했다. `skills/k-parent-library-finder/references/NOTICE.md` 참고.

## 다음 구현 후보

- 교과 연계 추천 도서 목록과 연결 (`k-parent-content-recommender`, `k-parent-quiz-maker`)
- `book-detail`의 연령별 대출 정보로 학년 적합성 보강
- 우리 `k-parent-proxy`로 라우트 이전 (배포 전 필수)
