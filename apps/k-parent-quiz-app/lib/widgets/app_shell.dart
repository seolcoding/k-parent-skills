import 'package:flutter/material.dart';

/// 모든 화면 공통 셸 — 넓은 화면에서도 폰 폭(520)으로 가운데 정렬.
class AppShell extends StatelessWidget {
  const AppShell({required this.child, this.padding, super.key});

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Padding(
            padding: padding ?? const EdgeInsets.symmetric(horizontal: 20),
            child: child,
          ),
        ),
      ),
    );
  }
}
