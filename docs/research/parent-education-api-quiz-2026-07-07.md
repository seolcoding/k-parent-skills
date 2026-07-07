# 부모 접근 가능 학교·학급·학습자료 API 인벤토리와 '오늘 배운 것 퀴즈' 앱 시작점

- 확인일: 2026-07-07
- 목적: 아이가 학교에서 그날 배운 내용을 바탕으로 퀴즈를 출력해주는 안드로이드 앱을 이 저장소 자산 위에서 시작할 수 있는지 판단한다.
- 선행 자산: `docs/neis_api_ref.md`(라이브 검증 완료), `docs/neis_parent_scenario_report.md`(300 시나리오 통과), `docs/edss_k_parent_sources.md`, `docs/data_portal_k_parent_api_specs.md`

## 한눈에 보기

| 축 | 소스 | 상태 | 퀴즈 앱 역할 |
| --- | --- | --- | --- |
| 학교·학급·시간표·학사·급식·학원 | NEIS 교육정보 개방 포털 | **즉시 사용 가능** (`KEDU_INFO_KEY` 발급·검증 완료) | 오늘 어떤 과목을 배웠는지의 유일한 공개 소스 |
| 학교 공시(학업성취·교육여건 등) | 학교알리미 Open API | **즉시 사용 가능** (`SCHOOLINFO_API_KEY` 발급·검증 완료 2026-07-07) | 학교 맥락 보조 + 평가계획 |
| 유치원 공시 | 유치원알리미 Open API | **즉시 사용 가능** (`CHILDSCHOOLINFO_API_KEY` 발급·검증 완료 2026-07-07, 기본현황 14종) | 유아 확장 시 |
| 교육과정·성취기준 | NCIC 자료실 (PDF/HWP) | API 없음 → 문서를 로컬 데이터로 번들 | 과목→학습내용 매핑의 핵심 |
| 평가문항·평가도구 | 학생평가지원포털(STAS, KICE) | API 없음, 로그인 필요 | 퀴즈 문항 스타일 참고자료 |
| 교과주제별 학습자료 | KERIS 데이터셋(data.go.kr) | **사용 가능** — CSV/오픈API, 이용허락 **제한 없음(상업 가능)**, 과학 467행 검증 완료 | 퀴즈 주제 시드 |
| 주제별 학습자료(원본 게시물) | 에듀넷 티클리어 | 교육부 PDF 파일데이터는 제4유형(상업 금지), 콘텐츠 API 신청 폼은 **교사 전용 확정** | 링크 안내만 |
| 공시+평가계획 통합 참고 구현 | schoolinfo-mcp (MIT, chrisryugj) | 채택 검토 — 학교알리미 35종+나이스+평가계획(HWP/PDF) kordoc 파싱, TypeScript | **단원 수준 정밀화 경로** |
| 아동 도서 | 도서관 정보나루 | **이미 래핑됨** (`packages/k-parent-source-library`) | 독서 퀴즈 확장 |
| 아이 개인 성적·출결·알림장 | 나이스 학부모서비스, 하이클래스/클래스팅 등 | 공개 API 없음 (본인인증/사설) | 접근하지 않음 — 사진 입력으로 대체 |

## 축 1. NEIS 교육정보 개방 포털 — 즉시 사용 가능

Base `https://open.neis.go.kr/hub/<endpoint>`, 인증키 `KEDU_INFO_KEY`(발급 완료, `.env`), 호출 제한 없음.
12개 엔드포인트 전부 라이브 검증 완료 — 상세 스펙과 페이지네이션/오류 코드는 `docs/neis_api_ref.md` 참고.

퀴즈 앱에 직접 쓰이는 것:

| Endpoint | 데이터 | 퀴즈 앱 용도 |
| --- | --- | --- |
| `schoolInfo` | 학교 검색(이름/지역/종류) | 온보딩: 학교 확정 |
| `classInfo` | 학년도별 학년·반 목록 | 온보딩: 학년/반 선택 |
| `elsTimetable` / `misTimetable` / `hisTimetable` / `spsTimetable` | 일자·교시별 수업내용(`ITRT_CNTNT`) | **그날 배운 과목 목록** |
| `SchoolSchedule` | 학사일정(학년별 행사 여부 포함) | 휴업일/행사일엔 퀴즈 대신 안내 |
| `mealServiceDietInfo` | 급식 식단·알레르기 | 부가 기능(오늘 급식 퀴즈 등) |
| `acaInsTiInfo` | 등록 학원·교습소 | 확장: 학원 과목 연계 |

핵심 제약: 시간표의 `ITRT_CNTNT`는 **과목명 수준**이다(예: "수학", "공통수학1", "도덕"). 교과서 단원·차시 수준은 NEIS에 없다. 또한 시간표 4종은 2025학년도 이후 데이터만 제공되며, 학교·날짜 조합에 따라 `INFO-200`(데이터 없음)이 정상적으로 발생한다.

