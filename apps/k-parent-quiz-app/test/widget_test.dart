import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:k_parent_quiz_app/data/fixture_quiz_repository.dart';
import 'package:k_parent_quiz_app/models/models.dart';
import 'package:k_parent_quiz_app/screens/onboarding_screen.dart';
import 'package:k_parent_quiz_app/theme/app_theme.dart';

/// 위젯 테스트는 fake-async 시계로 돌기 때문에 실제 파일 IO 대신
/// 동기 읽기를 즉시 완료 Future로 감싼다.
Future<String> fileLoader(String assetPath) {
  return Future.value(File(assetPath).readAsStringSync());
}

void main() {
  testWidgets('온보딩: 학교 검색 → 학년/반 선택 → 시작 버튼 활성화', (tester) async {
    ChildProfile? completed;
    await tester.pumpWidget(
      MaterialApp(
        theme: buildAppTheme(),
        home: OnboardingScreen(
          repository: FixtureQuizRepository(loader: fileLoader),
          onComplete: (profile) => completed = profile,
        ),
      ),
    );

    expect(find.text('오늘 뭐 배웠지?'), findsOneWidget);

    // 시작 버튼은 프로필이 완성되기 전에는 비활성.
    final startButton = find.widgetWithText(ElevatedButton, '복습 시작하기');
    expect(tester.widget<ElevatedButton>(startButton).onPressed, isNull);

    // 학교 검색 → fixture 학교가 단일 결과라 자동 선택된다.
    await tester.enterText(find.byType(TextField), '미래');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();
    expect(find.text('서울미래초등학교'), findsOneWidget);

    // 학년·반 선택 — ListView는 화면 밖 항목을 아직 만들지 않으므로 스크롤한다.
    // (TextField 내부 Scrollable과 겹치지 않게 목록 Scrollable을 못박는다.)
    final listView = find.byType(Scrollable).first;
    await tester.scrollUntilVisible(
      find.text('1학년'),
      120,
      scrollable: listView,
    );
    await tester.tap(find.text('1학년'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('2반'), 120, scrollable: listView);
    await tester.tap(find.text('2반'));
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(startButton, 120, scrollable: listView);
    await tester.tap(startButton);
    await tester.pumpAndSettle();

    expect(completed, isNotNull);
    expect(completed!.school.name, '서울미래초등학교');
    expect(completed!.grade, 1);
    expect(completed!.classNm, '2');
    expect(completed!.gradeBand, '1-2');
  });
}
