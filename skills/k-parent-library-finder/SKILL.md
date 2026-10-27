---
name: k-parent-library-finder
description: 대한민국 부모가 아이 책을 찾고 동네 공공도서관 소장·대출 가능 여부를 확인하는 스킬. 도서관 정보나루(국립중앙도서관) 데이터를 API 키 없이 k-skill 공개 프록시로 조회하고, 학년·관심사에 맞는 책 후보와 빌릴 수 있는 도서관을 정리한다. "구름빵 우리 동네 도서관에 있어?", "초등 2학년 공룡 책 찾아줘", "이 책 대출 가능한 도서관 알려줘" 같은 요청에 사용. 도서관 강좌·프로그램 신청은 k-parent-culture-center-events, 영상 콘텐츠는 k-parent-content-recommender.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: concept
---

# 아이 책 도서관 찾기

## 핵심 동작

아이에게 읽힐 책을 찾고, 그 책을 **가까운 공공도서관에서 지금 빌릴 수 있는지** 확인한다.
도서관 정보나루 Open API를 [k-skill 공개 프록시](../../docs/kskill-proxy.md)로 부르므로 부모에게 API 키가 필요 없다.

원본: NomaDamas/k-skill `library-book-search` (MIT). 바꾼 내용은 `references/NOTICE.md`.

## 사용 시점

- "구름빵 우리 동네 도서관에 있어?"
- "초등 2학년이 읽을 공룡 책 찾아줘"
- "이 ISBN 책 서울에서 대출 가능한 곳"
- "방학 숙제 독후감용 책, 근처 도서관에서 빌릴 수 있는 걸로"

## 준비 사항

- `curl`
- 선택: `KSKILL_PROXY_BASE_URL`

## 전형적 흐름

### 1. 입력 확인

- 책 제목·키워드 또는 ISBN
- 지역: 시·도 (필요하면 구) → 지역코드는 `references/region-codes.md`
- 아이 학년·관심사 (책 후보를 고를 때만)

### 2. 책 찾기

```bash
BASE="${KSKILL_PROXY_BASE_URL:-https://k-skill-proxy.nomadamas.org}"; BASE="${BASE%/}"
curl -fsS --get "${BASE}/v1/data4library/book-search" --data-urlencode "keyword=공룡" --data-urlencode "pageSize=10"
```

- `response.docs[].doc`의 `bookname`, `authors`, `publisher`, `publication_year`, `isbn13`을 쓴다.
- 결과는 대출이 많은 순이다. 아이 학년에 맞는지는 제목·출판사(아동 출판사 여부)로만 가늠하고, 확실하지 않으면 "학년 적합성은 확인 필요"라고 적는다.

### 3. 이 책을 가진 도서관

```bash
curl -fsS --get "${BASE}/v1/data4library/libraries-by-book" --data-urlencode "isbn=9788961700535" --data-urlencode "region=11" --data-urlencode "pageSize=10"
```

- 구 단위로 좁히려면 `dtl_region`(5자리)을 추가한다.

### 4. 지금 빌릴 수 있는지

```bash
curl -fsS --get "${BASE}/v1/data4library/book-exists" --data-urlencode "libraryCode=111182" --data-urlencode "isbn13=9788961700535"
```

- `hasBook`(소장), `loanAvailable`(대출 가능)을 읽는다.
- 도서관 시스템 동기화가 늦을 수 있다. 방문 전 도서관 홈페이지나 전화 확인을 권한다.

### 5. 정리

- 책: 제목, 저자, 출판사, 출판연도, ISBN
- 도서관: 이름, 주소, 소장 여부, 대출 가능 여부, 조회 시각
- 다음 할 일: 상호대차·예약은 도서관 회원 로그인이 필요하므로 부모가 직접 하도록 안내

## 데이터 소스

| 경로 | 용도 | 키 |
| --- | --- | --- |
| `/v1/data4library/book-search` | 키워드 검색 | 없음 (공개 프록시) |
| `/v1/data4library/book-detail` | ISBN 상세, `loaninfoYN=Y`면 연령별 대출 정보 | 없음 |
| `/v1/data4library/libraries-by-book` | 소장 도서관 목록 | 없음 |
| `/v1/data4library/book-exists` | 특정 도서관 소장·대출 가능 | 없음 |
| `packages/k-parent-source-library` `fetchLibraries({ region, dtlRegion })` | 지역 도서관 목록(우리 어댑터) | `KSKILL_LIBRARY_KEY` |

## 완료 조건

- 책을 ISBN까지 확정했다 (여러 권이면 부모가 골랐다).
- 지역 기준 소장 도서관과 대출 가능 여부를 확인했거나, 못 찾은 이유를 알렸다.
- 조회 시각과 "방문 전 확인" 안내를 적었다.

## 실패 모드

- 공개 프록시 장애·`429`: 도서관 정보나루(data4library.kr)나 지역 도서관 홈페이지 안내
- ISBN 자리수 오류: 하이픈 뺀 10자리 또는 13자리로 다시 요청
- 도서관 후보가 많음: 부모가 갈 수 있는 구를 물어 좁힌다.

## 참고

- 조회만 한다. 대출 예약, 상호대차, 도서관 로그인은 하지 않는다.
- 아이 이름, 도서관 회원번호는 받지 않는다.

## 관련 문서

- `docs/features/k-parent-library-finder.md`
