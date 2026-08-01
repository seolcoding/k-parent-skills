import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/hitl_approval_gateway.dart';
import '../models/action_approval.dart';
import '../theme/app_theme.dart';
import 'app_shell.dart';

abstract interface class OfficialSiteLauncher {
  Future<bool> open(Uri uri);
}

class PlatformOfficialSiteLauncher implements OfficialSiteLauncher {
  const PlatformOfficialSiteLauncher();

  @override
  Future<bool> open(Uri uri) => launchUrl(uri);
}

/// Creates an approval request, shows its exact decision boundary, and records
/// approve/reject. Approval never launches a site or executes the action.
class ActionConfirmationSurface extends StatefulWidget {
  const ActionConfirmationSurface({
    required this.gateway,
    required this.proposal,
    this.officialSiteLauncher = const PlatformOfficialSiteLauncher(),
    super.key,
  });

  final HitlApprovalGateway gateway;
  final ActionProposal proposal;
  final OfficialSiteLauncher officialSiteLauncher;

  @override
  State<ActionConfirmationSurface> createState() =>
      _ActionConfirmationSurfaceState();
}

class _ActionConfirmationSurfaceState extends State<ActionConfirmationSurface> {
  ActionRequest? _request;
  bool _hasError = false;
  bool _deciding = false;
  bool _openingSite = false;

  @override
  void initState() {
    super.initState();
    _createRequest();
  }

  Future<void> _createRequest() async {
    try {
      final request = await widget.gateway.createAction(widget.proposal);
      if (!_matchesProposal(request, widget.proposal)) {
        throw const FormatException('서버 응답의 작업명, 범위 또는 공식 사이트가 달라졌어요.');
      }
      if (!mounted) {
        return;
      }
      setState(() => _request = request);
    } on Object {
      if (!mounted) {
        return;
      }
      setState(() => _hasError = true);
    }
  }

  static bool _matchesProposal(ActionRequest request, ActionProposal proposal) {
    return request.type == proposal.type &&
        request.label == proposal.label &&
        request.officialSite == proposal.officialSite &&
        _sameJsonValue(request.scope, proposal.scope);
  }

  static bool _sameJsonValue(Object? left, Object? right) {
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

  Future<void> _decide(ActionDecision decision) async {
    final request = _request;
    if (request == null ||
        request.status != ActionStatus.awaitingApproval ||
        _deciding) {
      return;
    }
    setState(() {
      _deciding = true;
      _hasError = false;
    });
    try {
      final decided = await widget.gateway.decideAction(
        request,
        ActionDecisionInput(decision: decision),
      );
      final expectedStatus = decision == ActionDecision.approved
          ? ActionStatus.approved
          : ActionStatus.rejected;
      final approval = decided.approval;
      if (decided.id != request.id ||
          decided.status != expectedStatus ||
          approval?.decision != decision.wire ||
          (decision == ActionDecision.approved &&
              approval?.expiresAt == null) ||
          !_matchesProposal(decided, widget.proposal)) {
        throw const FormatException('서버가 승인 결정 또는 범위를 다르게 기록했어요.');
      }
      if (!mounted) {
        return;
      }
      setState(() => _request = decided);
    } on Object {
      if (!mounted) {
        return;
      }
      setState(() => _hasError = true);
    } finally {
      if (mounted) {
        setState(() => _deciding = false);
      }
    }
  }

  Future<void> _openOfficialSite() async {
    final request = _request;
    final site = request?.officialSite;
    if (request == null ||
        request.status != ActionStatus.approved ||
        site == null ||
        site.scheme != 'https' ||
        _openingSite) {
      return;
    }
    setState(() => _openingSite = true);
    final opened = await widget.officialSiteLauncher.open(site);
    if (!mounted) {
      return;
    }
    setState(() => _openingSite = false);
    if (!opened) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('공식 사이트를 열지 못했어요.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final request = _request;

    return Scaffold(
      appBar: AppBar(title: const Text('작업 확인')),
      body: AppShell(
        child: ListView(
          padding: const EdgeInsets.only(top: 12, bottom: 32),
          children: [
            Text(
              '부모님이 확인해야 진행돼요',
              style: Theme.of(context).textTheme.displayMedium,
            ),
            const SizedBox(height: 8),
            Text(
              '승인과 실제 실행은 달라요. 승인해도 자동으로 처리하거나 사이트를 열지 않아요.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.inkSoft),
            ),
            const SizedBox(height: 20),
            if (request == null && !_hasError)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Center(child: CircularProgressIndicator()),
                ),
              )
            else if (request == null)
              _RequestError(onRetry: _retryCreate)
            else
              _ApprovalCard(
                request: request,
                scopeSummary: widget.proposal.scopeSummary,
                deciding: _deciding,
                openingSite: _openingSite,
                onApprove: () => _decide(ActionDecision.approved),
                onReject: () => _decide(ActionDecision.rejected),
                onOpenOfficialSite: _openOfficialSite,
              ),
            if (request != null && _hasError) ...[
              const SizedBox(height: 12),
              const _InlineError(),
            ],
          ],
        ),
      ),
    );
  }

  void _retryCreate() {
    setState(() => _hasError = false);
    _createRequest();
  }
}

class _ApprovalCard extends StatelessWidget {
  const _ApprovalCard({
    required this.request,
    required this.scopeSummary,
    required this.deciding,
    required this.openingSite,
    required this.onApprove,
    required this.onReject,
    required this.onOpenOfficialSite,
  });

