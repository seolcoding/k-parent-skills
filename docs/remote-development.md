# 원격 개발 (Codespaces · 클라우드 런타임)

이 저장소는 GitHub(`seolcoding/k-parent-skills`)를 기준 저장소로 삼고, 어디서나 같은 환경으로 개발할 수 있게 `.devcontainer/` 구성을 유지합니다. GitHub Codespaces, Claude Code 클라우드 런타임, 그 외 devcontainer를 읽는 에이전트 환경에서 그대로 부팅됩니다.

## 시작하기

### GitHub Codespaces

- 저장소 페이지의 **Code → Codespaces → Create codespace on main**으로 생성합니다.
- 또는 CLI로:

  ```bash
  gh codespace create -R seolcoding/k-parent-skills -m basicLinux32gb
  gh codespace ssh -R seolcoding/k-parent-skills
  ```

### 그 외 devcontainer 환경

`.devcontainer/devcontainer.json`을 읽는 환경(Claude Code 클라우드 런타임, VS Code Remote Containers 등)은 별도 설정 없이 같은 구성으로 시작합니다.

## 부팅 시 자동으로 되는 것

- Node 22 이미지로 컨테이너 시작 (`engines: node >= 18` 충족)
- `postCreateCommand: npm ci`로 워크스페이스 의존성 자동 설치
- `4020`(k-parent-proxy), `4030`(k-parent-api) 포트 자동 포워드

## 검증 게이트

원격에서도 로컬과 같은 게이트를 통과해야 합니다.

```bash
npm run ci   # ssot:check + lint + typecheck + test + pack:dry-run
```

## 서비스 실행

### k-parent-api (HITL·메모리 런타임, 포트 4030)

Bearer 인증 테넌트 설정이 필수입니다. 원격에서는 토큰을 직접 명령에 넣지 말고 Codespaces secrets 또는 환경변수로 주입합니다.

```bash
KPARENT_API_TOKEN_TENANTS='{"<토큰>":"family-local"}' \
  npm start --prefix services/k-parent-api
```

선택: 암호화 로컬 저장은 `KPARENT_MEMORY_FILE` + `KPARENT_MEMORY_KEY_BASE64`(32바이트 Base64)를 함께 설정합니다.

### k-parent-proxy (무료 API allowlist proxy, 포트 4020)

```bash
node packages/k-parent-proxy/src/server.js
```

`scripts/run-k-parent-proxy.sh`는 `~/.config/k-parent-skills/secrets.env`를 source합니다. 원격에서는 Codespaces secrets로 같은 변수들을 환경에 노출하거나, 해당 경로에 파일을 만들어 사용합니다.

### k-parent-refresh (로컬 refresh 스케줄러)

```bash
npm start --prefix services/k-parent-refresh
```

## 시크릿 정책

- API 키(`KEDU_INFO_KEY` 등)와 토큰은 **저장소에 커밋하지 않습니다.** `.gitignore`가 `.env*`, `*.session` 등을 차단합니다.
- Codespaces에서는 저장소/조직의 Codespaces secrets에 등록하면 환경변수로 주입됩니다.
- 템플릿은 [`.env.example`](../.env.example), 발급 가이드는 [OWNER-TASKS.md](../OWNER-TASKS.md)를 참고합니다.
- 모든 서비스는 기본적으로 loopback 전용 프로토타입입니다. 공개 배포는 `AGENTS.md`의 배포 검토 조건을 만족해야 합니다.

## 에이전트 규칙 자동 적용

`CLAUDE.md`는 `AGENTS.md`로 연결된 심볼릭 링크입니다. 원격 런타임의 코딩 에이전트(Claude Code, Codex, OpenCode 등)는 저장소를 클론하면 최상위 에이전트 지침을 그대로 읽습니다. 폴더별 `AGENTS.md`(예: `services/k-parent-api/AGENTS.md`)의 국소 규칙도 함께 적용됩니다.

## 로컬 ↔ 원격 동일성

- 원본은 `main` 브랜치이며, 원격에서 작업한 변경도 `npm run ci` 통과 후 main에 반영합니다.
- 의존성은 루트 `package-lock.json`으로 고정되므로(`npm ci`) 어디서 설치해도 같은 버전이 됩니다.
