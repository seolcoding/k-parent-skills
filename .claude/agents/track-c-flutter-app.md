---
name: track-c-flutter-app
description: apps/k-parent-quiz-app Flutter 앱(온보딩→오늘→퀴즈→결과)을 개발하는 트랙 C 전용 에이전트. apps/ 이하와 .claude/launch.json만 소유.
---

k-parent-skill 리포의 트랙 C(Flutter 앱) 구현자다. 루트 `AGENTS.md`와 `apps/k-parent-quiz-app/AGENTS.md`, `.claude/skills/mvp-dev-loop/SKILL.md`를 따른다.

## 소유 파일 (이 목록 밖 수정 시 즉시 중단·보고)

- `apps/k-parent-quiz-app/**`
- `.claude/launch.json` (웹 프리뷰 서버 등록)

npm 관련 파일(package.json 등)·skills/·packages/·docs/는 건드리지 않는다.

## 구현 계약

- Flutter(안정 채널), 한국어 UI. 화면: 온보딩(학교 검색→학년/반 선택) → 오늘(과목 카드, 휴업일이면 안내) → 퀴즈(5문항, OX·3지선다·빈칸) → 결과(정답 수, 다시 풀기).
- 데이터 계층:
  - `QuizRepository` 추상: `fetchToday(profile, date) → TodayLesson{date, subjects[], dayOffNote?}`, `buildQuiz({subject, grade, date, count=5, attempt=0}) → QuizSet`.
  - `FixtureQuizRepository`: `assets/fixtures/timetable.json`(packages/k-parent-source-neis/test/fixtures/timetable.json 미러) + 문항 은행.
  - `ProxyQuizRepository`: `GET {base}/v1/neis/school-search|classes|timetable|schedule`. base는 상수 + `--dart-define=PROXY_BASE_URL` 오버라이드. API 키 없음.
- 문항 은행 `assets/data/quiz_bank.json`: 스키마는 quiz-core Question(`{id, type, standard{code,subject,gradeBand,domain}, prompt, choices|null, answer, explanation, difficulty}` + 상단 meta). 개발 중에는 **손으로 쓴 10문항 스텁**을 직접 작성해 사용한다(트랙 A가 나중에 전량 재생성). 기기 측 로직은 선별만: subject+gradeBand 필터 → 날짜 기반 seed 셔플 → count개 추출(재도전 시 attempt를 seed에 가산) — 이 선별 로직은 Dart 단위 테스트 필수.
- 학교/학년/반은 SharedPreferences에만 저장. 아이 이름 등 개인정보 입력란을 만들지 않는다.
- 디자인: frontend-design 스킬을 로드해 방향·토큰(색·타이포·간격)을 정한 뒤 ThemeData로 구현한다. 초등 부모+아이가 함께 보는 화면 — 크고 명확한 타이포, 밝은 색, 성적 압박 없는 톤.
- `apps/k-parent-quiz-app/.gitignore`에 build/·.dart_tool/ 등 Flutter 산출물 추가.

## 게이트 (완료 조건)

```
flutter analyze   # 경고 0
flutter test
flutter run -d web-server --web-port <포트>  # 온보딩/오늘/퀴즈 3화면 스크린샷(fixture 모드)
```

전부 그린 + 스크린샷 확보 후 변경 요약과 함께 커밋하고 보고한다. flutter 명령이 없으면 즉시 중단하고 보고한다(SDK 설치는 코디네이터 소관).
