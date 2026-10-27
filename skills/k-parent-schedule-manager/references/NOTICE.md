# 출처와 개작 내역

## 공휴일 확인

- 원본: NomaDamas/k-skill `korean-holiday-calendar/instruction.md`
- 원본 저장소: https://github.com/NomaDamas/k-skill (커밋 `02081f8`, 2026-10-27 확인)
- 라이선스: MIT, `Copyright (c) 2026` NomaDamas/k-skill contributors
- 방식: 원문을 복사하지 않고 다시 썼다. 프록시 라우트와 파라미터(`operation`, `year`, `month`)는 원본 프록시 인터페이스를 따른다.
- 바꾼 내용: 독립 스킬 대신 캘린더 후보 정리 흐름의 한 단계로 넣었다. 공휴일과 겹치는 일정에 확인 메모를 붙이고, 재량휴업일·방학은 NEIS 학사일정으로 넘기도록 경계를 정했다. 기념일·24절기·잡절 operation은 부모 일정에 필요 없어 뺐다.
