# 식단 확인 기능 문서

`k-parent-meal-planner`는 대한민국 부모가 아이 식단을 확인하고 계획할 때 쓰는 스킬이다. 학교 급식은 NEIS 공개 데이터로 확정하고 알레르기·일정·시간표와 합쳐 부모용 요약을 만든다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-source-neis` | NEIS 학교 검색, 급식, 학사일정, 시간표 조회 |
| `packages/k-parent-brief` | 급식·알레르기·학사일정·시간표를 Today Brief 경고와 요약으로 합성 |

## 현재 범위

- 학교 급식을 NEIS로 확정하고 알레르기(라벨 + 번호 1~19)를 파싱
- 확인된 식단과 추천 식단을 분리
- 아이 알레르기와 매칭해 경고 생성

## 결정형 구현

1. `resolveSchool` — 교육청 + 학교 코드 확정 (동명 학교는 `ambiguous`, 자동 선택 금지)
2. `getMeals` — 날짜별 급식 (`mealServiceDietInfo`); 각 항목에 `menuItems`, `allergens`, `allergyNumbers`, `origin`, `calories`, `nutrition`
3. `getSchedule` / `getTimetable` — 같은 날짜의 학사일정·시간표 보강
4. `composeTodayBrief` — `childProfile.allergyNumbers`/`allergies`와 매칭해 `warnings`(type `allergy`) 생성, 출처 freshness 경고 포함

## 데이터 계약

- 성공 `{ ok: true, status: "ok", meals: [...] }`
- 실패 `{ ok: false, status, message }` — `ambiguous` / `not_found`(급식 없음: 방학·재량휴업일·공휴일) / `stale` / `upstream_error` / `missing_config`
- 모든 항목에 `source`(`sourceName`, `sourceUrl`, `fetchedAt`, `freshness.status`)

## 환경변수

- `KEDU_INFO_KEY` — NEIS open API 인증키. 미설정 시 `missing_config`.

## 픽스처 갱신

```bash
KEDU_INFO_KEY=... npm run refresh:fixtures --workspace k-parent-source-neis
```

## 가드레일

- 아이 알레르기 정보는 저장하지 않고 호출 단위로만 사용한다.
- 건강·의학 판단처럼 말하지 않는다.
- 로그인, 신청, 구매, 결제, 캘린더 쓰기는 사용자 확인 전 실행하지 않는다.

## 남은 확장 후보

- 유치원 식단 공개 페이지 패턴 수집
- 주간 식단 요약 템플릿 추가
