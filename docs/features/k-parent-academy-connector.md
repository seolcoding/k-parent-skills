# 학원 안내문 기능 문서

`k-parent-academy-connector`는 학원 공지/안내문을 부모 일정 관리에 연결하는 구현 스킬이다.
현재는 `packages/k-parent-doc-extract`의 `extractAcademyNotice`와 `extractDeadlines`,
`packages/k-parent-calendar`의 `calendarCandidate`와 `dedupeCandidates`를 사용해
공지 텍스트를 분류하고 일정 후보로 정리한다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-doc-extract` | 학원 공지 유형 분류, 납부·신청 마감 추출 |
| `packages/k-parent-calendar` | 일정 후보 생성, 중복 제거, ICS 출력 후보 |

## 현재 범위

- 학원 앱, API, 문자, 카카오 알림, PDF, 사진 안내문을 입력 표면으로 분류
- 수업 일정, 숙제, 출결, 보강, 시험, 상담, 결제 마감을 공통 필드로 정리
- `extractAcademyNotice(text)` 기반의 학원 공지 유형 분류
- `extractDeadlines(text)` 기반의 결제·신청·제출 마감 후보 추출
- `calendarCandidate(input)`, `dedupeCandidates(list)`, `toICS(candidates)` 기반의 일정 후보 정리
- 읽기와 쓰기 권한을 분리하고, 쓰기 작업은 사용자 승인 뒤에만 진행
- 날짜가 있는 항목은 `requiresConfirmation: true`, `executable: false`인 일정 후보로 제안

## 환경변수

필요한 API key가 없다. `packages/k-parent-doc-extract`와 `packages/k-parent-calendar`는 이미 추출된 텍스트와 구조화된 입력으로 동작하는 순수 로직 패키지다.

## 픽스처 갱신

fixture refresh 명령이 없다. 안내문 파싱과 캘린더 후보 생성은 패키지 테스트의 고정 입력으로 검증한다.

## 가드레일

캘린더 쓰기, 결제, 신청, 예약, 로그인, 자녀 개인정보 입력은 사용자 승인 전 실행하지 않는다.

## 정규화 출력

```json
{
  "academy_name": "예시학원",
  "class_name": "초3 수학 A반",
  "child_or_grade": "초3",
  "event_type": "homework|class|makeup|exam|counseling|billing|notice",
  "starts_at": "2026-05-01T16:00:00+09:00",
  "ends_at": "2026-05-01T17:30:00+09:00",
  "deadline": "2026-05-03T23:59:00+09:00",
  "materials": ["교재", "오답노트"],
  "source": "academy_app|sms|kakao|pdf|photo|manual",
  "source_reference": "local path or URL",
  "needs_confirmation": true
}
```

## 남은 확장 후보

- 학원별 API/앱 표면 조사
- 문자·카카오 알림 텍스트 파서
- OCR 신뢰도와 원본 캡처 경로 연결
- 결제/신청 side-effect 승인 게이트
