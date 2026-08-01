# 처음 사용자 온보딩 가이드

이 문서는 `k-parent-skills`를 처음 보는 사람이 저장소의 목적, 기능 동작 방식, 설치 후 확인 방법을 빠르게 따라잡기 위한 가이드다. 세부 구현 규칙은 [아키텍처 컨벤션](architecture.md), 설치 명령은 [설치 방법](install.md), 기능별 상세 계약은 `docs/features/*.md`에서 확인한다.

## 1. 이 저장소가 하는 일

`k-parent-skills`는 대한민국 부모가 반복해서 확인하는 학교·학원·놀이·생활·쇼핑·영양 정보를 에이전트 스킬로 다루기 위한 저장소다. 핵심 단위는 `skills/<skill-name>/SKILL.md`이며, 반복 사용으로 경계가 명확해진 기능은 `packages/k-parent-*` 런타임 패키지로 승격한다.

처음 볼 때는 아래 네 층으로 이해하면 된다.

| 층 | 위치 | 역할 | 확인 방법 |
| --- | --- | --- | --- |
| 제품 스킬 | `skills/k-parent-*/SKILL.md` | 에이전트가 어떤 요청에서 어떤 순서로 질문·조회·요약할지 정의 | `npx --yes skills add seolcoding/k-parent-skills --list` 또는 파일 직접 확인 |
| 기능 문서 | `docs/features/k-parent-*.md` | 각 스킬의 데이터 소스, 환경변수, 출력 계약, 확장 후보 설명 | README의 스킬 표에서 기능 문서 링크 확인 |
| 런타임 패키지 | `packages/k-parent-*` | 공식 API 정규화, 안내문 추출, 캘린더 후보, Today Brief 합성 | `npm run test --workspace <package>` |
| 검증 스위트 | `scripts/skill-docs.test.js`, package tests | 문서 링크, 스킬 메타데이터, 패키지 계약, proxy route를 회귀 검증 | `npm run lint`, `npm run test`, `npm run ci` |
| 생태계 SSOT | `ssot/registry/*.json` | 자산 ID, canonical 경로, 성숙도, 검증, 배포 상태 | `npm run ssot:check` |

## 2. 기능 지형도

처음 사용하는 사람은 기능을 스킬 이름보다 부모의 실제 질문으로 고르는 편이 빠르다.

| 사용자가 묻는 것 | 먼저 볼 스킬 | 동작 방식 | 결과에서 확인할 것 |
| --- | --- | --- | --- |
| “이번 주 급식 뭐야?”, “알레르기 빼고 식단 봐줘” | `k-parent-meal-planner` | NEIS 급식 데이터를 학교 코드와 날짜로 조회하고 알레르기·영양 정보를 부모용 요약으로 정리 | 날짜, 식사 구분, 메뉴, 알레르기 번호, 출처 freshness |
| “이번 달 학교 일정 정리해줘”, “방과후 신청 언제까지야” | `k-parent-school-info` | 학교·교육청 코드를 확정한 뒤 NEIS 학사일정·급식·시간표와 통학 안전 소스를 합성 | 학교 식별자, 일정, 마감, 출처 URL, 확인 기준일 |
| “가정통신문 사진에서 준비물 뽑아줘” | `k-parent-school-doc-capture` | 안내문 텍스트에서 날짜·장소·준비물·신청 마감을 추출하고 캘린더 후보로 만든다 | 원본 문서 경로, 추출 confidence, `requiresConfirmation` |
| “근처 유치원 비교해줘” | `k-parent-kindergarten-info` | 어린이집/유치원 공개 정보를 운영시간·비용·교직원·안전·차량 등으로 비교 | 기관명 중복 여부, 비용, 운영시간, 공식 출처 |
| “주말에 아이랑 갈 만한 곳” | `k-parent-play-finder` | 놀이터·공원·TourAPI 장소를 연령, 위치, 날씨, 이동거리 기준으로 정리 | 대상 연령, 비용, 주차/교통, 예약 필요 여부 |
| “이번 주말 가족 축제” | `k-parent-festival-finder` | 날짜가 있는 축제·행사를 지역과 기간으로 조회한다 | 시작/종료일, 지역, 비용, 예약 상태, 공식 링크 |
| “문화센터 강좌 찾아줘” | `k-parent-culture-center-events` | 서울예약·도서관·문화포털 계열 데이터를 강좌/접수 상태로 정리 | 접수기간, 대상 연령, 기관, 신청 링크 |
| “부모급여 신청 서류 뭐야?” | `k-parent-application-helper` | 복지/신청 정보를 체크리스트와 공식 딥링크 중심으로 정리 | 자격, 필요 서류, 마감, 공식 링크, 사용자 확인 필요 여부 |
| “학원 안내문에서 숙제랑 보강 일정 뽑아줘” | `k-parent-academy-connector` | 안내문 텍스트를 일정·숙제·시험·결제 마감 후보로 정규화 | 학원 공지 원문, 날짜, 비용, 캘린더 후보 |
| “준비물 가격 비교해줘” | `k-parent-shopping-recommender` | 준비물 요구사항을 정규화하고 네이버 가격비교·쿠팡 링크 후보를 분리한다 | 비제휴 판단 정보, 제휴 고지, 배송일, 대체품 |
| “차 안에서 들을 과학 영상 추천해줘” | `k-parent-content-recommender` | YouTube safeSearch와 교과/이동시간 맥락으로 콘텐츠를 고른다 | 영상 길이, 교과 연결, 부모 질문, 후속 활동 |
| “여러 소스 데이터를 수집해줘” | `k-parent-data-collector` | 수집 작업을 출처·수집시각·freshness와 함께 정규화한다 | source URL, fetchedAt, freshness, 실패 source |

