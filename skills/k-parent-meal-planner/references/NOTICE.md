# 출처와 개작 내역

## 키 없는 급식 조회 (SKILL.md 3-0)

- 원본: NomaDamas/k-skill `k-schoollunch-menu/instruction.md`
- 원본 저장소: https://github.com/NomaDamas/k-skill (커밋 `02081f8`, 2026-10-27 확인)
- 라이선스: MIT, `Copyright (c) 2026` NomaDamas/k-skill contributors
- 방식: 원문을 복사하지 않고 다시 썼다. 프록시 라우트와 파라미터(`educationOffice`, `schoolName`, `educationOfficeCode`, `schoolCode`, `mealDate`)는 원본 프록시 인터페이스를 따른다.
- 바꾼 내용: 독립 스킬 대신 기존 식단 스킬의 "키 없을 때" 대체 경로로 넣었다. 알레르기 번호 해석을 우리 코드표에 연결하고, 정규화 봉투를 거치지 않는다는 한계를 명시했다.
