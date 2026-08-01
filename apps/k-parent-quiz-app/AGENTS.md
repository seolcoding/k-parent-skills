# k-parent-quiz-app (Flutter) 개발 규칙

루트 `AGENTS.md`를 상속한다. 이 디렉토리는 npm workspaces와 `npm run ci` 밖의 제품 표면이다.

## 경계

- 네트워크 호출은 k-parent-proxy(`/v1/...`)만. 다른 도메인 호출·클라이언트 API 키 내장 금지.
- 아이 식별정보는 학교/학년/반까지만, SharedPreferences 로컬 저장. 이름 등 개인정보는 받지 않는다. 서버 전송 없음.
- fixture-first: 오프라인 데모 경로(번들 fixture + 문항 은행)가 항상 동작해야 한다. proxy 연동은 `--dart-define=PROXY_BASE_URL=...` 오버라이드.

## 데이터 계약

- 문항은 빌드타임 사전 생성 은행 `assets/data/quiz_bank.json` (스키마: packages/k-parent-quiz-core의 Question). 기기에서는 필터→날짜 seed 셔플→선별만 한다. 생성 로직의 Dart 미러링 금지.
- 은행 재생성: `node packages/k-parent-quiz-core/scripts/generate-quiz-bank.mjs --out apps/k-parent-quiz-app/assets/data/quiz_bank.json`.

## 게이트

- `flutter analyze` 경고 0 + `flutter test` 그린이 이 디렉토리의 머지 게이트다.
- 웹 프리뷰: `flutter run -d web-server --web-port <port>` 후 3화면(온보딩/오늘/퀴즈) 스크린샷.
- UI는 한국어. 성적 판단·또래 비교·아이를 다그치는 문구 금지(스킬 가드레일과 동일).
