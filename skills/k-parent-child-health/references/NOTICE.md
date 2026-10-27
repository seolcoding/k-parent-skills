# 출처와 개작 내역

- 원본: NomaDamas/k-skill `mfds-drug-safety/instruction.md`, `mfds-food-safety/instruction.md`, `emergency-room-beds/instruction.md`
- 원본 저장소: https://github.com/NomaDamas/k-skill (커밋 `02081f8`, 2026-10-27 확인)
- 라이선스: MIT, `Copyright (c) 2026` NomaDamas/k-skill contributors
- 방식: 원문을 복사하지 않고 다시 썼다. 프록시 라우트 이름과 파라미터(`itemName`, `query`, `limit`)는 원본 프록시 인터페이스를 따른다.

## 바꾼 내용

- 세 스킬을 "아이 약·먹거리·급할 때 갈 곳" 하나로 합쳤다.
- 대상을 아이로 좁혔다: 개월 수·체중 범위를 먼저 묻고, 용량 계산·조정을 금지했다.
- 소아 위험 신호 목록(`red-flags.md`)을 새로 썼다. 생후 3개월 미만 발열, 탈수 신호, 중독·이물을 추가했다.
- 응급실 조회는 k-skill `emergency-room-beds` 패키지 대신 우리 `k-parent-source-emergency`(data.go.kr)와 E-Gen 안내로 바꿨다.
- 건강기능식품 원료·품목신고 조회(성인 보충제 중심)는 뺐다. 회수·부적합 조회만 남겼다.
- k-skill CLI와 Python helper 의존을 뺐다.
