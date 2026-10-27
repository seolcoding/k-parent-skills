# 출처와 개작 내역

- 원본: NomaDamas/k-skill `fine-dust-location/instruction.md`, `korea-weather/instruction.md`
- 원본 저장소: https://github.com/NomaDamas/k-skill (커밋 `02081f8`, 2026-10-27 확인)
- 라이선스: MIT, `Copyright (c) 2026` NomaDamas/k-skill contributors
- 방식: 원문을 복사하지 않고 다시 썼다. 프록시 라우트 이름과 파라미터(`regionHint`, `stationName`, `lat`, `lon`, `nx`, `ny`)는 원본 프록시 인터페이스를 따른다.

## 바꾼 내용

- 두 스킬을 "아이가 밖에 나가도 되나" 하나의 질문으로 합쳤다.
- 연령대·호흡기 민감 여부에 따른 판단표(`outdoor-guide.md`)와 챙길 것 목록을 새로 넣었다.
- 집 주소·집 좌표를 받지 않도록 입력 규칙을 바꿨다.
- k-skill CLI(`npx @nomadamas/k-skill`)와 Python helper 의존을 뺐다. `curl`만 쓴다.
