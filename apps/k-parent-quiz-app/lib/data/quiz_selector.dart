/// 문항 선별 로직 — 기기에서 하는 일은 이것뿐이다.
///
/// 은행에서 subject+gradeBand로 거르고, 날짜 기반 seed로 셔플해
/// count개를 뽑는다. 재도전 시 attempt를 seed에 가산해 순서가 바뀐다.
/// 문항 생성은 빌드타임(packages/k-parent-quiz-core)의 몫이다.
library;

import '../models/models.dart';

/// 플랫폼(VM/웹)과 무관하게 같은 수열을 내는 결정적 PRNG (Park-Miller LCG).
/// `dart:math`의 Random은 컴파일 타깃에 따라 수열이 달라질 수 있어 쓰지 않는다.
class SeededRandom {
  SeededRandom(int seed) : _state = _sanitize(seed);

  static const int _modulus = 2147483647; // 2^31 - 1
  static const int _multiplier = 48271;

  int _state;

  static int _sanitize(int seed) {
    final normalized = seed % _modulus;
    final positive = normalized < 0 ? normalized + _modulus : normalized;
    return positive == 0 ? 1 : positive;
  }

  /// [0, max) 범위의 다음 정수.
  int nextInt(int max) {
    _state = (_state * _multiplier) % _modulus;
    return _state % max;
  }
}

/// 날짜·과목·재도전 횟수로 안정적인 seed를 만든다.
/// 같은 날 같은 과목이면 항상 같은 문제 세트가 나온다.
int quizSeed({
  required DateTime date,
  required String subject,
  int attempt = 0,
}) {
  final dateKey = date.year * 10000 + date.month * 100 + date.day;
  // FNV-1a 32bit — String.hashCode는 플랫폼 안정성이 보장되지 않아 직접 계산.
  var hash = 0x811c9dc5;
  for (final unit in subject.codeUnits) {
    hash ^= unit;
    hash = (hash * 0x01000193) & 0xFFFFFFFF;
  }
  return (dateKey ^ hash) + attempt;
}

/// Fisher-Yates 셔플 (제자리 아님 — 새 리스트 반환).
List<T> seededShuffle<T>(List<T> items, SeededRandom random) {
  final result = List<T>.of(items);
  for (var i = result.length - 1; i > 0; i--) {
    final j = random.nextInt(i + 1);
    final swap = result[i];
    result[i] = result[j];
    result[j] = swap;
  }
  return result;
}

/// 은행에서 오늘의 문항 [count]개를 선별한다.
///
/// 1. subject+gradeBand 일치 문항을 우선 선별.
/// 2. 부족하면 같은 과목의 다른 학년군 문항으로 채운다(스텁 은행 대비).
/// 그래도 부족하면 있는 만큼만 반환한다.
List<Question> selectQuestions({
  required List<Question> bank,
  required String subject,
  required String gradeBand,
  required DateTime date,
  int count = 5,
  int attempt = 0,
}) {
  final random = SeededRandom(
    quizSeed(date: date, subject: subject, attempt: attempt),
  );

  final primary = bank
      .where(
        (question) =>
            question.standard.subject == subject &&
            question.standard.gradeBand == gradeBand,
      )
      .toList();
  final selected = seededShuffle(primary, random).take(count).toList();

  if (selected.length < count) {
    final fallback = bank
        .where(
          (question) =>
              question.standard.subject == subject &&
              question.standard.gradeBand != gradeBand,
        )
        .toList();
    selected.addAll(
      seededShuffle(fallback, random).take(count - selected.length),
    );
  }

  return selected;
}
