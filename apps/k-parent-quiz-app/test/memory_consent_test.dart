import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:k_parent_quiz_app/data/memory_consent_store.dart';
import 'package:k_parent_quiz_app/theme/app_theme.dart';
import 'package:k_parent_quiz_app/widgets/memory_consent_card.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('세션 메모리 동의 기본값은 꺼짐이다', () async {
    SharedPreferences.setMockInitialValues({});
    const store = SharedPreferencesMemoryConsentStore();

    expect(await store.loadEphemeralSessionConsent(), isFalse);
  });

  testWidgets('동의를 끄면 로컬 boolean 외 데이터를 남기지 않는다', (tester) async {
    SharedPreferences.setMockInitialValues({
      'privacy.ephemeralSessionMemory.enabled': true,
    });
    const store = SharedPreferencesMemoryConsentStore();
    await tester.pumpWidget(
      MaterialApp(
        theme: buildAppTheme(),
        home: Scaffold(
          body: SingleChildScrollView(child: MemoryConsentCard(store: store)),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('켜짐'), findsOneWidget);
    final toggle = find.byKey(const ValueKey('ephemeral-memory-consent'));
    expect(tester.widget<Switch>(toggle).value, isTrue);

    await tester.tap(toggle);
    await tester.pumpAndSettle();

    expect(await store.loadEphemeralSessionConsent(), isFalse);
    expect(find.text('꺼짐 · 세션 메모리를 만들거나 보내지 않아요.'), findsOneWidget);
    final preferences = await SharedPreferences.getInstance();
    expect(preferences.getKeys(), {'privacy.ephemeralSessionMemory.enabled'});
    expect(
      preferences.getBool('privacy.ephemeralSessionMemory.enabled'),
      isFalse,
    );
  });
}
