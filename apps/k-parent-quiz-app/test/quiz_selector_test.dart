import 'package:flutter_test/flutter_test.dart';
import 'package:k_parent_quiz_app/data/quiz_selector.dart';
import 'package:k_parent_quiz_app/models/models.dart';

Question makeQuestion(String id, {String subject = '수학', String band = '3-4'}) {
  return Question(
    id: id,
    type: QuestionType.ox,
    standard: AchievementStandard(
      code: 'T-$id',
      subject: subject,
      gradeBand: band,
      domain: '테스트',
    ),
    prompt: '테스트 문항 $id',
    choices: null,
    answer: 'O',
    explanation: '테스트 해설',
    difficulty: 'easy',
  );
}

void main() {
  final date = DateTime(2026, 7, 7);

  group('SeededRandom', () {
    test('같은 seed면 항상 같은 수열을 낸다 (플랫폼 무관 LCG)', () {
      final a = SeededRandom(1234);
      final b = SeededRandom(1234);
      final seqA = List.generate(10, (_) => a.nextInt(100));
      final seqB = List.generate(10, (_) => b.nextInt(100));
      expect(seqA, seqB);
    });

    test('값은 [0, max) 범위를 지킨다', () {
      final random = SeededRandom(42);
      for (var i = 0; i < 1000; i++) {
        final value = random.nextInt(7);
        expect(value, inInclusiveRange(0, 6));
      }
    });

    test('seed 0이나 음수도 안전하다', () {
      expect(() => SeededRandom(0).nextInt(5), returnsNormally);
      expect(() => SeededRandom(-99).nextInt(5), returnsNormally);
    });
  });

  group('quizSeed', () {
    test('재도전(attempt)은 seed에 가산된다', () {
      final base = quizSeed(date: date, subject: '수학');
      final retry = quizSeed(date: date, subject: '수학', attempt: 1);
      expect(retry, base + 1);
    });

    test('과목이 다르면 seed도 다르다', () {
      expect(
        quizSeed(date: date, subject: '수학'),
        isNot(quizSeed(date: date, subject: '국어')),
      );
    });

    test('날짜가 다르면 seed도 다르다', () {
      expect(
        quizSeed(date: date, subject: '수학'),
        isNot(quizSeed(date: DateTime(2026, 7, 8), subject: '수학')),
      );
    });
  });

  group('selectQuestions', () {
    final bank = [
      for (var i = 0; i < 8; i++) makeQuestion('m34-$i'),
      for (var i = 0; i < 3; i++) makeQuestion('m12-$i', band: '1-2'),
      for (var i = 0; i < 4; i++) makeQuestion('k34-$i', subject: '국어'),
    ];

    test('subject+gradeBand 필터를 지키고 count개를 돌려준다', () {
      final selected = selectQuestions(
        bank: bank,
        subject: '수학',
        gradeBand: '3-4',
        date: date,
      );
      expect(selected, hasLength(5));
      for (final question in selected) {
        expect(question.standard.subject, '수학');
        expect(question.standard.gradeBand, '3-4');
      }
    });

    test('같은 날짜·과목·attempt면 항상 같은 세트(결정적)', () {
      List<String> pick() => selectQuestions(
        bank: bank,
        subject: '수학',
        gradeBand: '3-4',
        date: date,
      ).map((question) => question.id).toList();
      expect(pick(), pick());
    });

    test('attempt가 다르면 세트(순서)가 바뀐다', () {
      List<String> pick(int attempt) => selectQuestions(
        bank: bank,
        subject: '수학',
        gradeBand: '3-4',
        date: date,
        attempt: attempt,
      ).map((question) => question.id).toList();
      expect(pick(0), isNot(pick(1)));
    });

    test('날짜가 다르면 세트(순서)가 바뀐다', () {
      List<String> pick(DateTime when) => selectQuestions(
        bank: bank,
        subject: '수학',
        gradeBand: '3-4',
        date: when,
      ).map((question) => question.id).toList();
      expect(pick(date), isNot(pick(DateTime(2026, 7, 8))));
    });

    test('학년군 문항이 부족하면 같은 과목 다른 학년군으로 채운다', () {
      final selected = selectQuestions(
        bank: bank,
        subject: '수학',
        gradeBand: '1-2',
        date: date,
      );
      expect(selected, hasLength(5));
      final primary = selected.take(3);
      for (final question in primary) {
        expect(question.standard.gradeBand, '1-2');
      }
      for (final question in selected) {
        expect(question.standard.subject, '수학');
      }
      expect(selected.map((question) => question.id).toSet(), hasLength(5));
    });

    test('다른 과목 문항은 어떤 경우에도 섞지 않는다', () {
      final selected = selectQuestions(
        bank: bank,
        subject: '국어',
        gradeBand: '3-4',
        date: date,
      );
      expect(selected, hasLength(4)); // 국어는 은행에 4문항뿐 — 있는 만큼만.
      for (final question in selected) {
        expect(question.standard.subject, '국어');
      }
    });

    test('빈 은행이면 빈 목록을 돌려준다', () {
      final selected = selectQuestions(
        bank: const [],
        subject: '수학',
        gradeBand: '3-4',
        date: date,
      );
      expect(selected, isEmpty);
    });
  });
}
