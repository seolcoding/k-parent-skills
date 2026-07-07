# 유치원알리미 (e-childschoolinfo) Open API 레퍼런스

> 출처: <https://e-childschoolinfo.moe.go.kr> OPEN API — 호출에 필요한 정보만 정리한 요약본 (이미지·포털 네비게이션 제거).

## 공통 사항

- Base URL: `https://e-childschoolinfo.moe.go.kr/api/notice/<엔드포인트>.do`
- 서비스명: **유치원 기본현황 정보 조회** (REST, JSON). 이 서비스 하나로 아래 전체 엔드포인트가 열린다.
- 인증키 발급: OPENAPI > 소셜 로그인(네이버/구글/카카오) → 활용목적 입력 → **자동승인** → 마이페이지에서 인증키 확인. 포털: <https://e-childschoolinfo.moe.go.kr/openApi/openApiIntro.do>
- 이 저장소에서의 키 보관: 루트 `.env`의 `CHILDSCHOOLINFO_API_KEY` (gitignore됨). 문서·코드에 키 값을 쓰지 않는다.
- 호출 제한: 공식 문서에 **수치 제한 없음**. 이용안내에 "과도한 트래픽으로 시스템에 무리를 주는 경우 서비스가 제한될 수 있다"는 조항만 있다.
- 데이터포맷: JSON. 엔드포인트마다 XLSX용 `https://e-childschoolinfo.moe.go.kr/api/notice/excelDownload/<엔드포인트>.do`가 별도로 있다 (라이브 미검증).
- 적재주기: 전 엔드포인트 **비정기(수시)**. 데이터는 공시차수(`YYYYT`: 연도+차수, 예 `20261` = 2026년 1차) 단위이며 **최근 3년치만** 제공.
- 이용허락조건: 저작자와 출처를 표시하면 영리 목적 이용 포함 변경·자유이용 허용.
- 제공기관: 교육부 (운영: KERIS 한국교육학술정보원).
- 개발자 가이드 PDF: API 제공목록 페이지의 `OpenAPI개발자활용가이드.pdf` (`POST /openApi/DeveloperGuideDownload.do`, 7쪽).
- 엔드포인트별 공식 명세: `https://e-childschoolinfo.moe.go.kr/openApi/history/<엔드포인트>.do`

### 공통 요청인자 (모든 엔드포인트 동일)

전체 14개 엔드포인트의 요청인자 명세가 완전히 동일하다.

```yaml
key:         { type: STRING, required: true,  desc: 인증키 }
sidoCode:    { type: NUMBER, required: true,  desc: 시도코드 (시도시군구코드 파일 참조) }
sggCode:     { type: NUMBER, required: true,  desc: 시군구코드 (시도시군구코드 파일 참조) }
pageCnt:     { type: NUMBER, required: false, desc: 페이지당 목록 수 }
currentPage: { type: NUMBER, required: false, desc: 페이지 번호 (1부터) }
timing:      { type: NUMBER, required: false, desc: 공시차수 YYYYT(예 20261). 최근 3년치만 제공 }
```

- `timing` 미지정 시: 유치원별 **최신 공시차수** 데이터가 내려온다 (같은 응답 안에 `pbnttmng=20261`과 `20232`가 섞일 수 있음 — 유치원마다 마지막 공시 시점이 다르기 때문).
- `timing=20252`처럼 지정하면 해당 차수 데이터만 내려오고, 그 차수에 공시하지 않은 유치원은 목록에서 빠진다 (종로구: 미지정 16건 → `20252` 지정 14건).
- 페이징: `pageCnt=5&currentPage=2`로 검증. row의 `key` 순번이 전체 결과 기준으로 이어진다 (2페이지 = `6`~`10`).

### 시도/시군구 코드

- 공식 출처: API 제공목록 페이지의 **시도시군구코드.xlsx** → `https://e-childschoolinfo.moe.go.kr/openApi/sidoSigunguCode.do`
  (파일명은 xlsx지만 실제 응답은 `Content-Type: application/vnd.ms-excel`인 HTML 표. 컬럼: 시도명/시도코드/시군구명/시군구코드, 261행)
