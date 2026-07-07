# NEIS 부모 시나리오 300개 라이브 테스트 리포트

- 생성시각: `2026-05-30T13:20:02.454870+00:00`
- Base URL: `https://open.neis.go.kr/hub`
- 시나리오: 300개
- 통과: 300개
- 원시 로그: `tmp/neis_parent_scenario_report.json`
- 주의: NEIS는 아이 개인의 관심사를 직접 보유하지 않는다. 관심사 시나리오는 부모가 입력한 관심사를 공식 등록 학원/학교 일정/시간표와 연결하는 방식으로만 해석한다.

## 카테고리별 요약

| 카테고리 | 개수 | 통과 | 사용 API |
|---|---:|---:|---|
| 관심사/학원 | 30 | 30 | acaInsTiInfo |
| 급식/식단 | 45 | 45 | mealServiceDietInfo |
| 복합쿼리/멀티스텝 | 30 | 30 | SchoolSchedule, classInfo, elsTimetable, hisTimetable, mealServiceDietInfo, misTimetable, schoolInfo, spsTimetable |
| 부모-아이 대화/시간대 | 20 | 20 | elsTimetable, hisTimetable, misTimetable, spsTimetable |
| 엣지케이스/오류해석 | 20 | 20 | SchoolSchedule, acaInsTiInfo, classInfo, elsTimetable, hisTimetable, mealServiceDietInfo, schoolInfo |
| 파라미터매트릭스/급식일정 | 8 | 8 | SchoolSchedule, mealServiceDietInfo |
| 파라미터매트릭스/시간표복합 | 12 | 12 | elsTimetable, hisTimetable, misTimetable, spsTimetable |
| 파라미터매트릭스/학교위치 | 10 | 10 | schoolInfo |
| 파라미터매트릭스/학년반 | 10 | 10 | classInfo |
| 파라미터매트릭스/학원복합 | 10 | 10 | acaInsTiInfo |
| 학교맥락/조회준비 | 25 | 25 | classInfo, schoolInfo |
| 학사일정/내일 | 40 | 40 | SchoolSchedule |
| 학습/시간표 | 40 | 40 | elsTimetable, hisTimetable, misTimetable, spsTimetable |

## 300개 시나리오 로그

### NEIS-PARENT-001 고등학생 1교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-04 1교시에 뭘 배우나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 1교시 수업
- 답변 예시: 20260304 1교시: 공통수학1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-002 고등학생 2교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-04 2교시에 뭘 배우나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 2교시 수업
- 답변 예시: 20260304 2교시: 정보

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=2` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-003 고등학생 3교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-04 3교시에 뭘 배우나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 3교시 수업
- 답변 예시: 20260304 3교시: 공통영어1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=3` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-004 고등학생 4교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-04 4교시에 뭘 배우나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 4교시 수업
- 답변 예시: 20260304 4교시: 공통국어1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=4` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-005 고등학생 5교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-04 5교시에 뭘 배우나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 5교시 수업
- 답변 예시: 20260304 5교시: 과학탐구실험1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=5` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-006 중학생 1교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-04 1교시에 뭘 배우나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 1교시 수업
- 답변 예시: 20260304 1교시: 도덕

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=1` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-007 중학생 2교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-04 2교시에 뭘 배우나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 2교시 수업
- 답변 예시: 20260304 2교시: 수학

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=2` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-008 중학생 3교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-04 3교시에 뭘 배우나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 3교시 수업
- 답변 예시: 20260304 3교시: 진로와 직업

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=3` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-009 중학생 4교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-04 4교시에 뭘 배우나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 4교시 수업
- 답변 예시: 20260304 4교시: 사회

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=4` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-010 중학생 5교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-04 5교시에 뭘 배우나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 5교시 수업
- 답변 예시: 20260304 5교시: 과학

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=5` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-011 초등학생 1교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-02 1교시에 뭘 배우나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 1교시 수업
- 답변 예시: 20260302 1교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=1` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-012 초등학생 2교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-02 2교시에 뭘 배우나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 2교시 수업
- 답변 예시: 20260302 2교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=2` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-013 초등학생 3교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-02 3교시에 뭘 배우나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 3교시 수업
- 답변 예시: 20260302 3교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=3` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-014 초등학생 4교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-02 4교시에 뭘 배우나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 4교시 수업
- 답변 예시: 20260302 4교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=4` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-015 초등학생 5교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-02 5교시에 뭘 배우나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 5교시 수업
- 답변 예시: 20260302 5교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=5` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-016 특수학교 학생 1교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-02 1교시에 뭘 배우나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 1교시 수업
- 답변 예시: 20260302 1교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=1` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-017 특수학교 학생 2교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-02 2교시에 뭘 배우나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 2교시 수업
- 답변 예시: 20260302 2교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=2` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-018 특수학교 학생 3교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-02 3교시에 뭘 배우나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 3교시 수업
- 답변 예시: 20260302 3교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=3` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-019 특수학교 학생 4교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-02 4교시에 뭘 배우나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 4교시 수업
- 답변 예시: 20260302 4교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=4` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-020 특수학교 학생 5교시 수업 확인

- 부모 질문: 우리 아이가 2026-03-02 5교시에 뭘 배우나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 5교시 수업
- 답변 예시: 20260302 5교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=5` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-021 고등학생 하루 수업 흐름

- 부모 질문: 오늘 하루 과목 흐름을 한 번에 볼 수 있나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 하루 시간표
- 답변 예시: 20260304 1교시: 공통수학1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-022 고등학생 1반 수업 확인

- 부모 질문: 아이 반 기준으로 어떤 수업이 잡혀 있나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 학년/반 시간표
- 답변 예시: 20260304 1교시: 공통수학1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-023 고등학생 주간 수업 후보

- 부모 질문: 이번 주 초반에는 어떤 수업이 이어지나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 기간 시간표
- 답변 예시: 20260303 1교시: 입학식

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, GRADE=1, CLASS_NM=1, TI_FROM_YMD=20260302, TI_TO_YMD=20260306` | `INFO-000` 정상 처리되었습니다. | 22/22 |

### NEIS-PARENT-024 고등학생 방과 전 마지막 수업

- 부모 질문: 하교 전에 마지막으로 어떤 수업을 하나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 마지막 교시
- 답변 예시: 20260304 7교시: 체육1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-025 고등학생 내일 준비물 추정용 수업

- 부모 질문: 내일 어떤 과목을 챙겨야 할지 시간표로 볼 수 있나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 다음 등교일 시간표
- 답변 예시: 20260303 1교시: 입학식

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, GRADE=1, CLASS_NM=1, TI_FROM_YMD=20260302, TI_TO_YMD=20260306` | `INFO-000` 정상 처리되었습니다. | 22/22 |

### NEIS-PARENT-026 중학생 하루 수업 흐름

- 부모 질문: 오늘 하루 과목 흐름을 한 번에 볼 수 있나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 하루 시간표
- 답변 예시: 20260304 1교시: 도덕

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 6/6 |

### NEIS-PARENT-027 중학생 1반 수업 확인

- 부모 질문: 아이 반 기준으로 어떤 수업이 잡혀 있나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 학년/반 시간표
- 답변 예시: 20260304 1교시: 도덕

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 6/6 |

### NEIS-PARENT-028 중학생 주간 수업 후보

- 부모 질문: 이번 주 초반에는 어떤 수업이 이어지나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 기간 시간표
- 답변 예시: 20260303 1교시: (창)자율·자치활동

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, GRADE=1, CLASS_NM=1, TI_FROM_YMD=20260302, TI_TO_YMD=20260306` | `INFO-000` 정상 처리되었습니다. | 21/21 |

### NEIS-PARENT-029 중학생 방과 전 마지막 수업

- 부모 질문: 하교 전에 마지막으로 어떤 수업을 하나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 마지막 교시
- 답변 예시: 20260304 6교시: 국어

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 6/6 |

### NEIS-PARENT-030 중학생 내일 준비물 추정용 수업

- 부모 질문: 내일 어떤 과목을 챙겨야 할지 시간표로 볼 수 있나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 다음 등교일 시간표
- 답변 예시: 20260303 1교시: (창)자율·자치활동

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, GRADE=1, CLASS_NM=1, TI_FROM_YMD=20260302, TI_TO_YMD=20260306` | `INFO-000` 정상 처리되었습니다. | 21/21 |

### NEIS-PARENT-031 초등학생 하루 수업 흐름

- 부모 질문: 오늘 하루 과목 흐름을 한 번에 볼 수 있나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 하루 시간표
- 답변 예시: 20260302 1교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-032 초등학생 1반 수업 확인

- 부모 질문: 아이 반 기준으로 어떤 수업이 잡혀 있나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 학년/반 시간표
- 답변 예시: 20260302 1교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-033 초등학생 주간 수업 후보

- 부모 질문: 이번 주 초반에는 어떤 수업이 이어지나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 기간 시간표
- 답변 예시: 20260302 1교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, GRADE=1, CLASS_NM=1, TI_FROM_YMD=20260302, TI_TO_YMD=20260306` | `INFO-000` 정상 처리되었습니다. | 23/23 |

### NEIS-PARENT-034 초등학생 방과 전 마지막 수업

- 부모 질문: 하교 전에 마지막으로 어떤 수업을 하나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 마지막 교시
- 답변 예시: 20260302 9교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-035 초등학생 내일 준비물 추정용 수업

- 부모 질문: 내일 어떤 과목을 챙겨야 할지 시간표로 볼 수 있나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 다음 등교일 시간표
- 답변 예시: 20260302 1교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, GRADE=1, CLASS_NM=1, TI_FROM_YMD=20260302, TI_TO_YMD=20260306` | `INFO-000` 정상 처리되었습니다. | 23/23 |

### NEIS-PARENT-036 특수학교 학생 하루 수업 흐름

- 부모 질문: 오늘 하루 과목 흐름을 한 번에 볼 수 있나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 하루 시간표
- 답변 예시: 20260302 1교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 20/20 |

### NEIS-PARENT-037 특수학교 학생 1반 수업 확인

- 부모 질문: 아이 반 기준으로 어떤 수업이 잡혀 있나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 학년/반 시간표
- 답변 예시: 20260302 1교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 20/20 |

### NEIS-PARENT-038 특수학교 학생 주간 수업 후보

- 부모 질문: 이번 주 초반에는 어떤 수업이 이어지나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 기간 시간표
- 답변 예시: 20260302 1교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, GRADE=1, CLASS_NM=1, TI_FROM_YMD=20260302, TI_TO_YMD=20260306` | `INFO-000` 정상 처리되었습니다. | 96/96 |

### NEIS-PARENT-039 특수학교 학생 방과 전 마지막 수업

- 부모 질문: 하교 전에 마지막으로 어떤 수업을 하나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 마지막 교시
- 답변 예시: 20260302 6교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 20/20 |

### NEIS-PARENT-040 특수학교 학생 내일 준비물 추정용 수업

