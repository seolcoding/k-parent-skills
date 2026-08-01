# 설치

제품 스킬은 모두 표준 `skills/<name>/SKILL.md` 컨테이너에 있다. 새 저장소에는
상속 예제 컨테이너가 없으므로 `--full-depth`가 필요하지 않다.

## 전체 설치

```bash
npx --yes skills add seolcoding/k-parent-skills --all -g
```

설치 후 에이전트에게 다음처럼 요청한다.

```text
k-parent-setup 스킬로 K-Parent Skills 실행 환경을 점검해줘.
```

## 선택 설치

```bash
npx --yes skills add seolcoding/k-parent-skills \
  --skill k-parent-school-info \
  --skill k-parent-meal-planner \
  --skill k-parent-schedule-manager \
  --skill k-parent-setup \
  -g
```

설치 가능한 전체 목록은 다음 명령으로 확인한다.

```bash
npx --yes skills add seolcoding/k-parent-skills --list
```

## 저장소 개발

```bash
git clone https://github.com/seolcoding/k-parent-skills.git
cd k-parent-skills
npm ci
npm run ci
```

Flutter 퀴즈 앱은 별도 게이트를 사용한다.

```bash
cd apps/k-parent-quiz-app
flutter pub get
flutter analyze
flutter test
```

라이브 API 키 없이도 패키지 fixture와 순수 로직 테스트를 실행할 수 있다. 실제
데이터 갱신이 필요할 때만 [공통 설정](setup.md)을 따른다.