스킬이 겹칠 때는 [스킬 라우팅 인덱스](skill-routing.md)를 본다. 특히 놀이 계열은 `play-finder`(상시 장소), `festival-finder`(날짜 있는 행사), `travel-recommender`(1박 이상·타지역 코스)로 나눈다.

## 3. 설치 후 첫 확인 흐름

권장 흐름은 “전체 설치 → 설정 확인 → 기능 하나 호출 → 검증 명령 실행”이다.

1. 설치 문서의 전체 설치 명령을 사용한다.

```bash
npx --yes skills add seolcoding/k-parent-skills --all -g
```

2. 공통 설정 스킬을 호출한다.

```text
k-parent-setup 스킬을 사용해서 공통 설정을 진행해줘.
```

3. 사용자 쪽 API key 없이 바로 확인 가능한 기능부터 시도한다.

```text
k-parent-school-info로 학교 일정 확인 흐름을 설명해줘. 실제 조회가 필요하면 어떤 입력값과 출처가 필요한지도 알려줘.
```

4. 로컬 저장소에서는 문서·패키지 검증을 실행한다.

```bash
npm run lint
npm run test
```

전체 검증이 필요하면 아래 명령을 사용한다.

```bash
npm run ci
```

`npm run ci`는 lint, TypeScript typecheck, 테스트, publishable workspace dry-run pack 검증을 순서대로 실행한다.

## 4. 데이터가 실제로 어떻게 동작하는지

부모 도메인 런타임 패키지는 대부분 **fixture-first** 방식이다.

1. `test/fixtures/*.json`에 공개 API 응답 예시를 둔다.
2. 패키지 테스트는 fixture를 읽어 정규화 함수가 안정적으로 동작하는지 확인한다.
3. API key가 있으면 `refresh:fixtures` 스크립트로 라이브 응답을 다시 받아 fixture를 갱신한다.
4. 스킬 문서는 정규화된 결과의 부모 판단 필드만 사용한다.

예를 들어 NEIS 기반 패키지는 아래처럼 확인한다.

```bash
npm run test --workspace k-parent-source-neis
KEDU_INFO_KEY=... npm run refresh:fixtures --workspace k-parent-source-neis
```

라이브 fixture 갱신은 실제 upstream API를 호출하고 로컬 fixture를 덮어쓸 수 있으므로, 키가 있고 갱신 의도가 명확할 때만 실행한다.

## 5. 결과를 확인할 때 보는 필드

부모용 결과는 단순 추천 문장이 아니라 확인 가능한 의사결정 필드를 포함해야 한다.

| 필드 | 의미 |
| --- | --- |
| 아이 나이/학년 | 대상 연령, 학년, 알레르기, 이동 가능 범위를 맞추기 위한 기준 |
| 지역/기관 | 학교, 유치원, 문화센터, 축제 장소, 이동거리 |
| 날짜/마감 | 일정, 접수기간, 신청 마감, 확인 기준일 |
| 비용/준비물/서류 | 부모가 실제로 챙겨야 할 행동 단위 |
| 예약/신청 상태 | 접수 가능, 마감, 확인 필요, 로그인 필요 |
| 출처 URL | 공식 API, 공시, 기관 페이지, 보조 source |
| 수집 시각/freshness | 데이터가 최신인지, stale인지, 실패 source가 있는지 |
| 사용자 확인 필요 여부 | 캘린더 쓰기, 신청, 예약, 결제, 개인정보 입력 전 확인 경계 |