- 부모 질문: 내일 어떤 과목을 챙겨야 할지 시간표로 볼 수 있나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 다음 등교일 시간표
- 답변 예시: 20260302 1교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, GRADE=1, CLASS_NM=1, TI_FROM_YMD=20260302, TI_TO_YMD=20260306` | `INFO-000` 정상 처리되었습니다. | 96/96 |

### NEIS-PARENT-041 급식 식단 확인 1

- 부모 질문: 오늘 점심에 아이가 뭘 먹나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260504 중식: 칼슘강화찹쌀밥 / 북어미역국 (5.6) / 한방돈갈비찜 (5.6.10.13) / 사천식잡채 (1.5.6.12.13.18) / 배추김치 (9) / 텔레토비마카롱 (1.2.6); 1181.4 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-042 급식 식단 확인 2

- 부모 질문: 급식에 알레르기 번호가 붙은 메뉴가 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260506 중식: [대체식]흰쌀밥 / 땡초주먹밥 (1.5.6.10.13) / 미소된장국 (5.6) / 단무지채깻잎무침 (13) / 라볶이 (1.5.6.13) / 콘치즈팝만두 (1.2.5.6.18) / 배추김치 (9) / 유산균음료 (2); 629.4 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-043 급식 식단 확인 3

- 부모 질문: 칼로리는 어느 정도인가요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260507 중식: 발아현미밥 / 뉴욕돼지곰탕 (5.6.10.15) / 적채부추무침 (13) / 팽이버섯전 (1.6) / 석박지 (9) / 사과; 603.0 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-044 급식 식단 확인 4

- 부모 질문: 단백질이나 영양 정보까지 볼 수 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260508 중식: ★1학년급식-오리뽑기이벤트★ [대체식]흰쌀밥 / [대체식]콩나물김치국 (5.9) / 수제싸이버거 (1.2.5.6.12.15.16) / 오지치즈후라이 (2.5.6.10) / 골라먹는스파클링제로음료(레인보우샤베트or애플민트) / 수제오이무피클 (13) / 그린샐러드&파인애플드레싱 (1.2.4.5.6.9.10.11.12.13.15.16.17.18); 988.8 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-045 급식 식단 확인 5

- 부모 질문: 한 달 급식 중 아이가 좋아할 만한 메뉴를 찾을 수 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260511 중식: 칼슘보리밥 / 닭개장 (5.6.15) / 참나물파채무침 (5.6.13) / 육전구이 (1.2.5.6.10.16) / 오이김치 (9) / 오렌지; 696.8 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-046 급식 식단 확인 6

- 부모 질문: 오늘 점심에 아이가 뭘 먹나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260512 중식: 수수밥 / 쇠고기무국 (5.6.16) / 청경채찜 (5.6.13.18) / 뉴진면닭갈비 (2.5.6.12.13.15.16.18) / 버터찹쌀김부각 (5.6) / 배추김치 (9); 850.1 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-047 급식 식단 확인 7

- 부모 질문: 급식에 알레르기 번호가 붙은 메뉴가 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260513 중식: 다시마무채국 (5.6) / 쭈돈덮밥 (5.6.10.13.16) / 수제오꼬노미야끼 (1.5.6.10.13.17) / 백김치 (9) / 설레임(밀크맛) (1.2.5); 945.6 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-048 급식 식단 확인 8

- 부모 질문: 칼로리는 어느 정도인가요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260514 중식: 칼슘강화찹쌀밥 / 쑥갓어묵국 (1.5.6.9.13) / 알본디가스(스페인식미트볼)그라탕 (1.2.3.5.6.10.12) / 잠발라고등어구이 (1.2.5.7.12.13) / 깍두기 (9) / 소바샐러드 (3.5.6.7.9.12.13.18); 1144.2 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-049 급식 식단 확인 9

- 부모 질문: 단백질이나 영양 정보까지 볼 수 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260515 중식: 발아현미밥 / 실곤약야채무침 (3.5.6.13) / 건새우근대된장국 (5.6.8.9.17.18) / 마늘보쌈 (5.6.10.13) / 보쌈김치 (9) / 카네이션꽃다발머랭쿠키 (1) / 상추쌈&쌈장 (5.6.13); 777.5 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-050 급식 식단 확인 10

- 부모 질문: 한 달 급식 중 아이가 좋아할 만한 메뉴를 찾을 수 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260518 중식: 칼슘기장밥 / 돈육목살김치찌개 (5.6.9.10) / 비름나물무침 (5.6) / 소떡소떡볶음 (2.5.6.10.12.13.15.16.18) / 가자미구이&와사비장 (2.5.6.12.13.16.18) / 깍두기 (9); 705.1 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-051 급식 식단 확인 11

- 부모 질문: 오늘 점심에 아이가 뭘 먹나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260519 중식: 발아현미밥 / 맑은콩나물국 (5.6.9) / 묵은지닭찜 (5.6.9.13.15.18) / 검은콩감자전 (1.5.6) / 열무김치 (9) / 아이스홍시; 880.8 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-052 급식 식단 확인 12

- 부모 질문: 급식에 알레르기 번호가 붙은 메뉴가 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260520 중식: 이블덮은깡총함박오므라이스(1,2,5,6,10,13 ,16,18) &소스(2,5,6,10,12,16) (1.2.5.6.10.12.13.16.18) / 가쓰오장국 (1.2.5.6.9.13) / 토마토아보카도샐러드 (1.2.5.6.12.13) / 깍두기 (9) / 그릴치킨타코 (2.5.6.15.16) / 애플샤인음료 (13); 831.9 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-053 급식 식단 확인 13

- 부모 질문: 칼로리는 어느 정도인가요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260521 중식: 혼합잡곡밥 (5) / 감자옹심이국 (5.6.17) / 짬뽕순두부찜 (5.6.9.13.17.18) / 브로콜리통마늘무침 / 파불고기 (5.6.10.13) / 배추김치 (9); 697.2 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-054 급식 식단 확인 14

- 부모 질문: 단백질이나 영양 정보까지 볼 수 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260522 중식: 칼슘강화찹쌀밥 / 호박잎된장찌개 (5.6) / 오이부추무침 (13) / 배추겉절이 (9) / 오리로스구이 (5) / 쌈무; 985.6 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-055 급식 식단 확인 15

- 부모 질문: 한 달 급식 중 아이가 좋아할 만한 메뉴를 찾을 수 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260526 중식: [가람-슬러시이벤트] 녹두밥 / 계란파국 (1.5.6) / 도라지오이생채 (5.6.13) / 크리미마라로제샹궈 (2.5.6.9.10.13.15.16) / 삼치카레구이 (2.5.6.12.13.16.18) / 깍두기 (9); 903.5 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-056 급식 식단 확인 16

- 부모 질문: 오늘 점심에 아이가 뭘 먹나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260527 중식: [대체식]흰쌀밥 / 미니상하이(해물)파스타 (1.5.6.9.13.17.18) / [대체식]콩나물김치국 (5.9) / 수제직화불고기피자 (2.5.6) / 수제매실에이드 (13) / 블루베리요거트샐러드 (1.2.3.4.5.6.7.8.9.10.11.12) / 수제오이무피클 (13); 893.9 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-057 급식 식단 확인 17

- 부모 질문: 급식에 알레르기 번호가 붙은 메뉴가 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260528 중식: 칼슘수수밥 / 황태두부맑은국 (5.6) / 치즈닭갈비 (2.5.6.13.15) / 스틱김자반 (5.9) / 마늘쫑볶음 (5.6) / 배추김치 (9); 891.1 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-058 급식 식단 확인 18

- 부모 질문: 칼로리는 어느 정도인가요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260529 중식: 칼슘강화찹쌀밥 / 페스츄리스프 (1.2.5.6.15.16.18) / 경양식돈까스(5,6,10) (1.2.5.6.10.12.15.16.18) / 배추김치 (9) / &소스 (1.2.5.6.12.15.16.18) / 레드글로버포도 / 시리얼양배추샐러드 (1.5.6.13); 757.7 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-059 급식 식단 확인 19

- 부모 질문: 단백질이나 영양 정보까지 볼 수 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260504 중식: 칼슘강화찹쌀밥 / 북어미역국 (5.6) / 한방돈갈비찜 (5.6.10.13) / 사천식잡채 (1.5.6.12.13.18) / 배추김치 (9) / 텔레토비마카롱 (1.2.6); 1181.4 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-060 급식 식단 확인 20

- 부모 질문: 한 달 급식 중 아이가 좋아할 만한 메뉴를 찾을 수 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260506 중식: [대체식]흰쌀밥 / 땡초주먹밥 (1.5.6.10.13) / 미소된장국 (5.6) / 단무지채깻잎무침 (13) / 라볶이 (1.5.6.13) / 콘치즈팝만두 (1.2.5.6.18) / 배추김치 (9) / 유산균음료 (2); 629.4 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-061 급식 식단 확인 21

- 부모 질문: 오늘 점심에 아이가 뭘 먹나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260507 중식: 발아현미밥 / 뉴욕돼지곰탕 (5.6.10.15) / 적채부추무침 (13) / 팽이버섯전 (1.6) / 석박지 (9) / 사과; 603.0 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-062 급식 식단 확인 22

- 부모 질문: 급식에 알레르기 번호가 붙은 메뉴가 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260508 중식: ★1학년급식-오리뽑기이벤트★ [대체식]흰쌀밥 / [대체식]콩나물김치국 (5.9) / 수제싸이버거 (1.2.5.6.12.15.16) / 오지치즈후라이 (2.5.6.10) / 골라먹는스파클링제로음료(레인보우샤베트or애플민트) / 수제오이무피클 (13) / 그린샐러드&파인애플드레싱 (1.2.4.5.6.9.10.11.12.13.15.16.17.18); 988.8 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-063 급식 식단 확인 23

- 부모 질문: 칼로리는 어느 정도인가요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260511 중식: 칼슘보리밥 / 닭개장 (5.6.15) / 참나물파채무침 (5.6.13) / 육전구이 (1.2.5.6.10.16) / 오이김치 (9) / 오렌지; 696.8 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-064 급식 식단 확인 24

- 부모 질문: 단백질이나 영양 정보까지 볼 수 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260512 중식: 수수밥 / 쇠고기무국 (5.6.16) / 청경채찜 (5.6.13.18) / 뉴진면닭갈비 (2.5.6.12.13.15.16.18) / 버터찹쌀김부각 (5.6) / 배추김치 (9); 850.1 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-065 급식 식단 확인 25

- 부모 질문: 한 달 급식 중 아이가 좋아할 만한 메뉴를 찾을 수 있나요?
- 아이/상황: 가락고등학교 급식
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260513 중식: 다시마무채국 (5.6) / 쭈돈덮밥 (5.6.10.13.16) / 수제오꼬노미야끼 (1.5.6.10.13.17) / 백김치 (9) / 설레임(밀크맛) (1.2.5); 945.6 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-066 학사일정 확인 1

- 부모 질문: 내일 학교에서 특별한 일정이 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260301 3·1절 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-067 학사일정 확인 2

- 부모 질문: 이번 달 쉬는 날이나 행사가 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260302 대체공휴일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-068 학사일정 확인 3

- 부모 질문: 아이 학년에 해당하는 행사인지 볼 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260303 입학식 (1학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-069 학사일정 확인 4

- 부모 질문: 현장체험학습 같은 준비가 필요한 날을 찾을 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260303 개학식 (2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-070 학사일정 확인 5

- 부모 질문: 등교 전에 확인해야 할 학교 일정을 볼 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260306 봉사활동사전교육 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-071 학사일정 확인 6

- 부모 질문: 내일 학교에서 특별한 일정이 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260307 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-072 학사일정 확인 7

- 부모 질문: 이번 달 쉬는 날이나 행사가 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260313 학급자치활동 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-073 학사일정 확인 8

- 부모 질문: 아이 학년에 해당하는 행사인지 볼 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260313 학급임원선거 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-074 학사일정 확인 9

- 부모 질문: 현장체험학습 같은 준비가 필요한 날을 찾을 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260314 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-075 학사일정 확인 10

- 부모 질문: 등교 전에 확인해야 할 학교 일정을 볼 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260316 교직원 연수 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-076 학사일정 확인 11

- 부모 질문: 내일 학교에서 특별한 일정이 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260516 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-077 학사일정 확인 12

- 부모 질문: 이번 달 쉬는 날이나 행사가 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260522 음주 및 약물오남용 예방교육 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-078 학사일정 확인 13

- 부모 질문: 아이 학년에 해당하는 행사인지 볼 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260522 통일교육 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-079 학사일정 확인 14

- 부모 질문: 현장체험학습 같은 준비가 필요한 날을 찾을 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260523 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-080 학사일정 확인 15

- 부모 질문: 등교 전에 확인해야 할 학교 일정을 볼 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260524 석가탄신일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-081 학사일정 확인 16

- 부모 질문: 내일 학교에서 특별한 일정이 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260525 대체공휴일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-082 학사일정 확인 17

- 부모 질문: 이번 달 쉬는 날이나 행사가 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260529 진로코디의 날 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-083 학사일정 확인 18

- 부모 질문: 아이 학년에 해당하는 행사인지 볼 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260530 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-084 학사일정 확인 19

- 부모 질문: 현장체험학습 같은 준비가 필요한 날을 찾을 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260501 재량휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-085 학사일정 확인 20

- 부모 질문: 등교 전에 확인해야 할 학교 일정을 볼 수 있나요?
- 아이/상황: 가락고등학교 2026학년도 1학기
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260501 노동절 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-086 학교 찾기

- 부모 질문: 서울고등학교 후보를 정확히 찾을 수 있나요?
- 아이/상황: 학교·학급 맥락 확인
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 서울고등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `SCHUL_NM=서울고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-087 초등학교 후보

