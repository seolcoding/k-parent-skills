import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:k_parent_quiz_app/data/hitl_approval_gateway.dart';
import 'package:k_parent_quiz_app/models/action_approval.dart';
import 'package:k_parent_quiz_app/theme/app_theme.dart';
import 'package:k_parent_quiz_app/widgets/action_confirmation_surface.dart';

void main() {
  testWidgets('승인해도 자동 실행·자동 공식 사이트 이동을 하지 않는다', (tester) async {
    final gateway = _FakeHitlApprovalGateway();
    final launcher = _FakeOfficialSiteLauncher();
    await tester.pumpWidget(_app(gateway: gateway, launcher: launcher));
    await tester.pumpAndSettle();

    expect(find.text('돌봄 신청'), findsOneWidget);
    expect(find.text('위험도 높음'), findsOneWidget);
    expect(find.textContaining('서울 지역 돌봄 서비스'), findsOneWidget);
    expect(find.textContaining('돌봄 서비스 코드만 사용'), findsOneWidget);
    expect(find.text('승인 만료'), findsOneWidget);
    expect(find.text('공식 사이트 인계'), findsOneWidget);
    expect(find.text('https://www.gov.kr/'), findsOneWidget);

    final approve = find.text('이 범위로 승인');
    await _scrollTo(tester, approve);
    await tester.tap(approve);
    await tester.pumpAndSettle();

    expect(gateway.decisions, [ActionDecision.approved]);
    expect(find.textContaining('아직 실행되지 않았어요'), findsOneWidget);
    expect(find.textContaining('까지 (기기 시간)'), findsOneWidget);
    expect(find.text('공식 사이트로 이동'), findsOneWidget);
    expect(launcher.opened, isEmpty);

    final handoff = find.byKey(const ValueKey('open-official-site'));
    await _scrollTo(tester, handoff);
    await tester.tap(handoff);
    await tester.pumpAndSettle();

    expect(launcher.opened, [Uri.parse('https://www.gov.kr/')]);
  });

  testWidgets('거절을 기록하고 공식 사이트로 넘기지 않는다', (tester) async {
    final gateway = _FakeHitlApprovalGateway();
    final launcher = _FakeOfficialSiteLauncher();
    await tester.pumpWidget(_app(gateway: gateway, launcher: launcher));
    await tester.pumpAndSettle();

    final reject = find.text('거절');
    await _scrollTo(tester, reject);
    await tester.tap(reject);
    await tester.pumpAndSettle();

    expect(gateway.decisions, [ActionDecision.rejected]);
    expect(find.text('요청을 거절했어요'), findsOneWidget);
    expect(find.text('거절된 요청에는 승인이 남지 않아요.'), findsOneWidget);
    expect(find.text('공식 사이트로 이동'), findsNothing);
    expect(launcher.opened, isEmpty);
  });

  testWidgets('gateway 예외의 원문을 화면에 노출하지 않는다', (tester) async {
    await tester.pumpWidget(
      _app(
        gateway: _ThrowingHitlApprovalGateway(),
        launcher: _FakeOfficialSiteLauncher(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('승인 요청을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'), findsOneWidget);
    expect(find.textContaining('secret-token'), findsNothing);
    expect(find.textContaining('childName'), findsNothing);
  });
}

Future<void> _scrollTo(WidgetTester tester, Finder target) async {
  await tester.scrollUntilVisible(
    target,
    180,
    scrollable: find.byType(Scrollable).first,
  );
  await tester.pumpAndSettle();
}

Widget _app({
  required HitlApprovalGateway gateway,
  required OfficialSiteLauncher launcher,
}) {
  return MaterialApp(
    theme: buildAppTheme(),
    home: ActionConfirmationSurface(
      gateway: gateway,
      officialSiteLauncher: launcher,
      proposal: ActionProposal(
        type: 'application',
        label: '돌봄 신청',
        scope: const {
          'target': 'official-service',
          'fields': ['region'],
        },
        scopeSummary: const ['서울 지역 돌봄 서비스', '돌봄 서비스 코드만 사용'],
        officialSite: Uri.parse('https://www.gov.kr/'),
      ),
    ),
  );
}

class _FakeHitlApprovalGateway implements HitlApprovalGateway {
  final List<ActionDecision> decisions = [];

  @override
  Future<ActionRequest> createAction(ActionProposal proposal) async {
    return _request(status: ActionStatus.awaitingApproval);
  }

  @override
  Future<ActionRequest> decideAction(
    ActionRequest request,
    ActionDecisionInput input,
  ) async {
    decisions.add(input.decision);
    return _request(
      status: input.decision == ActionDecision.approved
          ? ActionStatus.approved
          : ActionStatus.rejected,
      approval: ActionApprovalRecord(
        decision: input.decision.wire,
        actor: input.actor,
        decidedAt: DateTime.utc(2026, 8, 1),
        expiresAt: input.decision == ActionDecision.approved
            ? DateTime.utc(2026, 8, 1, 0, 15)
            : null,
        constraints: const [],
      ),
    );
  }

  ActionRequest _request({
    required ActionStatus status,
    ActionApprovalRecord? approval,
  }) {
    return ActionRequest(
      id: 'action-1',
      type: 'application',
      label: '돌봄 신청',
      status: status,
      risk: ActionRisk.high,
      requiresApproval: true,
      requiresOfficialSiteHandoff: true,
      oneTimeApproval: true,
      scope: const {
        'target': 'official-service',
        'fields': ['region'],
      },
      officialSite: Uri.parse('https://www.gov.kr/'),
      createdAt: DateTime.utc(2026, 8, 1),
      approval: approval,
    );
  }
}

class _FakeOfficialSiteLauncher implements OfficialSiteLauncher {
  final List<Uri> opened = [];

  @override
  Future<bool> open(Uri uri) async {
    opened.add(uri);
    return true;
  }
}

class _ThrowingHitlApprovalGateway implements HitlApprovalGateway {
  @override
  Future<ActionRequest> createAction(ActionProposal proposal) {
    throw Exception('accessToken=secret-token childName=never-render');
  }

  @override
  Future<ActionRequest> decideAction(
    ActionRequest request,
    ActionDecisionInput input,
  ) {
    throw UnimplementedError();
  }
}
