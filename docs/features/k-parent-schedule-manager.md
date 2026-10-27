# 스케줄 관리 기능 문서

`k-parent-schedule-manager`는 자녀 스케줄, 가족 캘린더, 학교/학원 일정, 행사, 여행 계획, 리마인더를 통합 관리하는 스킬이다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-calendar` | 캘린더 쓰기 후보 생성, 중복 제거, ICS export |

## 현재 범위

- 자녀별 일정 후보 생성
- 충돌 감지
- 준비물/마감 리마인더 후보
- `calendarCandidate(input)` 기반의 `type: "calendar_write"` 후보 생성
- `dedupeCandidates(list)` 기반의 중복 일정 후보 제거
- `toICS(candidates)` 기반의 RFC5545 `VCALENDAR`/`VEVENT` export
- 캘린더 쓰기 전 확인. 후보는 항상 `requiresConfirmation: true`, `executable: false`로 생성된다.

## 공휴일 확인

캘린더 후보가 공휴일·대체공휴일과 겹치는지 k-skill 공개 프록시 `/v1/korean-holiday/calendar`(한국천문연구원 특일 정보, `operation=rest`)로 확인하고 확인 메모를 붙인다. 응답은 XML이며 `isHoliday=Y`만 쉬는 날로 본다. 재량휴업일·방학은 `k-parent-school-info`의 NEIS 학사일정으로 본다. 2026-10-27 키 없이 200 응답 확인. 원본은 NomaDamas/k-skill `korean-holiday-calendar`(MIT)이며 `skills/k-parent-schedule-manager/references/NOTICE.md`에 개작 내역을 적었다.

## 환경변수

필요한 API key가 없다. `packages/k-parent-calendar`는 네트워크 호출 없이 동작하는 순수 로직 패키지다. 공휴일 확인은 선택 변수 `KSKILL_PROXY_BASE_URL`(비우면 k-skill 공개 프록시)만 쓴다.

## 픽스처 갱신

fixture refresh 명령이 없다. 캘린더 출력은 패키지 테스트의 고정 입력으로 검증한다.

## 남은 확장 후보

- Google/Apple/Outlook Calendar 연결
- 자녀별 일정 conflict detection
- 반복 일정과 방학 처리 (공휴일 겹침 확인은 SKILL.md 흐름으로 들어감, 결정형 코드는 아직 없음)