  final ActionRequest request;
  final List<String> scopeSummary;
  final bool deciding;
  final bool openingSite;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  final VoidCallback onOpenOfficialSite;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final awaiting = request.status == ActionStatus.awaitingApproval;
    final approved = request.status == ActionStatus.approved;
    final officialSite = request.officialSite;
    final canOpenOfficialSite =
        approved && officialSite != null && officialSite.scheme == 'https';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(request.label, style: textTheme.titleLarge),
                ),
                const SizedBox(width: 8),
                _RiskBadge(risk: request.risk),
              ],
            ),
            const SizedBox(height: 18),
            _DetailSection(
              icon: Icons.fact_check_outlined,
              title: '승인 범위',
              child: scopeSummary.isEmpty
                  ? const Text('표시할 수 있는 안전한 범위가 없어요.')
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        for (final item in scopeSummary)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 5),
                            child: Text('• $item'),
                          ),
                      ],
                    ),
            ),
            const SizedBox(height: 16),
            _DetailSection(
              icon: Icons.schedule_outlined,
              title: '승인 만료',
              child: Text(_expiryLabel(request)),
            ),
            const SizedBox(height: 16),
            _DetailSection(
              icon: Icons.open_in_new_rounded,
              title: '공식 사이트 인계',
              child: request.requiresOfficialSiteHandoff
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          officialSite?.toString() ?? '공식 사이트 주소가 없어요.',
                          style: textTheme.bodyMedium?.copyWith(
                            color: AppColors.inkSoft,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          '승인 뒤에도 직접 이동 버튼을 눌러야 해요. 입력·제출·결제는 공식 사이트에서 부모님이 마무리해요.',
                        ),
                      ],
                    )
                  : const Text('이 작업은 공식 사이트 이동이 필요하지 않아요.'),
            ),
            const SizedBox(height: 20),
            _DecisionStatus(status: request.status),
            if (awaiting) ...[
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: deciding ? null : onReject,
                child: const Text('거절'),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: deciding ? null : onApprove,
                child: Text(deciding ? '기록 중…' : '이 범위로 승인'),
              ),
            ],
            if (request.requiresOfficialSiteHandoff && approved) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                key: const ValueKey('open-official-site'),
                onPressed: canOpenOfficialSite && !openingSite
                    ? onOpenOfficialSite
                    : null,
                icon: const Icon(Icons.open_in_new_rounded),
                label: Text(openingSite ? '여는 중…' : '공식 사이트로 이동'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  static String _expiryLabel(ActionRequest request) {
    if (request.status == ActionStatus.rejected) {
      return '거절된 요청에는 승인이 남지 않아요.';
    }
    final expiry = request.approval?.expiresAt?.toLocal();
    if (expiry == null) {
      return '승인 후 서버 정책에 따라 만료 시각이 정해져요.';
    }
    final hour = expiry.hour.toString().padLeft(2, '0');
    final minute = expiry.minute.toString().padLeft(2, '0');
    return '${expiry.year}. ${expiry.month}. ${expiry.day}. $hour:$minute까지 (기기 시간)';
  }
}

class _RiskBadge extends StatelessWidget {
  const _RiskBadge({required this.risk});

  final ActionRisk risk;

  @override
  Widget build(BuildContext context) {
    final (label, background, foreground) = switch (risk) {
      ActionRisk.low => ('낮음', AppColors.leafBg, AppColors.leaf),
      ActionRisk.medium => ('보통', AppColors.marigoldSoft, AppColors.ink),
      ActionRisk.high => ('높음', AppColors.coralBg, AppColors.coral),
      ActionRisk.critical => ('매우 높음', AppColors.coral, Colors.white),
    };
    return Semantics(
      label: '위험도 $label',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          '위험도 $label',
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
            color: foreground,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _DetailSection extends StatelessWidget {
  const _DetailSection({
    required this.icon,
    required this.title,
    required this.child,
  });

  final IconData icon;
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: AppColors.inkSoft),
            const SizedBox(width: 7),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
          ],
        ),
        const SizedBox(height: 7),
        child,
      ],
    );
  }
}

class _DecisionStatus extends StatelessWidget {
  const _DecisionStatus({required this.status});

  final ActionStatus status;

  @override
  Widget build(BuildContext context) {
    final (icon, label, color) = switch (status) {
      ActionStatus.awaitingApproval => (
        Icons.shield_outlined,
        '결정을 기다리고 있어요',
        AppColors.inkSoft,
      ),
      ActionStatus.approved => (
        Icons.check_circle_outline_rounded,
        '승인을 기록했어요 · 아직 실행되지 않았어요',
        AppColors.leaf,
      ),
      ActionStatus.rejected => (
        Icons.block_rounded,
        '요청을 거절했어요',
        AppColors.coral,
      ),
      ActionStatus.expired => (
        Icons.timer_off_outlined,
        '승인이 만료됐어요',
        AppColors.coral,
      ),
      ActionStatus.proposed => (
        Icons.edit_note_rounded,
        '제안된 작업이에요',
        AppColors.inkSoft,
      ),
      ActionStatus.executed => (
        Icons.done_all_rounded,
        '공식 처리 상태를 확인해 주세요',
        AppColors.leaf,
      ),
    };
    return Row(
      children: [
        Icon(icon, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: color),
          ),
        ),
      ],
    );
  }
}

class _RequestError extends StatelessWidget {
  const _RequestError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Text('승인 요청을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('다시 시도')),
          ],
        ),
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError();

  @override
  Widget build(BuildContext context) {
    return Text(
      '결정을 기록하지 못했어요. 내용을 다시 확인하고 재시도해 주세요.',
      style: Theme.of(
        context,
      ).textTheme.bodyMedium?.copyWith(color: AppColors.coral),
    );
  }
}
