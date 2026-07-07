# k-parent-quiz-app — 오늘 뭐 배웠지?

초등 부모+아이가 오늘 시간표 과목을 5문항(OX·3지선다·빈칸)으로 함께 복습하는
Flutter 앱. 화면 흐름: 온보딩(학교 검색→학년/반) → 오늘(과목 카드) → 퀴즈 → 결과(칭찬 스티커판).

개발 규칙·경계는 `AGENTS.md`를 따른다 (proxy 외 네트워크 금지, 개인정보 최소화, fixture-first).

## 실행

```bash
flutter pub get
flutter run -d web-server --web-port 8787          # fixture 모드 (기본, 오프라인)
flutter run --dart-define=PROXY_BASE_URL=https://k-skill-proxy.nomadamas.org  # proxy 연동
```

fixture 모드 데모: 학교 검색에 `미래` 입력 → 서울미래초등학교 → 1학년 2반.

## 데이터 계층

- `QuizRepository` (추상) — `searchSchools` / `fetchToday` / `buildQuiz`
- `FixtureQuizRepository` — `assets/fixtures/timetable.json`(NEIS fixture 미러) + 문항 은행
- `ProxyQuizRepository` — `GET {base}/v1/neis/school-search|classes|timetable|schedule`, API 키 없음
- 문항 은행 `assets/data/quiz_bank.json` — 현재 수기 스텁 10문항.
  트랙 A 머지 후 재생성: `node packages/k-parent-quiz-core/scripts/generate-quiz-bank.mjs --out apps/k-parent-quiz-app/assets/data/quiz_bank.json`
- 기기 측 로직은 선별만: subject+gradeBand 필터 → 날짜 seed 셔플 → 5문항 (재도전 시 attempt를 seed에 가산). `lib/data/quiz_selector.dart`

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
