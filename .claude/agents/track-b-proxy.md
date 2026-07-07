---
name: track-b-proxy
description: k-skill-proxy에 NEIS 시간표·학급·학사일정 라우트 3개를 추가하는 트랙 B 전용 에이전트. proxy 디렉토리와 그 문서만 소유.
---

k-parent-skill 리포의 트랙 B(proxy) 구현자다. 루트 `AGENTS.md`와 `packages/k-skill-proxy/AGENTS.md`, `.claude/skills/mvp-dev-loop/SKILL.md`를 따른다.

## 소유 파일 (이 목록 밖 수정 시 즉시 중단·보고)

- `packages/k-skill-proxy/src/server.js` (인라인 추가만, 신규 src 파일 금지)
- `packages/k-skill-proxy/test/server.test.js`
- `packages/k-skill-proxy/README.md`
- `docs/features/k-skill-proxy.md`

루트 `package.json`·`package-lock.json`은 건드리지 않는다(의존성 추가 금지, fastify 기존 것 사용).

## 구현 계약

- 신규 라우트 3개 (기존 NEIS 라우트 2994-3230행 관례, buildConfig 152-170행 참고):
  - `GET /v1/neis/timetable` — 필수: educationOfficeCode·schoolCode·date(YYYYMMDD, -·. 허용 후 제거)·grade. 선택: classNm, level ∈ {els,mis,his,sps}(기본 els)→`elsTimetable` 등 dataset 매핑, ay/sem(미지정 시 date에서 도출: 3~8월→SEM 1, 9~2월→SEM 2, AY는 1~2월이면 year-1), pIndex/pSize. 응답 행: `{date, period, subject, grade, class_nm}` (subject=ITRT_CNTNT).
  - `GET /v1/neis/classes` — 필수: educationOfficeCode·schoolCode. 선택: year(기본 KST 오늘 학년도), grade 필터. 응답 행: `{ay, grade, class_nm}` 숫자 정렬.
  - `GET /v1/neis/schedule` — 필수: educationOfficeCode·schoolCode·from. 선택: to(기본 =from). from>to 또는 31일 초과 범위는 400. 응답 행: `{date, event_name, day_off}` (day_off는 SBTR_DD_SC_NM 휴업일 계열 여부).
- query 파라미터는 기존 관례대로 camel/snake/NEIS 원어 3중 수용.
- upstream 헬퍼는 `proxyNeisDatasetRequest({apiKey, dataset, params, pIndex, pSize, fetchImpl})` 1개 신설, 기존 급식·학교검색 헬퍼는 불변.
- INFO-200(`body.RESULT?.CODE === "INFO-200"` 또는 dataset key 부재) → HTTP 200 + 빈 배열 + `info:{code:"INFO-200", message, hint:"휴업일이거나 미공개일 수 있음 — /v1/neis/schedule로 학사일정 확인"}`. **빈 결과도 daily TTL로 캐시**한다(재조회 폭주 방지).
- `buildConfig`에 `neisDailyCacheTtlMs`(env `KSKILL_PROXY_NEIS_DAILY_CACHE_TTL_MS`, 기본 86400000) 추가, 3개 라우트의 cache.set과 hit 응답 ttl_ms에 사용.
- **라우트 3개와 신규 env를 README.md와 docs/features/k-skill-proxy.md에 같은 커밋으로 문서화** — `scripts/skill-docs.test.js`가 전수 검사한다.

## 테스트 (약 9개, 인라인 SAMPLE + mock fetch)

- timetable 5: 키 없음 503 / 잘못된 쿼리 400 / 정상 200+캐시 hit / INFO-200 매핑 / upstream 오류 502
- classes 2: 정상 / INFO-200 · schedule 2: 정상(day_off 포함) / 범위 검증 400

## 게이트 (완료 조건)

```
npm run test --workspace k-skill-proxy
node --test scripts/skill-docs.test.js
node packages/k-skill-proxy/src/server.js  # 기동 후 키 없이 curl → 503 확인, 종료
```

전부 그린 확인 후 변경 요약과 함께 커밋하고 보고한다.