기존 구현: `packages/k-parent-source-neis`(fixture-first 어댑터), 300개 부모 시나리오 라이브 통과 기록(`docs/neis_parent_scenario_report.md`).

## 축 2. 공시 포털 — 키 발급·검증 완료 (2026-07-07)

두 포털 모두 `SCHOOLINFO_API_KEY` / `CHILDSCHOOLINFO_API_KEY`로 발급을 마쳤고 실호출로 정상 응답을 확인했다. 엔드포인트 상세는 `docs/schoolinfo_api_ref.md`, `docs/childschoolinfo_api_ref.md` 참고.

- **학교알리미 Open API** (<https://www.schoolinfo.go.kr/ng/go/pnnggo_a01_m0.do>): 네이버/카카오 SNS 로그인으로 인증키 발급. 학생·교원 현황, 시설, 급식, 학업성취 등 공시 항목. 공공데이터 정책상 상업적 이용 포함 자유 이용(출처표시). 개발자 가이드 PDF 제공. data.go.kr 등록본: [15098092](https://www.data.go.kr/data/15098092/openapi.do).
- **유치원알리미 Open API** (<https://e-childschoolinfo.moe.go.kr/openApi/openApiIntro.do>): SNS 계정 인증, 개발/운영 계정 신청 후 담당자 승인으로 인증키 발급. data.go.kr 등록본: [15020786](https://www.data.go.kr/data/15020786/openapi.do).
- **지방교육재정알리미(에듀파인) Open API** (<https://www.eduinfo.go.kr/portal/open/openData/openApiPage.do>): 학교 예산/재정. 부모 직접성 낮음 — 보조.

## 축 3. 학습자료·교육과정 — 퀴즈 콘텐츠의 원천

공개 REST API가 사실상 없는 축이므로, 퀴즈 앱은 "문서 → 로컬 데이터 번들" 전략을 쓴다.

- **NCIC 국가교육과정정보센터** (<https://ncic.re.kr>): 2022 개정 교육과정 원문·인벤토리(xlsx)·성취수준 자료 배포(원문 목록: <https://ncic.re.kr/inv/org/list.do>). API 없음. **robots.txt가 전체 크롤링 금지(`Disallow: /`)이므로 자동 수집은 하지 않는다**(수동 다운로드는 가능). 저작권 정책상 KICE 저작물은 공공누리 제2유형(출처표시·비상업·2차저작 허용)이라 상업 앱 번들에 부적합. → 성취기준 번들은 **교육부 고시 원문(별책)** 에서 추출한다: 고시·공고는 저작권법 제7조 2호로 보호 대상이 아니라 자유이용 가능하며, 법제처 국가법령정보센터(law.go.kr) 행정규칙이나 교육부 게시판에서 같은 문서를 받을 수 있다(2026-07-07 확인). 과목×학년(군)별 성취기준 JSON 번들이 있으면 "오늘 3학년 수학" → "분수의 이해, 곱셈…" 수준의 학습내용 매핑과 RAG 결합이 가능해진다.
- **학생평가지원포털 STAS** (<https://stas.moe.go.kr>): 교육부·KICE 운영. 초·중·고 성취기준 검색과 수행평가/서·논술형 평가도구 제공. 로그인 필요, API 없음. → 문항 형식·난이도 설계의 참고자료.
- **에듀넷/KERIS 학습자료** (2026-07-07 브라우저 전수 확인):
  - **KERIS 교과주제별 학습자료 (과학·사회·미술 등)** — data.go.kr 파일데이터(CSV) + 오픈API. 과학편([15067105](https://www.data.go.kr/data/15067105/fileData.do))을 실제 다운로드해 검증: **467행**, 컬럼 `과목·주제·부제·제목·키워드·바로가기URL`, **이용허락범위 "제한 없음"(상업 이용 가능)**. odcloud 자동변환 오픈API도 제공(swagger `https://infuser.odcloud.kr/oas/docs?namespace=15067105/v1`). → 이게 에듀넷 축의 실질 소스다. 콘텐츠 본문이 아니라 **주제/키워드 메타데이터**라 저작권 부담 없이 퀴즈 주제 시드·RAG 태그로 쓸 수 있다. 통합본으로 KERIS 오픈API "주제별학습자료(에듀넷)"(XML, 활용신청형)도 존재.
  - **교육부 PDF 파일데이터** [15118987](https://www.data.go.kr/data/15118987/fileData.do)은 전체 1행짜리 에듀넷 갤러리 링크에 **공공저작물 제4유형(상업 금지·변경 금지)** 라 앱에 못 쓴다. KERIS CSV(제한 없음)와 라이선스가 다르니 혼동 주의.
  - **에듀넷 콘텐츠 API 신청 폼**(<https://www.edunet.net/apiApply/contsApi/491>)은 접속 시 "교사만 이용 가능한 서비스입니다"로 **교사 로그인 전용 확정** — 부모/개발자 경로 아님.
- **schoolinfo-mcp** (<https://github.com/chrisryugj/schoolinfo-mcp>, MIT, TypeScript): 학교알리미 35종 공시 + 나이스(학사일정/급식/시간표) + **교과별 평가계획 첨부파일(HWP/HWPX/PDF) 자동 다운로드·kordoc 파싱**을 `find_school`, `get_evaluation_plan`, `parse_evaluation_file`, `get_parent_digest` 등 13개 도구로 노출한다. 환경변수 `SCHOOLINFO_API_KEY`(필수), `NEIS_API_KEY`(선택). 시간표가 과목명 수준에 그치는 한계를 **평가계획 문서의 단원/영역 정보**로 보강할 수 있는 가장 빠른 참고 구현이다(2026-06 정비 확인).
- **e학습터는 2026-02-28 서비스 종료** — 학습 콘텐츠 소스로 계획에 넣지 말 것.
- **디지털교과서/AI 디지털교과서**: 학교 발급 계정 기반, 공개 API 없음.
- **도서관 정보나루**: 이미 `packages/k-parent-source-library`로 래핑됨. 연령별 인기대출도서로 독서 퀴즈 확장 가능.

## 접근하지 않는 것 (경계)

- 나이스 학부모서비스의 개인 성적·출결, 사설 알림장 앱(하이클래스, 클래스팅, e알리미)은 공개 API가 없고 본인인증/사설 로그인이 필요하다. 저장소 원칙대로 로그인·아동 개인정보 입력은 사용자 승인 없이 실행하지 않는다.
- 단원 수준 정밀도가 필요하면 크롤링 대신 **부모가 교과서/알림장 사진을 찍어 올리는 입력**(기존 `k-parent-school-doc-capture` 패턴)으로 해결한다.

## '오늘 배운 것 퀴즈' MVP 데이터 흐름

```
[온보딩 1회]
  schoolInfo(학교명 검색) → 학교 확정(ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE)
  classInfo(AY=올해) → 학년/반 선택
[매일]
  {els|mis|his}Timetable(오늘) → 과목 목록          … INFO-200이면 SchoolSchedule로 휴업일 확인
  성취기준 번들(과목×학년) → 이번 학기 학습내용 후보
  LLM(Claude API) → 과목·학년·성취기준 기반 퀴즈 N개 생성
[정밀화(선택)]
  학교알리미 평가계획 문서(schoolinfo-mcp 패턴) → 과목별 단원/영역 → 단원 수준 퀴즈
  교과서/알림장 사진 → OCR → 단원 인식 → 해당 단원 퀴즈
```

아키텍처 원칙 (기존 컨벤션 재사용):

- 안드로이드 앱은 NEIS·LLM 키를 절대 내장하지 않는다. `packages/k-skill-proxy` 패턴대로 좁은 allowlist 라우트(`/api/neis/school-search`, `/api/neis/timetable` 등)를 추가하고 캐시(시간표는 일 단위)로 감싼다.
- 퀴즈 생성 LLM 호출도 proxy를 경유시켜 키를 서버에 둔다.
- 아이 식별정보(학교/학년/반)는 앱 로컬(DataStore)에만 저장하고 서버에 남기지 않는다.
- 부모 도메인 출력 필드 규약(학년, 지역, 날짜, 출처, 확인일)을 퀴즈 메타데이터에도 적용한다.

## 다음 단계

1. `skills/k-parent-quiz-maker` concept `SKILL.md` 스캐폴딩 (저장소 규칙: SKILL.md-only로 시작).
2. `k-skill-proxy`에 NEIS 학교검색/시간표 allowlist 라우트 추가 + 캐시.
3. 2022 개정 성취기준 과목×학년 JSON 번들 1차 수집(초등 우선; NCIC 자료실 문서 기반, 확인일 기록).
4. 안드로이드 MVP: 온보딩(학교/학년/반) → 오늘 시간표 → 퀴즈 5문항 화면.
5. 에듀넷 콘텐츠 API 신청 조건 확인(로그인 후) 및 `OWNER-TASKS.md` 반영.

## 출처 (2026-07-07 확인)

- NEIS 개방 포털: <https://open.neis.go.kr> (저장소 내 라이브 검증: `docs/neis_api_ref.md`)
- 학교알리미 API 이용안내: <https://www.schoolinfo.go.kr/ng/go/pnnggo_a01_m0.do> / 개발자 가이드: <https://www.schoolinfo.go.kr/download/OpenAPI_Developer_Guide.pdf>
- 유치원알리미 Open API: <https://e-childschoolinfo.moe.go.kr/openApi/openApiIntro.do>
- NCIC 성취수준 자료실: <https://ncic.re.kr/bbs/standard/list.do>
- 학생평가지원포털: <https://stas.moe.go.kr>
- 에듀넷티클리어 주제별 학습자료 파일데이터: <https://www.data.go.kr/data/15118987/fileData.do>
- 학교알리미 공시정보(공공데이터포털): <https://www.data.go.kr/data/15098092/openapi.do>
