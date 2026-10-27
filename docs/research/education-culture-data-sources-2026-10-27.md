# 교육·문화 데이터 소스 조사 (2026-10-27)

부모 스킬에 붙일 교육·문화 공공데이터를 다섯 곳에서 조사했다. 모두 읽기 전용으로 확인했고 가입·키 신청·다운로드는 하지 않았다.

- 교육부 교육데이터플랫폼 (edmgr.kr)
- 한국교과서연구재단 교과서 정보 API (kotry.kr)
- 에듀넷 검색 API (edunet.net)
- 문화공공데이터광장 (culture.go.kr)
- 기존 문서: `docs/edss_k_parent_sources.md` (2026-05-31, EDSS 부분만)

## 요약

| 소스 | 키 없이 | 키 받는 법 | 부모 쓸모 | 붙일 곳 |
| --- | --- | --- | --- | --- |
| edmgr 자체 OpenAPI 183개 | 401 | 회원가입 + 건별 심의승인 | 낮음~중간 (같은 내용을 원천 포털에서 받는 편이 낫다) | 보류 |
| EDSS 심사데이터 | — | 연구계획서 + 심의, 70% 표본 | 학교 단위 조회 불가 | 제외 |
| 학교알리미 | 실패 (`apiKey는 필수`) | 로그인 후 OpenAPI 메뉴 신청 | 높음 (학급당 학생수, 방과후, 급식, 체력) | `k-parent-school-info`, 새 `k-parent-source-schoolinfo` |
| 유치원알리미 | 실패 | 소셜 로그인, 자동승인 | 높음 | `k-parent-source-childinfo` 엔드포인트 교체, `k-parent-kindergarten-info` |
| 어린이집 정보공개포털 | 실패 (`ERROR-100`) | 승인심의 | 높음 (영유아) | `k-parent-source-childinfo`. API별 영리 이용 조건이 다름 |
| 학구도안내서비스 | 파일 | data.go.kr 또는 schoolzone.emac.kr 다운로드 | 높음 (주소 → 배정 학교) | 지도 계산 필요, 범위 합의 후 |
| 교과서 정보 API (kotry) | 실패 (`API KEY 누락`) | 가입 + 신청 + 재단 담당자 승인 | 중간 (교과서 출판사·국검인정, ISBN → 도서관) | `k-parent-library-finder`, `k-parent-quiz-maker` |
| 에듀넷 검색 API | 미확인 (명세가 HWP 매뉴얼에만 있음) | 신청서 → 키 이메일 | 중간 (단원별 학습자료) | `k-parent-content-recommender` |
| 문화데이터광장 | 401 | API별 신청 → 키 이메일, 개발계정 일 1,000건 | 높음 (교과 연계 체험학습) | `k-parent-source-culture` 확장 + 새 체험학습 스킬 |

## 문화데이터: 교과 연계 체험학습

전체 469건(A 문화예술 139, B 문화유산 76, C 문화산업 88, D 관광 28, E 체육 39, F 도서 32, G 정책지원 20, H 문화홍보 8, I 맞춤형 39). 상세는 `https://www.culture.go.kr/data/openapi/openapiView.do?id=NNN&category=X&gubun=A`(맞춤형은 `gubun=B`).

먼저 붙일 다섯 개:

| 순서 | API | 쓸모 | 매칭 필드 |
| --- | --- | --- | --- |
| 1 | 전시정보(통합) id=598 (I) | 국립 박물관·미술관 23곳 전시 | `AUDIENCE`, `CHARGE`, `PERIOD`, 기관명. 지난 전시가 섞여 있어 `PERIOD`로 거른다 |
| 2 | 국립지방박물관 문화행사 통합 id=540 (B) | 박물관 교육·체험 프로그램 | 연령 필드 없음, 설명에서 학년 추출 |
| 3 | 문화재청_문화재정보 id=84 (B) | 지역·시대별 문화유산 | `extent`(시대), `spatial`(주소), `subjectKeyword`(지정종목). 국가유산청 개편 후 갱신 여부 미확인 |
| 4 | 대한민국역사박물관 교육프로그램 id=495 (B) | 학년 명시된 근현대사 교육 | `grade`, 접수기간·정원 |
| 5 | 국립한글박물관 문화행사 id=639 (A) | 국어(한글) 연계 | `AUDIENCE`, `TYPE` |

성취기준 매칭 (`skills/k-parent-quiz-maker/references/achievement-standards-elementary.json`, 2022 개정 초등 399건, 국어·수학·사회·과학·영어):

| 성취기준 | 데이터 | 신뢰도 |
| --- | --- | --- |
| 4사06 지역 문화유산·박물관 | 84 `spatial` 시군구 + 학교 시도의 국립박물관 행사(540·598) | 높음 |
| 6사04~06 시대사 (선사~광복) | 84 `extent`, 378 `temporal`; 598·540은 제목·설명 시대 키워드 | 시대 필드 높음, 설명 키워드 중간 |
| 6사05~07 근현대사 | 495 | 높음 |
| 4사04-01 옛날 풍습 | 국립민속박물관 계열, 540 설명 키워드 | 중간 |
| 국어(한글) | 639, 487 | 과목 단위 중간 |
| 과학 | 이 포털에 과학관 데이터 없음 (천문 267만 약하게) | 매칭 불가 |
| 음악·미술 | 성취기준 번들에 해당 교과 없음 | 코드 매칭 불가 |

## 발견한 문제

- **기존 `k-parent-source-culture` 엔드포인트가 죽었을 수 있다.** `http://www.culture.go.kr/openapi/rest/publicperformancedisplays/area`가 키 없이 307 → 문화포털 오류 페이지로 간다. 후속으로 보이는 API는 공연정보(통합) id=597, 문화예술공연(통합) id=580. 키를 넣은 호출은 미확인.
- **`k-parent-source-childinfo`는 data.go.kr 경로를 추정해서 쓴다.** 유치원알리미·어린이집 포털 공식 엔드포인트로 바꿔야 한다.
- **edmgr API 카탈로그 응답에 관리자 인증키 필드(`mngrApiAthkCn`)가 비로그인 사용자에게 노출된다.** 사용하지 않았고 값도 기록하지 않았다. 제품에서 의존하지 않으며 KERIS에 알릴 만하다.
- **과학관 데이터는 문화데이터광장에 없다.** 별도 소스가 필요하다(미조사).

## 확인하지 못한 것

- 문화데이터광장 키 하나로 여러 API를 쓸 수 있는지, 즉시 승인인지, 운영계정 한도, API별 공공누리 유형
- edmgr 데이터관리카드 xlsx·EDSS 개방데이터를 로그인 없이 받을 수 있는지
- 교과서 공개데이터 API에 2022 개정 교과서가 있는지
- 에듀넷 검색 API 요청 형식 (HWP 매뉴얼 미다운로드)
- 학생건강정보센터, 학교안전지원시스템, 커리어넷 API 여부

## 출처

- https://www.edmgr.kr/intro/service_intro, https://www.edmgr.kr/intro/service_openportal, https://www.edmgr.kr/copyright
- https://kotry.kr/libService/openApi.do?menuId=C110&upperMenuId=B001, https://www.data.go.kr/data/15076816/openapi.do
- https://www.edunet.net/apiApply/semantic/489
- https://www.culture.go.kr/data/openapi/openapiList.do?category=I, https://www.culture.go.kr/data/page/guide/openapiGuide.do
- https://info.childcare.go.kr/info/oais/openapi/OpenApiSlL.jsp, https://schoolzone.emac.kr/publicData/publicDataList.do
