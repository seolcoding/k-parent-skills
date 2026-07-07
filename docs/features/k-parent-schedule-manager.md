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

## 환경변수

필요한 API key가 없다. `packages/k-parent-calendar`는 네트워크 호출 없이 동작하는 순수 로직 패키지다.

## 픽스처 갱신

fixture refresh 명령이 없다. 캘린더 출력은 패키지 테스트의 고정 입력으로 검증한다.

## 남은 확장 후보

- Google/Apple/Outlook Calendar 연결
- 자녀별 일정 conflict detection
- 반복 일정과 방학/공휴일 처리
