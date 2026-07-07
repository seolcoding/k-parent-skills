---
name: k-parent-academy-connector
description: 학원 안내문(휴강·보강·결석·숙제·시험·수강료·차량)을 packages/k-parent-doc-extract와 packages/k-parent-calendar로 분류하고 일정 후보로 정리한다. 로그인·결제·신청은 사용자 승인이 필요하다. "학원 공지 정리", "보강 일정 알려줘", "수강료 마감 챙겨줘" 같은 요청에 사용.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: implemented
---

# 학원 연동 도우미

학원 공지/안내문을 부모가 한눈에 볼 수 있게 정리하는 도우미.

## 핵심 동작

- `packages/k-parent-doc-extract`의 `extractAcademyNotice(text)` 사용.
  - 반환: `[{ type, date, detail }]`
  - `type`: `class`(수업/휴강/개강) · `makeup`(보강) · `absence`(결석) ·
    `homework`(숙제/과제) · `exam`(시험/레벨테스트) · `payment`(수강료/납부) ·
    `shuttle`(차량/셔틀).
- 날짜가 있는 항목은 `packages/k-parent-calendar`의 `calendarCandidate`로 변환하고
  `dedupeCandidates`로 중복 제거한다.
- 수강료/납부 마감은 `extractDeadlines`로 함께 정리한다.

## 가드레일 (반드시 지킬 것)

- **로그인·결제·신청은 사용자 승인 후에만.** 학원 앱/사이트 로그인, 수강료
  결제, 수강 신청·취소를 자동으로 수행하지 않는다.
- 캘린더 후보는 `requiresConfirmation: true`, `executable: false`. 자동 캘린더
  쓰기 금지.
- 아동 개인정보·결제 비밀번호·인증서 정보를 입력·저장하지 않는다.

## 전형적 흐름

1. 학원 공지 텍스트(모델 OCR 결과 또는 사용자 입력) 수집.
2. `extractAcademyNotice`로 유형별 분류, `extractDeadlines`로 납부 마감 추출.
3. 날짜 있는 항목을 `calendarCandidate`로 변환, `dedupeCandidates`로 정리.
4. 유형별 요약 + 일정 후보를 사용자에게 표시.
5. 결제/신청이 필요하면 공식 채널로 안내하고 사용자 승인을 받는다.

## 출력 형식

- 아이 나이/학년 또는 수강 반
- 학원명, 과목, 지역 또는 셔틀/등원 맥락
- 날짜 범위와 확인 기준일
- 알림 출처, 원문/캡처 경로, 추출 신뢰도
- 수업, 숙제, 시험, 보강, 상담, 결제 마감
- 비용, 준비물, 필요 서류 또는 확인 필요 항목
- 출결/보강/결제/상담 신청 상태
- 부모의 다음 행동과 사용자 확인 필요 여부

## 완료 조건

- 공지가 유형별로 정리되었다.
- 일정/납부 마감이 후보로 만들어졌다.
- 로그인/결제/신청 등 민감 작업은 승인 전 실행되지 않았다.

## 관련 문서

- `docs/features/k-parent-academy-connector.md`
