import 'package:flutter_test/flutter_test.dart';
import 'package:k_parent_quiz_app/data/hitl_approval_gateway.dart';
import 'package:k_parent_quiz_app/models/action_approval.dart';

void main() {
  test('offline gateway는 주입된 typed fixture로 create/decision만 처리한다', () async {
    final gateway = _fixtureGateway();
    final proposal = ActionProposal(
      type: 'application',
      label: '돌봄 신청',
      scope: const {
        'target': 'official-service',
        'fields': ['region'],
      },
      scopeSummary: const ['서울 지역', '돌봄 서비스 코드'],
      officialSite: Uri.parse('https://www.gov.kr/'),
    );

    final created = await gateway.createAction(proposal);
    final decided = await gateway.decideAction(
      created,
      const ActionDecisionInput(decision: ActionDecision.approved),
    );

    expect(created.id, 'fixture-action-1');
    expect(created.status, ActionStatus.awaitingApproval);
    expect(created.risk, ActionRisk.high);
    expect(created.requiresOfficialSiteHandoff, isTrue);
    expect(decided.status, ActionStatus.approved);
    expect(decided.approval?.expiresAt, DateTime.utc(2026, 8, 1, 0, 15));
  });

  test('offline fixture gateway는 같은 요청의 결정을 한 번만 허용한다', () async {
    final gateway = _fixtureGateway();
    final created = await gateway.createAction(
      ActionProposal(
        type: 'application',
        label: '돌봄 신청',
        scope: const {'target': 'official-service'},
        scopeSummary: const ['돌봄 서비스'],
        officialSite: Uri.parse('https://www.gov.kr/'),
      ),
    );

    await gateway.decideAction(
      created,
      const ActionDecisionInput(decision: ActionDecision.rejected),
    );
    await expectLater(
      gateway.decideAction(
        created,
        const ActionDecisionInput(decision: ActionDecision.approved),
      ),
      throwsStateError,
    );
  });

  test('민감한 승인 범위는 fixture 생성 전에 거부한다', () async {
    var fixtureCalled = false;
    final gateway = OfflineFixtureHitlApprovalGateway(
      createFixture: (proposal) {
        fixtureCalled = true;
        return _createdFixture(proposal);
      },
      decisionFixture: _decisionFixture,
    );

    await expectLater(
      gateway.createAction(
        const ActionProposal(
          type: 'login',
          label: '로그인',
          scope: {'accessToken': 'never-store'},
          scopeSummary: ['공식 사이트 로그인'],
        ),
      ),
      throwsA(isA<FormatException>()),
    );
    expect(fixtureCalled, isFalse);
  });

  test('fixture가 승인 범위를 바꾸면 결정을 거부한다', () async {
    final gateway = OfflineFixtureHitlApprovalGateway(
      createFixture: _createdFixture,
      decisionFixture: (request, input) => ActionRequest(
        id: request.id,
        type: request.type,
        label: request.label,
        status: ActionStatus.approved,
        risk: request.risk,
        requiresApproval: request.requiresApproval,
        requiresOfficialSiteHandoff: request.requiresOfficialSiteHandoff,
        oneTimeApproval: request.oneTimeApproval,
        scope: const {'target': 'changed'},
        officialSite: request.officialSite,
        createdAt: request.createdAt,
        approval: ActionApprovalRecord(
          decision: input.decision.wire,
          actor: input.actor,
          decidedAt: DateTime.utc(2026, 8, 1),
          expiresAt: DateTime.utc(2026, 8, 1, 0, 15),
          constraints: const [],
        ),
      ),
    );
    final proposal = ActionProposal(
      type: 'application',
      label: '돌봄 신청',
      scope: const {'target': 'official-service'},
      scopeSummary: const ['돌봄 서비스'],
      officialSite: Uri.parse('https://www.gov.kr/'),
    );
    final created = await gateway.createAction(proposal);

    await expectLater(
      gateway.decideAction(
        created,
        const ActionDecisionInput(decision: ActionDecision.approved),
      ),
      throwsStateError,
    );
  });
}

OfflineFixtureHitlApprovalGateway _fixtureGateway() {
  return OfflineFixtureHitlApprovalGateway(
    createFixture: _createdFixture,
    decisionFixture: _decisionFixture,
  );
}

ActionRequest _createdFixture(ActionProposal proposal) {
  return ActionRequest(
    id: 'fixture-action-1',
    type: proposal.type,
    label: proposal.label,
    status: ActionStatus.awaitingApproval,
    risk: ActionRisk.high,
    requiresApproval: true,
    requiresOfficialSiteHandoff: true,
    oneTimeApproval: true,
    scope: proposal.scope,
    officialSite: proposal.officialSite,
    createdAt: DateTime.utc(2026, 8, 1),
    approval: null,
  );
}

ActionRequest _decisionFixture(
  ActionRequest request,
  ActionDecisionInput input,
) {
  final approved = input.decision == ActionDecision.approved;
  return ActionRequest(
    id: request.id,
    type: request.type,
    label: request.label,
    status: approved ? ActionStatus.approved : ActionStatus.rejected,
    risk: request.risk,
    requiresApproval: request.requiresApproval,
    requiresOfficialSiteHandoff: request.requiresOfficialSiteHandoff,
    oneTimeApproval: request.oneTimeApproval,
    scope: request.scope,
    officialSite: request.officialSite,
    createdAt: request.createdAt,
    approval: ActionApprovalRecord(
      decision: input.decision.wire,
      actor: input.actor,
      decidedAt: DateTime.utc(2026, 8, 1),
      expiresAt: approved ? DateTime.utc(2026, 8, 1, 0, 15) : null,
      constraints: input.constraints,
      reason: input.reason,
    ),
  );
}
