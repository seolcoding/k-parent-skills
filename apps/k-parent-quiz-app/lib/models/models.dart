/// 데이터 모델 — packages/k-parent-quiz-core 의 Question 스키마를 따른다.
/// 문항 생성 로직은 절대 이 앱에 두지 않는다. 기기에서는 선별만 한다.
library;

/// 성취기준 (2022 개정 교육과정).
class AchievementStandard {
  const AchievementStandard({
    required this.code,
    required this.subject,
    required this.gradeBand,
    required this.domain,
  });

  factory AchievementStandard.fromJson(Map<String, dynamic> json) {
    return AchievementStandard(
      code: json['code'] as String,
      subject: json['subject'] as String,
      gradeBand: json['gradeBand'] as String,
      domain: json['domain'] as String,
    );
  }

  final String code;
  final String subject;
  final String gradeBand;
  final String domain;
}

enum QuestionType {
  ox('ox'),
  choice3('choice3'),
  blank('blank');

  const QuestionType(this.wire);

  final String wire;

  static QuestionType fromWire(String value) {
    return QuestionType.values.firstWhere(
      (type) => type.wire == value,
      orElse: () => throw FormatException('알 수 없는 문항 유형: $value'),
    );
  }
}

/// 문항. 은행(assets/data/quiz_bank.json)에서 읽기만 한다.
class Question {
  const Question({
    required this.id,
    required this.type,
    required this.standard,
    required this.prompt,
    required this.choices,
    required this.answer,
    required this.explanation,
    required this.difficulty,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    final rawChoices = json['choices'];
    return Question(
      id: json['id'] as String,
      type: QuestionType.fromWire(json['type'] as String),
      standard: AchievementStandard.fromJson(
        json['standard'] as Map<String, dynamic>,
      ),
      prompt: json['prompt'] as String,
      choices: rawChoices == null
          ? null
          : (rawChoices as List<dynamic>).cast<String>(),
      answer: json['answer'] as String,
      explanation: json['explanation'] as String,
      difficulty: json['difficulty'] as String,
    );
  }

  final String id;
  final QuestionType type;
  final AchievementStandard standard;
  final String prompt;
  final List<String>? choices;
  final String answer;
  final String explanation;
  final String difficulty;

  /// 입력이 정답인지 판정한다. 빈칸형은 공백 차이를 무시한다.
  bool isCorrect(String input) {
    return _normalize(input) == _normalize(answer);
  }

  static String _normalize(String value) {
    return value.trim().replaceAll(RegExp(r'\s+'), ' ');
  }
}

/// 하루 복습 세트 — 선별된 문항 목록.
class QuizSet {
  const QuizSet({
    required this.subject,
    required this.gradeBand,
    required this.date,
    required this.attempt,
    required this.questions,
  });

  final String subject;
  final String gradeBand;
  final DateTime date;
  final int attempt;
  final List<Question> questions;
}

/// 시간표의 한 과목 (교시 목록 포함).
class LessonSubject {
  const LessonSubject({required this.name, required this.periods});

  final String name;
  final List<int> periods;
}

/// 오늘 배운 것. [dayOffNote]가 있으면 휴업일 안내를 보여준다.
class TodayLesson {
  const TodayLesson({
    required this.date,
    required this.subjects,
    this.dayOffNote,
  });

  final DateTime date;
  final List<LessonSubject> subjects;
  final String? dayOffNote;

  bool get isDayOff => dayOffNote != null;
}

/// 학교 정보 — NEIS schoolInfo 응답에서 필요한 최소 필드만.
class SchoolInfo {
  const SchoolInfo({
    required this.officeCode,
    required this.schoolCode,
    required this.name,
  });

  final String officeCode;
  final String schoolCode;
  final String name;
}

/// 아이 프로필. 학교/학년/반까지만 담는다 — 이름 등 개인정보 금지.
class ChildProfile {
  const ChildProfile({
    required this.school,
    required this.grade,
    required this.classNm,
  });

  final SchoolInfo school;
  final int grade;
  final String classNm;

  /// 학년 → 성취기준 학년군 ("1-2" | "3-4" | "5-6").
  String get gradeBand => gradeBandOf(grade);

  static String gradeBandOf(int grade) {
    if (grade <= 2) {
      return '1-2';
    }
    if (grade <= 4) {
      return '3-4';
    }
    return '5-6';
  }
}