- `sidoCode` 2자리 + `sggCode` 5자리(시도 2자리로 시작). 예: 서울특별시 `11` / 종로구 `11110`, 부산광역시 `26` / 동구 `26170`.
- 시도코드 전체 (2026-07-07 다운로드 기준):

| 시도 | 코드 | 시도 | 코드 |
|---|---|---|---|
| 서울특별시 | 11 | 경기도 | 41 |
| 전남광주통합특별시 | 12 | 충청북도 | 43 |
| 부산광역시 | 26 | 충청남도 | 44 |
| 대구광역시 | 27 | 경상북도 | 47 |
| 인천광역시 | 28 | 경상남도 | 48 |
| 대전광역시 | 30 | 제주특별자치도 | 50 |
| 울산광역시 | 31 | 강원특별자치도 | 51 |
| 세종특별자치시 | 36 | 전북특별자치도 | 52 |

- 주의: 2026년 행정 개편이 반영되어 **전남광주통합특별시가 `12`**로 통합돼 있다 (구 광주 29·전남 46 없음). 강원 `51`, 전북 `52`도 특별자치도 개편 코드다. 외부에서 가져온 법정 시도코드를 그대로 쓰지 말고 반드시 이 공식 파일 기준으로 매핑할 것.

### 공통 응답 구조

정상 응답:

```json
{
  "status": "SUCCESS",
  "kinderInfo": [
    {
      "key": "1",
      "kindercode": "1ecec08c-....-0a32095ab044",
      "officeedu": "서울특별시교육청",
      "subofficeedu": "중부교육지원청",
      "kindername": "옥인유치원",
      "establish": "사립(사인)",
      "pbnttmng": "20261"
    }
  ]
}
```

- 최상위: `status`(결과코드) / `message`(실패 사유) / `kinderInfo`(row 배열).
- 상태코드 규약 (공식 결과메세지 명세 + 라이브 검증):

| 상황 | HTTP | `status` | 처리 |
|---|---:|---|---|
| 정상 조회 | 200 | `SUCCESS` | `kinderInfo` 배열 사용 |
| 잘못된 인증키 | 200 | `DENIED` | `message`: `유효하지 않은 키`. 인증 설정 오류로 처리 |
| 조회 실패 | 200 | `ERROR` | 공식 명세상 존재. 라이브에서 미관측 (서버측 오류로 추정) |
| **필수 인자 누락** (`sggCode` 생략) | 200 | `SUCCESS` | **빈 `kinderInfo`가 온다.** 에러가 아니라 빈 결과로 위장되므로, 빈 배열이면 파라미터부터 의심할 것 |

- row 공통 사항:
  - 모든 row에 순번 필드 `key`(문자열)가 붙는다 (명세 출력항목에는 없음).
  - `basicInfo`·`basicInfo2`·`building`·`classArea`를 제외한 11개 엔드포인트 row에는 `page` 필드도 붙는다 (관측값은 항상 `null`).
  - 값은 전부 문자열 또는 `null` (숫자도 `"41"`처럼 문자열).
  - 공식 명세 표기는 `kinderCode`·`pbntTmng`·`rpstYn`처럼 camelCase가 섞여 있으나 **라이브 JSON 필드명은 전부 소문자/스네이크**(`kindercode`, `pbnttmng`, `rpst_yn`)다. 아래 출력값 표는 라이브 필드명 기준이며, 명세와 다른 항목은 비고에 적었다.
- 공통 출력 필드 (전 엔드포인트): `kindercode`(유치원코드, UUID — 엔드포인트 간 조인 키), `officeedu`(교육청명), `subofficeedu`(교육지원청명), `kindername`(유치원명), `establish` 또는 `estb_pt`(설립유형), `pbnttmng`(공시차수).
  - 설립유형 필드명이 엔드포인트에 따라 `establish` 또는 `estb_pt`로 갈린다 (각 표 참고). 값 예: `공립(단설)`, `공립(병설)`, `사립(사인)`, `사립(법인)`.

---

## 1. 일반현황 — `GET /api/notice/basicInfo2.do`

