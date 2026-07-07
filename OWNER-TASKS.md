# Owner Tasks — 부모 스킬 크레덴셜·운영 체크리스트

이 문서는 **사람(저장소 소유자)이 직접 처리해야 하는 일**만 모읍니다. 코드와 스킬은 이미
fixture(공개 스펙 기반 목 응답) 위에서 오프라인으로 동작합니다. 아래 크레덴셜을 발급해
환경변수에 넣고 각 패키지의 `refresh:fixtures` npm script를 돌리면 **라이브 데이터로 전환**됩니다.

> Claude/에이전트는 **로그인·결제·신청서 제출·예약 확정·취소·아동 개인정보 입력을 사용자 승인 없이 실행하지 않습니다.**
> 이 문서의 작업(가입/키 발급/본인인증)은 전적으로 소유자 몫입니다.

---

## 1. 크레덴셜 발급 체크리스트

각 제공자에서 가입 → 키 발급 → 해당 서비스 **활용신청(승인)** 까지 마쳐야 라이브 호출이 됩니다.

| # | 제공자 | 환경변수 | 발급/가입 URL | 비고 |
| --- | --- | --- | --- | --- |
| 1 | NEIS 교육정보 개방포털 | `KEDU_INFO_KEY` | https://open.neis.go.kr | 로그인 → 인증키 신청. 즉시 발급. 급식·학사일정·시간표·학교정보 공용 |
| 2 | 공공데이터포털(data.go.kr) 통합키 | `KSKILL_DATAGOKR_KEY` | https://www.data.go.kr | 한 키로 여러 서비스. **서비스별 활용신청 필요**(아래 2-1) |
| 3 | 한국관광공사 TourAPI 4.0 | `KSKILL_TOURAPI_KEY` | https://www.data.go.kr (TourAPI/KorService2 활용신청) | 놀이·축제·여행. serviceKey로 사용 |
| 4 | 서울 열린데이터광장 | `KSKILL_SEOUL_KEY` | https://data.seoul.go.kr | 공공서비스예약(문화/교육/체육) |
| 5 | 도서관 정보나루 | `KSKILL_LIBRARY_KEY` | https://data4library.kr/apiUtilization | 도서관·프로그램 |
| 6 | 문화포털 | `KSKILL_CULTURE_KEY` | https://www.culture.go.kr | 공연·전시 |
| 7 | 네이버 개발자센터 | `KSKILL_NAVER_CLIENT_ID` / `KSKILL_NAVER_CLIENT_SECRET` | https://developers.naver.com | 앱 등록 → 검색 API 사용 설정. 헤더 인증 |
| 8 | 쿠팡 파트너스 | `KSKILL_COUPANG_ACCESS_KEY` / `KSKILL_COUPANG_SECRET_KEY` | https://partners.coupang.com | 파트너 승인 후 키 발급. 어필리에이트(보조 수익) |
| 9 | Google Cloud (YouTube Data API v3) | `KSKILL_YOUTUBE_KEY` | https://console.cloud.google.com | 프로젝트 → YouTube Data API v3 사용 설정 → API 키 |
| 10 | 학교알리미 Open API | `SCHOOLINFO_API_KEY` | https://www.schoolinfo.go.kr/ng/go/pnnggo_a01_m0.do | 네이버/카카오 SNS 로그인 → 인증키 발급. **발급 완료(2026-07-07, 정상 확인)**. 35종 공시·평가계획 |
| 11 | 유치원알리미 Open API | `CHILDSCHOOLINFO_API_KEY` | https://e-childschoolinfo.moe.go.kr/openApi/openApiIntro.do | SNS 로그인 → 개발계정 자동승인. **발급 완료(2026-07-07, 정상 확인)**. 유치원 기본현황 14종 |

### 2-1. `KSKILL_DATAGOKR_KEY`로 활용신청할 data.go.kr 서비스
한 개의 data.go.kr 인증키로 아래를 각각 **활용신청**해야 합니다(승인까지 수 분~수 시간).
- 어린이놀이시설 안전 정보 / 전국도시공원표준데이터 — `k-parent-source-playground`
- 어린이보호구역·스쿨존 사고다발·옐로카펫 관련 서비스 — `k-parent-source-traffic-safety`
- 어린이집 정보공개 / 유치원현황(유치원알리미) — `k-parent-source-childinfo`
- 응급의료포털 e-gen(`ErmctInsttInfoInqireService`) — `k-parent-source-emergency`

