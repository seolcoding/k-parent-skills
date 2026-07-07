# EDSS/KERIS k-parent source candidates

확인일: 2026-05-31

EDSS(`https://www.edmgr.kr/edss/`)는 data.go.kr의 `활용신청` 반복 대상이 아니라
교육부·한국교육학술정보원 기반의 에듀데이터서비스다. 부모 스킬에서는 두 갈래로 다룬다.

1. 공개 API 포털로 연결되는 소재정보는 즉시 source 후보로 추적한다.
2. EDSS 심사데이터는 연구계획서 작성, 데이터 선택, 연구계획서 심의 후 제공되는 별도 신청형 데이터로 보고 자동 제출하지 않는다.

## Parent-facing API sources

| source | EDSS label | URL | k-parent mapping | 신청/인증 메모 |
| --- | --- | --- | --- | --- |
| SchoolInfo | 학교정보공시(학교알리미) | `https://www.schoolinfo.go.kr/ng/go/pnnggo_a01_m0.do` | `k-parent-school-info`, `k-parent-kindergarten-info` | 학교 공시 항목, 학생/교원/시설/교육여건. 별도 API 정책 확인 필요 |
| NEIS OpenAPI | 나이스(교육행정정보시스템) | `https://open.neis.go.kr/portal/guide/apiIntroPage.do` | `k-parent-school-info`, `k-parent-meal-planner` | 기존 `KEDU_INFO_KEY` 기반 핵심 소스 |
| EduInfo OpenAPI | 에듀파인(학교회계시스템) | `https://eduinfo.go.kr/portal/open/openData/openApiPage.do` | `k-parent-school-info`, `k-parent-application-helper` | 학교 예산/회계성 데이터. 부모용 직접성은 보조 |
| Kindergarten public info | 유치원알리미 | `https://e-childschoolinfo.moe.go.kr/openApi/openApiIntro.do` | `k-parent-kindergarten-info`, `k-parent-meal-planner` | 유치원 공시/운영/식단 후보. 별도 키/신청 확인 필요 |

## EDSS reviewed-data candidates

EDSS `데이터소재정보(API)`의 교육 데이터 범주는 부모용 장기 소스 인벤토리에 넣는다.
다만 심사데이터 신청은 연구목적과 계획서가 필요하므로, 사용자가 별도 연구계획서 제출을 승인하기 전에는 자동 신청하지 않는다.

| category | provider label | parent value | status |
| --- | --- | --- | --- |
| 초·중등 교육통계 | KEDI 교육통계 | 지역/학교급 통계, 정책 맥락 | `research_review_required` |
| 학교정보공시 | 학교알리미 | 학교 비교, 시설/교육여건 | `api_or_public_source` |
| 특수교육통계 | 교육부 특수교육정책과 | 특수교육 환경/지원 비교 | `research_review_required` |
| 나이스 | 교육행정정보시스템 | 급식, 학사, 시간표, 학교 기본정보 | `api_integrated` |
| 국가수준 학업성취도 평가 | KICE | 학업성취도 연구자료 | `research_review_required` |
| 대학수학능력시험 | KICE | 고등학생 진학/입시 맥락 | `research_review_required` |
| 에듀파인 | 학교회계시스템 | 학교 예산/재정 보조정보 | `api_or_public_source` |
| 고등 교육통계 | KEDI 교육통계 | 대학 진학 이후 보조정보 | `low_parent_priority` |
| 대학정보공시 | 대학알리미 | 대학 비교 보조정보 | `low_parent_priority` |
| 취업통계 | KEDI 교육통계 | 진로·직업 보조정보 | `low_parent_priority` |
| 평생통계 | KEDI 교육통계 | 부모/지역 평생교육 보조정보 | `low_parent_priority` |

## 신청 policy

- data.go.kr의 자동승인 OpenAPI는 기존 `docs/data_portal_k_parent_apply_queue.md` 기준으로 신청한다.
- EDSS 심사데이터는 `교육데이터플랫폼 회원가입 -> 연구계획서 작성 -> 요청데이터 선택 -> 연구계획서 심의 -> 제공` 흐름이므로 별도 사용자 승인과 연구계획서 작성이 필요하다.
- 공개 API 링크가 별도 포털로 이동하는 경우, 각 포털의 키 발급/신청 정책을 확인한 뒤 `OWNER-TASKS.md` 또는 source package 문서에 반영한다.
