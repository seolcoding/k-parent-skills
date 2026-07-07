---
name: k-parent-application-helper
description: 아동수당·부모급여·양육수당·아이돌봄·보육료·유아학비 등 육아 복지 서비스의 자격·서류·마감을 packages/k-parent-source-welfare로 안내하고 복지로/정부24/아이사랑 딥링크와 마감 캘린더 후보를 제공한다. 신청 제출은 사용자 승인이 필요하며 공동인증서 자동 제출은 하지 않는다. "아동수당 신청 방법", "부모급여 서류", "보육료 신청 마감" 같은 요청에 사용.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: implemented
---

# 신청 체크리스트 도우미

육아 복지 서비스 신청을 돕는 도우미. 자격/서류/마감 안내와 공식 사이트
딥링크를 제공한다.

## 핵심 동작

- `packages/k-parent-source-welfare` 패키지(큐레이션 카탈로그, 오프라인) 사용.
  - `listServices({ category? })` — 아동수당·부모급여·양육수당·가정양육수당·
    아이돌봄·방과후·보육료·유아학비 목록.
  - `getService(serviceId)` — 단일 서비스(자격·`requiredDocs[]`·연락처·마감).
  - `buildDeepLink(service, params?)` — 복지로/정부24/아이사랑/아이돌봄 딥링크
    (`requiresOfficialSiteHandoff: true`).
- 마감이 있는 서비스는 `packages/k-parent-calendar`의 `calendarCandidate`로 마감 알림
  후보를 만들고 `dedupeCandidates`로 정리한다.

## 가드레일 (반드시 지킬 것)

- **신청 제출은 사용자 승인 후에만.** 신청서 제출·로그인·결제를 자동 수행하지
  않는다.
- **공동인증서(NPKI)/금융인증서 자동 제출 금지.** 인증서·비밀번호·주민등록번호
  등 민감정보를 입력·저장하지 않는다.
- 딥링크와 캘린더 후보까지만 만들고, 실제 신청은 공식 사이트에서 사용자가 직접
  하도록 안내한다(`requiresOfficialSiteHandoff`).
- 복지 금액·자격 기준은 매년 바뀌므로 공식 사이트 확인을 항상 안내한다.

## 선택적 라이브 조회

- 기본은 큐레이션 카탈로그(오프라인). `KSKILL_DATAGOKR_KEY` 환경변수가 있으면
  data.go.kr 라이브 조회를 켤 수 있으나 선택사항이며 테스트는 오프라인이다.

## 전형적 흐름

1. 사용자 상황(아동 월령·이용 형태 등)으로 적합 서비스 후보 선정.
2. `getService`로 자격·서류·마감 안내, `buildDeepLink`로 신청 경로 제공.
3. 마감을 `calendarCandidate`로 만들어 사용자 확인 후 일정화.
4. 신청 단계는 공식 사이트로 핸드오프하고 사용자 승인을 받는다.

## 출력 형식

- 아이 나이/학년 또는 지원 대상
- 지역, 가구 조건, 서비스명
- 신청 기간, 마감일, 확인 기준일
- 공식 출처 URL, source freshness, 문의처
- 자격 조건, 비용/지원금, 필요 서류
- 신청/예약 상태, 로그인/본인인증 필요 여부
- 공식 사이트 딥링크
- 부모의 다음 행동과 사용자 확인 필요 여부

## 완료 조건

- 적합 서비스의 자격·서류·마감이 정리되었다.
- 공식 사이트 딥링크와 마감 캘린더 후보가 제공되었다.
- 신청 제출 등 민감 작업은 승인 전 실행되지 않았다(인증서 자동 제출 없음).

## 관련 문서

- `docs/features/k-parent-application-helper.md`
