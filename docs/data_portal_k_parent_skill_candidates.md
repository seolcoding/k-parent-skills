# k-parent-skills 공공데이터포털 API 후보

카탈로그 스냅샷: `20260430`, 전체 95,805건.

## 우선 신청 대상

| 우선순위 | proposed skill | data.go.kr | API | 신청버튼 | 스펙 | 현재 호출 | 왜 필요한가 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | `k-parent-public-restroom-baby` | [15155058](https://www.data.go.kr/data/15155058/openapi.do) | 행정안전부_공중화장실정보 조회서비스 | 있음 | apis.data.go.kr/1741000/public_restroom_info/info | 401 Unauthorized  | 기저귀교환대/어린이용 변기/개방시간 포함 전국 공중화장실 |
| P2 | `k-parent-emergency-care` | [15000563](https://www.data.go.kr/data/15000563/openapi.do) | - | 있음 | 상세 HTML 내 swagger 비어 있음 | no_spec | 전국 응급의료기관/응급실 가용 정보 |
| P3 | `k-parent-pharmacy-finder` | [15001673](https://www.data.go.kr/data/15001673/openapi.do) | - | 있음 | 상세 HTML 내 swagger 비어 있음 | no_spec | 건강보험심사평가원 약국정보 |
| P4 | `k-parent-playground-safety` | [15149543](https://www.data.go.kr/data/15149543/openapi.do) | - | 없음/이미신청 가능성 | 상세 HTML 내 swagger 비어 있음 | no_spec | 생활안전지도 어린이놀이시설 위치정보 |
| P5 | `k-parent-school-zone-risk` | [15058311](https://www.data.go.kr/data/15058311/openapi.do) | 한국도로교통공단_어린이보호구역내 어린이 교통사고 다발지역 | 있음 | apis.data.go.kr/B552061/schoolzoneChild/getRestSchoolzoneChild | 401 Unauthorized  | 어린이보호구역 내 어린이 교통사고 다발지역 |
| P6 | `k-parent-idolbom-info` | [15109775](https://www.data.go.kr/data/15109775/openapi.do) | 여성가족부_아이돌봄교육기관 | 있음 | apis.data.go.kr/1383000/gmis/babysitEdnstServiceV2/getBabysitEdnstListV2 | 401 Unauthorized  | 아이돌봄 교육기관 정보 |
| P7 | `k-parent-idolbom-cost` | [15132083](https://www.data.go.kr/data/15132083/openapi.do) | 성평등가족부_아이돌봄 년도별 아이돌보미 서비스 이용금액 정보 | 있음 | apis.data.go.kr/1383000/idis/YearlyCaringFeeService/getYearlyCaringFeeList | 401 Unauthorized  | 아이돌봄 서비스 이용금액 정보 |
| P8 | `k-parent-culture-course-busan` | [15143076](https://www.data.go.kr/data/15143076/openapi.do) | 부산광역시_부산진구 홈페이지시스템 강좌 정보 | 있음 | apis.data.go.kr/6260000/Hp2019CourseService/getHp2019Course | 401 Unauthorized  | 부산진구 강좌 정보, 어린이 대상 과정 포함 |
| P9 | `k-parent-library-course-busan-dongnae` | [15143089](https://www.data.go.kr/data/15143089/openapi.do) | 부산광역시_동래구 도서관 홈페이지 강좌 정보 | 있음 | apis.data.go.kr/6260000/DnLibCourseService/getDnLibCourse | 401 Unauthorized  | 동래구 도서관 강좌 정보 |
| P9 | `k-parent-reservation-busan-jin` | [15143215](https://www.data.go.kr/data/15143215/openapi.do) | 부산광역시_부산진구 홈페이지시스템 통합 예약 현황 | 있음 | apis.data.go.kr/6260000/Hp2019RsrvService/getHp2019Rsrv | 401 Unauthorized  | 부산진구 통합 예약 현황 |
| P9 | `k-parent-forest-education` | [3057832](https://www.data.go.kr/data/3057832/openapi.do) | - | 있음 | 상세 HTML 내 swagger 비어 있음 | no_spec | 유아숲/산림교육 프로그램 |
| P9 | `k-parent-nursing-room-busan` | [15034033](https://www.data.go.kr/data/15034033/openapi.do) | - | 있음 | 상세 HTML 내 swagger 비어 있음 | no_spec | 부산 수유실 보유 시설 |
| P9 | `k-parent-accessible-travel` | [15101897](https://www.data.go.kr/data/15101897/openapi.do) | 한국관광공사_무장애 여행 정보 | 있음 | apis.data.go.kr/B551011/KorWithService2/areaCode2 | 401 Unauthorized  | 영유아 가족 포함 무장애 여행 정보 |
| P9 | `k-parent-family-card-busan` | [15034075](https://www.data.go.kr/data/15034075/openapi.do) | - | 있음 | 상세 HTML 내 swagger 비어 있음 | no_spec | 다자녀 가족사랑카드 참여업체/혜택 |
| P9 | `k-parent-child-traffic-stats` | [15056770](https://www.data.go.kr/data/15056770/openapi.do) | - | 있음 | 상세 HTML 내 swagger 비어 있음 | no_spec | 지자체별 어린이 교통사고 통계 |

## 카테고리별 후보 수

- `childcare_kindergarten`: 294건
- `childcare_national_childinfo`: 84건
- `playground_safety`: 65건
- `park_play_outdoor`: 64건
- `after_school_care`: 102건
- `welfare_parenting`: 99건
- `emergency_medical`: 87건
- `library_programs`: 22건
- `culture_reservation`: 82건
- `school_zone_safety`: 47건
- `baby_facilities`: 50건
