# 로드맵

이 문서는 향후 방향과 우선순위를 설명한다. 현재 자산의 canonical 경로와
`maturity`·`verification`·`deployment` 상태는 `ssot/registry/*.json`이
SSOT이며, 사람이 읽는 통합 목록은 `ssot/INDEX.md`에서 생성한다.

## 디파트먼트 로드맵

K-Parent Skills는 `학교`, `학원`, `놀이`, `생활`, `트렌드`, `쇼핑`, `영양` 디파트먼트로 확장한다.

상태 범례: **adapter(fixture)** = 공식 API 어댑터 패키지 구현 완료, fixture로 오프라인 동작(키 넣으면 라이브) · **logic** = 외부 키 없는 순수 로직 패키지 · **concept** = 워크플로우 문서.

| 디파트먼트 | 현재 상태 | 구현 패키지 | 다음 후보 |
| --- | --- | --- | --- |
| 학교 | adapter(fixture): NEIS 학교/급식/학사일정/시간표 + Today Brief; 안내문 추출 logic; 성취기준 복습 퀴즈 logic | `packages/k-parent-source-neis`, `packages/k-parent-brief`, `packages/k-parent-doc-extract`, `packages/k-parent-quiz-core` | EDSS/KERIS 소재정보(학교알리미·NEIS·유치원알리미) 정밀화, 방과후 신청 흐름 |
| 학원 | logic: 알림 텍스트 정규화(doc-extract) | `packages/k-parent-doc-extract` | 학원 앱/API 표면 조사, 문자/카카오 알림 파서 |
| 놀이 | adapter(fixture): TourAPI 축제/관광지/주변, 놀이시설·도시공원, 서울예약·도서관·문화 | `packages/k-parent-source-tourapi`, `packages/k-parent-source-playground`, `packages/k-parent-source-seoul`, `packages/k-parent-source-library`, `packages/k-parent-source-culture` | 날씨 기반 후보 정렬, 평생교육 확대 |
| 생활 | logic: 복지 카탈로그·딥링크, 캘린더 후보·ICS; adapter(fixture): 응급의료 야간/휴일 | `packages/k-parent-source-welfare`, `packages/k-parent-calendar`, `packages/k-parent-source-emergency` | 정부24/복지로 가이던스 확대, 예방접종 체크리스트 |
| 트렌드 | logic: 제너릭 수집 러너 + 네이버 신호 | `packages/k-parent-source-naver` (collector) | 지역 부모 커뮤니티/시즌 이슈 수집 |
| 쇼핑 | adapter(fixture): 네이버 가격비교 + 쿠팡 어필리에이트(고지) | `packages/k-parent-source-naver`, `packages/k-parent-source-coupang` | 재고·대체품·중고 비교 강화 |
| 영양 | adapter(fixture): NEIS 급식·알레르기 | `packages/k-parent-source-neis` | 유치원 식단+집밥 보완 |
| 콘텐츠 | adapter(fixture): YouTube 교과 연계(safeSearch) | `packages/k-parent-source-youtube` | 오디오형/대화 주제 큐레이션 확대 |
| 유치원 | adapter(fixture): 어린이집/유치원 공시 비교 | `packages/k-parent-source-childinfo` | 처음학교로 모집 흐름 |

> 모든 소스 패키지는 fixture-first입니다. 크레덴셜 발급·라이브 전환은 [OWNER-TASKS.md](../OWNER-TASKS.md) 참고.

## 제품 스킬 상태

부모용 제품 스킬은 `skills/*/SKILL.md` 지침을 유지한다. 반복 사용이 검증된 표면은 원본 k-skill 구조처럼 `packages/` 또는 `scripts/` 구현으로 승격하고, 아직 패키지 경계가 없는 표면은 concept workflow로 관리한다.

