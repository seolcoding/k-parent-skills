# NEIS 교육정보 개방 포털 Open API 레퍼런스

> 출처: <https://open.neis.go.kr> — 호출에 필요한 정보만 정리한 요약본 (이미지·포털 네비게이션 제거).

## 공통 사항

- Base URL: `https://open.neis.go.kr/hub/<엔드포인트>`
- 인증키 신청: <https://open.neis.go.kr/portal/myPage/actKeyPage.do>
- 인증키 없이 호출하면 **5건만 샘플로** 응답. 실제 호출 시 반드시 인증키 사용.
- 모든 엔드포인트 호출 제한: **제한없음**.
- 제공 기관: 교육부, 17개 시도교육청. DATA 개방일: 2019-04-01.

### 공통 기본인자 (모든 엔드포인트 동일)

```yaml
KEY:    { type: STRING, required: true,  desc: 인증키,            default: sample key }
Type:   { type: STRING, required: true,  desc: 호출 문서(xml,json), default: xml }
pIndex: { type: INTEGER, required: true, desc: 페이지 위치,        default: 1   (sample key는 1 고정) }
pSize:  { type: INTEGER, required: true, desc: 페이지당 건수,      default: 100 (sample key는 5 고정) }
```

### 공통 키 필드

거의 모든 엔드포인트가 공유하는 핵심 키:

- `ATPT_OFCDC_SC_CODE` — 시도교육청코드 (예: `K10` 강원, `T10` 충북, `J10` 전북)
- `SD_SCHUL_CODE` — 행정표준코드 (학교 코드)

> 호출 예시 URL의 `<KEY>`, `<시도교육청코드>`, `<학교코드>` placeholder는 실제 값으로 치환하세요.
> 시간표 4종은 2025학년도 이후 데이터만 정상 조회됩니다 (각 섹션의 과거 데이터 안내 참고).

---

## 1. 학교기본정보 — `GET /hub/schoolInfo`

- 적재주기: 매주
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/schoolInfo?KEY=<KEY>&Type=json&pIndex=1&pSize=100&SCHUL_NM=서울고등학교
  ```
- 비고: 폐교 현황은 학교알리미(<https://www.schoolinfo.go.kr>)에서 확인. Map 검색은 최대 300개 마커.

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: false, desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: false, desc: 행정표준코드 }
SCHUL_NM:           { required: false, desc: 학교명 }
SCHUL_KND_SC_NM:    { required: false, desc: 학교종류명 }
LCTN_SC_NM:         { required: false, desc: 시도명 }
FOND_SC_NM:         { required: false, desc: 설립명 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| ENG_SCHUL_NM | 영문학교명 |
| SCHUL_KND_SC_NM | 학교종류명 |
| LCTN_SC_NM | 시도명 |
| JU_ORG_NM | 관할조직명 |
| FOND_SC_NM | 설립명 |
| ORG_RDNZC | 도로명우편번호 |
| ORG_RDNMA | 도로명주소 |
| ORG_RDNDA | 도로명상세주소 |
| ORG_TELNO | 전화번호 |
| HMPG_ADRES | 홈페이지주소 |
| COEDU_SC_NM | 남녀공학구분명 |
| ORG_FAXNO | 팩스번호 |
| HS_SC_NM | 고등학교구분명 |
| INDST_SPECL_CCCCL_EXST_YN | 산업체특별학급존재여부 |
| HS_GNRL_BUSNS_SC_NM | 고등학교일반전문구분명 |
| SPCLY_PURPS_HS_ORD_NM | 특수목적고등학교계열명 |
| ENE_BFE_SEHF_SC_NM | 입시전후기구분명 |
| DGHT_SC_NM | 주야구분명 |
| FOND_YMD | 설립일자 |
| FOAS_MEMRD | 개교기념일 |
| LOAD_DTM | 수정일자 |

---

## 2. 학교계열정보 — `GET /hub/schulAflcoinfo`

- 적재주기: 매월
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/schulAflcoinfo?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&SD_SCHUL_CODE=<학교코드>
  ```