- 기본현황 신규판. 등록일자: 2022-04-26.
- 호출 예시:
  ```
  https://e-childschoolinfo.moe.go.kr/api/notice/basicInfo2.do?key=<KEY>&sidoCode=11&sggCode=11110
  ```
- 신청인자: 공통 요청인자와 동일.

출력값 (명세 34종):

| 출력명 | 설명 |
|---|---|
| kindercode | 유치원코드 (UUID, 조인 키) |
| officeedu / subofficeedu | 교육청명 / 교육지원청명 |
| kindername | 유치원명 |
| establish | 설립유형 |
| rppnname / ldgrname | 대표자명 / 원장명 |
| edate / odate | 설립일 / 개원일 |
| addr / telno / faxno / hpaddr | 주소 / 전화번호 / FAX번호 / 홈페이지 |
| opertime | 운영시간 |
| clcnt3 / clcnt4 / clcnt5 | 만3/4/5세 학급수 |
| mixclcnt / shclcnt | 혼합학급수 / 특수학급수 |
| prmstfcnt | 인가총정원수 |
| ag3fpcnt / ag4fpcnt / ag5fpcnt | 3/4/5세 정원수 |
| mixfpcnt / spcnfpcnt | 혼합정원수 / 특수학급정원수 |
| ppcnt3 / ppcnt4 / ppcnt5 | 만3/4/5세 원아수 |
| mixppcnt / shppcnt | 혼합원아수 / 특수원아수 |
| pbnttmng | 공시차수 |
| rpst_yn | 직무대리여부 |
| lttdcdnt / lngtcdnt | 위도 / 경도 |

- 비고: 명세는 `rpstYn`이지만 라이브는 `rpst_yn`. 위경도(`lttdcdnt`/`lngtcdnt`)가 있어 지도·거리 계산의 기준 엔드포인트다.

---

## 2. 기본현황(레거시) — `GET /api/notice/basicInfo.do`

- 구판 기본현황. 공식 명세 탭에서 제거됨(`/openApi/history/basicInfo.do`는 404, 목록 페이지 소스에 주석 처리로 잔존). 개발자 가이드 PDF 예제는 아직 이 URL을 쓴다.
- 라이브는 정상 동작하지만 `basicInfo2` 대비 **faxno, 정원수 5종(prmstfcnt·ag3fpcnt·ag4fpcnt·ag5fpcnt·mixfpcnt·spcnfpcnt), rpst_yn, 위경도(lttdcdnt·lngtcdnt)가 빠진** 24개 필드만 내려온다.
- 신규 개발에서는 쓸 이유가 없다. **`basicInfo2`를 사용할 것.**

---

## 3. 건물현황 — `GET /api/notice/building.do`

- 등록일자: 2015-11-12 (이하 4~14번 동일).
- 호출 예시:
  ```
  https://e-childschoolinfo.moe.go.kr/api/notice/building.do?key=<KEY>&sidoCode=11&sggCode=11110
  ```
- 신청인자: 공통 요청인자와 동일 (이하 모든 엔드포인트 동일하므로 생략).

