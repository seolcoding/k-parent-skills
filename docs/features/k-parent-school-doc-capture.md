# 학교문서 스캔 기능 문서

`k-parent-school-doc-capture`는 학교 안내문 사진·PDF·앱 캡처를 OCR로 저장하고 일정/준비물/신청 마감을 관리하기 위한 스킬이다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-doc-extract` | 이미 추출된 안내문 plain text에서 일정, 준비물, 신청/제출 마감 추출 |
| `packages/k-parent-calendar` | 추출된 일정·마감의 캘린더 후보 생성, 중복 제거, ICS export |

## 현재 범위

- 원본 문서와 OCR 텍스트를 함께 보존
- 날짜, 시간, 장소, 대상, 준비물, 비용, 신청 마감을 구조화
- OCR은 모델이나 외부 도구가 먼저 수행한다. `packages/k-parent-doc-extract`는 이미 추출된 plain text만 파싱한다.
- `extractEvents(text)`, `extractSupplies(text)`, `extractDeadlines(text)` 기반의 안내문 항목 추출
- 캘린더/리마인더 후보를 만들고 사용자 확인 뒤에만 등록
- 캘린더 후보는 `calendarCandidate(input)`과 `toICS(candidates)`로 만들며 실제 캘린더 쓰기는 자동 실행하지 않는다.

## 환경변수

필요한 API key가 없다. `packages/k-parent-doc-extract`와 `packages/k-parent-calendar`는 네트워크 호출 없이 동작하는 순수 로직 패키지다.

## 픽스처 갱신

fixture refresh 명령이 없다. 문서 추출과 캘린더 후보는 패키지 테스트의 고정 입력으로 검증한다.

## 저장 레코드 후보

```json
{
  "document_id": "local-generated-id",
  "source_type": "photo|pdf|screenshot|message|manual",
  "original_path": "/local/path/school_notice.jpg",
  "ocr_text_path": "/local/path/school_notice.ocr.txt",
  "issuer": "예시초등학교",
  "child_or_grade": "3학년",
  "extracted_items": [
    {
      "type": "calendar_event",
      "title": "현장체험학습",
      "starts_at": "2026-05-10T09:00:00+09:00",
      "ends_at": "2026-05-10T14:00:00+09:00",
      "place": "부산시민공원",
      "materials": ["물", "모자"],
      "needs_confirmation": true
    }
  ],
  "review_needed": true
}
```

## 남은 확장 후보

- 로컬 문서 저장 디렉토리 규칙
- OCR 엔진 선택과 confidence 저장
- 중복 문서 감지
- Google/Apple/Outlook Calendar 후보 export
- QR 코드와 첨부 PDF 추출
