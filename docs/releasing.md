# 릴리스와 자동 배포

현재 `k-parent-skills`은 부모용 스킬 컨셉과 워크플로우를 정리하는 저장소다. 실제 npm/Python 패키지 배포 대상이 확정되기 전까지 release workflow는 비활성 상태로 둔다.

## 현재 정책

- `.github/workflows/ci.yml`만 push/PR에서 실행한다.
- npm/Python release workflow는 만들지 않는다.
- 실제 배포 패키지가 생기기 전에는 Changesets, release-please, PyPI publish를 자동 실행하지 않는다.
- 배포 workflow를 추가할 때는 "scaffold only" job을 만들지 않는다. 실행 조건 때문에 모든 job이 skip되면 GitHub Actions가 실패 알림을 보낼 수 있다.

## npm 패키지를 배포하게 될 때

1. 배포할 `packages/<package-name>`의 package name, registry, visibility를 확정한다.
2. Changesets 설정을 현재 패키지 구조에 맞게 점검한다.
3. `NPM_TOKEN` 또는 npm trusted publishing/OIDC 전략을 정한다.
4. push-triggered workflow는 Version Packages PR 흐름까지 검증한 뒤 추가한다.
5. `npm run ci`가 GitHub Actions에서 통과하는지 먼저 확인한다.

## Python 패키지를 배포하게 될 때

1. `python-packages/<package-name>/pyproject.toml`을 추가한다.
2. release-please config와 manifest를 실제 패키지 path 기준으로 작성한다.
3. PyPI trusted publishing을 우선 검토한다.
4. release-please와 publish job을 같은 PR에서 추가한다.
5. 실제 패키지가 없을 때는 `release-python.yml`을 만들지 않는다.

## Maintainer 확인 명령

```bash
npm run ci
```
