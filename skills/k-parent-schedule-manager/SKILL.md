---
name: k-parent-schedule-manager
description: 학교·학원·기관 안내문에서 추출한 일정을 packages/k-parent-calendar로 캘린더 후보로 정리하고 중복을 제거하며 ICS로 내보낸다. 실제 캘린더 쓰기는 항상 사용자 확인이 필요하다. "일정 정리", "캘린더에 추가", "ICS 내보내기", "준비물·마감 챙겨줘" 같은 요청에 사용.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: implemented
---

# 가족 일정 관리자

대한민국 부모를 위한 일정 정리 도우미. 학교/학원/기관 안내문에서 뽑아낸 날짜를
캘린더 후보(calendar candidate)로 정규화하고, 중복을 제거하고, ICS 파일로
내보낸다.

## 핵심 동작

`packages/k-parent-calendar` 패키지를 사용한다.

- `calendarCandidate({ title, date, time?, location?, supplies?, cost?, deadline?, targetGrade?, sourceDocId? })`
  - 안정적인 `id = sha256(`${title}|${date}|${location}`)`를 부여한다.
  - 내부적으로 `guardActionCandidate`로 `type: "calendar_write"` 처리되어
    항상 `requiresConfirmation: true`, `executable: false`다.
- `dedupeCandidates(list)` — 같은 `id`의 후보를 제거한다(같은 안내문을 여러 번
  찍은 사진 등에서 중복 방지).
- `toICS(candidates)` — `VCALENDAR`/`VEVENT`(종일 일정 `DTSTART;VALUE=DATE`,
  `SUMMARY`, `LOCATION`, `DESCRIPTION`) 문자열을 만든다.

## 가드레일 (반드시 지킬 것)

- **캘린더 자동 쓰기 금지.** 후보를 생성·정리·ICS 내보내기만 한다. 실제 캘린더
  반영은 사용자에게 후보 목록을 보여주고 명시적 확인을 받은 뒤에만 진행한다.
- 생성된 후보의 `requiresConfirmation`/`executable` 플래그를 변경하지 않는다.
- 아동 개인정보(생년월일·주민번호 등)를 일정 본문에 넣지 않는다.

## 전형적 흐름

1. 안내문 텍스트(모델 OCR 결과 또는 사용자 입력)에서 일정/준비물/마감을 추출
   (`packages/k-parent-doc-extract` 참고).
2. 각 일정을 `calendarCandidate`로 변환.
3. `dedupeCandidates`로 중복 제거.
4. 후보 목록을 사용자에게 표시하고 확인 요청.
5. 사용자가 원하면 `toICS`로 내보내거나, 사용자가 직접 캘린더에 등록.

## 출력 형식

- 아이 나이/학년 또는 대상 학년
- 지역, 학교/학원/기관, 원문 문서 경로
- 일정 날짜/시간, 마감일, 확인 기준일
- 출처 문서, 추출 신뢰도, review-needed flag
- 장소, 비용, 준비물, 필요 서류
- 캘린더 후보 상태, 중복 여부, 사용자 확인 필요 여부
- 부모의 다음 행동

## 관련 문서

- `docs/features/k-parent-schedule-manager.md`
