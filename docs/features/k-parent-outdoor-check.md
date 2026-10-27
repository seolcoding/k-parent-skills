# 바깥활동 체크 컨셉 문서

`k-parent-outdoor-check`는 등원·바깥놀이·체육 수업 전에 미세먼지와 기상청 단기예보를 함께 보고, 아이 기준 행동(마스크, 우산, 겉옷, 실내 대체)으로 정리하는 컨셉 스킬이다.

## 데이터 경로

| 경로 | 원천 | 키 |
| --- | --- | --- |
| k-skill 공개 프록시 `/v1/fine-dust/report` | 에어코리아 | 부모 쪽 없음 |
| k-skill 공개 프록시 `/v1/korea-weather/forecast` | 기상청 단기예보 | 부모 쪽 없음 |

2026-10-27 키 없이 조회: 날씨 200, 미세먼지 500(원천 에어코리아 429, 일시 한도 초과). 프록시 사용 규칙은 `docs/kskill-proxy.md`.

## 현재 범위

- 지역(구·동)과 시간대를 받아 공기질·날씨를 조회
- 연령대·호흡기 민감 여부에 따른 판단표 (`skills/k-parent-outdoor-check/references/outdoor-guide.md`)
- 실내 대안이 필요하면 `k-parent-play-finder`로 넘김

## 가드레일

- 집 주소·집 좌표를 받지 않는다. 구·동 단위와 공공 지점 좌표만 쓴다.
- 아이 건강 정보는 저장하지 않는다. 의학적 판단을 하지 않는다.
- 기관의 실외 수업 결정은 기관 공지를 따르라고 안내한다.

## 출처

NomaDamas/k-skill `fine-dust-location`, `korea-weather` (MIT)를 개작했다. `skills/k-parent-outdoor-check/references/NOTICE.md` 참고.

## 다음 구현 후보

- 미세먼지 내일 예보 (에어코리아 예보 API) 연결
- 우리 `k-parent-proxy`로 라우트 이전 (배포 전 필수)
- 판단표를 `packages/`의 결정형 함수로 옮기고 테스트
- Today Brief(`packages/k-parent-brief`)에 등원 날씨 경고로 합치기
