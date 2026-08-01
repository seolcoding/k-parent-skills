# k-parent-quiz-app — 오늘 뭐 배웠지?

초등 부모+아이가 오늘 시간표 과목을 5문항(OX·3지선다·빈칸)으로 함께 복습하는
Flutter 앱. 화면 흐름: 온보딩(학교 검색→학년/반) → 오늘(과목 카드) → 퀴즈 → 결과(칭찬 스티커판).

개발 규칙·경계는 `AGENTS.md`를 따른다 (네트워크는 proxy-only, 개인정보 최소화, fixture-first).

오늘 화면의 `세션 잠깐 기억하기`는 기본 꺼짐인 로컬 동의 설정이다. 설정에는 boolean만
저장하며 대화 원문, 아이 정보, 토큰, 승인 범위는 저장하지 않는다.

## 실행

```bash
flutter pub get
flutter run -d web-server --web-port 8787          # fixture 모드 (기본, 오프라인)
flutter run --dart-define=PROXY_BASE_URL=http://127.0.0.1:4020  # 로컬 웹/desktop proxy
flutter run --dart-define=PROXY_BASE_URL=http://10.0.2.2:4020   # Android emulator
```

fixture 모드 데모: 학교 검색에 `미래` 입력 → 서울미래초등학교 → 1학년 2반.

## 데이터 계층

- `QuizRepository` (추상) — `searchSchools` / `fetchToday` / `buildQuiz`
- `FixtureQuizRepository` — `assets/fixtures/timetable.json`(NEIS fixture 미러) + 문항 은행
- `ProxyQuizRepository` — `GET {base}/v1/neis/school-search|classes|timetable|schedule`, API 키 없음
- 문항 은행 `assets/data/quiz_bank.json` — `packages/k-parent-quiz-core` 생성기로 전수 생성한 2,668문항(성취기준 399건, OX·3지선다·빈칸, 바이트 단위 재현).
  재생성: `node packages/k-parent-quiz-core/scripts/generate-quiz-bank.mjs --out apps/k-parent-quiz-app/assets/data/quiz_bank.json`
- 기기 측 로직은 선별만: subject+gradeBand 필터 → 날짜 seed 셔플 → 5문항 (재도전 시 attempt를 seed에 가산). `lib/data/quiz_selector.dart`

## HITL 승인 경계

- `ActionProposal` / `ActionRequest` / `ActionDecisionInput`은 action
  create/decision 계약을 로컬 타입으로 고정한다.
- `HitlApprovalGateway`는 transport 없이 create/decision만 노출한다. execute 메서드나
  직접 HTTP client는 없으며, 승인 뒤에도 자동 실행하거나 공식 사이트를 자동으로 열지 않는다.
- `OfflineFixtureHitlApprovalGateway`는 오프라인 UI preview·테스트 전용이다. risk,
  승인 필요 여부, handoff, expiry가 들어 있는 typed fixture를 주입받을 뿐 정책을 소유하지
  않으며, 네트워크나 승인 범위 저장을 전혀 수행하지 않는다.
- `ActionConfirmationSurface`는 작업명, 위험도, 승인 범위 요약, 정책 만료 시각,
  공식 HTTPS 사이트 인계를 한 화면에 보여준다. 공식 사이트 이동은 승인 뒤 부모가
  별도 버튼을 눌렀을 때만 일어난다.
- 현재 퀴즈 흐름은 외부 작업을 만들지 않는다. 향후 runtime transport를 붙일 때도 앱의
  허용된 `k-parent-proxy` 경로를 통하는 gateway adapter로만 구성해야 한다.
- 승인 scope는 확인 화면이 살아 있는 동안만 메모리에 두며 SharedPreferences에 쓰지
  않는다. scope summary도 UI용이며 API에 전송하지 않는다.

## 게이트

```bash
flutter analyze   # 경고 0
flutter test      # 선별 로직·fixture 저장소·모델·온보딩 위젯 테스트
```

스크린샷: `docs/screenshots/` (fixture 모드 3화면 이상).

## 디자인 토큰

`lib/theme/app_theme.dart` — "크레파스 문방구": paper `#FFF9EE` / ink `#3D332C` /
marigold `#FFB017` / leaf `#4C9A52` / coral `#D95B3E`(오답에 빨강 금지),
과목별 교과서 색 스티커. 서체 Jua(표시)·Gowun Dodum(본문, 둘 다 OFL — `assets/fonts/OFL-*.txt`).
