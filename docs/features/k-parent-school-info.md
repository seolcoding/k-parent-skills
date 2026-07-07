# 학교 정보 기능 문서

`k-parent-school-info`는 학교 기본정보, 학사일정, 시간표, 급식을 NEIS 공개 데이터로 확정해 부모 관점으로 정리하는 스킬이다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-source-neis` | NEIS 학교 검색, 급식, 학사일정, 시간표 조회 |
| `packages/k-parent-brief` | 학교·급식·학사일정·시간표·마감 후보를 Today Brief로 합성 |
| `packages/k-parent-source-traffic-safety` | 어린이보호구역, 스쿨존 사고다발, 옐로카펫 data.go.kr 보강 데이터 정규화 |

## 현재 범위

- 학교명·지역으로 교육청 코드(`ATPT_OFCDC_SC_CODE`)와 학교 코드(`SD_SCHUL_CODE`)를 확정
- 급식, 학사일정, 시간표를 조회하고 출처 freshness를 표시
- 공지, 일정, 신청 마감, 준비물을 부모 실행 단위로 요약
- 신청 마감과 추천 나들이를 Today Brief에 합성

## 결정형 구현

NEIS 기반 흐름은 `packages/k-parent-source-neis`와 `packages/k-parent-brief`로 구현되어 있다. 통학 안전/어린이보호구역 보강 데이터는 `packages/k-parent-source-traffic-safety`가 담당한다.
EDSS/KERIS 소재정보에서 학교알리미, NEIS, 에듀파인 공개 API도 학교 데이터 후보로 추적한다(`docs/edss_k_parent_sources.md`).

1. `resolveSchool` — 교육청 + 학교 코드 확정 (동명 학교는 `ambiguous`로 후보 반환, 자동 선택 금지)
2. `getMeals` — 날짜별 급식 (`mealServiceDietInfo`)
3. `getSchedule` — 기간 학사일정 (`SchoolSchedule`)
4. `getTimetable` — 시간표 (`schoolLevel`/`dataset`으로 `elsTimetable`/`misTimetable`/`hisTimetable` 선택)
5. `composeTodayBrief` — `summary`, `warnings`, `todayTasks`, `timetable`, `upcomingDeadlines`, `suggestedOutings`, `calendarCandidates`, `sources` 생성

### 통학 안전 보강

`packages/k-parent-source-traffic-safety`는 data.go.kr 활용신청/승인된 스쿨존 데이터를 부모용 위치·위험 요약으로 정규화한다.

- `fetchSchoolZoneChildAccidentHotspots` — 한국도로교통공단 어린이보호구역 내 어린이 교통사고 다발지역(`15058311`)
- `fetchGyeongbukChildProtectionZones` — 경상북도 어린이보호구역 정보조회(`15143780`, 활용신청 대기)
- `fetchUiryeongChildProtectionZones` — 경상남도 의령군 어린이보호구역 서비스(`15112089`)
- `fetchSeongnamYellowCarpets` — 경기도 성남시 옐로우 카펫(`15111660`)

## 데이터 계약

- 성공 `{ ok: true, status: "ok", ... }`, 실패 `{ ok: false, status, message }`
- `status` 값: `ambiguous` / `not_found` / `stale` / `upstream_error` / `missing_config`
- 정규화 항목에는 항상 `source`(`sourceName`, `sourceUrl`, `fetchedAt`, `freshness.status`)가 붙는다

## 환경변수

- `KEDU_INFO_KEY` — NEIS open API 인증키. 미설정 시 `missing_config`.
- `KSKILL_DATAGOKR_KEY` — data.go.kr 통합 인증키. 통학 안전 보강 데이터 호출에 사용.

## 픽스처 갱신

```bash
KEDU_INFO_KEY=... npm run refresh:fixtures --workspace k-parent-source-neis
KSKILL_DATAGOKR_KEY=... npm run refresh:fixtures --workspace k-parent-source-traffic-safety
```

## 가드레일

캘린더 쓰기, 신청 제출, 예약, 결제, 로그인, 아이 개인정보 입력은 사용자 확인 전 실행하지 않는다. `calendarCandidates`는 `requiresConfirmation: true`, `executable: false`로 표시된다.

## 남은 확장 후보

- 학교 홈페이지 공지 PDF/이미지 추출
- 방과후·돌봄 신청 마감일 구조화 수집
- 통학로/어린이보호구역 위험 요약을 Today Brief에 합성
- 학교알리미·에듀파인 공개 API 정책 확인 후 학교 비교/예산 보조정보 매핑