> ⚠️ **엔드포인트 경로·파라미터명 확인 필요**: data.go.kr 서비스는 버전별로 BASE/PATH와 파라미터명이
> 다릅니다. 아래 파일의 **주석 처리된 상수**를 승인받은 서비스 상세페이지 값으로 바꿔주세요.
> - `packages/k-parent-source-playground/src/index.js` (`PLAYGROUND_PATH`, `URBAN_PARK_PATH`)
> - `packages/k-parent-source-traffic-safety/src/index.js` (`SCHOOLZONE_CHILD_ACCIDENT_PATH`, `GYEONGBUK_CHILD_PROTECTION_ZONE_PATH`, `SEONGNAM_YELLOW_CARPET_PATH`, `UIRYEONG_CHILD_PROTECTION_ZONE_PATH`)
> - `packages/k-parent-source-childinfo/src/index.js` (`CHILDCARE_ENDPOINT`, `KINDERGARTEN_ENDPOINT`)
> - `packages/k-parent-source-emergency/src/index.js` (`PHARMACY_ENDPOINT`, `EMERGENCY_ROOM_ENDPOINT`, `Q0`/`Q1` 파라미터)
> 파서는 여러 후보 필드명을 방어적으로 매핑하므로, 경로/파라미터만 맞추면 정규화는 동작합니다.

### 키가 필요 없는 패키지
- `k-parent-source-welfare`(복지 카탈로그·딥링크), `k-parent-calendar`(ICS), `k-parent-doc-extract`(안내문 파서),
  `k-parent-core`/`k-parent-brief` — 외부 키 없이 동작. (welfare는 선택적으로 `KSKILL_DATAGOKR_KEY` 라이브 조회 stub)

---

## 2. 라이브 fixture 재생성 명령

키를 `.env`(또는 셸 환경)에 넣은 뒤 실행하면 `test/fixtures/*.json`이 실제 응답으로 갱신됩니다.
키가 없으면 스크립트가 안내 메시지를 출력하고 `exit 1` 합니다.

```bash
# 학교/영양 (NEIS)
KEDU_INFO_KEY=...        npm run refresh:fixtures --workspace k-parent-source-neis

# 놀이/축제/여행
KSKILL_TOURAPI_KEY=...   npm run refresh:fixtures --workspace k-parent-source-tourapi
KSKILL_DATAGOKR_KEY=...  npm run refresh:fixtures --workspace k-parent-source-playground
KSKILL_DATAGOKR_KEY=...  npm run refresh:fixtures --workspace k-parent-source-traffic-safety

# 문화
KSKILL_SEOUL_KEY=...     npm run refresh:fixtures --workspace k-parent-source-seoul
KSKILL_LIBRARY_KEY=...   npm run refresh:fixtures --workspace k-parent-source-library
KSKILL_CULTURE_KEY=...   npm run refresh:fixtures --workspace k-parent-source-culture

# 유치원/응급
KSKILL_DATAGOKR_KEY=...  npm run refresh:fixtures --workspace k-parent-source-childinfo
KSKILL_DATAGOKR_KEY=...  npm run refresh:fixtures --workspace k-parent-source-emergency

# 쇼핑/트렌드
KSKILL_NAVER_CLIENT_ID=... KSKILL_NAVER_CLIENT_SECRET=... npm run refresh:fixtures --workspace k-parent-source-naver
KSKILL_COUPANG_ACCESS_KEY=... KSKILL_COUPANG_SECRET_KEY=... npm run refresh:fixtures --workspace k-parent-source-coupang

# 콘텐츠
KSKILL_YOUTUBE_KEY=...   npm run refresh:fixtures --workspace k-parent-source-youtube -- "검색어"
```

재생성 후 `npm test`가 그대로 통과하면 fixture 구조와 실제 API 계약이 일치한다는 뜻입니다.

---

## 3. 수동 검증 체크리스트 (키 발급 후)

- [ ] `.env`에 위 변수들을 채우고 `cp .env.example .env` 후 값 입력
- [ ] data.go.kr 2-1 목록 전체 활용신청 승인 + 엔드포인트 상수 확정(2-1)
- [ ] 각 `refresh:fixtures` npm script 실행 → `npm test` 재통과 확인
- [ ] 쿠팡 노출 화면에 제휴 고지 문구 유지: "쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 받을 수 있음"
- [ ] welfare 카탈로그(아동수당/부모급여 등) 금액·자격요건은 연 1회 공식 사이트로 갱신 확인

---

## 4. Claude가 하지 않는 일 (가드레일 — 사용자 승인 필수)

`packages/k-parent-core` guardrails에 의해 아래는 항상 확인/핸드오프 대상입니다.
- 캘린더 쓰기, 메시지 전송, 예약, 신청서 제출, 취소, 결제·구매, 장바구니
- 정부24/복지로 최종 제출, NPKI/공동인증서 로그인, 본인인증, 유료 예약
- 아동 개인정보(생년월일·주민번호 등) 저장 — 로컬 입력값으로만 일시 처리