출력값 (10종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / establish | 공통 필드 |
| archyy | 건축년도 |
| floorcnt | 건물층수 |
| bldgprusarea | 건물전용면적 |
| grottar | 대지총면적 |
| pbnttmng | 공시차수 |

---

## 4. 교실면적현황 — `GET /api/notice/classArea.do`

출력값 (12종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / establish | 공통 필드 |
| crcnt | 교실수 |
| clsrarea | 교실면적 |
| phgrindrarea | 체육장 |
| hlsparea | 보건/위생공간 |
| ktchmssparea | 조리실/급식공간 |
| otsparea | 기타공간 |
| pbnttmng | 공시차수 |

---

## 5. 직위·자격별 교직원현황 — `GET /api/notice/teachersInfo.do`

출력값 (48종). `(구)`/`(신)` 접두는 공시 양식 개편 전·후 항목 구분이며 라이브에서는 양쪽 다 내려온다:

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / establish | 공통 필드 |
| drcnt / adcnt | 원장수 / 원감수 |
| hdst_thcnt / asps_thcnt | 수석교사수 / 보직교사수 |
| gnrl_thcnt / spcn_thcnt | (구) 일반교사수 / (구) 특수교사수 |
| ntcnt / ntrt_thcnt | (구) 보건교사수 / (구) 영양교사수 |
| shcnt_thcnt / owcnt | (구) 기간제교사·강사수 / (구) 사무직원수 |
| hdst_tchr_qacnt | 수석교사자격수 |
| rgth_gd1_qacnt / rgth_gd2_qacnt | 정교사1급자격수 / 정교사2급자격수 |
| asth_qacnt / spsc_tchr_qacnt | 준교사자격수 / 특수학교정교사자격수 |
| nth_qacnt / ntth_qacnt | 보건교사자격수 / 영양교사자격수 |
| gen_tcr_cnt | (신) 정규 유치원교사수 |
| shtm_gen_tcr_cnt / shtm_spn_gen_tcr_cnt | (신) 정원내/정원외 기간제 유치원교사수 |
| spy_tcr_cnt / shtm_spy_tcr_cnt / shtm_spn_spy_tcr_cnt | (신) 정규/정원내 기간제/정원외 기간제 특수교사수 |
| hlt_tcr_cnt / shtm_hlt_tcr_cnt / shtm_spn_hlt_tcr_cnt | (신) 정규/정원내 기간제/정원외 기간제 보건교사수 |
| ntr_tcr_cnt / shtm_ntr_tcr_cnt / shtm_spn_ntr_tcr_cnt | (신) 정규/정원내 기간제/정원외 기간제 영양교사수 |
| insr_cnt / nur_cnt / nuast_cnt / ntrst_cnt / etc_emp_cnt | (신) 강사수/간호사수/간호조무사수/영양사수/기타직원수 |
| hlt_wrk_hlt_tcr_cnt / hlt_wrk_shtm_hlt_tcr_cnt | 보건업무 교원(보건교사/기간제)수 |
| hlt_wrk_adp_tcr_cnt / hlt_wrk_tou_hlt_tcr_cnt | 보건업무 교원 초등학교(겸임)/순회보건교사수 |
| hlt_wrk_doctr_cnt | 보건업무 직원 의사·치과의사·한의사·조산사·약사수 |
| hlt_wrk_nur_cnt / hlt_wrk_nuast_cnt / hlt_wrk_etc_emp_cnt | 보건업무 직원 간호사/간호조무사/기타수 |
| pbnttmng | 공시차수 |

---

## 6. 수업일수현황 — `GET /api/notice/lessonDay.do`

출력값 (13종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / establish | 공통 필드 |
| ag3_lsn_dcnt / ag4_lsn_dcnt / ag5_lsn_dcnt | 만 3/4/5세 수업일수 |
| mix_age_lsn_dcnt | 혼합연령수업일수 |
| spcl_lsn_dcnt | 특수학급수업일수 |
| afsc_pros_lsn_dcnt | 방과후 과정수업일수 |
| ldnum_blw_yn | 법정일수이하여부 |
| pbnttmng | 공시차수 |

---

## 7. 급식운영현황 — `GET /api/notice/schoolMeal.do`

출력값 (명세 25종, 라이브 24종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / establish | 공통 필드 |
| mlsr_oprn_way_tp_cd | 급식운영방식구분 (예: `직영`, `위탁`) |
| cons_ents_nm | 위탁업체명 |
| al_kpcnt / mlsr_kpcnt | 전체원아수 / 급식원아수 |
| ntrt_tchr_agmt_yn | 영양교사배치여부 |
| snge_agmt_ntrt_thcnt / cprt_agmt_ntrt_thcnt | (구) 단독/공동배치영양교사수 |
| cprt_agmt_itt_nm | 공동배치기관명 |
| ckcnt | 조리사수 — **명세에만 있고 라이브 미반환** |
| cmcnt | 조리인력수 |
| mas_mspl_dclr_yn | 집단급식소신고여부 |
| sgl_agmt_ntrt_thcnt / sgl_asn_shtm_ntr_tcr_cnt / sgl_asn_shtm_spn_ntr_tcr_cnt / sgl_asn_ntrst_cnt | (신) 단독배치 정규/정원내 기간제/정원외 기간제 영양교사수, 영양사수 |
| copr_agmt_ntrt_thcnt / copr_asn_shtm_ntr_tcr_cnt / copr_asn_shtm_spn_ntr_tcr_cnt / copr_asn_ntrst_cnt | (신) 공동배치 정규/정원내 기간제/정원외 기간제 영양교사수, 영양사수 |
| pbnttmng | 공시차수 |

---

## 8. 통학차량현황 — `GET /api/notice/schoolBus.do`

출력값 (12종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / establish | 공통 필드 |
| vhcl_oprn_yn | 차량운영여부 |
| opra_vhcnt | 운행차량수 |
| dclr_vhcnt | 신고차량수 (어린이통학버스 신고 기준) |
| psg9_dclr_vhcnt / psg12_dclr_vhcnt / psg15_dclr_vhcnt | 9/12/15인승 신고차량수 |
| pbnttmng | 공시차수 |

---

## 9. 근속연수현황 — `GET /api/notice/yearOfWork.do`

출력값 (11종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / establish | 공통 필드 |
| yy1_undr_thcnt | 1년미만교사수 |
| yy1_abv_yy2_undr_thcnt | 1년이상 2년미만 교사수 |
| yy2_abv_yy4_undr_thcnt | 2년이상 4년미만 교사수 |
| yy4_abv_yy6_undr_thcnt | 4년이상 6년미만 교사수 |
| yy6_abv_thcnt | 6년이상교사수 |
| pbnttmng | 공시차수 |

---

## 10. 환경위생 관리현황 — `GET /api/notice/environmentHygiene.do`

출력값 (22종). 설립유형 필드명이 `estb_pt`로 바뀌는 그룹(10~14번):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / estb_pt | 공통 필드 |
| arql_chk_dt / arql_chk_rslt_tp_cd | 실내공기질 점검일자 / 점검결과 |
| fxtm_dsnf_trgt_yn | 정기소독 의무대상시설여부 |
| fxtm_dsnf_chk_dt / fxtm_dsnf_chk_rslt_tp_cd | 정기소독 점검일자 / 점검결과 |
| tp_01 / tp_02 / tp_03 / tp_04 | 음용수종류: 먹는샘물(생수)/정수기/상수도/지하수 |
| unwt_qlwt_insc_yn / qlwt_insc_dt / qlwt_insc_stby_yn | 지하수사용시 수질 검사여부/검사일자/검사 결과 |
| mdst_chk_dt / mdst_chk_rslt_cd | 미세먼지 검사일자 / 검사결과 |
| ilmn_chk_dt / ilmn_chk_rslt_cd | 조도관리 검사일자 / 검사결과 |
| pbnttmng | 공시차수 |

---

## 11. 안전점검 현황 — `GET /api/notice/safetyEdu.do`

- 주의: 엔드포인트 이름은 `safetyEdu`지만 내용은 **안전점검**(시설점검·CCTV)이다. 안전**교육**은 12번 `safetyInstruct`.

출력값 (21종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / estb_pt | 공통 필드 |
| fire_avd_yn / fire_avd_dt | 소방대피훈련 여부/일자 |
| gas_ck_yn / gas_ck_dt | 가스점검 여부/일자 |
| fire_safe_yn / fire_safe_dt | 소방안전점검 여부/일자 |
| elect_ck_yn / elect_ck_dt | 전기설비점검 여부/일자 |
| plyg_ck_yn / plyg_ck_dt / plyg_ck_rs_cd | 놀이시설 안전검사 대상여부/점검일자/점검결과 |
| cctv_ist_yn | CCTV 설치여부 |
| cctv_ist_total / cctv_ist_in / cctv_ist_out | CCTV 총/건물 안/건물 밖 설치수 |
| pbnttmng | 공시차수 |

---

## 12. 안전교육 현황 — `GET /api/notice/safetyInstruct.do`

- 공식 API 제공목록의 14개 탭 중 하나. (승인 화면의 안내 문구 "안전점검ㆍ교육 실시현황"은 11번+12번을 묶어 부르던 옛 명칭이다.) 동일 인증키로 정상 호출됨을 확인.
- 유치원 1곳당 학기·공시차수별 여러 row가 내려온다 (종로구 16개 유치원 → 59 rows).

출력값 (15종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / estb_pt | 공통 필드 |
| pbnt_sem_sc_cd | 학기 |
| safe_tp_cd1 | 생활안전교육 (실시 횟수) |
| safe_tp_cd2 | 교통안전교육 |
| safe_tp_cd3 | 폭력예방 및 신변보호교육 |
| safe_tp_cd4 | 약물중독예방교육 |
| safe_tp_cd5 | 사이버중독예방교육 |
| safe_tp_cd6 | 재난안전교육 |
| safe_tp_cd7 | 직업안전교육 |
| safe_tp_cd8 | 응급처치교육 |
| pbnttmng | 공시차수 |

---

## 13. 공제회 가입현황 — `GET /api/notice/deductionSociety.do`

출력값 (10종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / estb_pt | 공통 필드 |
| school_ds_yn / school_ds_en | 학교안전공제회 대상여부 / 가입여부 |
| educate_ds_yn / educate_ds_en | 교육시설공제 대상여부 / 가입여부 |
| pbnttmng | 공시차수 |

- 비고: 공식 명세에는 가입여부가 `ducate_ds_en`으로 적혀 있으나 **명세 오타**이며 라이브 필드는 `educate_ds_en`이다.

---

## 14. 보험별 가입현황 — `GET /api/notice/insurance.do`

- 유치원 1곳당 **보험 종류별로 여러 row**가 내려온다 (종로구 16개 유치원 → 107 rows). 값 예: `insurance_nm`에 `화재보험`, `배상책임보험` 등.

출력값 (12종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / estb_pt | 공통 필드 |
| insurance_nm | 가입 보험명 |
| insurance_en | 대상여부 |
| insurance_yn | 가입여부 |
| company1 / company2 / company3 | 업체명1/2/3 |
| pbnttmng | 공시차수 |

---

## 15. 방과후 과정 편성 운영 현황 — `GET /api/notice/afterSchoolPresent.do`

- 등록일자: 2022-04-26.

출력값 (16종):

| 출력명 | 설명 |
|---|---|
| kindercode / officeedu / subofficeedu / kindername / establish | 공통 필드 |
| inor_clcnt / pm_rrgn_clcnt | 독립편성학급수 / 오후재편성학급수 |
| oper_time | 운영시간 |
| inor_ptcn_kpcnt / pm_rrgn_ptcn_kpcnt | 독립편성/오후재편성 참여원아수 |
| fxrl_thcnt / shcnt_thcnt | 정규교사수 / 기간제교사수 |
| incnt | (구) 전담사수 |
| cce_tcr_cnt / etc_thts_cnt | (신) 보육교사수 / (신) 기타전담사수 |
| pbnttmng | 공시차수 |

---

## 부모 관점 활용 포인트 (유치원 비교)

같은 시군구의 유치원을 `basicInfo2`로 리스트업한 뒤, `kindercode`(UUID)를 조인 키로 나머지 엔드포인트를 붙이면 유치원 비교표가 완성된다. 부모 의사결정에 바로 쓰이는 축:

| 비교 축 | 엔드포인트 | 핵심 필드 |
|---|---|---|
| 빈자리·규모 | `basicInfo2` | 연령별 정원(`ag3fpcnt`~) − 원아수(`ppcnt3`~) = 여유 추정, 학급수, 운영시간, 위경도(거리) |
| 급식 | `schoolMeal` | 직영/위탁(`mlsr_oprn_way_tp_cd`), 위탁업체명, 영양교사 배치(`ntrt_tchr_agmt_yn`), 조리인력수, 급식원아수 |
| 통학차량 | `schoolBus` | 운영여부, 운행차량수 vs **신고**차량수(법적 신고 여부), 승합 크기 구성 |
| 방과후(돌봄) | `afterSchoolPresent` | 독립편성/오후재편성 학급·참여원아수, 운영시간, 전담 인력 구성 |
| 교사 안정성 | `yearOfWork` + `teachersInfo` | 근속 6년 이상 교사 비중(잦은 교체 여부 proxy), 정규 대 기간제 비율 |
| 안전 | `safetyEdu` + `safetyInstruct` | CCTV 설치수, 소방·가스·전기·놀이시설 점검일자, 8대 안전교육 실시 횟수 |
| 위생 환경 | `environmentHygiene` | 실내공기질·미세먼지 검사일/결과, 정기소독, 음용수 종류 |
| 사고 대비 | `insurance` + `deductionSociety` | 배상책임보험·화재보험 가입, 학교안전공제회 가입 |
| 시설 | `building` + `classArea` | 건축년도(노후도), 교실면적, 체육장 유무 |
| 운영일 | `lessonDay` | 법정일수이하여부(`ldnum_blw_yn`) 플래그 |

활용 시 주의:

- 이 API는 **공시 데이터**다. 유치원 자가 공시 기반이고 공시차수(`pbnttmng`) 시점의 스냅샷이므로, 부모에게 보여줄 때는 항상 공시차수와 확인일을 함께 표기한다 (k-parent-skill 공통 출력 규칙: 지역·출처 URL·확인일 정규화).
- 실시간 모집·입소 신청 상태는 여기 없다. 모집은 처음학교로(<https://www.go-firstschool.go.kr>)가 소스다.
- `timing` 미지정 시 유치원마다 다른 차수가 섞여 온다. 비교표를 만들 때는 row별 `pbnttmng`를 그대로 노출하거나, 특정 차수로 고정 조회해서 결측 유치원을 명시하는 편이 안전하다.

---

## 라이브 검증 결과 (2026-07-07 KST)

검증 출처:

- 공식 이용안내: <https://e-childschoolinfo.moe.go.kr/openApi/openApiIntro.do>
- 공식 API 제공목록: <https://e-childschoolinfo.moe.go.kr/openApi/openApiList.do>
- 엔드포인트별 공식 명세: `https://e-childschoolinfo.moe.go.kr/openApi/history/<엔드포인트>.do` (14종 전부 수집)
- 개발자 가이드 PDF: `POST /openApi/DeveloperGuideDownload.do` (7쪽 — 인증키 발급, 요청인자 표, 호출 예시)
- 시도/시군구 코드표: <https://e-childschoolinfo.moe.go.kr/openApi/sidoSigunguCode.do>
- 라이브 probe 스크립트: `scripts/childschoolinfo_live_probe.py`
- 원시 결과 JSON: `tmp/childschoolinfo_live_probe.json` (`key` 값은 마스킹 저장)

검증 방법:

1. `.env`의 `CHILDSCHOOLINFO_API_KEY`로 실제 `https://e-childschoolinfo.moe.go.kr/api/notice/<엔드포인트>.do`를 호출했다.
2. 15개 엔드포인트(승인 목록 14개 + 공식 목록에서 확인한 `safetyInstruct`)를 서울 종로구(`sidoCode=11&sggCode=11110`)로 1회씩 호출하고, `basicInfo2`·`schoolMeal`은 부산 동구(`26`/`26170`)로 교차 확인했다.
3. HTTP status, `status`, row 수, 실제 row 필드 목록을 수집해 공식 출력항목 표와 비교했다 (대소문자 무시 매칭 + 케이스 불일치 별도 기록).
4. `timing=20252`, `pageCnt=5&currentPage=2`, 잘못된 키, 필수 인자(`sggCode`) 누락을 각 1회 추가 확인했다.
5. 총 21회 호출. 전부 1차 시도에 성공해 재시도는 없었다.

재실행:

```bash
set -a
source .env
set +a
python3 scripts/childschoolinfo_live_probe.py --output tmp/childschoolinfo_live_probe.json
```

### 공통 검증 결과

- 전 엔드포인트 HTTP 200 + `status=SUCCESS`. 응답 wrapper는 어느 엔드포인트든 `kinderInfo`다.
- 잘못된 키 → `{"status":"DENIED","message":"유효하지 않은 키"}` (HTTP 200).
- `sggCode` 누락 → `{"status":"SUCCESS","kinderInfo":[]}`. **필수 인자 누락이 에러가 아니라 빈 결과로 온다.**
- `ERROR` status는 재현하지 못했다.
- 명세 대비 라이브 공통 차이: 필드명 전부 소문자(`kindercode`, `pbnttmng`), row에 순번 `key` 추가, 11개 엔드포인트 row에 `page`(항상 `null`) 추가.
- `timing=20252` → 해당 차수만 14건(미공시 유치원 2곳 제외). `pageCnt=5&currentPage=2` → 5건, `key` 순번 `6`~`10`으로 연속.

### 엔드포인트별 라이브 검증 요약

종로구 유치원 16곳 기준. "명세 대비"는 공식 출력항목 표와 라이브 필드의 비교 결과다.

| Endpoint | 기능명 | `status` | Rows | 명세 대비 |
|---|---|---|---:|---|
| `basicInfo2` | 일반현황 | `SUCCESS` | 16 (부산 동구 7) | 일치 (단, `rpstYn`→라이브 `rpst_yn`) |
| `basicInfo` | 기본현황(레거시) | `SUCCESS` | 16 | 공식 명세 없음. `basicInfo2` 대비 10개 필드 축소 (FAX·정원수 5종·직무대리·위경도 없음) |
| `building` | 건물현황 | `SUCCESS` | 16 | 일치 |
| `classArea` | 교실면적현황 | `SUCCESS` | 16 | 일치 |
| `teachersInfo` | 직위·자격별교직원현황 | `SUCCESS` | 16 | 일치 (48필드 전부 확인) |
| `lessonDay` | 수업일수현황 | `SUCCESS` | 16 | 일치 |
| `schoolMeal` | 급식운영현황 | `SUCCESS` | 16 (부산 동구 7) | `ckcnt`(조리사수)만 라이브 미반환, 나머지 일치 |
| `schoolBus` | 통학차량현황 | `SUCCESS` | 16 | 일치 |
| `yearOfWork` | 근속연수현황 | `SUCCESS` | 16 | 일치 |
| `environmentHygiene` | 환경위생관리 현황 | `SUCCESS` | 16 | 일치 |
| `safetyEdu` | 안전점검 현황 | `SUCCESS` | 16 | 일치 |
| `safetyInstruct` | 안전교육 현황 | `SUCCESS` | 59 | 일치. 유치원당 학기·차수별 다행 |
| `deductionSociety` | 공제회 가입 현황 | `SUCCESS` | 16 | 명세 오타 `ducate_ds_en` → 라이브 `educate_ds_en`, 나머지 일치 |
| `insurance` | 보험별 가입 현황 | `SUCCESS` | 107 | 일치. 유치원당 보험명별 다행 |
| `afterSchoolPresent` | 방과후과정현황 | `SUCCESS` | 16 | 일치 |

### 미확인으로 남은 것

- `ERROR` status의 발생 조건 (라이브 재현 실패 — 서버측 장애로 추정).
- 호출량 임계값: 공식 수치 없음. "과도한 트래픽" 판정 기준 미공개.
- `excelDownload/<엔드포인트>.do` (XLSX)의 라이브 동작 — 문서상 존재만 확인.
- 레거시 `basicInfo.do`의 지원 종료 일정 (명세 페이지는 이미 제거됨).
- `timing`의 "최근 3년" 경계가 정확히 어느 차수부터 잘리는지 (2023-2차가 응답에 존재하는 것까지는 확인).

### 에이전트용 호출 순서

1. 시군구를 확정한다 (시도시군구코드 파일 기준, 미보유 지역명은 코드표에서 검색).
2. `basicInfo2`로 해당 시군구 유치원 목록과 `kindercode`를 확보한다.
3. 사용자가 원하는 비교 축의 엔드포인트만 같은 `sidoCode`/`sggCode`로 호출해 `kindercode`로 조인한다.
4. `insurance`·`safetyInstruct`는 유치원당 다행이므로 `kindercode`로 group-by 후 요약한다.
5. 빈 `kinderInfo`가 오면 데이터 없음으로 단정하지 말고 `sidoCode`/`sggCode` 유효성부터 재확인한다.
6. 사용자 노출 시 `pbnttmng`(공시차수)와 조회일을 함께 표기한다.