- 부모 질문: 서울의 초등학교 후보를 넓게 볼 수 있나요?
- 아이/상황: 학교·학급 맥락 확인
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 경기초등학교, 경복초등학교, 경희초등학교, 계성초등학교, 광운초등학교, 금성초등학교, 대광초등학교, 동광초등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `SCHUL_KND_SC_NM=초등학교, LCTN_SC_NM=서울특별시` | `INFO-000` 정상 처리되었습니다. | 100/610 |

### NEIS-PARENT-088 고등학교 학급

- 부모 질문: 아이 학년에는 몇 반까지 있나요?
- 아이/상황: 학교·학급 맥락 확인
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4, 5, 6, 7, 8

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, GRADE=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-089 중학교 학급

- 부모 질문: 중학생 아이 반 선택값을 확인할 수 있나요?
- 아이/상황: 학교·학급 맥락 확인
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4, 5, 6

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, GRADE=1` | `INFO-000` 정상 처리되었습니다. | 6/6 |

### NEIS-PARENT-090 초등학교 학급

- 부모 질문: 초등학생 아이 반 선택값을 확인할 수 있나요?
- 아이/상황: 학교·학급 맥락 확인
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, GRADE=1` | `INFO-000` 정상 처리되었습니다. | 4/4 |

### NEIS-PARENT-091 수학 관심사 학원 후보

- 부모 질문: 수학에 관심이 생긴 아이에게 공식 등록 학원 후보를 찾아볼 수 있나요?
- 아이/상황: 수학에 관심이 생긴 아이
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: BT수학전문수학교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 선릉로 38

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=수학` | `INFO-000` 정상 처리되었습니다. | 100/4507 |

### NEIS-PARENT-092 수학 관심사 학원 세부 과정

- 부모 질문: 수학에 관심이 생긴 아이에게 공식 등록 학원 후보를 찾아볼 수 있나요?
- 아이/상황: 수학에 관심이 생긴 아이
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: BT수학전문수학교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 선릉로 38

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=수학, LE_CRSE_NM=보습` | `INFO-000` 정상 처리되었습니다. | 100/3281 |

### NEIS-PARENT-093 영어 관심사 학원 후보

- 부모 질문: 영어 말하기를 더 해보고 싶은 아이에게 공식 등록 학원 후보를 찾아볼 수 있나요?
- 아이/상황: 영어 말하기를 더 해보고 싶은 아이
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 301아카데미(Academy)영어교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 개포로82길 7

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=영어` | `INFO-000` 정상 처리되었습니다. | 100/3661 |

### NEIS-PARENT-094 영어 관심사 학원 세부 과정

- 부모 질문: 영어 말하기를 더 해보고 싶은 아이에게 공식 등록 학원 후보를 찾아볼 수 있나요?
- 아이/상황: 영어 말하기를 더 해보고 싶은 아이
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 301아카데미(Academy)영어교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 개포로82길 7

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=영어, LE_CRSE_NM=보습` | `INFO-000` 정상 처리되었습니다. | 100/2535 |

### NEIS-PARENT-095 미술 관심사 학원 후보

- 부모 질문: 그림 그리기를 좋아하는 아이에게 공식 등록 학원 후보를 찾아볼 수 있나요?
- 아이/상황: 그림 그리기를 좋아하는 아이
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 감각의논리미술교습소 / 예능(대) / None / 서울특별시 강남구 남부순환로 2927

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=미술` | `INFO-000` 정상 처리되었습니다. | 100/2591 |

### NEIS-PARENT-096 미술 관심사 학원 세부 과정

- 부모 질문: 그림 그리기를 좋아하는 아이에게 공식 등록 학원 후보를 찾아볼 수 있나요?
- 아이/상황: 그림 그리기를 좋아하는 아이
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 홍익아트플레이스미술학원 / 예능(대) / 보습 / 서울특별시 강서구 우현로 17

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=미술, LE_CRSE_NM=보습` | `INFO-000` 정상 처리되었습니다. | 8/8 |

### NEIS-PARENT-097 피아노 관심사 학원 후보

- 부모 질문: 음악 활동에 관심 있는 아이에게 공식 등록 학원 후보를 찾아볼 수 있나요?
- 아이/상황: 음악 활동에 관심 있는 아이
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 김윤진피아노교습소 / 예능(대) / 음악 / 서울특별시 강남구 삼성로4길 17

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=피아노` | `INFO-000` 정상 처리되었습니다. | 100/1084 |

### NEIS-PARENT-098 피아노 관심사 학원 세부 과정

- 부모 질문: 음악 활동에 관심 있는 아이에게 공식 등록 학원 후보를 찾아볼 수 있나요?
- 아이/상황: 음악 활동에 관심 있는 아이
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 명음피아노음악교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 성북구 동소문로34길 24

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=피아노, LE_CRSE_NM=보습` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-099 댄스 관심사 학원 후보

- 부모 질문: 몸을 움직이는 활동을 좋아하는 아이에게 공식 등록 학원 후보를 찾아볼 수 있나요?
- 아이/상황: 몸을 움직이는 활동을 좋아하는 아이
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 김강산댄스스튜디오학원 / 기예(대) / 댄스 / 서울특별시 강남구 선릉로161길 11

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=댄스` | `INFO-000` 정상 처리되었습니다. | 100/218 |

### NEIS-PARENT-100 댄스 관심사 학원 세부 과정

- 부모 질문: 몸을 움직이는 활동을 좋아하는 아이에게 공식 등록 학원 후보를 찾아볼 수 있나요?
- 아이/상황: 몸을 움직이는 활동을 좋아하는 아이
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 김강산댄스스튜디오학원 / 기예(대) / 댄스 / 서울특별시 강남구 선릉로161길 11

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=댄스, LE_CRSE_NM=댄스` | `INFO-000` 정상 처리되었습니다. | 100/105 |

### NEIS-PARENT-101 급식 세부 해석 1

- 부모 질문: 급식 원산지 정보까지 확인해서 아이와 이야기할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260514 중식: 칼슘강화찹쌀밥 / 쑥갓어묵국 (1.5.6.9.13) / 알본디가스(스페인식미트볼)그라탕 (1.2.3.5.6.10.12) / 잠발라고등어구이 (1.2.5.7.12.13) / 깍두기 (9) / 소바샐러드 (3.5.6.7.9.12.13.18); 1144.2 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-102 급식 세부 해석 2

- 부모 질문: 이번 달 중 매운 메뉴처럼 보이는 날을 찾을 단서를 얻을 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260515 중식: 발아현미밥 / 실곤약야채무침 (3.5.6.13) / 건새우근대된장국 (5.6.8.9.17.18) / 마늘보쌈 (5.6.10.13) / 보쌈김치 (9) / 카네이션꽃다발머랭쿠키 (1) / 상추쌈&쌈장 (5.6.13); 777.5 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-103 급식 세부 해석 3

- 부모 질문: 칼로리와 영양 정보를 함께 보고 저녁 메뉴를 조정할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260518 중식: 칼슘기장밥 / 돈육목살김치찌개 (5.6.9.10) / 비름나물무침 (5.6) / 소떡소떡볶음 (2.5.6.10.12.13.15.16.18) / 가자미구이&와사비장 (2.5.6.12.13.16.18) / 깍두기 (9); 705.1 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-104 급식 세부 해석 4

- 부모 질문: 알레르기 번호가 붙은 메뉴를 부모가 미리 확인할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260519 중식: 발아현미밥 / 맑은콩나물국 (5.6.9) / 묵은지닭찜 (5.6.9.13.15.18) / 검은콩감자전 (1.5.6) / 열무김치 (9) / 아이스홍시; 880.8 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-105 급식 세부 해석 5

- 부모 질문: 급식이 없는 날인지, 단순히 검색 조건이 좁은 건지 구분할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260520 중식: 이블덮은깡총함박오므라이스(1,2,5,6,10,13 ,16,18) &소스(2,5,6,10,12,16) (1.2.5.6.10.12.13.16.18) / 가쓰오장국 (1.2.5.6.9.13) / 토마토아보카도샐러드 (1.2.5.6.12.13) / 깍두기 (9) / 그릴치킨타코 (2.5.6.15.16) / 애플샤인음료 (13); 831.9 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-106 급식 세부 해석 6

- 부모 질문: 급식 원산지 정보까지 확인해서 아이와 이야기할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260521 중식: 혼합잡곡밥 (5) / 감자옹심이국 (5.6.17) / 짬뽕순두부찜 (5.6.9.13.17.18) / 브로콜리통마늘무침 / 파불고기 (5.6.10.13) / 배추김치 (9); 697.2 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-107 급식 세부 해석 7

- 부모 질문: 이번 달 중 매운 메뉴처럼 보이는 날을 찾을 단서를 얻을 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260522 중식: 칼슘강화찹쌀밥 / 호박잎된장찌개 (5.6) / 오이부추무침 (13) / 배추겉절이 (9) / 오리로스구이 (5) / 쌈무; 985.6 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-108 급식 세부 해석 8

- 부모 질문: 칼로리와 영양 정보를 함께 보고 저녁 메뉴를 조정할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260526 중식: [가람-슬러시이벤트] 녹두밥 / 계란파국 (1.5.6) / 도라지오이생채 (5.6.13) / 크리미마라로제샹궈 (2.5.6.9.10.13.15.16) / 삼치카레구이 (2.5.6.12.13.16.18) / 깍두기 (9); 903.5 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-109 급식 세부 해석 9

- 부모 질문: 알레르기 번호가 붙은 메뉴를 부모가 미리 확인할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260527 중식: [대체식]흰쌀밥 / 미니상하이(해물)파스타 (1.5.6.9.13.17.18) / [대체식]콩나물김치국 (5.9) / 수제직화불고기피자 (2.5.6) / 수제매실에이드 (13) / 블루베리요거트샐러드 (1.2.3.4.5.6.7.8.9.10.11.12) / 수제오이무피클 (13); 893.9 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-110 급식 세부 해석 10

- 부모 질문: 급식이 없는 날인지, 단순히 검색 조건이 좁은 건지 구분할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260528 중식: 칼슘수수밥 / 황태두부맑은국 (5.6) / 치즈닭갈비 (2.5.6.13.15) / 스틱김자반 (5.9) / 마늘쫑볶음 (5.6) / 배추김치 (9); 891.1 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-111 급식 세부 해석 11

- 부모 질문: 급식 원산지 정보까지 확인해서 아이와 이야기할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260529 중식: 칼슘강화찹쌀밥 / 페스츄리스프 (1.2.5.6.15.16.18) / 경양식돈까스(5,6,10) (1.2.5.6.10.12.15.16.18) / 배추김치 (9) / &소스 (1.2.5.6.12.15.16.18) / 레드글로버포도 / 시리얼양배추샐러드 (1.5.6.13); 757.7 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-112 급식 세부 해석 12

- 부모 질문: 이번 달 중 매운 메뉴처럼 보이는 날을 찾을 단서를 얻을 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260504 중식: 칼슘강화찹쌀밥 / 북어미역국 (5.6) / 한방돈갈비찜 (5.6.10.13) / 사천식잡채 (1.5.6.12.13.18) / 배추김치 (9) / 텔레토비마카롱 (1.2.6); 1181.4 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-113 급식 세부 해석 13

- 부모 질문: 칼로리와 영양 정보를 함께 보고 저녁 메뉴를 조정할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260506 중식: [대체식]흰쌀밥 / 땡초주먹밥 (1.5.6.10.13) / 미소된장국 (5.6) / 단무지채깻잎무침 (13) / 라볶이 (1.5.6.13) / 콘치즈팝만두 (1.2.5.6.18) / 배추김치 (9) / 유산균음료 (2); 629.4 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-114 급식 세부 해석 14

- 부모 질문: 알레르기 번호가 붙은 메뉴를 부모가 미리 확인할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260507 중식: 발아현미밥 / 뉴욕돼지곰탕 (5.6.10.15) / 적채부추무침 (13) / 팽이버섯전 (1.6) / 석박지 (9) / 사과; 603.0 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-115 급식 세부 해석 15