- 용도: 고등학교·특수학교 시간표 조회 조건(콤보박스)으로 사용.

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: false, desc: 행정표준코드 }
DGHT_CRSE_SC_NM:    { required: false, desc: 주야과정명 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| DGHT_CRSE_SC_NM | 주야과정명 |
| ORD_SC_NM | 계열명 |
| LOAD_DTM | 수정일자 |

---

## 3. 학교학과정보 — `GET /hub/schoolMajorinfo`

- 적재주기: 매월
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/schoolMajorinfo?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&SD_SCHUL_CODE=<학교코드>
  ```
- 용도: 고등학교·특수학교 시간표 조회 조건(콤보박스)으로 사용.

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: false, desc: 행정표준코드 }
DGHT_CRSE_SC_NM:    { required: false, desc: 주야과정명 }
ORD_SC_NM:          { required: false, desc: 계열명 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| DGHT_CRSE_SC_NM | 주야과정명 |
| ORD_SC_NM | 계열명 |
| DDDEP_NM | 학과명 |
| LOAD_DTM | 수정일자 |

---

## 4. 학급정보 — `GET /hub/classInfo`

- 적재주기: 매월
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/classInfo?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&SD_SCHUL_CODE=<학교코드>&AY=2025
  ```
- 용도: 초등학교·중학교 시간표 조회 조건(콤보박스)으로 사용.

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: true,  desc: 행정표준코드 }
AY:                 { required: false, desc: 학년도 }
GRADE:              { required: false, desc: 학년 }
DGHT_CRSE_SC_NM:    { required: false, desc: 주야과정명 }
SCHUL_CRSE_SC_NM:   { required: false, desc: 학교과정명 }
ORD_SC_NM:          { required: false, desc: 계열명 }
DDDEP_NM:           { required: false, desc: 학과명 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| AY | 학년도 |
| GRADE | 학년 |
| DGHT_CRSE_SC_NM | 주야과정명 |
| SCHUL_CRSE_SC_NM | 학교과정명 |
| ORD_SC_NM | 계열명 |
| DDDEP_NM | 학과명 |
| CLASS_NM | 학급명 |
| LOAD_DTM | 수정일자 |

---

## 5. 초등학교시간표 — `GET /hub/elsTimetable`

- 적재주기: 매일
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/elsTimetable?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&SD_SCHUL_CODE=<학교코드>&AY=2025&SEM=1&ALL_TI_YMD=20250303
  ```
- 과거 데이터: 2023.8~2024학년도는 API 조회 불가(필요 시 openinfo@keris.or.kr 문의).
  2019~2023.7 데이터는 `elsTimetablebgs` 엔드포인트로 조회.
  예: `https://open.neis.go.kr/hub/elsTimetablebgs?ATPT_OFCDC_SC_CODE=K10&SD_SCHUL_CODE=7840018`

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: true,  desc: 행정표준코드 }
AY:                 { required: false, desc: 학년도 }
SEM:                { required: false, desc: 학기 }
ALL_TI_YMD:         { required: false, desc: 시간표일자 }
GRADE:              { required: false, desc: 학년 }
CLASS_NM:           { required: false, desc: 학급명 }
PERIO:              { required: false, desc: 교시 }
TI_FROM_YMD:        { required: false, desc: 시간표시작일자 }
TI_TO_YMD:          { required: false, desc: 시간표종료일자 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| AY | 학년도 |
| SEM | 학기 |
| ALL_TI_YMD | 시간표일자 |
| GRADE | 학년 |
| CLASS_NM | 학급명 |
| PERIO | 교시 |
| ITRT_CNTNT | 수업내용 |
| LOAD_DTM | 수정일자 |

---

## 6. 중학교시간표 — `GET /hub/misTimetable`

- 적재주기: 매일
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/misTimetable?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&SD_SCHUL_CODE=<학교코드>&AY=2025&SEM=1&ALL_TI_YMD=20250303
  ```
- 과거 데이터: 2023.8~2024학년도는 API 조회 불가. 2019~2023.7은 `misTimetablebgs` 사용.
  예: `https://open.neis.go.kr/hub/misTimetablebgs?ATPT_OFCDC_SC_CODE=T10&SD_SCHUL_CODE=7003714`

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: true,  desc: 행정표준코드 }
AY:                 { required: false, desc: 학년도 }
SEM:                { required: false, desc: 학기 }
ALL_TI_YMD:         { required: false, desc: 시간표일자 }
DGHT_CRSE_SC_NM:    { required: false, desc: 주야과정명 }
GRADE:              { required: false, desc: 학년 }
CLASS_NM:           { required: false, desc: 학급명 }
PERIO:              { required: false, desc: 교시 }
TI_FROM_YMD:        { required: false, desc: 시간표시작일자 }
TI_TO_YMD:          { required: false, desc: 시간표종료일자 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| AY | 학년도 |
| SEM | 학기 |
| ALL_TI_YMD | 시간표일자 |
| DGHT_CRSE_SC_NM | 주야과정명 |
| GRADE | 학년 |
| CLASS_NM | 학급명 |
| PERIO | 교시 |
| ITRT_CNTNT | 수업내용 |
| LOAD_DTM | 수정일자 |

---

## 7. 고등학교시간표 — `GET /hub/hisTimetable`

- 적재주기: 매일
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/hisTimetable?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&SD_SCHUL_CODE=<학교코드>&AY=2025&SEM=1&ALL_TI_YMD=20250303
  ```
- 과거 데이터: 2023.8~2024학년도는 API 조회 불가. 2019~2023.7은 `hisTimetablebgs` 사용.
  예: `https://open.neis.go.kr/hub/hisTimetablebgs?ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530174`

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: true,  desc: 행정표준코드 }
AY:                 { required: false, desc: 학년도 }
SEM:                { required: false, desc: 학기 }
ALL_TI_YMD:         { required: false, desc: 시간표일자 }
DGHT_CRSE_SC_NM:    { required: false, desc: 주야과정명 }
ORD_SC_NM:          { required: false, desc: 계열명 }
DDDEP_NM:           { required: false, desc: 학과명 }
GRADE:              { required: false, desc: 학년 }
CLRM_NM:            { required: false, desc: 강의실명 }
CLASS_NM:           { required: false, desc: 학급명 }
TI_FROM_YMD:        { required: false, desc: 시간표시작일자 }
TI_TO_YMD:          { required: false, desc: 시간표종료일자 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| AY | 학년도 |
| SEM | 학기 |
| ALL_TI_YMD | 시간표일자 |
| DGHT_CRSE_SC_NM | 주야과정명 |
| ORD_SC_NM | 계열명 |
| DDDEP_NM | 학과명 |
| GRADE | 학년 |
| CLRM_NM | 강의실명 |
| CLASS_NM | 학급명 |
| PERIO | 교시 |
| ITRT_CNTNT | 수업내용 |
| LOAD_DTM | 수정일자 |

---

## 8. 학사일정 — `GET /hub/SchoolSchedule`

- 적재주기: 매일
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/SchoolSchedule?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&SD_SCHUL_CODE=<학교코드>&AA_FROM_YMD=20250301&AA_TO_YMD=20250630
  ```
- 비고: 학년별 행사여부 필드(`ONE_GRADE_EVENT_YN` ~ `SIX_GRADE_EVENT_YN`)로 대상 학년 판별 가능.

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: true,  desc: 행정표준코드 }
DGHT_CRSE_SC_NM:    { required: false, desc: 주야과정명 }
SCHUL_CRSE_SC_NM:   { required: false, desc: 학교과정명 }
AA_YMD:             { required: false, desc: 학사일자 }
AA_FROM_YMD:        { required: false, desc: 학사시작일자 }
AA_TO_YMD:          { required: false, desc: 학사종료일자 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| AY | 학년도 |
| DGHT_CRSE_SC_NM | 주야과정명 |
| SCHUL_CRSE_SC_NM | 학교과정명 |
| SBTR_DD_SC_NM | 수업공제일명 |
| AA_YMD | 학사일자 |
| EVENT_NM | 행사명 |
| EVENT_CNTNT | 행사내용 |
| ONE_GRADE_EVENT_YN | 1학년행사여부 |
| TW_GRADE_EVENT_YN | 2학년행사여부 |
| THREE_GRADE_EVENT_YN | 3학년행사여부 |
| FR_GRADE_EVENT_YN | 4학년행사여부 |
| FIV_GRADE_EVENT_YN | 5학년행사여부 |
| SIX_GRADE_EVENT_YN | 6학년행사여부 |
| LOAD_DTM | 수정일자 |

---

## 9. 급식식단정보 — `GET /hub/mealServiceDietInfo`

- 적재주기: 매일
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&SD_SCHUL_CODE=<학교코드>&MLSV_YMD=20250303
  ```
- 비고: 현재 연도 급식만 제공. 요리명(`DDISH_NM`)의 숫자는 알레르기 유발 식재료 번호:
  1.난류 2.우유 3.메밀 4.땅콩 5.대두 6.밀 7.고등어 8.게 9.새우 10.돼지고기
  11.복숭아 12.토마토 13.아황산류 14.호두 15.닭고기 16.쇠고기 17.오징어 18.조개류(굴·전복·홍합) 19.잣

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: true,  desc: 행정표준코드 }
MMEAL_SC_CODE:      { required: false, desc: 식사코드 }
MLSV_YMD:           { required: false, desc: 급식일자 }
MLSV_FROM_YMD:      { required: false, desc: 급식시작일자 }
MLSV_TO_YMD:        { required: false, desc: 급식종료일자 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| MMEAL_SC_CODE | 식사코드 |
| MMEAL_SC_NM | 식사명 |
| MLSV_YMD | 급식일자 |
| MLSV_FGR | 급식인원수 |
| DDISH_NM | 요리명 |
| ORPLC_INFO | 원산지정보 |
| CAL_INFO | 칼로리정보 |
| NTR_INFO | 영양정보 |
| MLSV_FROM_YMD | 급식시작일자 |
| MLSV_TO_YMD | 급식종료일자 |
| LOAD_DTM | 수정일자 |

---

## 10. 특수학교시간표 — `GET /hub/spsTimetable`

- 적재주기: 매일
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/spsTimetable?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&SD_SCHUL_CODE=<학교코드>&AY=2025&SEM=1&ALL_TI_YMD=20250303
  ```
- 과거 데이터: 2023.8~2024학년도는 API 조회 불가. 2019~2023.7은 `spsTimetablebgs` 사용.
  예: `https://open.neis.go.kr/hub/spsTimetablebgs?ATPT_OFCDC_SC_CODE=K10&SD_SCHUL_CODE=7800534`

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: true,  desc: 행정표준코드 }
AY:                 { required: false, desc: 학년도 }
SEM:                { required: false, desc: 학기 }
ALL_TI_YMD:         { required: false, desc: 시간표일자 }
SCHUL_CRSE_SC_NM:   { required: false, desc: 학교과정명 }
GRADE:              { required: false, desc: 학년 }
CLRM_NM:            { required: false, desc: 강의실명 }
CLASS_NM:           { required: false, desc: 학급명 }
PERIO:              { required: false, desc: 교시 }
TI_FROM_YMD:        { required: false, desc: 시간표시작일자 }
TI_TO_YMD:          { required: false, desc: 시간표종료일자 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| AY | 학년도 |
| SEM | 학기 |
| ALL_TI_YMD | 시간표일자 |
| SCHUL_CRSE_SC_NM | 학교과정명 |
| GRADE | 학년 |
| CLRM_NM | 강의실명 |
| CLASS_NM | 학급명 |
| PERIO | 교시 |
| ITRT_CNTNT | 수업내용 |
| LOAD_DTM | 수정일자 |

---

## 11. 학원교습소정보 — `GET /hub/acaInsTiInfo`

- 적재주기: 매주
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/acaInsTiInfo?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&ACA_NM=<학원명>
  ```
- 비고: 휴원일자·등록상태·정원·분야·계열·과정 제공. 수강료는 공개여부(`THCC_OTHBC_YN`)에 따라 노출.
  이 엔드포인트는 `SD_SCHUL_CODE` 대신 `ATPT_OFCDC_SC_CODE`만 필수.

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
ADMST_ZONE_NM:      { required: false, desc: 행정구역명 }
ACA_ASNUM:          { required: false, desc: 학원지정번호 }
ACA_NM:             { required: false, desc: 학원명 }
REALM_SC_NM:        { required: false, desc: 분야명 }
LE_ORD_NM:          { required: false, desc: 교습계열명 }
LE_CRSE_NM:         { required: false, desc: 교습과정명 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| ADMST_ZONE_NM | 행정구역명 |
| ACA_INSTI_SC_NM | 학원교습소명 |
| ACA_ASNUM | 학원지정번호 |
| ACA_NM | 학원명 |
| ESTBL_YMD | 개설일자 |
| REG_YMD | 등록일자 |
| REG_STTUS_NM | 등록상태명 |
| CAA_BEGIN_YMD | 휴원시작일자 |
| CAA_END_YMD | 휴원종료일자 |
| TOFOR_SMTOT | 정원합계 |
| DTM_RCPTN_ABLTY_NMPR_SMTOT | 일시수용능력인원합계 |
| REALM_SC_NM | 분야명 |
| LE_ORD_NM | 교습계열명 |
| LE_CRSE_LIST_NM | 교습과정목록명 |
| LE_CRSE_NM | 교습과정명 |
| PSNBY_THCC_CNTNT | 인당수강료 |
| THCC_OTHBC_YN | 수강료공개여부 |
| BRHS_ACA_YN | 기숙사학원여부 |
| FA_RDNMA | 도로명주소 |
| FA_RDNDA | 도로명상세주소 |
| FA_RDNZC | 도로명우편번호 |
| FA_TELNO | 전화번호 |
| LOAD_DTM | 수정일자 |

---

## 12. 시간표강의실정보 — `GET /hub/tiClrminfo`

- 적재주기: 매일
- 호출 예시:
  ```
  https://open.neis.go.kr/hub/tiClrminfo?KEY=<KEY>&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=<시도교육청코드>&SD_SCHUL_CODE=<학교코드>&AY=2025
  ```
- 용도: 고등학교 시간표 조회 조건으로 사용.

신청인자:

```yaml
ATPT_OFCDC_SC_CODE: { required: true,  desc: 시도교육청코드 }
SD_SCHUL_CODE:      { required: true,  desc: 행정표준코드 }
AY:                 { required: false, desc: 학년도 }
GRADE:              { required: false, desc: 학년 }
SEM:                { required: false, desc: 학기 }
SCHUL_CRSE_SC_NM:   { required: false, desc: 학교과정명 }
DGHT_CRSE_SC_NM:    { required: false, desc: 주야과정명 }
ORD_SC_NM:          { required: false, desc: 계열명 }
DDDEP_NM:           { required: false, desc: 학과명 }
```

출력값:

| 출력명 | 설명 |
|--------|------|
| ATPT_OFCDC_SC_CODE | 시도교육청코드 |
| ATPT_OFCDC_SC_NM | 시도교육청명 |
| SD_SCHUL_CODE | 행정표준코드 |
| SCHUL_NM | 학교명 |
| AY | 학년도 |
| GRADE | 학년 |
| SEM | 학기 |
| SCHUL_CRSE_SC_NM | 학교과정명 |
| DGHT_CRSE_SC_NM | 주야과정명 |
| ORD_SC_NM | 계열명 |
| DDDEP_NM | 학과명 |
| CLRM_NM | 강의실명 |
| LOAD_DTM | 수정일자 |

---

## 라이브 검증 결과 (2026-05-30 KST)

검증 출처:

- 공식 포털: <https://open.neis.go.kr>
- 공식 개발자 가이드: <https://open.neis.go.kr/portal/guide/apiGuidePage.do>
- 공식 Open API 소개: <https://open.neis.go.kr/portal/guide/apiIntroPage.do>
- 라이브 probe 스크립트: `scripts/neis_live_probe.py`
- 원시 결과 JSON: `tmp/neis_live_probe.json` (`KEY` 값은 마스킹 저장)

검증 방법:

1. `.env`의 `KEDU_INFO_KEY`를 사용해 실제 `https://open.neis.go.kr/hub/<dataset>`를 호출했다.
2. 각 엔드포인트마다 기본 query와 1~3개 변형 query를 실행했다.
3. HTTP status, NEIS `RESULT.CODE`, `row` 건수, `list_total_count`, 실제 row field 목록을 수집했다.
4. 이 문서의 출력값 목록과 실제 row field set을 비교했다.
5. 데이터 없음은 API 불능이 아니라 seed 학교/일자 문제인지 확인하기 위해 학교 검색 후 다른 학교 코드로 재검증했다.

재실행:

```bash
set -a
source .env
set +a
python3 scripts/neis_live_probe.py --output tmp/neis_live_probe.json --page-size 20
```

### 공통 응답 구조

JSON 정상 응답은 아래 구조다. 문서나 일부 예제에서 `LIST_TOTAL_COUNT`처럼 대문자로 생각하기 쉽지만, 실제 JSON head의 총건수 키는 **`list_total_count` 소문자**로 내려왔다.

```json
{
  "schoolInfo": [
    {
      "head": [
        { "list_total_count": 1 },
        { "RESULT": { "CODE": "INFO-000", "MESSAGE": "정상 처리되었습니다." } }
      ]
    },
    {
      "row": [
        { "SCHUL_NM": "서울고등학교" }
      ]
    }
  ]
}
```

데이터가 없거나 인증 오류가 나면 dataset wrapper 없이 top-level `RESULT`만 올 수 있다.

```json
{ "RESULT": { "CODE": "INFO-200", "MESSAGE": "해당하는 데이터가 없습니다." } }
```

검증된 공통 코드:

| 상황 | HTTP | `RESULT.CODE` | 처리 |
|---|---:|---|---|
| 정상 row 있음 | 200 | `INFO-000` | dataset 배열의 `row` 사용 |
| 조건에 맞는 데이터 없음 | 200 | `INFO-200` | 빈 결과로 처리, 장애 아님 |
| 잘못된 인증키 | 200 | `ERROR-290` | 인증 설정 오류로 처리 |
| `pSize > 1000` | 200 | `ERROR-336` | `pSize`를 1000 이하로 낮춰 재시도 |

인증키 없이 호출하면 샘플 모드로 동작한다. `schoolInfo`에서 `pSize=100`을 요청해도 row는 5건만 내려왔고 `list_total_count`는 실제 총건수로 표시됐다.

`Type=xml`도 정상 동작한다. XML은 `<dataset><head>...</head><row>...</row></dataset>` 구조이며, 자동화에서는 JSON이 훨씬 다루기 쉽다.

### 전체 목록 쿼리 방법

NEIS API는 검색 조건을 충분히 넓게 두고 `pIndex`/`pSize`로 페이지를 순회하면 전체 목록을 수집할 수 있다. 한 번에 받을 수 있는 최대 `pSize`는 라이브 검증상 **1000**이다.

권장 알고리즘:

```text
1. pIndex=1, pSize=1000으로 호출한다.
2. 정상 응답이면 head[0].list_total_count를 읽는다.
3. row를 저장한다.
4. ceil(list_total_count / pSize)까지 pIndex를 1씩 증가시키며 반복한다.
5. 중간 page에서 INFO-200이 오면 해당 조건의 남은 page가 없다고 보고 멈춘다.
6. ERROR-336이 오면 pSize를 1000 이하로 낮춘다.
```

예: `acaInsTiInfo?ATPT_OFCDC_SC_CODE=B10&ACA_NM=수학&pSize=1000`은 `list_total_count=4507`이었고, `pIndex=1` 1000건, `pIndex=2` 1000건, `pIndex=5` 507건으로 페이지가 정상 동작했다.

전체 수집 시 추천 seed:

| 목적 | Dataset | 넓은 조건 |
|---|---|---|
| 학교 목록 | `schoolInfo` | `ATPT_OFCDC_SC_CODE=<교육청>` 또는 `LCTN_SC_NM=<시도명>` |
| 학교별 계열/학과 | `schulAflcoinfo`, `schoolMajorinfo` | 먼저 교육청 단위로 훑고, 필요하면 `SD_SCHUL_CODE`로 좁힘 |
| 학교별 학급 | `classInfo` | `ATPT_OFCDC_SC_CODE`, `SD_SCHUL_CODE`, `AY` |
| 시간표 | `elsTimetable`, `misTimetable`, `hisTimetable`, `spsTimetable` | `ATPT_OFCDC_SC_CODE`, `SD_SCHUL_CODE`, `AY`, `SEM`; 일자 범위는 있으면 좁히기 |
| 학사일정 | `SchoolSchedule` | `ATPT_OFCDC_SC_CODE`, `SD_SCHUL_CODE`, `AA_FROM_YMD`, `AA_TO_YMD` |
| 급식 | `mealServiceDietInfo` | `ATPT_OFCDC_SC_CODE`, `SD_SCHUL_CODE`, `MLSV_FROM_YMD`, `MLSV_TO_YMD` |
| 학원/교습소 | `acaInsTiInfo` | `ATPT_OFCDC_SC_CODE`; 검색 폭이 너무 넓으면 `ACA_NM`, `ADMST_ZONE_NM`, `LE_CRSE_NM` 추가 |
| 강의실 | `tiClrminfo` | `ATPT_OFCDC_SC_CODE`, `SD_SCHUL_CODE`, `AY` |

### 엔드포인트별 라이브 검증 요약

모든 문서화된 출력 field는 실제 row에서 확인됐다. 추가 field는 발견되지 않았다.

| Dataset | 검증 query 핵심 | `RESULT` | Rows | Total | 문서 field 일치 |
|---|---|---:|---:|---:|---|
| `schoolInfo` | `SCHUL_KND_SC_NM=초등학교`, `LCTN_SC_NM=서울특별시` | `INFO-000` | 20 | 610 | 일치 |
| `schulAflcoinfo` | `ATPT_OFCDC_SC_CODE=B10` | `INFO-000` | 20 | 502 | 일치 |
| `schoolMajorinfo` | `ATPT_OFCDC_SC_CODE=B10` | `INFO-000` | 20 | 3050 | 일치 |
| `classInfo` | `B10`, `7010057`, `AY=2026` | `INFO-000` | 20 | 28 | 일치 |
| `elsTimetable` | `B10`, `7130110`, `AY=2026`, `SEM=1` | `INFO-000` | 20 | 732 | 일치 |
| `misTimetable` | `B10`, `7130165`, `AY=2026`, `SEM=1` | `INFO-000` | 20 | 9576 | 일치 |
| `hisTimetable` | `B10`, `7010057`, `AY=2026`, `SEM=1` | `INFO-000` | 20 | 601 | 일치 |
| `SchoolSchedule` | `B10`, `7010057`, `20260301~20260331` | `INFO-000` | 18 | 18 | 일치 |
| `mealServiceDietInfo` | `B10`, `7010057`, `20260501~20260531` | `INFO-000` | 18 | 18 | 일치 |
| `spsTimetable` | `B10`, `7010575`, `AY=2026`, `SEM=1` | `INFO-000` | 20 | 6944 | 일치 |
| `acaInsTiInfo` | `B10`, `ACA_NM=수학` | `INFO-000` | 20 | 9096 | 일치 |
| `tiClrminfo` | `B10`, `7010057`, `AY=2026` | `INFO-000` | 20 | 34 | 일치 |

검증에 사용한 학교 코드:

| 용도 | 교육청 | 학교명 | `SD_SCHUL_CODE` |
|---|---|---|---|
| 고등학교, 학급, 학사일정, 급식, 강의실 | 서울 `B10` | 가락고등학교 | `7010057` |
| 초등 시간표 | 서울 `B10` | 서울거여초등학교 | `7130110` |
| 중학교 시간표 | 서울 `B10` | 가락중학교 | `7130165` |
| 특수학교 시간표 | 서울 `B10` | 교남학교 | `7010575` |

주의: 시간표는 학교·학년도·학기·일자 조합에 따라 `INFO-200`이 자주 나온다. 이 경우 API가 죽은 것이 아니라 해당 학교가 그 조건의 시간표를 공개하지 않았거나 그 날짜에 시간표가 없을 가능성이 높다. 우선 `AY`와 `SEM`만으로 넓게 조회해 데이터가 있는 날짜를 찾은 뒤 `ALL_TI_YMD`, `GRADE`, `CLASS_NM`, `PERIO`로 좁히는 방식이 안정적이다.

### 에이전트용 호출 순서

학교 기반 기능은 아래 순서로 호출하면 실패율이 낮다.

1. `schoolInfo`로 학교명 후보를 찾는다.
2. 같은 이름이 여러 개면 `ATPT_OFCDC_SC_CODE`, `SCHUL_KND_SC_NM`, 주소로 하나를 확정한다.
3. 확정된 `ATPT_OFCDC_SC_CODE`와 `SD_SCHUL_CODE`를 후속 호출의 기본 키로 사용한다.
4. 시간표 기능이면 `classInfo`, `schulAflcoinfo`, `schoolMajorinfo`, `tiClrminfo`로 선택 가능한 학년/반/계열/학과/강의실 값을 먼저 가져온다.
5. 급식·학사일정은 단일 일자보다 기간 query를 먼저 사용해 실제 데이터가 있는 날짜를 찾는다.
6. 사용자가 특정 날짜만 원하면 기간 결과에서 해당 날짜를 필터링하거나, 날짜가 확실할 때만 `MLSV_YMD`/`AA_YMD`/`ALL_TI_YMD` 단일 조건으로 재호출한다.

학원/교습소 기능은 학교 코드가 없으므로 `ATPT_OFCDC_SC_CODE`가 루트 키다. `ACA_NM=수학`처럼 흔한 단어는 수천 건이 나오므로 `ADMST_ZONE_NM`, `REALM_SC_NM`, `LE_CRSE_NM`을 함께 받아 페이지 수를 줄이는 것이 좋다.
