/// Transport-free HITL action create/decision contract.
///
/// The app keeps action requests in memory only. In particular, approval scope,
/// raw dialogue, credentials, and child-identifying data must never be written
/// to SharedPreferences.
library;

enum ActionRisk {
  low('low'),
  medium('medium'),
  high('high'),
  critical('critical');

  const ActionRisk(this.wire);

  final String wire;

  static ActionRisk fromWire(String value) {
    return ActionRisk.values.firstWhere(
      (risk) => risk.wire == value,
      orElse: () => throw FormatException('알 수 없는 작업 위험도: $value'),
    );
  }
}

enum ActionStatus {
  proposed('proposed'),
  awaitingApproval('awaiting_approval'),
  approved('approved'),
  rejected('rejected'),
  expired('expired'),
  executed('executed');

  const ActionStatus(this.wire);

  final String wire;

  static ActionStatus fromWire(String value) {
    return ActionStatus.values.firstWhere(
      (status) => status.wire == value,
      orElse: () => throw FormatException('알 수 없는 작업 상태: $value'),
    );
  }
}

enum ActionDecision {
  approved('approved'),
  rejected('rejected');

  const ActionDecision(this.wire);

  final String wire;
}

class ActionProposal {
  const ActionProposal({
    required this.type,
    required this.label,
    required this.scope,
    required this.scopeSummary,
    this.officialSite,
    this.requestedBy = 'quiz-app',
  });

  final String type;
  final String label;

  /// Safe, minimal approval scope. Kept only for the lifetime of the UI flow.
  final Map<String, Object?> scope;

  /// Parent-facing description of exactly what [scope] covers.
  /// This is UI copy and is never sent to or persisted by the API client.
  final List<String> scopeSummary;
  final Uri? officialSite;
  final String requestedBy;

  void validate() {
    assertSafeActionScope(scope);
    final site = officialSite;
    if (site != null && site.scheme != 'https') {
      throw const FormatException('공식 사이트 인계에는 HTTPS 주소가 필요해요.');
    }
  }

  Map<String, Object?> toJson() {
    validate();
    return {
      'type': type,
      'label': label,
      'scope': scope,
      if (officialSite != null) 'officialUrl': officialSite.toString(),
      'requestedBy': requestedBy,
    };
  }
}

class ActionDecisionInput {
  const ActionDecisionInput({
    required this.decision,
    this.actor = 'parent-session',
    this.reason,
    this.constraints = const [],
  });

  final ActionDecision decision;
  final String actor;
  final String? reason;
  final List<String> constraints;

  Map<String, Object?> toJson() {
    return {
      'decision': decision.wire,
      'actor': actor,
      if (reason != null) 'reason': reason,
      if (constraints.isNotEmpty) 'constraints': constraints,
    };
  }
}

class ActionApprovalRecord {
  const ActionApprovalRecord({
    required this.decision,
    required this.actor,
    required this.decidedAt,
    required this.expiresAt,
    required this.constraints,
    this.reason,
  });

  factory ActionApprovalRecord.fromJson(Map<String, dynamic> json) {
    final rawConstraints = json['constraints'];
    return ActionApprovalRecord(
      decision: _requiredString(json, 'decision'),
      actor: _requiredString(json, 'actor'),
      decidedAt: DateTime.parse(_requiredString(json, 'decidedAt')),
      expiresAt: _optionalDateTime(json['expiresAt']),
      constraints: rawConstraints is List<dynamic>
          ? rawConstraints.map((value) => value.toString()).toList()
          : const [],
      reason: json['reason'] as String?,
    );
  }

  final String decision;
  final String actor;
  final DateTime decidedAt;
  final DateTime? expiresAt;
  final List<String> constraints;
  final String? reason;
}

class ActionRequest {
  const ActionRequest({
    required this.id,
    required this.type,
    required this.label,
    required this.status,
    required this.risk,
    required this.requiresApproval,
    required this.requiresOfficialSiteHandoff,
    required this.oneTimeApproval,
    required this.scope,
    required this.officialSite,
    required this.createdAt,
    required this.approval,
  });

