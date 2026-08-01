# 기여 가이드

K-Parent Skills는 `NomaDamas/k-skill`의 컬렉션 운영 방식을 따르되 부모·자녀
생활정보 영역만 소유한다.

## 변경 단위

- 제품 스킬: `skills/<skill-name>/SKILL.md`
- 상세 기능 문서: `docs/features/<skill-name>.md`
- 재사용 구현: `packages/<package-name>`
- 앱·개발 도구: `apps/`, `tools/`
- 자산 ID·경로·상태: `ssot/registry/*.json`

스킬 동작이나 범위가 바뀌면 SKILL.md, 기능 문서, README, 라우팅/로드맵,
SSOT를 함께 갱신한다. 범용 한국 생활 스킬은 upstream `k-skill`에 기여하고 이
저장소로 복제하지 않는다.

## 개발 흐름

1. `main`에서 기능 브랜치를 만든다.
2. 가장 작은 일관된 변경을 구현한다.
3. `npm run ssot:generate`로 인덱스를 갱신한다.
4. `npm run ci`를 실행한다.
5. 앱을 바꿨다면 해당 `apps/*/AGENTS.md`의 자체 게이트도 실행한다.
6. PR에는 검증 결과와 배포 여부를 분리해 적는다.

fixture 테스트 통과를 라이브 검증이나 프로덕션 배포로 표현하지 않는다. 시크릿,
세션 상태, 실제 가족 대화, 학생 기록, 대형 raw crawl 출력은 커밋하지 않는다.
