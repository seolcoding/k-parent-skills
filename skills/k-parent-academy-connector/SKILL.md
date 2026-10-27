---
name: k-parent-academy-connector
description: 학원 안내문(휴강·보강·결석·숙제·시험·수강료·차량)을 packages/k-parent-doc-extract와 packages/k-parent-calendar로 분류하고 일정 후보로 정리하며, 교육청 등록 학원·교습소 정보(등록·휴원 상태, 교습과정, 신고된 교습비, 연락처)를 NEIS 학원교습소정보로 확인한다(packages/k-parent-source-neis searchAcademies). 로그인·결제·신청은 사용자 승인이 필요하다. "학원 공지 정리", "보강 일정 알려줘", "우리 동네 영어학원 교습비 얼마로 신고돼 있어?", "이 학원 교육청에 등록된 곳이야?" 같은 요청에 사용. 학교 정보는 k-parent-school-info.
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
- 학원 자체 정보(교육청 등록 여부, 휴원, 교습과정, 신고 교습비)는 NEIS
  학원교습소정보로 확인한다. 아래 "학원·교습소 확인" 참고.

## 학원·교습소 확인 (NEIS 학원교습소정보)

교육청에 등록된 학원·교습소의 공개 정보를 조회한다. 적재 주기는 매주다.

```js
const { searchAcademies } = require("k-parent-source-neis");

const result = await searchAcademies({
  region: "서울",          // 또는 educationOfficeCode: "B10"
  district: "송파구",      // 행정구역명
  academyName: "영어",     // 학원명 일부
  // course: "보습",       // 교습과정명 (선택)
});
// result.ok, result.totalCount, result.truncated, result.keyless, result.academies[]
```

- **키 없이도 된다.** `KEDU_INFO_KEY`가 없으면 NEIS 샘플 모드로 호출하고, NEIS가
  한 번에 **최대 5건**만 준다. 이때 `keyless: true`이고 `truncated`가 true면
  "검색 결과 N건 중 5건만 보여 줌"이라고 알리고 조건(구, 학원명, 과목)을 좁히게 한다.
- 키가 있는 프록시를 쓰면 `GET $KPARENT_PROXY_BASE_URL/v1/neis/academies?educationOffice=서울&district=송파구&academyName=영어`
  (구나 학원명 중 하나 필수, 최대 100건).
- 교육청이 애매하면(`경상` 등) `ambiguous`로 실패한다. 후보를 보여 주고 고르게 한다.
- 각 항목: `name`, `kind`(학원/교습소), `registrationStatus`, `leave`·`onLeaveToday`,
  `course`, `courseList`, `capacity`, `tuition`(`disclosed`, `items[{course, amountKrw}]`),
  `address`, `telephone`, `updatedAt`, `source`.

해석 규칙:

- `tuition.items`는 학원이 교육청에 **신고한** 교습비 원문이다. 실제 청구액, 교재비·
  차량비 포함 여부, 기간 단위는 과정명 괄호(예: `(4.2주)(주2회, 회당150분)`)로만
  알 수 있다. "신고 교습비 기준"이라고 적고, 실제 금액은 학원에 확인하라고 안내한다.
- 교습비 미공개(`disclosed: false`)나 빈 값이면 "공개된 교습비 없음"이라고 쓴다.
- `02-0000-0000` 같은 자리표시 전화번호는 `null`로 바뀐다. 연락처가 없다고 쓴다.
- 등록 정보는 학원의 수업 질이나 안전을 보증하지 않는다. 평가처럼 말하지 않는다.
- 답변에 조회 시각과 "NEIS 학원교습소정보(매주 적재)"를 적는다.

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

학원을 고르거나 확인하는 질문이면 1~4 대신 `searchAcademies`로 후보를 찾고,
등록 상태·휴원·신고 교습비·연락처를 표로 보여 준다. 상담·등록은 부모가 직접 한다.

## 데이터 소스

| 경로 | 함수 / 라우트 | 키 |
| --- | --- | --- |
| `packages/k-parent-source-neis` | `searchAcademies({ region \| educationOfficeCode, district, academyName, course, pageSize })` | `KEDU_INFO_KEY` 선택 (없으면 5건 샘플) |
| `packages/k-parent-proxy` | `GET /v1/neis/academies` | 프록시 서버에 `KEDU_INFO_KEY` |
| `packages/k-parent-doc-extract` | `extractAcademyNotice`, `extractDeadlines` | 없음 |
| `packages/k-parent-calendar` | `calendarCandidate`, `dedupeCandidates`, `toICS` | 없음 |

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
