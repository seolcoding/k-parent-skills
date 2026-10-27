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
| `packages/k-parent-source-neis` | `searchAcademies` — NEIS 학원교습소정보(`acaInsTiInfo`) 조회·정규화 |
| `packages/k-parent-proxy` | `GET /v1/neis/academies` — 키를 서버에 둔 학원 조회 라우트 |

## 학원·교습소 확인

`searchAcademies({ region | educationOfficeCode, district, academyName, course })`가 교육청 등록 학원·교습소를 찾는다.

- 정규화 필드: 학원지정번호, 학원/교습소 구분, 등록 상태, 휴원 기간과 오늘 휴원 여부(KST), 분야·계열·교습과정, 정원, 신고 교습비(`{ course, amountKrw }`), 주소, 전화번호, 수정일, `source`(freshness 기본 7일).
- 교습비 원문은 과정명 괄호 안에 쉼표가 있어(`(주2회, 회당150분)`) 괄호 밖 쉼표로만 나눈다.
- `02-0000-0000` 자리표시 번호는 `null`, `CAA_END_YMD=99991231`은 "휴원 없음/종료일 없음"으로 해석한다.
- **키 없이 동작:** `KEDU_INFO_KEY`가 없으면 NEIS 샘플 모드로 최대 5건을 받는다(`keyless: true`, `truncated`). 2026-10-27 서울 송파구 "영어"로 키 없이 284건 중 5건 조회를 확인했다.
- 프록시 라우트는 `district`나 `academyName`을 요구해 교육청 전체 스캔을 막고, 최대 100건으로 제한한다.

## 현재 범위

- 학원 앱, API, 문자, 카카오 알림, PDF, 사진 안내문을 입력 표면으로 분류
- 수업 일정, 숙제, 출결, 보강, 시험, 상담, 결제 마감을 공통 필드로 정리
- `extractAcademyNotice(text)` 기반의 학원 공지 유형 분류
- `extractDeadlines(text)` 기반의 결제·신청·제출 마감 후보 추출
- `calendarCandidate(input)`, `dedupeCandidates(list)`, `toICS(candidates)` 기반의 일정 후보 정리
- 읽기와 쓰기 권한을 분리하고, 쓰기 작업은 사용자 승인 뒤에만 진행
- 날짜가 있는 항목은 `requiresConfirmation: true`, `executable: false`인 일정 후보로 제안

## 환경변수

안내문 정리에는 API key가 없다. `packages/k-parent-doc-extract`와 `packages/k-parent-calendar`는 이미 추출된 텍스트와 구조화된 입력으로 동작하는 순수 로직 패키지다.
학원 조회는 `KEDU_INFO_KEY`가 있으면 페이지당 최대 100건, 없으면 NEIS 샘플 모드로 5건이다.

## 픽스처 갱신

안내문 파싱과 캘린더 후보 생성은 패키지 테스트의 고정 입력으로 검증한다. 학원 조회 fixture(`packages/k-parent-source-neis/test/fixtures/academy.json`)는 NEIS 갱신 명령에 포함된다.

```bash
KEDU_INFO_KEY=... npm run refresh:fixtures --workspace k-parent-source-neis
```

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
- 학원 조회 결과를 지도·통학 거리와 결합
- 교습과정명 괄호에서 기간·주당 횟수·회당 시간 구조화
- 문자·카카오 알림 텍스트 파서
- OCR 신뢰도와 원본 캡처 경로 연결
- 결제/신청 side-effect 승인 게이트
