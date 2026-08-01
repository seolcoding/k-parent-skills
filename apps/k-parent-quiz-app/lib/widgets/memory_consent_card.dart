import 'package:flutter/material.dart';

import '../data/memory_consent_store.dart';
import '../theme/app_theme.dart';

class MemoryConsentCard extends StatefulWidget {
  const MemoryConsentCard({required this.store, super.key});

  final MemoryConsentStore store;

  @override
  State<MemoryConsentCard> createState() => _MemoryConsentCardState();
}

class _MemoryConsentCardState extends State<MemoryConsentCard> {
  bool? _enabled;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final enabled = await widget.store.loadEphemeralSessionConsent();
    if (mounted) {
      setState(() => _enabled = enabled);
    }
  }

  Future<void> _setEnabled(bool enabled) async {
    final previous = _enabled ?? false;
    setState(() {
      _enabled = enabled;
      _saving = true;
    });
    try {
      await widget.store.saveEphemeralSessionConsent(enabled: enabled);
    } on Object {
      if (!mounted) {
        return;
      }
      setState(() => _enabled = previous);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('기억 동의 설정을 저장하지 못했어요.')));
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final enabled = _enabled;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.memory_rounded, color: AppColors.inkSoft),
                const SizedBox(width: 10),
                Expanded(
                  child: Text('세션 잠깐 기억하기', style: textTheme.titleMedium),
                ),
                if (enabled == null)
                  const SizedBox.square(
                    dimension: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  Switch.adaptive(
                    key: const ValueKey('ephemeral-memory-consent'),
                    value: enabled,
                    onChanged: _saving ? null : _setEnabled,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '지역·날짜·진행 단계 같은 최소 정보만 최대 30분 동안 임시로 기억하도록 허용해요.',
              style: textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Text(
              '대화 원문, 아이 정보, 로그인 정보는 저장하지 않아요. 학교·학년·반도 세션 메모리로 보내지 않아요.',
              style: textTheme.labelMedium,
            ),
            if (enabled != null) ...[
              const SizedBox(height: 12),
              Text(
                enabled
                    ? '켜짐 · 동의를 철회하면 새 세션 기억을 만들지 않아요.'
                    : '꺼짐 · 세션 메모리를 만들거나 보내지 않아요.',
                key: const ValueKey('ephemeral-memory-consent-status'),
                style: textTheme.labelMedium?.copyWith(
                  color: enabled ? AppColors.leaf : AppColors.inkSoft,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
