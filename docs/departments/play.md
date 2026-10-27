# Play Department

놀이 디파트먼트는 아이와 갈 곳, 실내외 체험, 축제, 문화센터, 도서관 행사, 공공 프로그램을 다룬다.

## Skills

- `k-parent-play-finder`
- `k-parent-festival-finder`
- `k-parent-culture-center-events`
- `k-parent-travel-recommender`
- `k-parent-content-recommender`
- `k-parent-library-finder`

## Shared patterns

- 아이 나이, 날짜, 위치, 이동수단, 예산, 실내/실외, 예약 필요 여부를 우선 확인한다.
- 공식 운영정보와 후기를 분리한다.
- TourAPI, 지자체 공공예약, 평생교육, 도서관, 문화예술교육, 문화센터 데이터를 같은 프로그램 스키마로 맞춘다.
- 날씨와 미세먼지에 따라 실내/실외 후보를 다르게 정렬한다.
- 자녀 일정의 빈 시간, 이동 가능 시간, 여행/체험 선호를 추천에 반영한다.
- 이동 중 콘텐츠는 화면을 계속 보지 않아도 이해되는지, 교과/체험과 연결되는지, 대화 주제를 만들 수 있는지 평가한다.
- API가 없는 상업 문화센터는 약관, robots, 로그인, 결제 경계를 확인한 뒤 서버형 crawler 후보로만 다룬다.

## Next candidates

- 지자체 행사/축제 수집
- TourAPI festival and event collector
- 공공서비스예약/평생교육 프로그램 collector
- 도서관 어린이 프로그램 파서
- 문화센터 모집 상태 normalization
- 아이 동반 여행지/당일치기 코스 추천
- 차 안에서 듣기 좋은 교과 연계 유튜브/오디오 콘텐츠 추천
