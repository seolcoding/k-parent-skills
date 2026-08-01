/// 데이터 계층 계약.
///
/// 구현체는 두 가지뿐이다:
/// - [FixtureQuizRepository]: 번들 fixture + 문항 은행 (오프라인 데모, 기본값)
/// - [ProxyQuizRepository]: k-parent-proxy `/v1/neis/*` (실데이터, 키 없음)
library;

import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../models/models.dart';
import 'quiz_selector.dart';

/// 에셋 텍스트 로더 — 테스트에서 파일 기반 로더를 주입할 수 있게 분리.
typedef AssetTextLoader = Future<String> Function(String assetPath);

/// 기본 로더: 번들 에셋에서 읽는다.
Future<String> rootBundleTextLoader(String assetPath) {
  return rootBundle.loadString(assetPath);
}

abstract class QuizRepository {
  /// 학교 이름으로 학교를 찾는다.
  Future<List<SchoolInfo>> searchSchools(String query);

  /// 프로필과 날짜로 오늘 배운 과목을 가져온다.
  Future<TodayLesson> fetchToday(ChildProfile profile, DateTime date);

  /// 문항 은행에서 오늘의 복습 세트를 선별한다.
  Future<QuizSet> buildQuiz({
    required String subject,
    required int grade,
    required DateTime date,
    int count = 5,
    int attempt = 0,
  });
}

/// 문항 은행 로더 — 은행은 데이터 모드와 무관하게 항상 번들 에셋이다.
class QuizBank {
  QuizBank({this.loader = rootBundleTextLoader});

  static const String assetPath = 'assets/data/quiz_bank.json';

  final AssetTextLoader loader;
  List<Question>? _cache;

  Future<List<Question>> load() async {
    final cached = _cache;
    if (cached != null) {
      return cached;
    }
    final raw = await loader(assetPath);
    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    final questions = (decoded['questions'] as List<dynamic>)
        .map((item) => Question.fromJson(item as Map<String, dynamic>))
        .toList();
    _cache = questions;
    return questions;
  }
}

/// 은행 선별 로직은 fixture/proxy 공통이라 믹스인으로 공유한다.
mixin QuizBuilding {
  QuizBank get bank;

  Future<QuizSet> buildQuizFromBank({
    required String subject,
    required int grade,
    required DateTime date,
    int count = 5,
    int attempt = 0,
  }) async {
    final questions = await bank.load();
    final gradeBand = ChildProfile.gradeBandOf(grade);
    final selected = selectQuestions(
      bank: questions,
      subject: subject,
      gradeBand: gradeBand,
      date: date,
      count: count,
      attempt: attempt,
    );
    return QuizSet(
      subject: subject,
      gradeBand: gradeBand,
      date: date,
      attempt: attempt,
      questions: selected,
    );
  }
}
