import '../models/action_approval.dart';

typedef HitlCreateFixture = ActionRequest Function(ActionProposal proposal);
typedef HitlDecisionFixture =
    ActionRequest Function(ActionRequest request, ActionDecisionInput input);

/// Transport-free HITL boundary for action creation and human decisions.
///
/// Runtime composition may later adapt this gateway through the allowed
/// k-parent-proxy path. This app layer deliberately has no HTTP transport and
/// exposes no execute operation.
abstract interface class HitlApprovalGateway {
  Future<ActionRequest> createAction(ActionProposal proposal);

  Future<ActionRequest> decideAction(
    ActionRequest request,
    ActionDecisionInput input,
  );
}

/// Fixture-only gateway for offline UI previews and deterministic tests.
///
/// Risk, approval requirements, handoff requirements, and expiry all come from
/// injected typed fixtures. This class deliberately owns no policy table; the
/// canonical HITL policy remains outside the Experience layer.
class OfflineFixtureHitlApprovalGateway implements HitlApprovalGateway {
  OfflineFixtureHitlApprovalGateway({
    required this.createFixture,
    required this.decisionFixture,
  });

  final HitlCreateFixture createFixture;
  final HitlDecisionFixture decisionFixture;
  final Set<String> _decidedActionIds = <String>{};

  @override
  Future<ActionRequest> createAction(ActionProposal proposal) async {
    proposal.validate();
    final request = createFixture(proposal);
    if (!_matchesProposal(request, proposal)) {
      throw StateError('fixture의 작업명, 범위 또는 공식 사이트가 제안과 달라요.');
    }
    return request;
  }

  @override
  Future<ActionRequest> decideAction(
    ActionRequest request,
    ActionDecisionInput input,
  ) async {
    if (request.status != ActionStatus.awaitingApproval ||
        !request.requiresApproval) {
      throw StateError('승인을 기다리는 작업만 결정할 수 있어요.');
    }
    if (input.actor.isEmpty) {
      throw StateError('승인 주체가 필요해요.');
    }
    if (_decidedActionIds.contains(request.id)) {
      throw StateError('이미 결정한 작업이에요.');
    }

    final decided = decisionFixture(request, input);
    final expectedStatus = input.decision == ActionDecision.approved
        ? ActionStatus.approved
        : ActionStatus.rejected;
    if (decided.id != request.id ||
        decided.status != expectedStatus ||
        decided.approval?.decision != input.decision.wire ||
        !_sameRequestBoundary(request, decided)) {
      throw StateError('fixture가 승인 결정 또는 범위를 다르게 만들었어요.');
    }
    _decidedActionIds.add(request.id);
    return decided;
  }
}

bool _matchesProposal(ActionRequest request, ActionProposal proposal) {
  return request.type == proposal.type &&
      request.label == proposal.label &&
      request.officialSite == proposal.officialSite &&
      _sameJsonValue(request.scope, proposal.scope);
}

bool _sameRequestBoundary(ActionRequest before, ActionRequest after) {
  return before.type == after.type &&
      before.label == after.label &&
      before.risk == after.risk &&
      before.requiresApproval == after.requiresApproval &&
      before.requiresOfficialSiteHandoff == after.requiresOfficialSiteHandoff &&
      before.oneTimeApproval == after.oneTimeApproval &&
      before.officialSite == after.officialSite &&
      _sameJsonValue(before.scope, after.scope);
}

bool _sameJsonValue(Object? left, Object? right) {
  if (left is List<Object?> && right is List<Object?>) {
    if (left.length != right.length) {
      return false;
    }
    for (var index = 0; index < left.length; index++) {
      if (!_sameJsonValue(left[index], right[index])) {
        return false;
      }
    }
    return true;
  }
  if (left is Map<String, Object?> && right is Map<String, Object?>) {
    if (left.length != right.length || !left.keys.every(right.containsKey)) {
      return false;
    }
    return left.entries.every(
      (entry) => _sameJsonValue(entry.value, right[entry.key]),
    );
  }
  return left == right;
}
