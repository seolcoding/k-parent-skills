---
name: k-parent-kindergarten-info
description: 대한민국 부모가 유치원·어린이집을 비교할 때 쓰는 스킬. 어린이집정보공개·유치원현황(packages/k-parent-source-childinfo)으로 운영시간·비용·교직원·급식/위생/안전·CCTV/차량·방과후를 비교한다. "근처 유치원 비교해줘", "국공립 유치원 모집 언제야", "어린이집 방과후 되는 곳 찾아줘" 같은 요청에 사용. 초·중·고 학교는 k-parent-school-info.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: p0
---

# 유치원 정보 비교

## 핵심 동작

대한민국 부모가 유치원·어린이집 정보를 비교하고 모집·등록 일정을 놓치지 않도록 돕는다. 결정형 구현은 `packages/k-parent-source-childinfo`를 사용하며 유치원 기본정보, 모집, 방과후 과정, 통학, 급식, 비용 확인 절차를 정의한다.

## 사용 시점

- "동네 유치원 비교해줘"
- "처음학교로 모집 일정 확인해줘"
- "방과후 과정 있는 유치원 찾아줘"
- "통학버스 되는 곳 위주로 정리해줘"

## 전형적 흐름

### 1. 입력값 수집

- 거주 지역 또는 희망 통학 범위
- 아이 출생연도
- 공립/사립 선호
- 방과후, 통학버스, 급식, 특성화 활동, 비용 조건
- 모집/입학 연도

### 2. 공식 출처 우선 확인

현재 기준으로 공식 출처를 우선한다.

- 처음학교로 모집 공고
- 유치원알리미
- 교육청 안내
- 개별 유치원 홈페이지·공지

결정형 조회가 필요하면 `packages/k-parent-source-childinfo`를 사용한다.

```js
const { fetchChildcareCenters, fetchKindergartens } = require("k-parent-source-childinfo");

const childcare = await fetchChildcareCenters({ sidoCode: "11", sigunguCode: "11110" });
const kindergarten = await fetchKindergartens({ sidoCode: "11", sggCode: "11110" });
```

### 3. 부모용 비교표 정리

- 기관명
- 대상 연령
- 모집 상태와 마감일
- 통학 조건
- 방과후 과정
- 비용 또는 확인 필요 항목
- 링크

## 출력 형식

응답은 부모가 비교할 수 있도록 아래 필드를 포함한다.

- 아이 나이/출생연도와 대상 연령
- 지역, 통학 범위, 기관명, 기관 유형
- 날짜 범위, 모집/입학 연도, 확인 기준일
- 공식 출처 URL, source freshness, 수집/확인 시각
- 운영시간, 방과후/연장, 통학, 급식/위생/안전, CCTV/차량
- 비용, 필요 서류, 모집 상태, 신청 마감일
- 로그인/본인인증 필요 여부
- 부모의 다음 행동

## 완료 조건

- 후보 유치원의 출처와 확인일을 적었다.
- 모집 상태, 마감일, 통학 조건을 구분했다.
- 사용자가 다음에 해야 할 확인 작업을 짧게 정리했다.

## 실패 모드

- 모집 일정이 아직 공개되지 않음
- 유치원별 세부 비용이 공개 페이지에 없음
- 통학버스 노선이 전화 문의로만 확인 가능

## 참고

- 평판성 판단은 출처가 있는 사실과 보호자 후기 추정을 분리한다.
- 아이 개인정보를 외부 사이트에 입력하지 않는다.

## 관련 문서

- `docs/features/k-parent-kindergarten-info.md`
