/// k-parent-proxy 연동 저장소.
///
/// 호출 표면은 `GET {base}/v1/neis/school-search|classes|timetable|schedule`
/// 뿐이다. 다른 도메인 호출 금지, 클라이언트 API 키 없음(키는 proxy 서버 소관).
/// base는 [defaultBaseUrl] 상수이며 `--dart-define=PROXY_BASE_URL=...`로
/// 오버라이드한다. 문항 은행은 proxy 모드에서도 번들 에셋을 쓴다.
library;

import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/models.dart';
import 'quiz_repository.dart';

class ProxyQuizRepository with QuizBuilding implements QuizRepository {
  ProxyQuizRepository({
    String? baseUrl,
    http.Client? client,
    QuizBank? quizBank,
    this.defaultEducationOffice = 'B10',
  }) : baseUrl = _normalizeBase(baseUrl ?? configuredBaseUrl),
       _client = client ?? http.Client(),
       bank = quizBank ?? QuizBank();

  /// 로컬 proxy 기본 주소 (docs/features/k-parent-proxy.md 참고).
  static const String defaultBaseUrl = 'http://127.0.0.1:4020';

  /// `--dart-define=PROXY_BASE_URL=...` 오버라이드 반영값.
  static const String configuredBaseUrl = String.fromEnvironment(
    'PROXY_BASE_URL',
    defaultValue: defaultBaseUrl,
  );

  final String baseUrl;

  /// 학교 검색에 필수인 교육청 코드. MVP는 서울(B10) 기본.
  final String defaultEducationOffice;

  final http.Client _client;

  @override
  final QuizBank bank;

  static String _normalizeBase(String base) {
    return base.endsWith('/') ? base.substring(0, base.length - 1) : base;
  }

  Future<dynamic> _getJson(String path, Map<String, String> query) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
    final response = await _client.get(uri);
    if (response.statusCode >= 400) {
      throw ProxyException(path: path, statusCode: response.statusCode);
    }
    return jsonDecode(utf8.decode(response.bodyBytes));
  }

  /// proxy 응답에서 행 배열을 꺼낸다. 트랙 B 라우트는 정규화된
  /// `rows` 배열을 내려주지만, 방어적으로 몇 가지 키를 함께 본다.
  static List<Map<String, dynamic>> _rowsOf(dynamic body) {
    if (body is List) {
      return body.cast<Map<String, dynamic>>();
    }
    if (body is Map<String, dynamic>) {
      for (final key in const ['rows', 'data', 'results']) {
        final value = body[key];
        if (value is List) {
          return value.cast<Map<String, dynamic>>();
        }
      }
    }
    return const [];
  }

  @override
  Future<List<SchoolInfo>> searchSchools(String query) async {
    final body = await _getJson('/v1/neis/school-search', {
      'educationOffice': defaultEducationOffice,
      'schoolName': query.trim(),
    });

    // school-search는 NEIS schoolInfo 패스스루 형태도 낼 수 있다.
    final rows = <Map<String, dynamic>>[];
    if (body is Map<String, dynamic> && body['schoolInfo'] is List) {
      final sections = body['schoolInfo'] as List<dynamic>;
      for (final section in sections) {
        final rowList = (section as Map<String, dynamic>)['row'];
        if (rowList is List) {
          rows.addAll(rowList.cast<Map<String, dynamic>>());
        }
      }
    } else {
      rows.addAll(_rowsOf(body));
    }

    return rows
        .map(
          (row) => SchoolInfo(
            officeCode:
                (row['ATPT_OFCDC_SC_CODE'] ?? row['education_office_code'])
                    as String,
            schoolCode: (row['SD_SCHUL_CODE'] ?? row['school_code']) as String,
            name: (row['SCHUL_NM'] ?? row['school_name']) as String,
          ),
        )
        .toList();
  }

  @override
  Future<TodayLesson> fetchToday(ChildProfile profile, DateTime date) async {
    final ymd =
        '${date.year}'
        '${date.month.toString().padLeft(2, '0')}'
        '${date.day.toString().padLeft(2, '0')}';

    final body = await _getJson('/v1/neis/timetable', {
      'educationOfficeCode': profile.school.officeCode,
      'schoolCode': profile.school.schoolCode,
      'date': ymd,
      'grade': '${profile.grade}',
      'classNm': profile.classNm,
    });
    final rows = _rowsOf(body);

    if (rows.isEmpty) {
      // 시간표가 비면 학사일정에서 휴업일 여부를 확인한다.
      final note = await _dayOffNote(profile, ymd);
      return TodayLesson(date: date, subjects: const [], dayOffNote: note);
    }

    final periodsBySubject = <String, List<int>>{};
    for (final row in rows) {
      final subject = row['subject'] as String? ?? '';
      if (subject.isEmpty) {
        continue;
      }
      final period = int.tryParse('${row['period']}') ?? 0;
      periodsBySubject.putIfAbsent(subject, () => []).add(period);
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

  Future<String?> _dayOffNote(ChildProfile profile, String ymd) async {
    try {
      final body = await _getJson('/v1/neis/schedule', {
        'educationOfficeCode': profile.school.officeCode,
        'schoolCode': profile.school.schoolCode,
        'from': ymd,
      });
      for (final row in _rowsOf(body)) {
        if (row['day_off'] == true) {
          final event = row['event_name'] as String? ?? '휴업일';
          return '오늘은 $event이에요. 푹 쉬어요!';
        }
      }
    } on Exception {
      // 학사일정 조회 실패는 치명적이지 않다 — 일반 안내로 대신한다.
    }
    return '오늘 시간표가 아직 올라오지 않았어요. 조금 뒤에 다시 볼까요?';
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

class ProxyException implements Exception {
  const ProxyException({required this.path, required this.statusCode});

  final String path;
  final int statusCode;

  @override
  String toString() => 'ProxyException($path -> HTTP $statusCode)';
}