- 부모 질문: 급식이 없는 날인지, 단순히 검색 조건이 좁은 건지 구분할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260508 중식: ★1학년급식-오리뽑기이벤트★ [대체식]흰쌀밥 / [대체식]콩나물김치국 (5.9) / 수제싸이버거 (1.2.5.6.12.15.16) / 오지치즈후라이 (2.5.6.10) / 골라먹는스파클링제로음료(레인보우샤베트or애플민트) / 수제오이무피클 (13) / 그린샐러드&파인애플드레싱 (1.2.4.5.6.9.10.11.12.13.15.16.17.18); 988.8 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-116 급식 세부 해석 16

- 부모 질문: 급식 원산지 정보까지 확인해서 아이와 이야기할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260511 중식: 칼슘보리밥 / 닭개장 (5.6.15) / 참나물파채무침 (5.6.13) / 육전구이 (1.2.5.6.10.16) / 오이김치 (9) / 오렌지; 696.8 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-117 급식 세부 해석 17

- 부모 질문: 이번 달 중 매운 메뉴처럼 보이는 날을 찾을 단서를 얻을 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260512 중식: 수수밥 / 쇠고기무국 (5.6.16) / 청경채찜 (5.6.13.18) / 뉴진면닭갈비 (2.5.6.12.13.15.16.18) / 버터찹쌀김부각 (5.6) / 배추김치 (9); 850.1 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-118 급식 세부 해석 18

- 부모 질문: 칼로리와 영양 정보를 함께 보고 저녁 메뉴를 조정할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260513 중식: 다시마무채국 (5.6) / 쭈돈덮밥 (5.6.10.13.16) / 수제오꼬노미야끼 (1.5.6.10.13.17) / 백김치 (9) / 설레임(밀크맛) (1.2.5); 945.6 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-119 급식 세부 해석 19

- 부모 질문: 알레르기 번호가 붙은 메뉴를 부모가 미리 확인할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260514 중식: 칼슘강화찹쌀밥 / 쑥갓어묵국 (1.5.6.9.13) / 알본디가스(스페인식미트볼)그라탕 (1.2.3.5.6.10.12) / 잠발라고등어구이 (1.2.5.7.12.13) / 깍두기 (9) / 소바샐러드 (3.5.6.7.9.12.13.18); 1144.2 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-120 급식 세부 해석 20

- 부모 질문: 급식이 없는 날인지, 단순히 검색 조건이 좁은 건지 구분할 수 있나요?
- 아이/상황: 가락고등학교 급식 세부 확인
- 상태: `pass`
- 해석: 기간 급식에서 관심 날짜 선택
- 답변 예시: 20260515 중식: 발아현미밥 / 실곤약야채무침 (3.5.6.13) / 건새우근대된장국 (5.6.8.9.17.18) / 마늘보쌈 (5.6.10.13) / 보쌈김치 (9) / 카네이션꽃다발머랭쿠키 (1) / 상추쌈&쌈장 (5.6.13); 777.5 Kcal

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-121 일정 준비 체크 1

- 부모 질문: 행사명과 학년 대상 여부를 같이 확인할 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260502 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-122 일정 준비 체크 2

- 부모 질문: 공휴일과 학교 행사를 구분해서 볼 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260505 어린이날 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-123 일정 준비 체크 3