- `k-parent-meal-planner`: 학교·유치원 식단, 알레르기, 집밥 보완 추천
- `k-parent-school-info`: 학교 공지, 학사일정, 방과후, 급식, 통학 정보
- `k-parent-kindergarten-info`: 유치원 비교, 모집 일정, 방과후, 통학, 비용
- `k-parent-play-finder`: 실내외 놀거리, 키즈 공간, 박물관, 도서관, 공원
- `k-parent-festival-finder`: 지역 축제, 계절 행사, 가족 체험 프로그램
- `k-parent-culture-center-events`: 문화센터, 도서관, 마트, 백화점, 공공기관 강좌
- `k-parent-application-helper`: 돌봄, 방과후, 바우처, 체험, 지원사업 신청
- `k-parent-academy-connector`: 학원 일정, 숙제, 출결, 결제, 알림 API/앱 연동 컨셉
- `k-parent-school-doc-capture`: 안내문 사진·PDF OCR 저장, 일정/준비물/신청 마감 추출, 캘린더 후보 생성
- `k-parent-shopping-recommender`: 준비물·교재·육아용품 상품 후보 정리, 쿠팡 어필리에이트 링크 제공
- `k-parent-mobile-agent`: 서버 배포형 모바일 부모 에이전트 컨셉
- `k-parent-data-collector`: 학교데이터, 시간표, 평생교육, 축제, 행사, 트렌드 크롤링
- `k-parent-schedule-manager`: 자녀 스케줄, 가족 캘린더, 리마인더 통합
- `k-parent-travel-recommender`: 아이 동반 여행지·체험·일정 추천
- `k-parent-knowledge-helper`: 부모 일반 지식 질의응답 컨셉
- `k-parent-content-recommender`: 유튜브 채널·영상, 교과 연계, 차 안 오디오형 콘텐츠, 대화 주제 추천
- `k-parent-quiz-maker`: 나이스 시간표로 오늘 배운 과목을 확인하고 성취기준 기반 결정적 복습 퀴즈 생성(`packages/k-parent-quiz-core`, 앱 표면 `apps/k-parent-quiz-app`)
- `k-parent-setup`: fixture-first 실행 환경과 부모 API 시크릿 파일 권한 진단
- `k-parent-outdoor-check`: 미세먼지·날씨 기반 등원·바깥놀이 판단 컨셉 (k-skill 개작, 키 없이 공개 프록시)
- `k-parent-child-health`: 아이 약·식품 안전과 야간·휴일 진료 경로 컨셉 (k-skill 개작, 위험 신호 우선)
- `k-parent-library-finder`: 아이 책 검색과 동네 도서관 소장·대출 확인 컨셉 (k-skill 개작)

k-skill 공개 프록시에 기대는 세 컨셉 스킬과 급식·공휴일 키 없는 경로는, 앱으로 배포하기 전에 같은 라우트를 우리 `k-parent-proxy`로 옮기거나 NomaDamas의 사용 허락을 받아야 한다(`docs/kskill-proxy.md`).

공통 HITL 레이어는 `k-parent-core`에 구현되어 있다. 다음 제품 단계는 Experience,
Skill, Policy/HITL, Tool, Domain, Adapter, Data 경계를 앱과 서버 표면에도 일관되게
적용하는 것이다.

## v1 구현 후보

### gstack 기반 개발·상품화 운영

- 첫 상품화 표면은 서버 배포형 모바일 부모 에이전트로 잡는다.
- gstack으로 로컬/프리뷰/배포 앱을 실제 부모 플로우 기준으로 dogfood한다.
- 디자인 검토는 모바일 홈, 자녀 전환, 데이터 freshness, 일정 확인, 추천 이유, 확인 모달을 우선한다.
- 배포 후 canary는 로그인/홈, 데이터 새로고침, 일정 후보 생성, 추천, 에러 없는 첫 화면을 확인한다.
- 성능 기준은 첫 로드, 데이터 새로고침, 크롤러/OCR, 추천 생성, 캘린더 쓰기 시간으로 둔다.

### 모바일 서버형 에이전트

- 일반 사용자가 모바일 웹/앱에서 사용할 수 있는 서버 배포 구조를 만든다.
- 보이스/메신저/모바일 클라이언트가 같은 백엔드를 쓰도록 skill router, profile/consent, normalization layer를 분리한다.
- 자녀 프로필, 학교/학원/지역/관심사, 가족 캘린더, 알림 설정을 사용자별로 관리한다.
- 에이전틱 명령: "이번 주 챙길 것", "주말 갈 곳", "학교 일정 정리", "학원 숙제 확인", "여행지 추천"을 처리한다.
- 쓰기 작업은 확인 후 실행한다.

### 소스 인벤토리와 코드 정규화

- 공식 API/공시, 공공데이터 파일, 지도/지역검색 API, 제한 스크래핑, 커뮤니티 보조신호 순서로 source priority를 둔다.
- EDSS/KERIS는 data.go.kr 활용신청 큐와 분리해 교육 데이터 소재 인벤토리로 추적한다. 공개 API 링크(학교알리미, NEIS, 에듀파인, 유치원알리미)는 source 후보로 다루고, 연구계획서 심의형 EDSS 심사데이터는 별도 사용자 승인 전 자동 신청하지 않는다.
- NEIS 교육청/학교 코드, 학교알리미 지역 코드, TourAPI 법정동/분류 코드, 서울예약 `SVCID`, 정부/복지 서비스 id를 `region_code_map`과 resolver로 묶는다.
- 초기 저장 모델은 `parent_profile`, `child_profile`, `region_code_map`, `institution`, `content_item`, `application_service`, `consent_log`로 시작한다.
- 부모 계정이 주체이며 자녀 정보는 최소화한다. 기본 위치는 시군구 수준으로 두고 GPS는 근처 찾기 요청 시 일시 사용한다.

### 실제 데이터 수집 레이어

- 학교데이터, 시간표, NEIS/교육청, 학교 홈페이지, 유치원, 평생교육, 축제, 행사, 문화센터, 지역 트렌드 크롤러를 둔다.
- 수집 결과는 출처 URL, 수집 시각, freshness, 중복 여부, 신뢰도와 함께 저장한다.
- 크롤링 실패/차단/오래된 데이터는 사용자에게 숨기지 않는다.
- 느리게 변하는 공시/정책/기관 데이터는 매 요청 live lookup보다 캐시와 동기화 파이프라인을 우선한다.

