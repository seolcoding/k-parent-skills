import 'package:flutter_test/flutter_test.dart';
import 'package:k_parent_quiz_app/models/models.dart';

void main() {
  group('Question.fromJson', () {
    test('choice3 문항을 파싱한다', () {
      final question = Question.fromJson(const {
        'id': 'q1',
        'type': 'choice3',
        'standard': {
          'code': '4수01-04',
          'subject': '수학',
          'gradeBand': '3-4',
          'domain': '수와 연산',
        },
        'prompt': '24 × 3 은?',
        'choices': ['62', '72', '82'],
        'answer': '72',
        'explanation': '20×3+4×3',
        'difficulty': 'easy',
      });
      expect(question.type, QuestionType.choice3);
      expect(question.choices, ['62', '72', '82']);
      expect(question.standard.code, '4수01-04');
    });

    test('ox 문항은 choices가 null이다', () {
      final question = Question.fromJson(const {
        'id': 'q2',
        'type': 'ox',
        'standard': {
          'code': '2수01-03',
          'subject': '수학',
          'gradeBand': '1-2',
          'domain': '수와 연산',
        },
        'prompt': '58은 85보다 크다?',
        'choices': null,
        'answer': 'X',
        'explanation': '85가 더 커요.',
        'difficulty': 'easy',
      });
      expect(question.type, QuestionType.ox);
      expect(question.choices, isNull);
    });

    test('알 수 없는 유형은 FormatException', () {
      expect(() => QuestionType.fromWire('essay'), throwsFormatException);
    });
  });

  group('Question.isCorrect', () {
    final question = Question.fromJson(const {
      'id': 'q3',
      'type': 'blank',
      'standard': {
        'code': '4국04-04',
        'subject': '국어',
        'gradeBand': '3-4',
        'domain': '문법',
      },
      'prompt': "'밥'의 높임말은?",
      'choices': null,
      'answer': '진지',
      'explanation': '웃어른께는 진지라고 해요.',
      'difficulty': 'medium',
    });

    test('앞뒤 공백은 무시한다', () {
      expect(question.isCorrect(' 진지 '), isTrue);
    });

    test('다른 답은 오답', () {
      expect(question.isCorrect('식사'), isFalse);
    });
  });

  group('ChildProfile.gradeBandOf', () {
    test('학년 → 학년군 매핑', () {
      expect(ChildProfile.gradeBandOf(1), '1-2');
      expect(ChildProfile.gradeBandOf(2), '1-2');
      expect(ChildProfile.gradeBandOf(3), '3-4');
      expect(ChildProfile.gradeBandOf(4), '3-4');
      expect(ChildProfile.gradeBandOf(5), '5-6');
      expect(ChildProfile.gradeBandOf(6), '5-6');
    });
  });
}