  factory ActionRequest.fromJson(Map<String, dynamic> json) {
    final rawScope = json['scope'];
    if (rawScope is! Map<String, dynamic>) {
      throw const FormatException('작업 승인 범위가 올바르지 않아요.');
    }
    final scope = Map<String, Object?>.from(rawScope);
    assertSafeActionScope(scope);
    final rawApproval = json['approval'];
    return ActionRequest(
      id: _requiredString(json, 'id'),
      type: _requiredString(json, 'type'),
      label: _requiredString(json, 'label'),
      status: ActionStatus.fromWire(_requiredString(json, 'status')),
      risk: ActionRisk.fromWire(_requiredString(json, 'risk')),
      requiresApproval: _requiredBool(json, 'requiresApproval'),
      requiresOfficialSiteHandoff: _requiredBool(
        json,
        'requiresOfficialSiteHandoff',
      ),
      oneTimeApproval: _requiredBool(json, 'oneTimeApproval'),
      scope: scope,
      officialSite: _optionalUri(json['officialUrl']),
      createdAt: DateTime.parse(_requiredString(json, 'createdAt')),
      approval: rawApproval is Map<String, dynamic>
          ? ActionApprovalRecord.fromJson(rawApproval)
          : null,
    );
  }

  final String id;
  final String type;
  final String label;
  final ActionStatus status;
  final ActionRisk risk;
  final bool requiresApproval;
  final bool requiresOfficialSiteHandoff;
  final bool oneTimeApproval;

  /// Never persisted by this app; retained only while confirmation is visible.
  final Map<String, Object?> scope;
  final Uri? officialSite;
  final DateTime createdAt;
  final ActionApprovalRecord? approval;
}

const Set<String> _forbiddenScopeKeys = {
  'password',
  'secret',
  'token',
  'cookie',
  'authorization',
  'apikey',
  'clientsecret',
  'accesstoken',
  'refreshtoken',
  'residentregistrationnumber',
  'rrn',
  'birthdate',
  'childname',
  'certificatepassword',
  'paymentpassword',
  'dialogue',
  'rawdialogue',
  'conversation',
  'conversationtext',
};

/// Mirrors the server's forbidden approval-scope boundary and additionally
/// rejects raw dialogue fields before any network call is made.
void assertSafeActionScope(Object? value, [String path = 'scope']) {
  if (value == null || value is String || value is num || value is bool) {
    return;
  }
  if (value is List<Object?>) {
    for (var index = 0; index < value.length; index++) {
      assertSafeActionScope(value[index], '$path[$index]');
    }
    return;
  }
  if (value is Map<String, Object?>) {
    for (final entry in value.entries) {
      final normalizedKey = entry.key.toLowerCase().replaceAll(
        RegExp('[^a-z0-9]'),
        '',
      );
      if (_forbiddenScopeKeys.contains(normalizedKey)) {
        throw FormatException('$path.${entry.key}는 승인 범위에 담을 수 없어요.');
      }
      assertSafeActionScope(entry.value, '$path.${entry.key}');
    }
    return;
  }
  throw FormatException('$path에 지원하지 않는 값이 있어요.');
}

String _requiredString(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is! String || value.isEmpty) {
    throw FormatException('$key 값이 없거나 올바르지 않아요.');
  }
  return value;
}

bool _requiredBool(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is! bool) {
    throw FormatException('$key 값이 없거나 올바르지 않아요.');
  }
  return value;
}

DateTime? _optionalDateTime(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is! String) {
    throw const FormatException('날짜 값이 올바르지 않아요.');
  }
  return DateTime.parse(value);
}

Uri? _optionalUri(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is! String) {
    throw const FormatException('공식 사이트 주소가 올바르지 않아요.');
  }
  return Uri.parse(value);
}
