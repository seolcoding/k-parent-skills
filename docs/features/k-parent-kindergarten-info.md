# 유치원 기능 문서

`k-parent-kindergarten-info`는 유치원 모집, 통학, 방과후, 급식, 비용 정보를 비교하는 스킬이다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-source-childinfo` | 어린이집정보공개 / 유치원현황 data.go.kr 응답을 부모용 후보 필드로 정규화 |

## 현재 범위

- 지역과 아이 출생연도 기준으로 후보 조건 정리
- 처음학교로, 유치원알리미, 교육청, 기관 홈페이지를 우선 출처로 사용
- 모집 상태와 마감일을 분리
- `fetchChildcareCenters({ sidoCode, sigunguCode, name })` 기반의 어린이집 후보 정규화
- `fetchKindergartens({ sidoCode, sggCode, name })` 기반의 유치원 후보 정규화
- 출력 필드: 기관명, 설립유형, 주소, 전화번호, 정원/현원, 통학차량, CCTV, 학급수, 원아수

## 환경변수

- `KSKILL_DATAGOKR_KEY` — data.go.kr 통합 인증키. live API 조회와 fixture 갱신에 사용한다.

## 픽스처 갱신

```bash
KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures --workspace k-parent-source-childinfo
```

data.go.kr는 어린이집/유치원 데이터를 여러 제공처와 서비스 버전으로 노출한다. 활용신청 후 포털의 API 명세서에서 endpoint path와 파라미터명을 확인해야 한다.

## 남은 확장 후보

- 유치원알리미 공개 항목 매핑
- EDSS/KERIS 소재정보 별도 source 후보 추적. 심사데이터형 EDSS 신청은 연구계획서 심의가 필요하므로 자동 신청하지 않는다.
- 처음학교로 모집 일정 추적
- 통학버스와 방과후 과정 비교 표준 필드 정의
