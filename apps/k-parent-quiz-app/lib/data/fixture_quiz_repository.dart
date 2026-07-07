/// 오프라인 데모 저장소 — 번들 fixture(NEIS 시간표 미러) + 문항 은행.
///
/// fixture-first 원칙: 이 경로는 네트워크 없이 항상 동작해야 한다.
library;

import 'dart:convert';

import '../models/models.dart';
import 'quiz_repository.dart';

class FixtureQuizRepository with QuizBuilding implements QuizRepository {
  FixtureQuizRepository({
    AssetTextLoader loader = rootBundleTextLoader,
    QuizBank? quizBank,
  }) : _loader = loader,
       bank = quizBank ?? QuizBank(loader: loader);

  static const String timetableAssetPath = 'assets/fixtures/timetable.json';

  final AssetTextLoader _loader;

  @override
  final QuizBank bank;

  List<_TimetableRow>? _rowsCache;

  Future<List<_TimetableRow>> _loadRows() async {
    final cached = _rowsCache;
    if (cached != null) {
      return cached;
    }
    final raw = await _loader(timetableAssetPath);
    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    final sections = decoded['elsTimetable'] as List<dynamic>;
    final rows = <_TimetableRow>[];
    for (final section in sections) {
      final rowList = (section as Map<String, dynamic>)['row'];
      if (rowList is List) {
        for (final row in rowList) {
          rows.add(_TimetableRow.fromJson(row as Map<String, dynamic>));
        }
      }
    }
    _rowsCache = rows;
    return rows;
  }

  @override
  Future<List<SchoolInfo>> searchSchools(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      return const [];
    }
    final rows = await _loadRows();
    final seen = <String>{};
    final schools = <SchoolInfo>[];
    for (final row in rows) {
      if (!row.schoolName.contains(trimmed)) {
        continue;
      }
      if (seen.add(row.schoolCode)) {
        schools.add(
          SchoolInfo(
            officeCode: row.officeCode,
            schoolCode: row.schoolCode,
            name: row.schoolName,
          ),
        );
      }
    }
    return schools;
  }

  @override
  Future<TodayLesson> fetchToday(ChildProfile profile, DateTime date) async {
    if (date.weekday == DateTime.saturday || date.weekday == DateTime.sunday) {
      return TodayLesson(
        date: date,
        subjects: const [],
        dayOffNote: '오늘은 학교에 가지 않는 날이에요. 푹 쉬어요!',
      );
    }

    final rows = await _loadRows();
    // 데모 fixture는 특정 날짜(20260501, 1학년 2반)만 담고 있다.
    // 학년·반이 일치하는 행을 우선 쓰고, 없으면 전체 행으로 데모를 이어간다.
    var matched = rows
        .where(
          (row) =>
              row.grade == '${profile.grade}' && row.classNm == profile.classNm,
        )
        .toList();
    if (matched.isEmpty) {
      matched = rows;
    }

    final periodsBySubject = <String, List<int>>{};
    for (final row in matched) {
      periodsBySubject.putIfAbsent(row.subject, () => []).add(row.period);
    }
    final subjects =
        periodsBySubject.entries
            .map(
              (entry) =>
                  LessonSubject(name: entry.key, periods: entry.value..sort()),
            )
            .toList()
          ..sort((a, b) => a.periods.first.compareTo(b.periods.first));

    return TodayLesson(date: date, subjects: subjects);
  }

  @override
  Future<QuizSet> buildQuiz({
    required String subject,
    required int grade,
    required DateTime date,
    int count = 5,
    int attempt = 0,
  }) {
    return buildQuizFromBank(
      subject: subject,
      grade: grade,
      date: date,
      count: count,
      attempt: attempt,
    );
  }
}

class _TimetableRow {
  const _TimetableRow({
    required this.officeCode,
    required this.schoolCode,
    required this.schoolName,
    required this.grade,
    required this.classNm,
    required this.period,
    required this.subject,
  });

  factory _TimetableRow.fromJson(Map<String, dynamic> json) {
    return _TimetableRow(
      officeCode: json['ATPT_OFCDC_SC_CODE'] as String,
      schoolCode: json['SD_SCHUL_CODE'] as String,
      schoolName: json['SCHUL_NM'] as String,
      grade: json['GRADE'] as String,
      classNm: json['CLASS_NM'] as String,
      period: int.parse(json['PERIO'] as String),
      subject: json['ITRT_CNTNT'] as String,
    );
  }

  final String officeCode;
  final String schoolCode;
  final String schoolName;
  final String grade;
  final String classNm;
  final int period;
  final String subject;
}
