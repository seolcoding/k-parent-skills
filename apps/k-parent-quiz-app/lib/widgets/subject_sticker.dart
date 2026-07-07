import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// 칭찬 스티커 — 이 앱의 시그니처 모티프.
///
/// 과목별 교과서 색 원형 스티커. 살짝 기울여 도화지에 손으로 붙인
/// 느낌을 낸다. 오늘 화면 카드, 퀴즈 진행 점, 결과 스티커판이
/// 모두 이 모양을 공유한다.
class SubjectSticker extends StatelessWidget {
  const SubjectSticker({
    required this.subject,
    this.size = 56,
    this.tilted = true,
    this.checked = false,
    super.key,
  });

  final String subject;
  final double size;
  final bool tilted;

  /// true면 글자 대신 체크 표시(결과 스티커판용).
  final bool checked;

  @override
  Widget build(BuildContext context) {
    final colors = SubjectColors.of(subject);
    final char = subject.isEmpty ? '?' : subject.characters.first;

    final sticker = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: colors.background,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: size * 0.055),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.10),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: checked
          ? Icon(
              Icons.check_rounded,
              color: colors.foreground,
              size: size * 0.55,
            )
          : Text(
              char,
              style: TextStyle(
                fontFamily: AppType.display,
                fontFamilyFallback: AppType.fallback,
                fontSize: size * 0.42,
                color: colors.foreground,
                height: 1,
              ),
            ),
    );

    return Semantics(
      label: '$subject 스티커',
      child: tilted
          ? Transform.rotate(angle: -4 * math.pi / 180, child: sticker)
          : sticker,
    );
  }
}

/// 아직 붙이지 않은 스티커 자리 (결과 스티커판·퀴즈 진행용).
class EmptyStickerSlot extends StatelessWidget {
  const EmptyStickerSlot({this.size = 56, this.active = false, super.key});

  final double size;

  /// true면 지금 풀고 있는 자리 — 금잔화 테두리.
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: active ? AppColors.marigoldSoft : AppColors.paper,
        shape: BoxShape.circle,
        border: Border.all(
          color: active ? AppColors.marigold : AppColors.line,
          width: active ? 2.5 : 2,
        ),
      ),
    );
  }
}