- 부모 질문: 가정에서 준비가 필요할 수 있는 일정을 미리 찾을 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260507 학력평가(3) (3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-124 일정 준비 체크 4

- 부모 질문: 이번 달 반복해서 확인해야 할 학교 일정을 모아볼 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260508 소풍 (2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-125 일정 준비 체크 5

- 부모 질문: 내일 아이에게 물어볼 학교 일정 대화거리를 만들 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260508 학생참여한마당 (1학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-126 일정 준비 체크 6

- 부모 질문: 행사명과 학년 대상 여부를 같이 확인할 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260509 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-127 일정 준비 체크 7

- 부모 질문: 공휴일과 학교 행사를 구분해서 볼 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260511 교직원 회의 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-128 일정 준비 체크 8

- 부모 질문: 가정에서 준비가 필요할 수 있는 일정을 미리 찾을 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260515 동아리활동 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-129 일정 준비 체크 9

- 부모 질문: 이번 달 반복해서 확인해야 할 학교 일정을 모아볼 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260516 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-130 일정 준비 체크 10

- 부모 질문: 내일 아이에게 물어볼 학교 일정 대화거리를 만들 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260522 음주 및 약물오남용 예방교육 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-131 일정 준비 체크 11

- 부모 질문: 행사명과 학년 대상 여부를 같이 확인할 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260522 통일교육 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-132 일정 준비 체크 12

- 부모 질문: 공휴일과 학교 행사를 구분해서 볼 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260523 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-133 일정 준비 체크 13

- 부모 질문: 가정에서 준비가 필요할 수 있는 일정을 미리 찾을 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260524 석가탄신일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-134 일정 준비 체크 14

- 부모 질문: 이번 달 반복해서 확인해야 할 학교 일정을 모아볼 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260525 대체공휴일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-135 일정 준비 체크 15

- 부모 질문: 내일 아이에게 물어볼 학교 일정 대화거리를 만들 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260529 진로코디의 날 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-136 일정 준비 체크 16

- 부모 질문: 행사명과 학년 대상 여부를 같이 확인할 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260530 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-137 일정 준비 체크 17

- 부모 질문: 공휴일과 학교 행사를 구분해서 볼 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260501 재량휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-138 일정 준비 체크 18

- 부모 질문: 가정에서 준비가 필요할 수 있는 일정을 미리 찾을 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260501 노동절 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-139 일정 준비 체크 19

- 부모 질문: 이번 달 반복해서 확인해야 할 학교 일정을 모아볼 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260502 토요휴업일 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-140 일정 준비 체크 20

- 부모 질문: 내일 아이에게 물어볼 학교 일정 대화거리를 만들 수 있나요?
- 아이/상황: 가락고등학교 행사 준비
- 상태: `pass`
- 해석: 기간 학사일정에서 행사 선택
- 답변 예시: 20260505 어린이날 (1학년,2학년,3학년)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-141 고등학생 학교 주소 확인

- 부모 질문: 학교 위치와 등하교 동선을 확인할 수 있나요?
- 아이/상황: 가락고등학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.ORG_RDNMA 확인
- 답변 예시: 서울특별시 송파구 송이로 42

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-142 고등학생 학교 연락처 확인

- 부모 질문: 급하게 문의할 학교 전화번호를 찾을 수 있나요?
- 아이/상황: 가락고등학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.ORG_TELNO 확인
- 답변 예시: 02-416-4658

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-143 고등학생 학교 홈페이지 확인

- 부모 질문: 가정통신문을 볼 홈페이지를 찾을 수 있나요?
- 아이/상황: 가락고등학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.HMPG_ADRES 확인
- 답변 예시: http://garak.sen.hs.kr

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-144 고등학생 설립 구분 확인

- 부모 질문: 공립/사립 같은 학교 성격을 확인할 수 있나요?
- 아이/상황: 가락고등학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.FOND_SC_NM 확인
- 답변 예시: 공립

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-145 고등학생 학교 종류 확인

- 부모 질문: 초중고/특수학교 구분을 API로 확정할 수 있나요?
- 아이/상황: 가락고등학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.SCHUL_KND_SC_NM 확인
- 답변 예시: 고등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-146 중학생 학교 주소 확인

- 부모 질문: 학교 위치와 등하교 동선을 확인할 수 있나요?
- 아이/상황: 가락중학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.ORG_RDNMA 확인
- 답변 예시: 서울특별시 송파구 송이로 45

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-147 중학생 학교 연락처 확인

- 부모 질문: 급하게 문의할 학교 전화번호를 찾을 수 있나요?
- 아이/상황: 가락중학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.ORG_TELNO 확인
- 답변 예시: 02-2143-3100

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-148 중학생 학교 홈페이지 확인

- 부모 질문: 가정통신문을 볼 홈페이지를 찾을 수 있나요?
- 아이/상황: 가락중학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.HMPG_ADRES 확인
- 답변 예시: http://karak.sen.ms.kr

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-149 중학생 설립 구분 확인

- 부모 질문: 공립/사립 같은 학교 성격을 확인할 수 있나요?
- 아이/상황: 가락중학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.FOND_SC_NM 확인
- 답변 예시: 공립

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-150 중학생 학교 종류 확인

- 부모 질문: 초중고/특수학교 구분을 API로 확정할 수 있나요?
- 아이/상황: 가락중학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.SCHUL_KND_SC_NM 확인
- 답변 예시: 중학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-151 초등학생 학교 주소 확인

- 부모 질문: 학교 위치와 등하교 동선을 확인할 수 있나요?
- 아이/상황: 서울거여초등학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.ORG_RDNMA 확인
- 답변 예시: 서울특별시 송파구 마천로25길 18

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-152 초등학생 학교 연락처 확인

- 부모 질문: 급하게 문의할 학교 전화번호를 찾을 수 있나요?
- 아이/상황: 서울거여초등학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.ORG_TELNO 확인
- 답변 예시: 02-2160-5400

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-153 초등학생 학교 홈페이지 확인

- 부모 질문: 가정통신문을 볼 홈페이지를 찾을 수 있나요?
- 아이/상황: 서울거여초등학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.HMPG_ADRES 확인
- 답변 예시: http://geo-yeo.sen.es.kr

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-154 초등학생 설립 구분 확인

- 부모 질문: 공립/사립 같은 학교 성격을 확인할 수 있나요?
- 아이/상황: 서울거여초등학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.FOND_SC_NM 확인
- 답변 예시: 공립

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-155 초등학생 학교 종류 확인

- 부모 질문: 초중고/특수학교 구분을 API로 확정할 수 있나요?
- 아이/상황: 서울거여초등학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.SCHUL_KND_SC_NM 확인
- 답변 예시: 초등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-156 특수학교 학생 학교 주소 확인

- 부모 질문: 학교 위치와 등하교 동선을 확인할 수 있나요?
- 아이/상황: 교남학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.ORG_RDNMA 확인
- 답변 예시: 서울특별시 강서구 까치산로22길 38

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-157 특수학교 학생 학교 연락처 확인

- 부모 질문: 급하게 문의할 학교 전화번호를 찾을 수 있나요?
- 아이/상황: 교남학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.ORG_TELNO 확인
- 답변 예시: 02-2607-2456

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-158 특수학교 학생 학교 홈페이지 확인

- 부모 질문: 가정통신문을 볼 홈페이지를 찾을 수 있나요?
- 아이/상황: 교남학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.HMPG_ADRES 확인
- 답변 예시: http://kyonam.sen.sc.kr

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-159 특수학교 학생 설립 구분 확인

- 부모 질문: 공립/사립 같은 학교 성격을 확인할 수 있나요?
- 아이/상황: 교남학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.FOND_SC_NM 확인
- 답변 예시: 사립

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-160 특수학교 학생 학교 종류 확인

- 부모 질문: 초중고/특수학교 구분을 API로 확정할 수 있나요?
- 아이/상황: 교남학교 기본정보
- 상태: `pass`
- 해석: schoolInfo.SCHUL_KND_SC_NM 확인
- 답변 예시: 특수학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-161 고등학생 등교 직후 대화

- 부모 질문: 아침에 첫 수업이 뭐냐고 물으면 답할 수 있나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 등교 직후 대화
- 답변 예시: 20260304 1교시: 공통수학1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-162 고등학생 오전 중간 대화

- 부모 질문: 오전 중간에는 어떤 과목을 배우는지 말해줄 수 있나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 오전 중간 대화
- 답변 예시: 20260304 2교시: 정보

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=2` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-163 고등학생 점심 전 대화

- 부모 질문: 점심 전까지 어떤 수업이 이어지는지 볼 수 있나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 점심 전 대화
- 답변 예시: 20260304 3교시: 공통영어1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=3` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-164 고등학생 오후 첫 수업 대화

- 부모 질문: 점심 먹고 어떤 수업으로 돌아가는지 볼 수 있나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 오후 첫 수업 대화
- 답변 예시: 20260304 4교시: 공통국어1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=4` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-165 고등학생 마무리 수업 대화

- 부모 질문: 하교 전 마지막 쪽 수업을 확인할 수 있나요?
- 아이/상황: 가락고등학교 1학년 1반
- 상태: `pass`
- 해석: 마무리 수업 대화
- 답변 예시: 20260304 5교시: 과학탐구실험1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=5` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-166 중학생 등교 직후 대화

- 부모 질문: 아침에 첫 수업이 뭐냐고 물으면 답할 수 있나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 등교 직후 대화
- 답변 예시: 20260304 1교시: 도덕

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=1` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-167 중학생 오전 중간 대화

- 부모 질문: 오전 중간에는 어떤 과목을 배우는지 말해줄 수 있나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 오전 중간 대화
- 답변 예시: 20260304 2교시: 수학

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=2` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-168 중학생 점심 전 대화

- 부모 질문: 점심 전까지 어떤 수업이 이어지는지 볼 수 있나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 점심 전 대화
- 답변 예시: 20260304 3교시: 진로와 직업

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=3` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-169 중학생 오후 첫 수업 대화

- 부모 질문: 점심 먹고 어떤 수업으로 돌아가는지 볼 수 있나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 오후 첫 수업 대화
- 답변 예시: 20260304 4교시: 사회

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=4` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-170 중학생 마무리 수업 대화

- 부모 질문: 하교 전 마지막 쪽 수업을 확인할 수 있나요?
- 아이/상황: 가락중학교 1학년 1반
- 상태: `pass`
- 해석: 마무리 수업 대화
- 답변 예시: 20260304 5교시: 과학

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=5` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-171 초등학생 등교 직후 대화

- 부모 질문: 아침에 첫 수업이 뭐냐고 물으면 답할 수 있나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 등교 직후 대화
- 답변 예시: 20260302 1교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=1` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-172 초등학생 오전 중간 대화

- 부모 질문: 오전 중간에는 어떤 과목을 배우는지 말해줄 수 있나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 오전 중간 대화
- 답변 예시: 20260302 2교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=2` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-173 초등학생 점심 전 대화

- 부모 질문: 점심 전까지 어떤 수업이 이어지는지 볼 수 있나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 점심 전 대화
- 답변 예시: 20260302 3교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=3` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-174 초등학생 오후 첫 수업 대화

- 부모 질문: 점심 먹고 어떤 수업으로 돌아가는지 볼 수 있나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 오후 첫 수업 대화
- 답변 예시: 20260302 4교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=4` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-175 초등학생 마무리 수업 대화

- 부모 질문: 하교 전 마지막 쪽 수업을 확인할 수 있나요?
- 아이/상황: 서울거여초등학교 1학년 1반
- 상태: `pass`
- 해석: 마무리 수업 대화
- 답변 예시: 20260302 5교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=5` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-176 특수학교 학생 등교 직후 대화

- 부모 질문: 아침에 첫 수업이 뭐냐고 물으면 답할 수 있나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 등교 직후 대화
- 답변 예시: 20260302 1교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=1` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-177 특수학교 학생 오전 중간 대화

- 부모 질문: 오전 중간에는 어떤 과목을 배우는지 말해줄 수 있나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 오전 중간 대화
- 답변 예시: 20260302 2교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=2` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-178 특수학교 학생 점심 전 대화

- 부모 질문: 점심 전까지 어떤 수업이 이어지는지 볼 수 있나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 점심 전 대화
- 답변 예시: 20260302 3교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=3` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-179 특수학교 학생 오후 첫 수업 대화

- 부모 질문: 점심 먹고 어떤 수업으로 돌아가는지 볼 수 있나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 오후 첫 수업 대화
- 답변 예시: 20260302 4교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=4` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-180 특수학교 학생 마무리 수업 대화

- 부모 질문: 하교 전 마지막 쪽 수업을 확인할 수 있나요?
- 아이/상황: 교남학교 1학년 1반
- 상태: `pass`
- 해석: 마무리 수업 대화
- 답변 예시: 20260302 5교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=5` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-181 추가 관심사 수학

- 부모 질문: 수학 선행보다 보습 중심 후보가 있나요?
- 아이/상황: 수학 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: BT수학전문수학교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 선릉로 38

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=수학, LE_CRSE_NM=보습` | `INFO-000` 정상 처리되었습니다. | 100/3281 |

### NEIS-PARENT-182 추가 관심사 수학

- 부모 질문: 수학 학원 후보를 넓게 비교할 수 있나요?
- 아이/상황: 수학 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: BT수학전문수학교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 선릉로 38

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=수학` | `INFO-000` 정상 처리되었습니다. | 100/4507 |

### NEIS-PARENT-183 추가 관심사 영어

- 부모 질문: 영어 회화 전후로 다닐 후보가 있나요?
- 아이/상황: 영어 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 301아카데미(Academy)영어교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 개포로82길 7

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=영어` | `INFO-000` 정상 처리되었습니다. | 100/3661 |

### NEIS-PARENT-184 추가 관심사 영어

- 부모 질문: 영어 보습 과정으로 좁힐 수 있나요?
- 아이/상황: 영어 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 301아카데미(Academy)영어교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 개포로82길 7

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=영어, LE_CRSE_NM=보습` | `INFO-000` 정상 처리되었습니다. | 100/2535 |

### NEIS-PARENT-185 추가 관심사 미술

- 부모 질문: 그림 좋아하는 아이에게 미술 후보가 있나요?
- 아이/상황: 미술 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 감각의논리미술교습소 / 예능(대) / None / 서울특별시 강남구 남부순환로 2927

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=미술` | `INFO-000` 정상 처리되었습니다. | 100/2591 |

### NEIS-PARENT-186 추가 관심사 미술

- 부모 질문: 미술 세부 과정 후보가 있나요?
- 아이/상황: 미술 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 감성예찬미술교습소 / 예능(대) / 미술 / 서울특별시 강남구 도곡로93길 12

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=미술, LE_CRSE_NM=미술` | `INFO-000` 정상 처리되었습니다. | 100/2184 |

### NEIS-PARENT-187 추가 관심사 피아노

- 부모 질문: 피아노 관심 학원 후보가 있나요?
- 아이/상황: 피아노 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 김윤진피아노교습소 / 예능(대) / 음악 / 서울특별시 강남구 삼성로4길 17

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=피아노` | `INFO-000` 정상 처리되었습니다. | 100/1084 |

### NEIS-PARENT-188 추가 관심사 피아노

- 부모 질문: 음악 계열 후보를 좁힐 수 있나요?
- 아이/상황: 피아노 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 김윤진피아노교습소 / 예능(대) / 음악 / 서울특별시 강남구 삼성로4길 17

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=피아노, LE_CRSE_NM=음악` | `INFO-000` 정상 처리되었습니다. | 100/959 |

### NEIS-PARENT-189 추가 관심사 댄스

- 부모 질문: 댄스 학원 후보를 볼 수 있나요?
- 아이/상황: 댄스 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 김강산댄스스튜디오학원 / 기예(대) / 댄스 / 서울특별시 강남구 선릉로161길 11

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=댄스` | `INFO-000` 정상 처리되었습니다. | 100/218 |

### NEIS-PARENT-190 추가 관심사 댄스

- 부모 질문: 댄스 과정으로 좁힐 수 있나요?
- 아이/상황: 댄스 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 김강산댄스스튜디오학원 / 기예(대) / 댄스 / 서울특별시 강남구 선릉로161길 11

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=댄스, LE_CRSE_NM=댄스` | `INFO-000` 정상 처리되었습니다. | 100/105 |

### NEIS-PARENT-191 추가 관심사 논술

- 부모 질문: 글쓰기에 관심 있는 아이에게 논술 후보가 있나요?
- 아이/상황: 논술 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: GLMA글로벌인생만남논술교습소 / 입시.검정 및 보습 / 보습·논술 / 서울특별시 강남구 일원로5길 71

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=논술` | `INFO-000` 정상 처리되었습니다. | 100/1145 |

### NEIS-PARENT-192 추가 관심사 논술

- 부모 질문: 논술 보습 후보를 찾을 수 있나요?
- 아이/상황: 논술 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 수오국어논술교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 선릉로 340

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=논술, LE_CRSE_NM=보습` | `INFO-000` 정상 처리되었습니다. | 100/137 |

### NEIS-PARENT-193 추가 관심사 과학

- 부모 질문: 과학에 관심 있는 아이에게 후보가 있나요?
- 아이/상황: 과학 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 강성호올림피아드과학교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 선릉로62길 30

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=과학` | `INFO-000` 정상 처리되었습니다. | 100/439 |

### NEIS-PARENT-194 추가 관심사 국어

- 부모 질문: 독서나 국어 관심 후보를 찾을 수 있나요?
- 아이/상황: 국어 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 365국어교습소 / 입시.검정 및 보습 / None / 서울특별시 강남구 삼성로 150

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=국어` | `INFO-000` 정상 처리되었습니다. | 100/882 |

### NEIS-PARENT-195 추가 관심사 코딩

- 부모 질문: 코딩 관심 후보를 찾을 수 있나요?
- 아이/상황: 코딩 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 강남코리코딩교습소 / 기타(대) / None / 서울특별시 강남구 광평로10길 50

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=코딩` | `INFO-000` 정상 처리되었습니다. | 78/78 |

### NEIS-PARENT-196 추가 관심사 음악

- 부모 질문: 음악 활동 후보를 찾을 수 있나요?
- 아이/상황: 음악 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: J바이올린음악교습소 / 예능(대) / 음악 / 서울특별시 강남구 압구정로 309

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=음악` | `INFO-000` 정상 처리되었습니다. | 100/2795 |

### NEIS-PARENT-197 추가 관심사 무용

- 부모 질문: 무용 활동 후보를 찾을 수 있나요?
- 아이/상황: 무용 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 하늘발레무용교습소 / 기타(대) / 전통무용 / 서울특별시 강남구 압구정로29길 65

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=무용` | `INFO-000` 정상 처리되었습니다. | 100/171 |

### NEIS-PARENT-198 추가 관심사 발레

- 부모 질문: 발레 관심 후보를 찾을 수 있나요?
- 아이/상황: 발레 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 앙뜨발레핏대치점발레교습소 / 예능(대) / 무용 / 서울특별시 강남구 남부순환로 2927

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=발레` | `INFO-000` 정상 처리되었습니다. | 100/298 |

### NEIS-PARENT-199 추가 관심사 보습

- 부모 질문: 보습 과정 전체 후보를 볼 수 있나요?
- 아이/상황: 보습 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 301아카데미(Academy)영어교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 개포로82길 7

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, LE_CRSE_NM=보습` | `INFO-000` 정상 처리되었습니다. | 100/9096 |

### NEIS-PARENT-200 추가 관심사 댄스

- 부모 질문: 기예 활동 후보를 찾을 수 있나요?
- 아이/상황: 댄스 관심 부모 요청
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 김강산댄스스튜디오학원 / 기예(대) / 댄스 / 서울특별시 강남구 선릉로161길 11

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, LE_CRSE_NM=댄스` | `INFO-000` 정상 처리되었습니다. | 100/116 |

### NEIS-PARENT-201 학교명으로 오늘 수업 찾기 #1

- 부모 질문: 학교 이름만 말했을 때 학교코드 resolve 후 시간표까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 가락고등학교 1학년 1반 2026-03-04: 공통수학1, 정보, 공통영어1, 공통국어1, 과학탐구실험1, 한국사1, 체육1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-202 학교명으로 급식 찾기 #1

- 부모 질문: 학교 이름만 말했을 때 오늘 점심까지 찾을 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 급식 기간 조회
- 답변 예시: 가락고등학교 급식: 20260504 칼슘강화찹쌀밥 / 북어미역국 (5.6) / 한방돈갈비찜 (5.6.10.13) / 사천식잡채 (1.5.6.12.13.18) / 배추김치 (9) / 텔레토비마카롱 (1.2.6)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-203 학교명으로 일정 찾기 #1

- 부모 질문: 학교 이름만 말했을 때 이번 달 학교 일정을 찾을 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학사일정 기간 조회
- 답변 예시: 가락고등학교 일정: 20260301 3·1절

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-204 학교명으로 학급 확인 #1

- 부모 질문: 학교 이름과 학년만으로 반 목록을 확인할 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학급정보 조회
- 답변 예시: 가락고등학교 1학년 반 후보: 1, 2, 3, 4, 5, 6, 7, 8, 9

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, GRADE=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-205 시간표와 급식 묶기 #1

- 부모 질문: 오늘 배우는 것과 먹는 것을 한 번에 요약할 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 시간표 + 급식 병합
- 답변 예시: 수업: 공통수학1, 정보, 공통영어1, 공통국어1 / 급식 예시: 칼슘강화찹쌀밥 / 북어미역국 (5.6) / 한방돈갈비찜 (5.6.10.13) / 사천식잡채 (1.5.6.12.13.18) / 배추김치 (9) / 텔레토비마카롱 (1.2.6)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |
| 2 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-206 시간표와 일정 묶기 #1

- 부모 질문: 오늘 수업과 학교 행사를 같이 확인할 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 시간표 + 학사일정 병합
- 답변 예시: 수업 7건, 일정 예시 20260301 3·1절

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |
| 2 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-207 급식과 일정 묶기 #1

- 부모 질문: 체험학습 같은 날 급식 정보도 함께 볼 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학사일정 + 급식 병합
- 답변 예시: 일정 예시: 20260501 재량휴업일 / 급식 예시: 20260504

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |
| 2 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-208 중학교 학교명 시간표 #1

- 부모 질문: 중학교 이름만으로 시간표 조회까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 가락중학교 1학년 1반 2026-03-04: 도덕, 수학, 진로와 직업, 사회, 과학, 국어

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락중학교, SCHUL_KND_SC_NM=중학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 6/6 |

### NEIS-PARENT-209 초등학교 학교명 시간표 #1

- 부모 질문: 초등학교 이름만으로 시간표 조회까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 서울거여초등학교 1학년 1반 2026-03-02: 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=서울거여초등학교, SCHUL_KND_SC_NM=초등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-210 특수학교 학교명 시간표 #1

- 부모 질문: 특수학교 이름만으로 시간표 조회까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 교남학교 1학년 1반 2026-03-02: 대체휴일, 대체휴일, 대체휴일, 대체휴일, 대체휴일, 대체휴일, 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=교남학교, SCHUL_KND_SC_NM=특수학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 20/20 |

### NEIS-PARENT-211 학교명으로 오늘 수업 찾기 #2

- 부모 질문: 학교 이름만 말했을 때 학교코드 resolve 후 시간표까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 가락고등학교 1학년 1반 2026-03-04: 공통수학1, 정보, 공통영어1, 공통국어1, 과학탐구실험1, 한국사1, 체육1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-212 학교명으로 급식 찾기 #2

- 부모 질문: 학교 이름만 말했을 때 오늘 점심까지 찾을 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 급식 기간 조회
- 답변 예시: 가락고등학교 급식: 20260504 칼슘강화찹쌀밥 / 북어미역국 (5.6) / 한방돈갈비찜 (5.6.10.13) / 사천식잡채 (1.5.6.12.13.18) / 배추김치 (9) / 텔레토비마카롱 (1.2.6)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-213 학교명으로 일정 찾기 #2

- 부모 질문: 학교 이름만 말했을 때 이번 달 학교 일정을 찾을 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학사일정 기간 조회
- 답변 예시: 가락고등학교 일정: 20260301 3·1절

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-214 학교명으로 학급 확인 #2

- 부모 질문: 학교 이름과 학년만으로 반 목록을 확인할 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학급정보 조회
- 답변 예시: 가락고등학교 1학년 반 후보: 1, 2, 3, 4, 5, 6, 7, 8, 9

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, GRADE=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-215 시간표와 급식 묶기 #2

- 부모 질문: 오늘 배우는 것과 먹는 것을 한 번에 요약할 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 시간표 + 급식 병합
- 답변 예시: 수업: 공통수학1, 정보, 공통영어1, 공통국어1 / 급식 예시: 칼슘강화찹쌀밥 / 북어미역국 (5.6) / 한방돈갈비찜 (5.6.10.13) / 사천식잡채 (1.5.6.12.13.18) / 배추김치 (9) / 텔레토비마카롱 (1.2.6)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |
| 2 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-216 시간표와 일정 묶기 #2

- 부모 질문: 오늘 수업과 학교 행사를 같이 확인할 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 시간표 + 학사일정 병합
- 답변 예시: 수업 7건, 일정 예시 20260301 3·1절

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |
| 2 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-217 급식과 일정 묶기 #2

- 부모 질문: 체험학습 같은 날 급식 정보도 함께 볼 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학사일정 + 급식 병합
- 답변 예시: 일정 예시: 20260501 재량휴업일 / 급식 예시: 20260504

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |
| 2 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-218 중학교 학교명 시간표 #2

- 부모 질문: 중학교 이름만으로 시간표 조회까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 가락중학교 1학년 1반 2026-03-04: 도덕, 수학, 진로와 직업, 사회, 과학, 국어

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락중학교, SCHUL_KND_SC_NM=중학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 6/6 |

### NEIS-PARENT-219 초등학교 학교명 시간표 #2

- 부모 질문: 초등학교 이름만으로 시간표 조회까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 서울거여초등학교 1학년 1반 2026-03-02: 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=서울거여초등학교, SCHUL_KND_SC_NM=초등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-220 특수학교 학교명 시간표 #2

- 부모 질문: 특수학교 이름만으로 시간표 조회까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 교남학교 1학년 1반 2026-03-02: 대체휴일, 대체휴일, 대체휴일, 대체휴일, 대체휴일, 대체휴일, 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=교남학교, SCHUL_KND_SC_NM=특수학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 20/20 |

### NEIS-PARENT-221 학교명으로 오늘 수업 찾기 #3

- 부모 질문: 학교 이름만 말했을 때 학교코드 resolve 후 시간표까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 가락고등학교 1학년 1반 2026-03-04: 공통수학1, 정보, 공통영어1, 공통국어1, 과학탐구실험1, 한국사1, 체육1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-222 학교명으로 급식 찾기 #3

- 부모 질문: 학교 이름만 말했을 때 오늘 점심까지 찾을 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 급식 기간 조회
- 답변 예시: 가락고등학교 급식: 20260504 칼슘강화찹쌀밥 / 북어미역국 (5.6) / 한방돈갈비찜 (5.6.10.13) / 사천식잡채 (1.5.6.12.13.18) / 배추김치 (9) / 텔레토비마카롱 (1.2.6)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-223 학교명으로 일정 찾기 #3

- 부모 질문: 학교 이름만 말했을 때 이번 달 학교 일정을 찾을 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학사일정 기간 조회
- 답변 예시: 가락고등학교 일정: 20260301 3·1절

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-224 학교명으로 학급 확인 #3

- 부모 질문: 학교 이름과 학년만으로 반 목록을 확인할 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학급정보 조회
- 답변 예시: 가락고등학교 1학년 반 후보: 1, 2, 3, 4, 5, 6, 7, 8, 9

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락고등학교, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, GRADE=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-225 시간표와 급식 묶기 #3

- 부모 질문: 오늘 배우는 것과 먹는 것을 한 번에 요약할 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 시간표 + 급식 병합
- 답변 예시: 수업: 공통수학1, 정보, 공통영어1, 공통국어1 / 급식 예시: 칼슘강화찹쌀밥 / 북어미역국 (5.6) / 한방돈갈비찜 (5.6.10.13) / 사천식잡채 (1.5.6.12.13.18) / 배추김치 (9) / 텔레토비마카롱 (1.2.6)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |
| 2 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-226 시간표와 일정 묶기 #3

- 부모 질문: 오늘 수업과 학교 행사를 같이 확인할 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 시간표 + 학사일정 병합
- 답변 예시: 수업 7건, 일정 예시 20260301 3·1절

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |
| 2 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-227 급식과 일정 묶기 #3

- 부모 질문: 체험학습 같은 날 급식 정보도 함께 볼 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학사일정 + 급식 병합
- 답변 예시: 일정 예시: 20260501 재량휴업일 / 급식 예시: 20260504

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |
| 2 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-228 중학교 학교명 시간표 #3

- 부모 질문: 중학교 이름만으로 시간표 조회까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 가락중학교 1학년 1반 2026-03-04: 도덕, 수학, 진로와 직업, 사회, 과학, 국어

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락중학교, SCHUL_KND_SC_NM=중학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 6/6 |

### NEIS-PARENT-229 초등학교 학교명 시간표 #3

- 부모 질문: 초등학교 이름만으로 시간표 조회까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 서울거여초등학교 1학년 1반 2026-03-02: 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재, 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=서울거여초등학교, SCHUL_KND_SC_NM=초등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-230 특수학교 학교명 시간표 #3

- 부모 질문: 특수학교 이름만으로 시간표 조회까지 갈 수 있나요?
- 아이/상황: 부모가 학교명만 주거나 여러 정보를 한 번에 묻는 상황
- 상태: `pass`
- 해석: 학교명 resolve -> 학교코드/교육청코드 -> 시간표
- 답변 예시: 교남학교 1학년 1반 2026-03-02: 대체휴일, 대체휴일, 대체휴일, 대체휴일, 대체휴일, 대체휴일, 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=교남학교, SCHUL_KND_SC_NM=특수학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |
| 2 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1` | `INFO-000` 정상 처리되었습니다. | 20/20 |

### NEIS-PARENT-231 없는 학교명 #1

- 부모 질문: 존재하지 않는 학교명을 물으면 데이터 없음으로 정리할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 없는 학교명은 후보 없음으로 안내; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `SCHUL_NM=없는학교이름XYZ` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-232 너무 넓은 학교명 #1

- 부모 질문: 학교명이 너무 넓으면 여러 후보를 보여줄 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 넓은 query의 다중 후보 처리
- 답변 예시: 여러 학교 후보가 있어 추가 확인 필요; 후보 예시: 남서울중학교, 덜위치칼리지서울영국학교, 북서울중학교, 서서울생활과학고등학교, 서울가곡초등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `SCHUL_NM=서울` | `INFO-000` 정상 처리되었습니다. | 100/650 |

### NEIS-PARENT-233 없는 급식 날짜 #1

- 부모 질문: 급식 없는 날짜를 물으면 API 장애와 구분할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 급식 데이터 없음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_YMD=20260101` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-234 없는 일정 날짜 #1

- 부모 질문: 행사 없는 날짜를 물으면 빈 일정으로 처리할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 일정 데이터 없음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_YMD=20260405` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-235 없는 시간표 교시 #1

- 부모 질문: 없는 교시를 물으면 조건을 넓히라고 말할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 서버가 PERIO를 완전 필터링하지 않을 수 있어 클라이언트 필터 필요; 서버 rows=7, 클라이언트 교시 필터 후 rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=99` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-236 과도한 pSize #1

- 부모 질문: 한 번에 너무 많이 요청하면 에러 코드를 해석할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: pSize는 1000 이하로 재시도; 응답 코드 ERROR-336, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=수학, pSize=3000` | `ERROR-336` 데이터요청은 한번에 최대 1,000건을 넘을 수 없습니다. | 0/None |

### NEIS-PARENT-237 페이지 범위 초과 #1

- 부모 질문: 마지막 페이지 밖을 요청하면 빈 결과로 해석할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 페이지 범위 초과 또는 남은 데이터 없음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=수학, pIndex=999, pSize=100` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-238 없는 학원 관심사 #1

- 부모 질문: NEIS에 없는 관심사를 물으면 대체 검색어를 제안할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 등록 학원명 후보 없음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=태권도` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-239 학년 불일치 #1

- 부모 질문: 없는 학년 학급을 물으면 조건 오류로 안내할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 학년/학교 조건에 맞는 학급 없음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, GRADE=9` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-240 과거 시간표 공백 #1

- 부모 질문: 조회 불가 과거 시간표는 빈 결과로 처리할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 2024 시간표는 현재 endpoint에서 비어 있을 수 있음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2024, SEM=1` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-241 없는 학교명 #2

- 부모 질문: 존재하지 않는 학교명을 물으면 데이터 없음으로 정리할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 없는 학교명은 후보 없음으로 안내; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `SCHUL_NM=없는학교이름XYZ` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-242 너무 넓은 학교명 #2

- 부모 질문: 학교명이 너무 넓으면 여러 후보를 보여줄 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 넓은 query의 다중 후보 처리
- 답변 예시: 여러 학교 후보가 있어 추가 확인 필요; 후보 예시: 남서울중학교, 덜위치칼리지서울영국학교, 북서울중학교, 서서울생활과학고등학교, 서울가곡초등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `SCHUL_NM=서울` | `INFO-000` 정상 처리되었습니다. | 100/650 |

### NEIS-PARENT-243 없는 급식 날짜 #2

- 부모 질문: 급식 없는 날짜를 물으면 API 장애와 구분할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 급식 데이터 없음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_YMD=20260101` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-244 없는 일정 날짜 #2

- 부모 질문: 행사 없는 날짜를 물으면 빈 일정으로 처리할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 일정 데이터 없음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_YMD=20260405` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-245 없는 시간표 교시 #2

- 부모 질문: 없는 교시를 물으면 조건을 넓히라고 말할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 서버가 PERIO를 완전 필터링하지 않을 수 있어 클라이언트 필터 필요; 서버 rows=7, 클라이언트 교시 필터 후 rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=99` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-246 과도한 pSize #2

- 부모 질문: 한 번에 너무 많이 요청하면 에러 코드를 해석할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: pSize는 1000 이하로 재시도; 응답 코드 ERROR-336, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=수학, pSize=3000` | `ERROR-336` 데이터요청은 한번에 최대 1,000건을 넘을 수 없습니다. | 0/None |

### NEIS-PARENT-247 페이지 범위 초과 #2

- 부모 질문: 마지막 페이지 밖을 요청하면 빈 결과로 해석할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 페이지 범위 초과 또는 남은 데이터 없음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=수학, pIndex=999, pSize=100` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-248 없는 학원 관심사 #2

- 부모 질문: NEIS에 없는 관심사를 물으면 대체 검색어를 제안할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 등록 학원명 후보 없음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=태권도` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-249 학년 불일치 #2

- 부모 질문: 없는 학년 학급을 물으면 조건 오류로 안내할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 학년/학교 조건에 맞는 학급 없음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, GRADE=9` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-250 과거 시간표 공백 #2

- 부모 질문: 조회 불가 과거 시간표는 빈 결과로 처리할 수 있나요?
- 아이/상황: 부모 요청이 모호하거나 데이터가 없거나 API 제한에 걸린 상황
- 상태: `pass`
- 해석: 예상 가능한 edge 응답 코드 해석
- 답변 예시: 2024 시간표는 현재 endpoint에서 비어 있을 수 있음; 응답 코드 INFO-200, rows=0

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2024, SEM=1` | `INFO-200` 해당하는 데이터가 없습니다. | 0/None |

### NEIS-PARENT-251 서울 고등학교명+위치

- 부모 질문: 서울 지역 고등학교만 좁혀 찾을 수 있나요?
- 아이/상황: 지역+학교급+설립구분 복합 필터
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 가락고등학교, 가재울고등학교, 강동고등학교, 강서고등학교, 강일고등학교, 개포고등학교, 건국대학교사범대학부속고등학교, 경기고등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_KND_SC_NM=고등학교, LCTN_SC_NM=서울특별시` | `INFO-000` 정상 처리되었습니다. | 100/319 |

### NEIS-PARENT-252 서울 중학교명+위치

- 부모 질문: 서울 지역 중학교만 좁혀 찾을 수 있나요?
- 아이/상황: 지역+학교급+설립구분 복합 필터
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 가락중학교, 가산중학교, 가원중학교, 가재울중학교, 강남중학교, 강동중학교, 강명중학교, 강북중학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_KND_SC_NM=중학교, LCTN_SC_NM=서울특별시` | `INFO-000` 정상 처리되었습니다. | 100/390 |

### NEIS-PARENT-253 서울 초등학교명+위치

- 부모 질문: 서울 지역 초등학교만 좁혀 찾을 수 있나요?
- 아이/상황: 지역+학교급+설립구분 복합 필터
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 경기초등학교, 경복초등학교, 경희초등학교, 계성초등학교, 광운초등학교, 금성초등학교, 대광초등학교, 동광초등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_KND_SC_NM=초등학교, LCTN_SC_NM=서울특별시` | `INFO-000` 정상 처리되었습니다. | 100/610 |

### NEIS-PARENT-254 경기 고등학교 위치

- 부모 질문: 경기 지역 고등학교 후보도 같은 방식으로 찾을 수 있나요?
- 아이/상황: 지역+학교급+설립구분 복합 필터
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 가온고등학교, 가운고등학교, 가좌고등학교, 가평고등학교, 갈매고등학교, 감일고등학교, 경기게임마이스터고등학교, 경기경영고등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=J10, SCHUL_KND_SC_NM=고등학교, LCTN_SC_NM=경기도` | `INFO-000` 정상 처리되었습니다. | 100/505 |

### NEIS-PARENT-255 부산 초등학교 위치

- 부모 질문: 부산 지역 초등학교 후보도 찾을 수 있나요?
- 아이/상황: 지역+학교급+설립구분 복합 필터
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: (가칭)에코1초등학교, (가칭)일광3초등학교, 가남초등학교, 가동초등학교, 가락초등학교, 가야초등학교, 가평초등학교, 감전초등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=C10, SCHUL_KND_SC_NM=초등학교, LCTN_SC_NM=부산광역시` | `INFO-000` 정상 처리되었습니다. | 100/307 |

### NEIS-PARENT-256 공립 학교 필터

- 부모 질문: 공립 학교만 좁혀 후보를 볼 수 있나요?
- 아이/상황: 지역+학교급+설립구분 복합 필터
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 가락고등학교, 가재울고등학교, 강일고등학교, 개포고등학교, 경기고등학교, 경기기계공업고등학교, 경기상업고등학교, 경기여자고등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, FOND_SC_NM=공립, SCHUL_KND_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 100/116 |

### NEIS-PARENT-257 사립 학교 필터

- 부모 질문: 사립 학교만 좁혀 후보를 볼 수 있나요?
- 아이/상황: 지역+학교급+설립구분 복합 필터
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 경기초등학교, 경복초등학교, 경희초등학교, 계성초등학교, 광운초등학교, 금성초등학교, 대광초등학교, 동광초등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, FOND_SC_NM=사립, SCHUL_KND_SC_NM=초등학교` | `INFO-000` 정상 처리되었습니다. | 38/38 |

### NEIS-PARENT-258 학교코드 직접

- 부모 질문: 학교코드만 있을 때 학교를 복원할 수 있나요?
- 아이/상황: 지역+학교급+설립구분 복합 필터
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 가락고등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `SD_SCHUL_CODE=7010057` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-259 학교명+교육청

- 부모 질문: 학교명과 교육청을 함께 쓰면 후보를 정확히 줄일 수 있나요?
- 아이/상황: 지역+학교급+설립구분 복합 필터
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 가락고등학교, 가락중학교, 서울가락초등학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_NM=가락` | `INFO-000` 정상 처리되었습니다. | 3/3 |

### NEIS-PARENT-260 특수학교 위치

- 부모 질문: 특수학교도 위치/교육청 조합으로 찾을 수 있나요?
- 아이/상황: 지역+학교급+설립구분 복합 필터
- 상태: `pass`
- 해석: schoolInfo.SCHUL_NM 확인
- 답변 예시: 광성하늘빛학교, 교남학교, 누리학교, 다니엘학교, 밀알학교, 서울경운학교, 서울광진학교, 서울나래학교

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/schoolInfo` | `ATPT_OFCDC_SC_CODE=B10, SCHUL_KND_SC_NM=특수학교, LCTN_SC_NM=서울특별시` | `INFO-000` 정상 처리되었습니다. | 32/32 |

### NEIS-PARENT-261 고1 반

- 부모 질문: 고1 반 목록을 확인할 수 있나요?
- 아이/상황: 학교급+학년+반 필터
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4, 5, 6, 7, 8

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, GRADE=1` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-262 고2 반

- 부모 질문: 고2 반 목록도 확인할 수 있나요?
- 아이/상황: 학교급+학년+반 필터
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4, 5, 6, 7, 8

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, GRADE=2` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-263 고3 반

- 부모 질문: 고3 반 목록도 확인할 수 있나요?
- 아이/상황: 학교급+학년+반 필터
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4, 5, 6, 7, 8

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, GRADE=3` | `INFO-000` 정상 처리되었습니다. | 9/9 |

### NEIS-PARENT-264 중1 반

- 부모 질문: 중1 반 목록을 확인할 수 있나요?
- 아이/상황: 학교급+학년+반 필터
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4, 5, 6

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, GRADE=1` | `INFO-000` 정상 처리되었습니다. | 6/6 |

### NEIS-PARENT-265 중2 반

- 부모 질문: 중2 반 목록을 확인할 수 있나요?
- 아이/상황: 학교급+학년+반 필터
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4, 5, 6

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, GRADE=2` | `INFO-000` 정상 처리되었습니다. | 6/6 |

### NEIS-PARENT-266 중3 반

- 부모 질문: 중3 반 목록을 확인할 수 있나요?
- 아이/상황: 학교급+학년+반 필터
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4, 5

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, GRADE=3` | `INFO-000` 정상 처리되었습니다. | 5/5 |

### NEIS-PARENT-267 초1 반

- 부모 질문: 초1 반 목록을 확인할 수 있나요?
- 아이/상황: 학교급+학년+반 필터
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, GRADE=1` | `INFO-000` 정상 처리되었습니다. | 4/4 |

### NEIS-PARENT-268 초2 반

- 부모 질문: 초2 반 목록을 확인할 수 있나요?
- 아이/상황: 학교급+학년+반 필터
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4, 5

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, GRADE=2` | `INFO-000` 정상 처리되었습니다. | 5/5 |

### NEIS-PARENT-269 초3 반

- 부모 질문: 초3 반 목록을 확인할 수 있나요?
- 아이/상황: 학교급+학년+반 필터
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1, 2, 3, 4, 5, 6

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, GRADE=3` | `INFO-000` 정상 처리되었습니다. | 6/6 |

### NEIS-PARENT-270 특수 고등 과정 반

- 부모 질문: 특수학교 고등 과정 반 목록을 확인할 수 있나요?
- 아이/상황: 학교급+학년+반 필터
- 상태: `pass`
- 해석: classInfo.CLASS_NM 확인
- 답변 예시: 1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/classInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, GRADE=1, SCHUL_CRSE_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-271 고1 1반 1교시

- 부모 질문: 고1 1반 1교시를 정확히 좁힐 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 고1 1반 1교시
- 답변 예시: 20260304 1교시: 공통수학1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-272 고1 2반 2교시

- 부모 질문: 고1 2반 2교시도 반 파라미터로 좁힐 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 고1 2반 2교시
- 답변 예시: 20260304 2교시: 공통수학1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=2, PERIO=2` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-273 고2 1반 3교시

- 부모 질문: 고2 시간표도 학년 파라미터로 확인할 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 고2 1반 3교시
- 답변 예시: 20260304 3교시: 대수

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=2, CLASS_NM=1, PERIO=3` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-274 고 계열 일반계

- 부모 질문: 고등학교 계열 필터를 함께 넣어도 조회할 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 고 계열 일반계
- 답변 예시: 20260304 1교시: 공통수학1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, ORD_SC_NM=일반계` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-275 고 학과 일반학과

- 부모 질문: 고등학교 학과 필터를 함께 넣어도 조회할 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 고 학과 일반학과
- 답변 예시: 20260304 1교시: 공통수학1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, DDDEP_NM=일반학과` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-276 고 강의실 1

- 부모 질문: 강의실명까지 넣어 시간표를 좁힐 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 고 강의실 1
- 답변 예시: 20260304 1교시: 공통수학1

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/hisTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, CLRM_NM=1` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-277 중1 1반 4교시

- 부모 질문: 중1 1반 4교시를 확인할 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 중1 1반 4교시
- 답변 예시: 20260304 4교시: 사회

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, ALL_TI_YMD=20260304, GRADE=1, CLASS_NM=1, PERIO=4` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-278 중2 1반 기간

- 부모 질문: 중2 1반 기간 시간표를 확인할 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 중2 1반 기간
- 답변 예시: 20260304 1교시: 영어

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/misTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130165, AY=2026, SEM=1, GRADE=2, CLASS_NM=1, TI_FROM_YMD=20260304, TI_TO_YMD=20260306` | `INFO-000` 정상 처리되었습니다. | 19/19 |

### NEIS-PARENT-279 초1 1반 2교시

- 부모 질문: 초1 1반 2교시를 확인할 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 초1 1반 2교시
- 답변 예시: 20260302 2교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, PERIO=2` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-280 초2 1반 기간

- 부모 질문: 초2 1반 기간 시간표를 확인할 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 초2 1반 기간
- 답변 예시: 20260302 1교시: 수업명 미기재

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/elsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7130110, AY=2026, SEM=1, GRADE=2, CLASS_NM=1, TI_FROM_YMD=20260302, TI_TO_YMD=20260306` | `INFO-000` 정상 처리되었습니다. | 28/28 |

### NEIS-PARENT-281 특수 과정 고등학교

- 부모 질문: 특수학교 과정명을 함께 넣어 조회할 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 특수 과정 고등학교
- 답변 예시: 20260302 1교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, SCHUL_CRSE_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 7/7 |

### NEIS-PARENT-282 특수 강의실

- 부모 질문: 특수학교 강의실 필터를 함께 넣어 조회할 수 있나요?
- 아이/상황: 학교급+학년+반+계열/학과/강의실 복합 필터
- 상태: `pass`
- 해석: 특수 강의실
- 답변 예시: 20260302 1교시: 대체휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/spsTimetable` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010575, AY=2026, SEM=1, ALL_TI_YMD=20260302, GRADE=1, CLASS_NM=1, CLRM_NM=1` | `INFO-000` 정상 처리되었습니다. | 20/20 |

### NEIS-PARENT-283 급식 단일일자

- 부모 질문: 급식일자 하나만으로 조회할 수 있나요?
- 아이/상황: 날짜/기간/식사코드/과정 복합 필터
- 상태: `pass`
- 해석: mealServiceDietInfo.DDISH_NM 확인
- 답변 예시: 칼슘강화찹쌀밥 <br/>북어미역국 (5.6)<br/>한방돈갈비찜 (5.6.10.13)<br/>사천식잡채 (1.5.6.12.13.18)<br/>배추김치 (9)<br/>텔레토비마카롱 (1.2.6)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_YMD=20260504, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-284 급식 기간

- 부모 질문: 급식 기간으로 여러 식단을 볼 수 있나요?
- 아이/상황: 날짜/기간/식사코드/과정 복합 필터
- 상태: `pass`
- 해석: mealServiceDietInfo.DDISH_NM 확인
- 답변 예시: 칼슘강화찹쌀밥 <br/>북어미역국 (5.6)<br/>한방돈갈비찜 (5.6.10.13)<br/>사천식잡채 (1.5.6.12.13.18)<br/>배추김치 (9)<br/>텔레토비마카롱 (1.2.6), [대체식]흰쌀밥 <br/>땡초주먹밥 (1.5.6.10.13)<br/>미소된장국 (5.6)<br/>단무지채깻잎무침 (13)<br/>라볶이 (1.5.6.13)<br/>콘치즈팝만두 (1.2.5.6.18)<br/>배추김치 (9)<br/>유산균음료 (2), 발아현미밥 <br/>뉴욕돼지곰탕 (5.6.10.15)<br/>적채부추무침 (13)<br/>팽이버섯전 (1.6)<br/>석박지 (9)<br/>사과 , ★1학년급식-오리뽑기이벤트★ [대체식]흰쌀밥 <br/>[대체식]콩나물김치국 (5.9)<br/>수제싸이버거 (1.2.5.6.12.15.16)<br/>오지치즈후라이 (2.5.6.10)<br/>골라먹는스파클링제로음료(레인보우샤베트or애플민트) <br/>수제오이무피클 (13)<br/>그린샐러드&파인애플드레싱 (1.2.4.5.6.9.10.11.12.13.15.16.17.18), 칼슘보리밥 <br/>닭개장 (5.6.15)<br/>참나물파채무침 (5.6.13)<br/>육전구이 (1.2.5.6.10.16)<br/>오이김치 (9)<br/>오렌지 , 수수밥 <br/>쇠고기무국 (5.6.16)<br/>청경채찜 (5.6.13.18)<br/>뉴진면닭갈비 (2.5.6.12.13.15.16.18)<br/>버터찹쌀김부각 (5.6)<br/>배추김치 (9), 다시마무채국 (5.6)<br/>쭈돈덮밥 (5.6.10.13.16)<br/>수제오꼬노미야끼 (1.5.6.10.13.17)<br/>백김치 (9)<br/>설레임(밀크맛) (1.2.5), 칼슘강화찹쌀밥 <br/>쑥갓어묵국 (1.5.6.9.13)<br/>알본디가스(스페인식미트볼)그라탕 (1.2.3.5.6.10.12)<br/>잠발라고등어구이 (1.2.5.7.12.13)<br/>깍두기 (9)<br/>소바샐러드 (3.5.6.7.9.12.13.18)

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-285 급식 식사코드

- 부모 질문: 중식 코드로 식단을 좁힐 수 있나요?
- 아이/상황: 날짜/기간/식사코드/과정 복합 필터
- 상태: `pass`
- 해석: mealServiceDietInfo.MMEAL_SC_NM 확인
- 답변 예시: 중식

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, MLSV_FROM_YMD=20260501, MLSV_TO_YMD=20260531, MMEAL_SC_CODE=2` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-286 일정 단일일자

- 부모 질문: 학사일자 하나만으로 조회할 수 있나요?
- 아이/상황: 날짜/기간/식사코드/과정 복합 필터
- 상태: `pass`
- 해석: SchoolSchedule.EVENT_NM 확인
- 답변 예시: 대체공휴일

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_YMD=20260302` | `INFO-000` 정상 처리되었습니다. | 1/1 |

### NEIS-PARENT-287 일정 기간 3월

- 부모 질문: 3월 학사일정을 기간으로 조회할 수 있나요?
- 아이/상황: 날짜/기간/식사코드/과정 복합 필터
- 상태: `pass`
- 해석: SchoolSchedule.EVENT_NM 확인
- 답변 예시: 3·1절, 대체공휴일, 입학식, 개학식, 봉사활동사전교육, 토요휴업일, 학급자치활동, 학급임원선거

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-288 일정 기간 5월

- 부모 질문: 5월 학사일정을 기간으로 조회할 수 있나요?
- 아이/상황: 날짜/기간/식사코드/과정 복합 필터
- 상태: `pass`
- 해석: SchoolSchedule.EVENT_NM 확인
- 답변 예시: 재량휴업일, 노동절, 토요휴업일, 어린이날, 학력평가(3), 소풍, 학생참여한마당

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260501, AA_TO_YMD=20260531` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-289 일정 주야과정

- 부모 질문: 주야과정명을 함께 넣어도 조회할 수 있나요?
- 아이/상황: 날짜/기간/식사코드/과정 복합 필터
- 상태: `pass`
- 해석: SchoolSchedule.EVENT_NM 확인
- 답변 예시: 3·1절, 대체공휴일, 입학식, 개학식, 봉사활동사전교육, 토요휴업일, 학급자치활동, 학급임원선거

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331, DGHT_CRSE_SC_NM=주간` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-290 일정 학교과정

- 부모 질문: 학교과정명을 함께 넣어도 조회할 수 있나요?
- 아이/상황: 날짜/기간/식사코드/과정 복합 필터
- 상태: `pass`
- 해석: SchoolSchedule.EVENT_NM 확인
- 답변 예시: 3·1절, 대체공휴일, 입학식, 개학식, 봉사활동사전교육, 토요휴업일, 학급자치활동, 학급임원선거

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/SchoolSchedule` | `ATPT_OFCDC_SC_CODE=B10, SD_SCHUL_CODE=7010057, AA_FROM_YMD=20260301, AA_TO_YMD=20260331, SCHUL_CRSE_SC_NM=고등학교` | `INFO-000` 정상 처리되었습니다. | 18/18 |

### NEIS-PARENT-291 강남 수학

- 부모 질문: 강남구 수학 학원 후보를 찾을 수 있나요?
- 아이/상황: 지역+학원명+분야+과정 복합 필터
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: BT수학전문수학교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 선릉로 38

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ADMST_ZONE_NM=강남구, ACA_NM=수학` | `INFO-000` 정상 처리되었습니다. | 100/515 |

### NEIS-PARENT-292 서초 영어

- 부모 질문: 서초구 영어 학원 후보를 찾을 수 있나요?
- 아이/상황: 지역+학원명+분야+과정 복합 필터
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 그래머에이펙스영어교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 서초구 서초대로 389

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ADMST_ZONE_NM=서초구, ACA_NM=영어` | `INFO-000` 정상 처리되었습니다. | 100/211 |

### NEIS-PARENT-293 강남 보습

- 부모 질문: 강남구 보습 과정 후보를 찾을 수 있나요?
- 아이/상황: 지역+학원명+분야+과정 복합 필터
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 301아카데미(Academy)영어교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 개포로82길 7

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ADMST_ZONE_NM=강남구, LE_CRSE_NM=보습` | `INFO-000` 정상 처리되었습니다. | 100/642 |

### NEIS-PARENT-294 입시검정 보습

- 부모 질문: 분야와 과정을 함께 넣어 학원을 좁힐 수 있나요?
- 아이/상황: 지역+학원명+분야+과정 복합 필터
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 301아카데미(Academy)영어교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 개포로82길 7

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, REALM_SC_NM=입시.검정 및 보습, LE_CRSE_NM=보습` | `INFO-000` 정상 처리되었습니다. | 100/9056 |

### NEIS-PARENT-295 댄스 과정

- 부모 질문: 댄스 과정 학원을 과정명으로 찾을 수 있나요?
- 아이/상황: 지역+학원명+분야+과정 복합 필터
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 김강산댄스스튜디오학원 / 기예(대) / 댄스 / 서울특별시 강남구 선릉로161길 11

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, LE_CRSE_NM=댄스` | `INFO-000` 정상 처리되었습니다. | 100/116 |

### NEIS-PARENT-296 미술 과정

- 부모 질문: 미술 과정 학원을 과정명으로 찾을 수 있나요?
- 아이/상황: 지역+학원명+분야+과정 복합 필터
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 감성예찬미술교습소 / 예능(대) / 미술 / 서울특별시 강남구 도곡로93길 12

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, LE_CRSE_NM=미술` | `INFO-000` 정상 처리되었습니다. | 100/2282 |

### NEIS-PARENT-297 음악 과정

- 부모 질문: 음악 과정 학원을 과정명으로 찾을 수 있나요?
- 아이/상황: 지역+학원명+분야+과정 복합 필터
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: J바이올린음악교습소 / 예능(대) / 음악 / 서울특별시 강남구 압구정로 309

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, LE_CRSE_NM=음악` | `INFO-000` 정상 처리되었습니다. | 100/3287 |

### NEIS-PARENT-298 논술 학원명

- 부모 질문: 논술 학원명을 키워드로 찾을 수 있나요?
- 아이/상황: 지역+학원명+분야+과정 복합 필터
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: GLMA글로벌인생만남논술교습소 / 입시.검정 및 보습 / 보습·논술 / 서울특별시 강남구 일원로5길 71

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=논술` | `INFO-000` 정상 처리되었습니다. | 100/1145 |

### NEIS-PARENT-299 과학 학원명

- 부모 질문: 과학 학원명을 키워드로 찾을 수 있나요?
- 아이/상황: 지역+학원명+분야+과정 복합 필터
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 강성호올림피아드과학교습소 / 입시.검정 및 보습 / 보습 / 서울특별시 강남구 선릉로62길 30

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=과학` | `INFO-000` 정상 처리되었습니다. | 100/439 |

### NEIS-PARENT-300 코딩 학원명

- 부모 질문: 코딩 학원명을 키워드로 찾을 수 있나요?
- 아이/상황: 지역+학원명+분야+과정 복합 필터
- 상태: `pass`
- 해석: 관심사 기반 공식 등록 학원 후보
- 답변 예시: 강남코리코딩교습소 / 기타(대) / None / 서울특별시 강남구 광평로10길 50

| Step | API | 주요 파라미터 | Result | Rows/Total |
|---:|---|---|---|---:|
| 1 | `GET /hub/acaInsTiInfo` | `ATPT_OFCDC_SC_CODE=B10, ACA_NM=코딩` | `INFO-000` 정상 처리되었습니다. | 78/78 |
