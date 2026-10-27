# 출처와 개작 내역

- 원본: NomaDamas/k-skill `library-book-search/instruction.md`
- 원본 저장소: https://github.com/NomaDamas/k-skill (커밋 `02081f8`, 2026-10-27 확인)
- 라이선스: MIT, `Copyright (c) 2026` NomaDamas/k-skill contributors
- 방식: 원문을 복사하지 않고 다시 썼다. 프록시 라우트 이름과 파라미터(`keyword`, `isbn`, `isbn13`, `region`, `dtl_region`, `libraryCode`)는 원본 프록시 인터페이스를 따른다.

## 바꾼 내용

- 범용 도서 검색을 "아이 책을 동네에서 빌리기" 흐름으로 좁혔다.
- 학년·관심사 기반 후보 선택과 학년 적합성 확인 문구를 넣었다.
- 지역코드 표(`region-codes.md`)를 추가했다.
- 우리 `k-parent-source-library` 어댑터와의 관계를 데이터 소스 표에 적었다.