### 학교·유치원 데이터 허브

- NEIS 학교 검색·급식 조회는 학교명에서 바로 급식으로 가지 않고 교육청 코드와 학교 코드를 먼저 resolve한다.
- 급식 데이터는 날짜, 식사 구분, 메뉴, 알레르기 번호, 원산지, 칼로리, 영양정보로 정규화한다.
- 유치원알리미, 어린이집 알리미, 처음학교로 공개 정보 확인 흐름 정리
- 유치원/어린이집 비교는 운영시간, 비용, 교직원, 급식/위생/안전, CCTV/차량, 방과후/연장 보육 조건을 포함한다.
- 지역·기관명 중복 해결용 공통 resolver 추가

### 지역 행사·놀거리 수집

- TourAPI, 행안부 어린이놀이시설/도시공원 데이터, 지자체 행사 공지, 공공서비스예약, 평생교육, 도서관 프로그램, 문화센터 모집 페이지를 같은 필드로 정규화
- 날짜, 연령, 비용, 예약 상태, 주차/교통을 공통 스키마로 맞춤
- 비·미세먼지 같은 날씨 조건을 후보 정렬에 반영
- 이동 중 듣기 좋은 유튜브/오디오형 콘텐츠, 교과 연계 영상, 부모-자녀 대화 주제를 추천한다.
- API가 없는 문화센터/리테일 사이트는 약관·robots·로그인 경계를 확인한 뒤 서버형 crawler 후보로만 다룬다.

### 교과 연계 콘텐츠 추천

- 학년, 교과 단원, 이동 시간, 화면 시청 가능 여부, 아이 관심사를 기준으로 추천한다.
- 차 안에서는 영상미보다 음성 설명 품질, 길이, 주제 안정성, 대화 확장성을 우선한다.
- 추천 결과에는 채널/영상, 교과 연결 지점, 듣기 좋은 상황, 부모 질문 3개, 후속 활동을 포함한다.
- 유튜브 추천은 현재성·채널 신뢰도·광고성·연령 적합성을 확인한다.

### 신청 체크리스트

- 정부24, 복지로, 교육청, 지자체, 학교 신청 페이지의 준비물·마감일 추출
- 아동수당, 부모급여, 양육수당, 돌봄, 방과후 신청은 eligibility, 필요 서류, 공식 링크, 문의처, 마감일을 분리한다.
- 로그인/본인인증/결제/제출 전 사용자 확인 규칙 강화
- NPKI/공동인증서/본인인증이 필요한 영역은 최종 제출자가 아니라 준비·가이던스 시스템으로 제한한다.
- `지금 신청` 액션은 공식 사이트 딥링크, 체크리스트, 리마인더 중심으로 구현한다.
- 마감 임박 항목을 캘린더나 리마인더로 연결할 수 있는 확장 검토

### 보이스·다국어 레이어

- 아침 브리핑, 주말 추천, 신청 마감 알림을 짧은 음성 응답으로 구성한다.
- 원문 공식 데이터는 한국어로 보존하고, 다문화 가정/조부모 보호자를 위한 요약만 다국어·쉬운말로 제공한다.
- 과알림을 막기 위해 quiet hours, 알림 채널, 알림 근거를 저장한다.

### 문서 인입·캘린더 파이프라인

- 학교 안내문, 가정통신문, 알림장, PDF, 사진을 원본 파일과 OCR 텍스트로 함께 저장
- 날짜, 시간, 장소, 준비물, 비용, 회신/신청 마감, 대상 학년을 구조화
- 캘린더에 바로 쓰지 않고 후보 이벤트를 만든 뒤 사용자 확인 후 등록
- 같은 문서를 중복 촬영했을 때 해시와 주요 텍스트로 중복 감지

### 학원 연동 허브

- 학원 앱/API, 문자, 카카오 알림, PDF 안내문을 같은 `academy_notice` 스키마로 정규화
- 수업 일정, 보강, 결석, 숙제, 시험, 상담, 결제 마감, 셔틀 정보를 분리
- 로그인·결제·상담 신청은 읽기/쓰기 권한을 분리하고 사용자 승인 전 실행하지 않음

### 쇼핑·어필리에이트 수익화

- 학교문서 OCR, 학원 알림, 놀이/문화센터 준비물에서 구매 후보를 생성할 수 있다
- 쿠팡 어필리에이트는 핵심 로직이 아니라 구매 의도가 있는 순간의 보조 수익모델이다
- 쿠팡 어필리에이트는 링크 제공 전 제휴/광고 고지를 필수화
- 상품 후보는 가격, 배송일, 리뷰, 재고, 대체품, 중고 가능 여부를 분리해 제시
- 결제, 장바구니 담기, 자동 구매는 사용자 승인 전 실행하지 않음

## 이후 후보

- 예방접종·건강검진 일정 확인
- 어린이 병원·약국 야간/휴일 진료 확인
- 장난감도서관·육아종합지원센터 대여/프로그램 확인
- 가족 주말 일정 자동 초안
- 백화점/마트 문화센터 접수 오픈 감시와 수동 검수 툴
