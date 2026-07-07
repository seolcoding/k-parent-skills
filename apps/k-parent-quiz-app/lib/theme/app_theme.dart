import 'package:flutter/material.dart';

/// 디자인 토큰 — "크레파스 문방구" 방향.
///
/// 밝은 미색 도화지 위에 크레파스 브라운 잉크, 금잔화색 CTA.
/// 시그니처는 칭찬 스티커 모티프: 과목별 교과서 색 스티커가
/// 오늘 화면 카드 → 퀴즈 진행 점 → 결과 스티커판으로 이어진다.
abstract final class AppColors {
  // 바탕
  static const Color paper = Color(0xFFFFF9EE); // 밝은 미색 도화지
  static const Color card = Color(0xFFFFFFFF);
  static const Color line = Color(0xFFEADFD2); // 헤어라인

  // 잉크 (검정 대신 크레파스 브라운)
  static const Color ink = Color(0xFF3D332C);
  static const Color inkSoft = Color(0xFF8A7A6D);

  // 행동 색
  static const Color marigold = Color(0xFFFFB017); // primary CTA
  static const Color marigoldSoft = Color(0xFFFFEDC7);

  // 피드백 색 — 오답에 빨강을 쓰지 않는다.
  static const Color leaf = Color(0xFF4C9A52); // 정답
  static const Color leafBg = Color(0xFFE4F3E1);
  static const Color coral = Color(0xFFD95B3E); // 한 번 더 볼 문제
  static const Color coralBg = Color(0xFFFCEAE2);
}

/// 과목 스티커 색 — 초등 교과서 표지 색 관습을 따른다.
class SubjectColors {
  const SubjectColors({required this.background, required this.foreground});

  final Color background;
  final Color foreground;

  static const SubjectColors _fallback = SubjectColors(
    background: Color(0xFFF0EAE2),
    foreground: Color(0xFF6B5D51),
  );

  static const Map<String, SubjectColors> _bySubject = {
    '국어': SubjectColors(
      background: Color(0xFFFFE3DC),
      foreground: Color(0xFFA23F2A),
    ),
    '수학': SubjectColors(
      background: Color(0xFFDDEEFF),
      foreground: Color(0xFF20618F),
    ),
    '과학': SubjectColors(
      background: Color(0xFFDFF2D9),
      foreground: Color(0xFF39702F),
    ),
    '사회': SubjectColors(
      background: Color(0xFFFFEEC2),
      foreground: Color(0xFF7C5A0F),
    ),
    '영어': SubjectColors(
      background: Color(0xFFEAE1FF),
      foreground: Color(0xFF5B4699),
    ),
    '도덕': SubjectColors(
      background: Color(0xFFFFE7F0),
      foreground: Color(0xFF99406A),
    ),
    '체육': SubjectColors(
      background: Color(0xFFE0F3F1),
      foreground: Color(0xFF2A7A70),
    ),
    '음악': SubjectColors(
      background: Color(0xFFFFF0D6),
      foreground: Color(0xFF9A6A1B),
    ),
    '미술': SubjectColors(
      background: Color(0xFFE8ECF9),
      foreground: Color(0xFF4A5A9E),
    ),
  };

  /// 과목명으로 스티커 색을 찾는다. "국어 활동"처럼 변형된 이름도 매칭한다.
  static SubjectColors of(String subject) {
    for (final entry in _bySubject.entries) {
      if (subject.contains(entry.key)) {
        return entry.value;
      }
    }
    return _fallback;
  }
}

/// 타이포 스케일. 표시는 주아체(그림책 제목 느낌), 본문은 고운돋움.
abstract final class AppType {
  static const String display = 'Jua';
  static const String body = 'GowunDodum';
  static const List<String> fallback = ['Apple SD Gothic Neo', 'sans-serif'];
}

ThemeData buildAppTheme() {
  const colorScheme = ColorScheme.light(
    primary: AppColors.marigold,
    onPrimary: AppColors.ink,
    secondary: AppColors.leaf,
    onSecondary: Colors.white,
    error: AppColors.coral,
    onError: Colors.white,
    surface: AppColors.card,
    onSurface: AppColors.ink,
    outline: AppColors.line,
  );

  const textTheme = TextTheme(
    // 화면 제목·결과 숫자 — 주아체
    displayMedium: TextStyle(
      fontFamily: AppType.display,
      fontFamilyFallback: AppType.fallback,
      fontSize: 32,
      height: 1.3,
      color: AppColors.ink,
    ),
    titleLarge: TextStyle(
      fontFamily: AppType.display,
      fontFamilyFallback: AppType.fallback,
      fontSize: 22,
      height: 1.35,
      color: AppColors.ink,
    ),
    titleMedium: TextStyle(
      fontFamily: AppType.display,
      fontFamilyFallback: AppType.fallback,
      fontSize: 18,
      height: 1.4,
      color: AppColors.ink,
    ),
    // 문항 텍스트 — 아이와 부모가 같이 읽는 크기
    bodyLarge: TextStyle(
      fontFamily: AppType.body,
      fontFamilyFallback: AppType.fallback,
      fontSize: 21,
      height: 1.55,
      color: AppColors.ink,
    ),
    bodyMedium: TextStyle(
      fontFamily: AppType.body,
      fontFamilyFallback: AppType.fallback,
      fontSize: 16.5,
      height: 1.55,
      color: AppColors.ink,
    ),
    labelMedium: TextStyle(
      fontFamily: AppType.body,
      fontFamilyFallback: AppType.fallback,
      fontSize: 13.5,
      height: 1.4,
      letterSpacing: 0.2,
      color: AppColors.inkSoft,
    ),
    labelLarge: TextStyle(
      fontFamily: AppType.display,
      fontFamilyFallback: AppType.fallback,
      fontSize: 18,
      color: AppColors.ink,
    ),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: AppColors.paper,
    fontFamily: AppType.body,
    fontFamilyFallback: AppType.fallback,
    textTheme: textTheme,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.paper,
      foregroundColor: AppColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: AppColors.card,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.line, width: 1.5),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.marigold,
        foregroundColor: AppColors.ink,
        disabledBackgroundColor: AppColors.line,
        disabledForegroundColor: AppColors.inkSoft,
        minimumSize: const Size.fromHeight(56),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        textStyle: const TextStyle(
          fontFamily: AppType.display,
          fontFamilyFallback: AppType.fallback,
          fontSize: 18,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.ink,
        minimumSize: const Size.fromHeight(56),
        side: const BorderSide(color: AppColors.line, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        textStyle: const TextStyle(
          fontFamily: AppType.display,
          fontFamilyFallback: AppType.fallback,
          fontSize: 18,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.inkSoft,
        textStyle: const TextStyle(
          fontFamily: AppType.body,
          fontFamilyFallback: AppType.fallback,
          fontSize: 15,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.card,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      hintStyle: const TextStyle(color: AppColors.inkSoft),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.line, width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.marigold, width: 2),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.card,
      selectedColor: AppColors.marigold,
      labelStyle: const TextStyle(
        fontFamily: AppType.display,
        fontFamilyFallback: AppType.fallback,
        fontSize: 17,
        color: AppColors.ink,
      ),
      side: const BorderSide(color: AppColors.line, width: 1.5),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      showCheckmark: false,
    ),
    dividerTheme: const DividerThemeData(
      color: AppColors.line,
      thickness: 1.5,
      space: 1.5,
    ),
  );
}
