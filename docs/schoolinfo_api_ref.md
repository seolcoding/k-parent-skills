# 학교알리미(schoolinfo.go.kr) Open API 레퍼런스

> 출처: <https://www.schoolinfo.go.kr> — 호출에 필요한 정보만 정리한 요약본.
> 근거: 공식 개발자 가이드 PDF(<https://www.schoolinfo.go.kr/download/OpenAPI_Developer_Guide.pdf>, 7쪽, 2025-07-30 작성),
> API 제공목록 페이지(`/ng/go/pnnggo_a01_l0.do`)의 항목별 명세, 출력값 정의 스크립트(`/js/new/dev/openApi.js`), 라이브 호출 검증(2026-07-07).

## 공통 사항

- Base URL: `https://www.schoolinfo.go.kr/openApi.do` (REST, JSON. GET 호출 라이브 검증 완료, 포털 샘플 화면은 POST 사용)
- 인증키 발급: 학교알리미 > OpenAPI > 로그인(소셜 로그인) 후 신청 → `나의 정보 조회`에서 인증키 확인. 이용 현황(공시정보별 호출횟수, 마지막 사용일)도 같은 화면에서 조회.
- 요청제한횟수: 포털 메타정보 기준 **제한없음** (단, 부정 이용·시스템 과부하 시 제한 가능. 개발 계정은 보수적으로 사용 권장)
- 제공 기관: 교육부/한국교육학술정보원(KERIS) 학교알리미. 적재주기: **연간** (초·중등 교육정보 공시 데이터)
- **최근 3년치 공시만 제공** (2026-07 기준 `pbanYr` 선택지: 2024·2025·2026). 3년 이전 자료는 에듀데이터서비스(EDSS)로 신청.
- 하나의 URL(`openApi.do`)에 `apiType` 파라미터로 공시 항목을 선택하는 구조 (NEIS처럼 엔드포인트가 나뉘지 않음).
- 이용허락: 공공누리 출처표시 (출처 표시 시 영리 이용·변형 가능)

### 공통 기본인자

```yaml
apiKey:       { type: STRING, required: true,  desc: 인증키 }
apiType:      { type: STRING, required: true,  desc: 공시 항목 코드 (아래 카탈로그 참조) }
pbanYr:       { type: NUMBER, required: true,  desc: 공시연도(yyyy). 최근 3년만. apiType=0(학교기본정보)은 불필요 }
sidoCode:     { type: STRING, required: false, desc: 시도코드 (생략 시 전국) }
sggCode:      { type: STRING, required: false, desc: 시군구코드 (생략 시 시도 전체) }
schulKndCode: { type: STRING, required: true,  desc: 학교급구분. 02:초등 03:중등 04:고등 05:특수 06:그외 07:각종 (항목별 허용값 상이) }
depthNo:      { type: STRING, required: 항목별, desc: 분류1 (apiType 04·24·27·28·35·58만 사용) }
depthNo2:     { type: STRING, required: 항목별, desc: 분류2 (apiType 27·28만 사용) }
```

- 호출 URL 형식 (개발자 가이드 p.5):
  ```
  https://www.schoolinfo.go.kr/openApi.do?apiKey=<KEY>&apiType=<코드>&sidoCode=<시도>&sggCode=<시군구>&schulKndCode=<학교급>
  ```
- 스펙에 없는 파라미터는 무시되는 것으로 보임 (`apiType=0`에 `pbanYr`를 붙여도 정상 응답 확인).
- 페이지네이션 파라미터는 **없음**. 조건에 맞는 전체 목록이 한 번에 반환되므로 `sidoCode`/`sggCode`로 응답 크기를 제한할 것 (전국 초등학교 목록 요청 시 6천 건 이상).

### 코드표

`schulKndCode` (학교급구분):

| 코드 | 학교급 |
|---|---|
| 02 | 초등학교 |
| 03 | 중학교 |
| 04 | 고등학교 |
| 05 | 특수학교 |
| 06 | 그외학교 |
| 07 | 각종학교 |

`sidoCode` (라이브 페이지 select 기준, 2026-07-07):

| 코드 | 시도 | 코드 | 시도 |
|---|---|---|---|
| 11 | 서울특별시 | 41 | 경기도 |
| 12 | 전남광주통합특별시 | 43 | 충청북도 |
| 26 | 부산광역시 | 44 | 충청남도 |
| 27 | 대구광역시 | 47 | 경상북도 |
| 28 | 인천광역시 | 48 | 경상남도 |
| 30 | 대전광역시 | 50 | 제주특별자치도 |
| 31 | 울산광역시 | 51 | 강원특별자치도 |
| 36 | 세종특별자치시 | 52 | 전북특별자치도 |

- `sggCode`는 법정동코드 앞 5자리 (예: 서울 종로구 `11110`). 전체 표는 포털 첨부 `시도시군구코드.xlsx`(<https://www.schoolinfo.go.kr/download/sido_sggCode.xlsx>) 또는 제공목록 페이지에 인라인된 시군구 select 스크립트에서 확인.
- 응답의 `ADRCD_CD`/`ADRCD_ID`(법정동코드 10자리) 앞 5자리가 `sggCode`와 일치하므로, 학교기본정보로 sggCode를 역산할 수 있다.

---

## 공시 항목(apiType) 카탈로그 — 총 35종

포털 제공목록 페이지의 카테고리별 목록 34종 + 메뉴에서 내려간 42(환경위생관리 현황). 모든 항목의 요청 URL은 동일하고 `apiType`만 바뀐다.
"추가 인자"가 없는 항목의 신청인자는 `apiKey, apiType, pbanYr, sidoCode(선택), sggCode(선택), schulKndCode` 고정이다.

### 학사/학생 (groupNo=1, 12종)

| apiType | 항목명 | schulKndCode 허용값 | 추가 인자 |
|---|---|---|---|
| `0` | 학교기본정보 | 02 03 04 05 06 07 | `pbanYr` 불필요 (연도 무관 현재 스냅샷) |
| `08` | 수업일수 및 수업시수 현황 | 02 03 04 05 | - |
| `04` | 자유학기제 운영에 관한 사항 | 03 | `depthNo` 10:1학기 20:2학기 |
| `62` | 학교 현황 | 02 03 04 05 06 07 | - |
| `63` | 성별 학생수 | 02 03 04 05 06 07 | - |
| `09` | 학년별·학급별 학생수 | 02 03 04 05 06 07 | - |
| `10` | 전·출입 및 학업중단 학생 수 | 02 03 04 05 | - |
| `22` | 직위별 교원 현황 | 02 03 04 05 06 07 | - |
| `64` | 자격종별 교원 현황 | 02 03 04 05 07 | - |
| `24` | 표시과목별 교원 현황 | 02 03 04 | `depthNo` 10:교과별 20:과목별 |
| `94` | 대상별 학교폭력 예방교육 실적 | 02 03 04 05 07 | - |
| `51` | 입학생 현황 | 02 03 04 05 | - |

### 재정/시설/설비 (groupNo=2, 9종 + 중단 1종)

| apiType | 항목명 | schulKndCode 허용값 | 추가 인자 |
|---|---|---|---|
| `16` | 학교용지 현황 | 02 03 04 05 06 07 | - |
| `17` | 교사(校舍) 현황 | 02 03 04 05 06 07 | - |
| `18` | 학생교육활동에 필요한 지원시설 현황 | 02 03 04 05 06 07 | - |
| `20` | 학교시설 개방에 관한 사항 | 02 03 04 05 07 | - |
| `27` | 학교회계 예·결산서(국공립) | 02 03 04 05 07 | `depthNo` 10:예산 20:결산, `depthNo2` 1:세입(예산) 2:세출(예산) 3:세입(결산) 4:세출(결산) |
| `28` | 사립학교 교비회계 예·결산서 | 02 03 04 05 06 07 | `depthNo`/`depthNo2` 27과 동일 |
| `30` | 학교발전기금 | 02 03 04 05 | - |
| `44` | 시설안전 점검 현황 | 02 03 04 05 07 | - |
| `73` | 교복 구매 유형 및 단가 | 02 03 04 05 06 07 | - |
| `42` | 환경위생관리 현황 — **2024년부터 API 제공 중단** | (02 03 04 05) | 호출 시 `fail` 반환 (라이브 확인) |

### 보건/복지 (groupNo=3, 13종)

| apiType | 항목명 | schulKndCode 허용값 | 추가 인자 |
|---|---|---|---|
| `67` | 교육운영 특색사업 계획 | 02 03 04 05 07 | - |
| `21` | 장애인 편의시설 현황 | 02 03 04 05 06 07 | - |
| `34` | 급식 실시 현황 | 02 03 04 05 | - |
| `35` | 급식비 집행 실적 | 02 03 04 05 | `depthNo` 10:급식비부담주체 20:급식비지출내역 |
| `38` | 보건관리 현황 | 02 03 04 05 | - |
| `43` | 안전교육 계획 및 실시현황 | 02 03 04 05 07 | - |
| `55` | 장학금 수혜 현황 | 03 04 05 | - |
| `56` | 동아리 활동 현황 | 02 03 04 | - |
| `58` | 학교도서관 현황 | 02 03 04 05 07 | `depthNo` 10:자료보유 20:운영현황 30:이용현황 |
| `59` | 방과후학교 운영 계획 및 운영ㆍ지원현황 | 02 03 04 05 | - |
| `61` | 학생·학부모 상담계획 및 실시 현황 | 02 03 04 05 | - |
| `68` | 직원 현황 | 02 03 04 05 | - |
| `90` | 학생의 체력 증진에 관한 사항 | 02 03 04 | - |

### 공통 출력값 (모든 항목의 행 앞부분)

모든 공시 항목의 각 행(list 원소)은 아래 학교 식별 블록으로 시작한다. `apiType=0`은 `PBAN_EXCP_*` 대신 자체 필드를 가진다.

| 출력명 | 설명 | 비고 |
|--------|------|------|
| ATPT_OFCDC_ORG_NM | 시도교육청 | 국립학교는 항목에 따라 `교육부`로 오기도 함 (라이브 확인) |
| ATPT_OFCDC_ORG_CODE | 시도교육청코드 | 예: `A000000001` |
| JU_ORG_NM | 교육지원청 | |
| JU_ORG_CODE | 교육지원청코드 | |
| ADRCD_NM | 지역 (예: `서울특별시 종로구`) | |
| ADRCD_CD | 지역코드 (법정동코드 10자리) | 앞 5자리 = `sggCode` |
| LCTN_SC_CODE | 소재지구분코드 (예: `01`) | |
| SCHUL_CODE | 정보공시 학교코드 (예: `S000003563`) | NEIS `SD_SCHUL_CODE`와 **다른 체계** |
| SCHUL_NM | 학교명 | |
| SCHUL_KND_SC_CODE | 학교급코드 (`02`~`07`) | |
| FOND_SC_CODE | 설립구분 | 값이 코드가 아니라 한글명 (`국립`/`공립`/`사립`) |
| HS_KND_SC_NM | 고등학교종류 | 고등학교 행에만 존재 |
| BNHH_YN | 분교여부 (`Y`/`N`) | |
| PBAN_EXCP_YN | 공시 제외여부 | apiType=0 제외 전 항목 |
| PBAN_EXCP_RSN | 공시 제외사유 | 제외(`Y`)일 때만 존재 |

값 타입 주의 (라이브 검증):

- 수치 필드는 JSON number(정수/실수)로 내려온다. 문자열 아님.
- `*_CODE`로 끝나도 실제 값이 한글명인 필드가 많다 (`FOND_SC_CODE=국립`, `DGHT_SC_CODE=주간`, `COEDU_SC_CODE=남녀공학`, `OPER_MET_CODE`, `FAS_DTN_SC_CODE=복식부기`, `PBAN_REV_EX_SC_CODE=예산세입` 등).
- 값이 없는 필드는 행에서 key 자체가 생략된다 (예: 미폐교 학교의 `ABSCH_YMD`, 초등학교 행의 `HS_KND_SC_NM`).
- `COL_*` 계열 필드는 **같은 key라도 학교급(schulKndCode)에 따라 의미가 다르다**. 예: apiType 62의 `COL_1`은 초·중·고에서 `1학년 학급수`, 특수학교에서 `유초등부-유`. 반드시 조회한 schulKndCode 기준으로 해석할 것.

---

## 항목별 상세 (라이브 검증 12종)

아래 각 항목의 "라이브 확인 필드"는 2026-07-07 서울 종로구(`sidoCode=11&sggCode=11110`) seed 호출에서 실제 관측된 row key다.
공통 식별 블록(위 표)은 생략하고 항목 고유 필드만 적는다. 전체 항목(35종)의 출력값 원본 명세는 제공목록 페이지 각 항목 탭과 `/js/new/dev/openApi.js`의 `setReturnData()`에 있다.

### 1. 학교기본정보 — `apiType=0`

- `pbanYr` 불필요. 폐교(`ABSCH_YN`)·휴교(`CLOSE_YN`) 포함 스냅샷.
- 호출 예시:
  ```
  https://www.schoolinfo.go.kr/openApi.do?apiKey=<KEY>&apiType=0&sidoCode=11&sggCode=11110&schulKndCode=02
  ```

출력값 (38필드 전체):

| 출력명 | 설명 | 출력명 | 설명 |
|--------|------|--------|------|
| ATPT_OFCDC_ORG_NM | 시도교육청 | SCHUL_RDNZC | 학교도로명 우편번호 |
| ATPT_OFCDC_ORG_CODE | 시도교육청코드 | SCHUL_RDNMA | 학교도로명 주소 |
| JU_ORG_NM | 교육지원청 | SCHUL_RDNDA | 학교도로명 상세주소 |
| JU_ORG_CODE | 교육지원청코드 | LTTUD | 위도 (number) |
| ADRCD_NM | 지역 | LGTUD | 경도 (number) |
| ADRCD_CD | 지역코드 | USER_TELNO | 전화번호 |
| LCTN_SC_CODE | 소재지구분코드 | USER_TELNO_SW | 전화번호(교무실) |
| SCHUL_CODE | 정보공시 학교코드 | USER_TELNO_GA | 전화번호(행정실) |
| SHL_IDF_CD | 학교고유식별코드(UUID) | PERC_FAXNO | 팩스번호 |
| SCHUL_NM | 학교명 | HMPG_ADRES | 홈페이지 주소 |
| SCHUL_KND_SC_CODE | 학교급코드 | COEDU_SC_CODE | 남녀공학 구분 |
| FOND_SC_CODE | 설립구분 | ABSCH_YN | 폐교여부 |
| HS_KND_SC_NM | 고등학교종류 (고교만) | ABSCH_YMD | 폐교일자 (폐교시만) |
| BNHH_YN | 분교여부 | CLOSE_YN | 휴교여부 |
| SCHUL_FOND_TYP_CODE | 설립유형 | SCHUL_CRSE_SC_VALUE | 학교과정구분값(2-3-4) |
| DGHT_SC_CODE | 주야구분 | SCHUL_CRSE_SC_VALUE_NM | 학교과정구분명(초-중-고) |
| FOAS_MEMRD | 개교기념일 | ADRES_BRKDN | 주소내역 |
| FOND_YMD | 설립일 | DTLAD_BRKDN | 상세주소내역 |
| ADRCD_ID | 법정동코드 | ZIP_CODE | 우편번호 |

- 라이브 결과: 종로구 초등 13개교, 명세 38필드 중 `HS_KND_SC_NM`만 미관측(초등이라 정상). 명세 외 필드 없음.

### 2. 수업일수 및 수업시수 현황 — `apiType=08`

- 신청인자: 기본형 + `pbanYr`. schulKndCode 02~05.
- 항목 고유 출력값: `COL_1`~`COL_6`(1~6학년 수업일수; 중·고는 1~3학년만), `PER_STUDAY_DAY`(교사 1인당 주당평균수업시수), `WEEK_TOT_ITRT_HR_FGR`(주당수업시수), `ITRT_TCR_TOT_FGR`(수업교원수).
- 특수학교(05) 전용: `SCHUL_CRSE_SC_CODE_P/M/H`(과정구분)와 `COL_n_P`(유초등부 1~6학년), `COL_n_M`, `COL_n_H`(중·고등부 1~3학년).
- 라이브(초등): 13개교. `COL_1~6`, `PER_STUDAY_DAY`, `WEEK_TOT_ITRT_HR_FGR`, `ITRT_TCR_TOT_FGR` 관측. `_P/_M/_H` 계열은 특수학교 전용이라 미관측(정상).

### 3. 학교 현황 — `apiType=62`

- 신청인자: 기본형 + `pbanYr`. schulKndCode 02~07.
- 초·중·고·그외: `COL_1`~`COL_6`(학년별 학급수), `COL_7`(특수학급), `COL_8`(순회학급), `COL_SUM`(학급수계), `COL_FGR_SUM`(학생수계), `AVG_FGR_SUM`(학급당학생수), `SP_SUM`/`SP_FGR_SUM`(특수학급 학급수/학생수계).
- 특수(05)·각종(07)은 유초등부/중등부/고등부/전공과 블록별 `COL_*`, `COL_SUM_n`, `COL_SUM_FGRn`, `AVG_SUM_FGRn` 체계로 같은 key가 다른 의미를 가진다 (포털 명세 참조).
- 라이브(초등): 13개교, 위 초·중·고 필드셋 전부 관측. 명세 외 필드 없음.

### 4. 성별 학생수 — `apiType=63`

- 신청인자: 기본형 + `pbanYr`. schulKndCode 02~07.
- 초·중·고·그외: `COL_M1`~`COL_M8`/`COL_W1`~`COL_W8`(학년·특수·순회학급별 남/여 학생수), `COL_MSUM`/`COL_WSUM`(남/여 계), `SUM`(총계).
- 특수·각종은 부(部)별 반복 필드(`COL_SM*`, `COL_MSUM1~4` 등) 사용.
- 라이브(초등): 13개교, `COL_M1~M8`, `COL_W1~W8`, `COL_MSUM`, `COL_WSUM`, `SUM` 관측.

### 5. 학년별·학급별 학생수 — `apiType=09`

- 신청인자: 기본형 + `pbanYr`. schulKndCode 02~07.
- 학년(n=1~6)·특수학급(7)·순회학급(8)별 3필드 세트: `COL_Cn`(학급수), `COL_Sn`(학생수), `COL_n`(학급당 학생수). 합계 `COL_C_SUM`/`COL_S_SUM`/`COL_SUM`, 교원 지표 `TEACH_CNT`(교사수), `TEACH_CAL`(수업교원 1인당 학생수).
- 라이브(초등): 13개교, 위 필드셋 전부 관측.

### 6. 직위별 교원 현황 — `apiType=22`

- 신청인자: 기본형 + `pbanYr`. schulKndCode 02~07.
- 직위 인덱스: 1 교장, 2 교감, 15 수석교사, 3 보직교사, 4 일반교사, 5 특수교사, 6 전문상담교사, 7 사서교사, 8 실기교사, 9 보건교사, 10 영양교사, 11 기간제교사, 13 강사, 14 원어민강사.
- 직위 n마다 `COL_Mn`(남)/`COL_Wn`(여)/`COL_Rn`(휴직교원)/`COL_n`(계). 총계는 `COL_SM`/`COL_SW`/`COL_SR`/`COL_S`, 휴직교원수 `COL_R_SUM`.
- 라이브(초등): 13개교, 75개 필드 관측 (`COL_R14`(원어민 휴직)와 `COL_M12`류 미사용 인덱스 제외).

### 7. 입학생 현황 — `apiType=51`

- 신청인자: 기본형 + `pbanYr`. schulKndCode 02~05. **학교급에 따라 출력 구조가 완전히 다름**:
  - 초등(02): 적령/유예·과령/조기입학 아동별 남·여·합계·비율 (`BEAGE_*`, `HEST_AWA_LTAGE_*`, `ELPD_ETRC_*`, `TOTAL_1/2`, `TOT_SUM`).
  - 중·고(03/04): 당해연도/이전연도 졸업자, 검정고시 등 이수자별 남·여·합계·비율 (`PRTI_GRDTN_*`, `BFR_YR_GRDTN_*`, `SQE_COMPT_*`, `ETC_*`, `MAN_SUM`/`WOMAN_SUM`/`ALL_SUM`). `(2020년 이전)` 표기 필드는 과거 연도 조회 전용.
  - 특수(05): 장애 유형별 남·여·합계·비율 (`HDEY_*`, `HDER_*`, `MER_*` 등).
- 라이브(고등, schulKndCode=04): 14개교, 중·고 필드셋 + `DGHT_CRSE_SC_CODE`(주야과정, 명세 외 추가 필드) + `HS_KND_SC_NM` 관측.

### 8. 자유학기제 운영에 관한 사항 — `apiType=04`

- 신청인자: 기본형 + `pbanYr` + `depthNo`(10:1학기, 20:2학기). schulKndCode **03(중학교) 전용**.
- 항목 고유 출력값: `LBRTY_SEM_SC_CODE`(자유학기구분코드, 예: `학기제`), `COL_P`(운영학기, 예: `1학년 1학기`), `COL_4`(진로탐색활동), `COL_5`(주제선택활동), `COL_6`(예술체육활동), `COL_7`(동아리활동), `COL_8`(소계), `COL_3`(교과활동시간, 2024년 이전).
- 라이브(중학교): 9개교, 명세 필드 전부 관측 (`PBAN_EXCP_RSN`만 예외 학교가 없어 미관측).

### 9. 표시과목별 교원 현황 — `apiType=24`

- 신청인자: 기본형 + `pbanYr` + `depthNo`(10:교과별, 20:과목별). schulKndCode 02~04.
- 초등(02): 학급 유형(`COL1_*`: 교감/일반/특수/순회학급)과 교과(`COL_M/W/n`: 국어~기타)별 남·여·계 매트릭스.
- 중·고(03/04): 학교×교과(과목)당 1행 — `FMTCD`(교과코드), `PJ_CHASU`(교과차수), `UPPER_ORGA_NM`(상위교과), `ORGA_NM`(교과명), `SBJT_CODE`/`SBJT_NM`(과목코드/명, depthNo=20), `ML_TCHER_FGR`/`FML_TCHER_FGR`/`SUM_CNT`(남/여/계).
- 라이브(중학교, depthNo=10): **130행** (학교당 교과 수만큼 행이 반복됨). 중·고 필드셋 관측.

### 10. 학교회계 예·결산서(국공립) — `apiType=27`

- 신청인자: 기본형 + `pbanYr` + `depthNo`(10:예산, 20:결산) + `depthNo2`(1:세입(예산) 2:세출(예산) 3:세입(결산) 4:세출(결산)). schulKndCode 02~05, 07. 사립학교는 `apiType=28`(같은 구조).
- 세입(depthNo2=1/3): `FAS_DTN_SC_CODE`(예결산구분), `PBAN_REV_EX_SC_CODE`(예: `예산세입`), `AMT1`~`AMT6` = 정부이전수입/기타이전수입/학부모부담수입/지원금수입/행정활동수입/기타.
- 세출(depthNo2=2/4): `AMT1`~`AMT8` = 인적자원운용/학생복지·교육격차해소/기본적교육활동/선택적교육활동/교육활동지원/학교일반운영/학교시설확충/학교재무활동.
- `CLSDR_YN`(비공개여부)은 명세에 있으나 라이브에서는 미관측.
- 라이브(초등, 예산·세입): 11개교(국공립만), `AMT1~6` number 관측.

### 11. 급식 실시 현황 — `apiType=34`

- 신청인자: 기본형 + `pbanYr`. schulKndCode 02~05.
- 항목 고유 출력값: `OPER_MET_CODE`(운영방식-급식종류), `COL_1`(직영급식)/`COL_2`(전부위탁 업체명)/`COL_3`(일부위탁 업체명), `HAKSAENGSU_TOT`(전체학생수), `MLSV_STDNT_FGR`(급식학생수), `KS_RATE`(급식비율), `NTRST_FGR`/`COOK_FGR`/`COOAS_FGR`(영양(교)사/조리사/조리원 수), `COL_4`~`COL_7`(배식장소: 식당/교실/식당+교실/기타).
- 라이브(초등): 13개교. `COL_2`/`COL_3`(위탁 업체명)·`COL_5`/`COL_7`은 해당 학교가 없어 미관측(정상), 나머지 전부 관측.

### 12. 학교도서관 현황 — `apiType=58`

- 신청인자: 기본형 + `pbanYr` + `depthNo`(10:자료보유, 20:운영현황, 30:이용현황). schulKndCode 02~05, 07.
- depthNo=10(자료보유): `GNRL_BOKS_FGR`(도서자료), `NN_BOS_DTA_FGR`(비도서자료수), `SUMCNT`(합계), `PBAN_YR_ALL_STDNT_FGR`(공시연도 전체 학생수), `RATIO`(학생 1인당 자료수).
- depthNo=20/30: 사서 인력(`LBRRY_CRQFC_*`), 예산(`PRTI_DTA_PHS_CST` 등), 대출(`LBRRY_LN_DTA_FGR` 등) — 포털 명세 참조.
- 라이브(초등, depthNo=10): 13개교, depthNo=10 필드셋 전부 관측.

---

## 라이브 검증 결과 (2026-07-07 KST)

검증 출처:

- 공식 포털: <https://www.schoolinfo.go.kr> (OpenAPI 메뉴: API 이용안내 `/ng/go/pnnggo_a01_m0.do`, API 제공목록 `/ng/go/pnnggo_a01_l0.do`)
- 공식 개발자 가이드 PDF: <https://www.schoolinfo.go.kr/download/OpenAPI_Developer_Guide.pdf> — 7쪽 이미지 기반 PDF(텍스트 레이어 없음)여서 pdftotext 추출은 실패, 페이지 이미지 판독으로 내용 확보 (인증키 발급 절차, 요청인자 표, 호출 URL 형식, Java/jQuery 예제)
- 항목 카탈로그·명세: 제공목록 페이지 HTML(EUC-KR) 내 항목 select/JS(`loadOpenApi(goNo, groupNo)`)와 항목별 요청인자 표(34종 전수 조회) + `/js/new/dev/openApi.js`의 `setReturnData()` 출력값 정의(35종 + 42 구버전)
- 라이브 probe 스크립트: `scripts/schoolinfo_live_probe.py`
- 원시 결과 JSON: `tmp/schoolinfo_live_probe.json` (`apiKey` 값은 마스킹 저장)

검증 방법:

1. `.env`의 `SCHOOLINFO_API_KEY`로 실제 `https://www.schoolinfo.go.kr/openApi.do`를 GET 호출했다.
2. 대표 apiType 12종(0·08·62·63·09·22·51·04·24·27·34·58) + 오류 3종(필수 인자 누락, 제공 중단 42, 잘못된 키) = **총 15회 호출** (개발 계정 쿼터 보호를 위해 40회 한도·네트워크 오류에 한해 재시도 1회 정책).
3. 서울 종로구(`sidoCode=11&sggCode=11110`) seed로 응답 크기를 제한하고, HTTP status, `resultCode`/`resultMsg`, list 건수, 실제 row 필드를 수집했다.
4. 포털 출력값 명세(`openApi.js`)와 실제 row 필드 셋을 비교했다.

재실행:

```bash
set -a
source .env
set +a
python3 scripts/schoolinfo_live_probe.py --output tmp/schoolinfo_live_probe.json
```

### 공통 응답 구조

정상 응답 (HTTP 200):

```json
{
  "resultCode": "success",
  "resultMsg": "성공",
  "list": [
    { "SCHUL_CODE": "S000003563", "SCHUL_NM": "서울대학교사범대학부설초등학교", "LTTUD": 37.5778056231 }
  ]
}
```

실패 응답도 HTTP 200으로 오고 `resultCode`가 `fail`이다. `list`는 아예 없다.

```json
{ "resultCode": "fail", "resultMsg": "유효하지 않은 apiKey입니다." }
```

검증된 결과 코드/메시지:

| 상황 | HTTP | `resultCode` | `resultMsg` (라이브 관측) | 처리 |
|---|---:|---|---|---|
| 정상 | 200 | `success` | `성공` | `list` 배열 사용 (조건에 맞는 학교가 없으면 빈 배열 가능) |
| 필수 인자 누락 | 200 | `fail` | `schulKndCode는 필수 정보입니다.` | 요청 파라미터 수정 |
| 제공 중단/미공시 항목·연도 | 200 | `fail` | `선택하신 항목은 해당 연도에 공시되지 않은 항목으로 제공이 불가합니다.` | apiType·pbanYr 조합 확인 (42는 2024년부터 중단) |
| 잘못된 인증키 | 200 | `fail` | `유효하지 않은 apiKey입니다.` | 인증 설정 오류로 처리 |

- 최상위 key는 `resultCode`/`resultMsg`/`list` 3개뿐 (총건수·페이지 메타데이터 없음).
- 응답 본문은 UTF-8 JSON. (포털 웹 페이지는 EUC-KR이지만 API 응답은 UTF-8로 확인)

### apiType별 라이브 검증 요약

seed: `sidoCode=11&sggCode=11110`(서울 종로구), `pbanYr=2025`. "명세 대비"는 포털 출력값 명세(해당 학교급 기준)와 실제 row 필드 비교 결과.

| apiType | 항목 | 조건 | `resultCode` | Rows | 명세 대비 |
|---|---|---|---|---:|---|
| `0` | 학교기본정보 | schulKndCode=02 | `success` | 13 | 일치 (`HS_KND_SC_NM`은 고교 전용이라 미관측) |
| `08` | 수업일수·수업시수 | schulKndCode=02 | `success` | 13 | 일치 (특수학교 전용 `_P/_M/_H` 미관측) |
| `62` | 학교 현황 | schulKndCode=02 | `success` | 13 | 일치 |
| `63` | 성별 학생수 | schulKndCode=02 | `success` | 13 | 일치 |
| `09` | 학년별·학급별 학생수 | schulKndCode=02 | `success` | 13 | 일치 |
| `22` | 직위별 교원 현황 | schulKndCode=02 | `success` | 13 | 일치 (미사용 직위 인덱스 일부 미관측) |
| `51` | 입학생 현황 | schulKndCode=04 | `success` | 14 | 중·고 필드셋 일치 + 명세 외 `DGHT_CRSE_SC_CODE` 추가 관측 |
| `04` | 자유학기제 | schulKndCode=03, depthNo=10 | `success` | 9 | 일치 |
| `24` | 표시과목별 교원 | schulKndCode=03, depthNo=10 | `success` | 130 | 중·고는 교과당 1행(`FMTCD`/`ORGA_NM`/`SUM_CNT` 등), 초등용 `COL_*` 매트릭스는 미관측 |
| `27` | 학교회계 예·결산(국공립) | schulKndCode=02, depthNo=10, depthNo2=1 | `success` | 11 | 일치 (`CLSDR_YN` 미관측) |
| `34` | 급식 실시 현황 | schulKndCode=02 | `success` | 13 | 일치 (위탁 업체명 등 해당 없는 필드 미관측) |
| `58` | 학교도서관 현황 | schulKndCode=02, depthNo=10 | `success` | 13 | 일치 |
| `0` | (오류) schulKndCode 누락 | sidoCode/sggCode만 | `fail` | - | `schulKndCode는 필수 정보입니다.` |
| `42` | (오류) 제공 중단 항목 | schulKndCode=02, pbanYr=2025 | `fail` | - | `선택하신 항목은 해당 연도에 공시되지 않은 항목으로 제공이 불가합니다.` |
| `0` | (오류) 잘못된 인증키 | 더미 키 | `fail` | - | `유효하지 않은 apiKey입니다.` |

### 에이전트용 호출 순서

1. `apiType=0`(학교기본정보)으로 학교를 확정한다. `sidoCode`+`sggCode`+`schulKndCode`로 좁혀 호출하고, `SCHUL_NM`/주소로 학교를 고른 뒤 `SCHUL_CODE`를 기억한다.
2. 다른 공시 항목은 지역 단위 응답이므로, 같은 `sidoCode`/`sggCode`/`schulKndCode`로 호출한 뒤 응답 안에서 `SCHUL_CODE`로 원하는 학교 행을 필터링한다 (학교 단위 조회 파라미터는 없음).
3. `pbanYr`는 2026-07 기준 2024~2026만 유효. 갓 시작된 연도는 공시 전일 수 있으므로 `fail`(미공시) 응답이 오면 직전 연도로 재시도한다.
4. `depthNo`(04·24·27·28·35·58)와 `depthNo2`(27·28)는 필수다. 빠뜨리면 `fail` 또는 빈 결과가 온다.
5. `COL_*` 필드는 schulKndCode별 의미표(포털 명세)를 먼저 확보한 뒤 해석한다. 같은 key가 학교급마다 다른 뜻이다.
6. 전국 단위 수집이 필요하면 시도(16개)×시군구 루프로 나눠 호출하고, 항목당 연 1회 적재(연간 공시)이므로 캐시를 적극 활용한다.

미확인/주의 사항:

- `sggCode` 전체 표는 `시도시군구코드.xlsx` 다운로드로 확인 가능하나 이번 검증에서는 서울 종로구만 사용했다.
- `schulKndCode=06(그외)`/`07(각종)`, `depthNo=20/30` 변형, apiType 나머지 23종(10·16·17·18·20·21·28·30·35·38·43·44·55·56·59·61·64·67·68·73·90·94)은 쿼터 보호를 위해 라이브 호출하지 않았다 (명세만 확보).
- `pbanYr=2026`(당해연도) 데이터 존재 여부는 미검증.
- XML 등 JSON 외 포맷 옵션은 문서화되어 있지 않다 (포털 메타: 데이터포맷 JSON).