시간표, 모집, 행사, 신청 마감처럼 바뀌는 정보는 오래된 문서만 보고 답하면 안 된다. 현재 출처를 확인하고 확인 기준일을 함께 남긴다.

## 6. 안전 경계

이 저장소의 스킬은 부모의 준비와 판단을 돕는 것이 기본이다. 다음 작업은 명시적 사용자 승인 전 실행하지 않는다.

- 로그인 정보 입력
- 신청서 제출
- 예약, 취소, 결제
- 캘린더 쓰기
- 아이 개인정보 저장 또는 외부 전송
- 쿠팡 등 제휴 링크를 중립 추천처럼 숨기는 행위

문서 추출이나 쇼핑 추천처럼 side effect가 생길 수 있는 기능은 후보를 만들고 `requiresConfirmation: true` 같은 확인 상태를 유지한다.

## 7. 개발자가 기능을 확인하는 방법

기능을 바꾸거나 새 스킬을 추가했다면 최소한 아래 순서로 확인한다.

1. 스킬 문서 구조 확인

```bash
./scripts/validate-skills.sh
```

2. 문서 회귀 테스트 확인

```bash
node --test scripts/skill-docs.test.js
```

3. 변경한 패키지만 먼저 확인

```bash
npm run test --workspace k-parent-source-neis
npm run lint --workspace k-parent-source-neis
```

4. 전체 검증

```bash
npm run ci
```

5. 생성물 위생 확인

```bash
find . \( -name '*.tgz' -o -path './.playwright-mcp/*' -o -name '.DS_Store' \) -print
```

마지막 명령은 출력이 없어야 한다.

## 8. 어디를 먼저 읽을지

처음 30분 캐치업 순서는 아래를 권장한다.

1. [README](../README.md): 제품 스킬 목록과 큰 구조
2. [설치 방법](install.md): 에이전트 스킬 설치와 `k-parent-setup`
3. [스킬 라우팅 인덱스](skill-routing.md): 사용자 질문을 어느 스킬로 보낼지
4. [디파트먼트 인덱스](departments/README.md): 학교·놀이·생활 등 분류
5. 관심 기능의 `docs/features/k-parent-*.md`: 패키지, 환경변수, 출력 계약
6. [아키텍처 컨벤션](architecture.md): 스킬 우선 구조와 구현 승격 경로
7. [로드맵](roadmap.md): 다음 확장 후보

## 9. 자주 헷갈리는 점

| 질문 | 답 |
| --- | --- |
| 범용 k-skill은 어디에 있는가? | 부모 제품과 직접 관계없는 범용 한국 생활 스킬은 upstream `NomaDamas/k-skill`에 남겨 이 저장소에 복제하지 않는다. |
| API key가 없으면 못 쓰는가? | 대부분의 패키지 테스트는 fixture로 오프라인 동작한다. 일부 live 조회나 fixture 갱신에만 key가 필요하다. |
| 사용자가 API key를 직접 넣어야 하는가? | fixture 테스트에는 필요 없다. 라이브 조회·fixture 갱신 또는 self-host 프록시에만 공식 API 키를 사용한다. |
| 스킬이 실제 행동을 실행하는가? | 기본은 정보 정리와 후보 생성이다. 신청·예약·결제·캘린더 쓰기는 사용자 승인 전 실행하지 않는다. |
| 새 기능은 어디에 추가하는가? | 먼저 `skills/<name>/SKILL.md`와 `docs/features/<name>.md`로 시작하고, 반복 사용이 확인되면 `packages/*` 또는 `scripts/*`로 승격한다. |

## 10. 완료 기준

처음 사용자가 이 문서를 따라가면 아래를 스스로 확인할 수 있어야 한다.

- 이 저장소가 부모 생활정보 스킬 모음이라는 점
- 어떤 질문을 어떤 스킬로 보낼지
- 스킬이 fixture, 공식 API, hosted proxy, 로컬 패키지 중 어떤 경로로 동작하는지
- 설치 후 어떤 명령으로 검증할지
- 결과에서 출처, freshness, 마감, 비용, 준비물, 사용자 확인 경계를 어떻게 볼지
- 새 기능을 어디에 문서화하고 어떤 테스트로 확인할지
