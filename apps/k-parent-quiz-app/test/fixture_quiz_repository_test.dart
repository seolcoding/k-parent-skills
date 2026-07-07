import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:k_parent_quiz_app/data/fixture_quiz_repository.dart';
import 'package:k_parent_quiz_app/models/models.dart';

/// 실제 번들 에셋 파일을 그대로 읽는 로더 (flutter test의 cwd = 패키지 루트).
Future<String> fileLoader(String assetPath) {
  return File(assetPath).readAsString();
}

ChildProfile profileOf({int grade = 1, String classNm = '2'}) {
  return ChildProfile(
    school: const SchoolInfo(
      officeCode: 'B10',
      schoolCode: '7010123',
      name: '서울미래초등학교',
    ),
    grade: grade,
    classNm: classNm,
  );
}

void main() {
  final tuesday = DateTime(2026, 7, 7);
  final saturday = DateTime(2026, 7, 11);

  FixtureQuizRepository makeRepository() {
    return FixtureQuizRepository(loader: fileLoader);
  }

  group('searchSchools', () {
    test('fixture 학교를 이름 일부로 찾는다', () async {
      final schools = await makeRepository().searchSchools('미래');
      expect(schools, hasLength(1));
      expect(schools.single.name, '서울미래초등학교');
      expect(schools.single.officeCode, 'B10');
      expect(schools.single.schoolCode, '7010123');
    });

    test('없는 이름이면 빈 목록', () async {
      final schools = await makeRepository().searchSchools('은하수');
      expect(schools, isEmpty);
    });

    test('빈 검색어는 빈 목록', () async {
      final schools = await makeRepository().searchSchools('  ');
      expect(schools, isEmpty);
    });
  });

  group('fetchToday', () {
    test('평일: fixture 시간표에서 교시 순 과목 목록', () async {
      final lesson = await makeRepository().fetchToday(profileOf(), tuesday);
      expect(lesson.isDayOff, isFalse);
      expect(lesson.subjects.map((subject) => subject.name).toList(), [
        '국어',
        '수학',
      ]);
      expect(lesson.subjects.first.periods, [1]);
      expect(lesson.subjects.last.periods, [2]);
    });

    test('학년·반이 fixture와 달라도 데모는 계속된다 (전체 행 fallback)', () async {
      final lesson = await makeRepository().fetchToday(
        profileOf(grade: 3, classNm: '1'),
        tuesday,
      );
      expect(lesson.subjects.map((subject) => subject.name), ['국어', '수학']);
    });

    test('주말은 휴업일 안내를 준다', () async {
      final lesson = await makeRepository().fetchToday(profileOf(), saturday);
      expect(lesson.isDayOff, isTrue);
      expect(lesson.subjects, isEmpty);
      expect(lesson.dayOffNote, isNotNull);
    });
  });

  group('buildQuiz (은행 선별)', () {
    test('수학 3-4: 5문항 전부 수학·3-4 학년군', () async {
      final quiz = await makeRepository().buildQuiz(
        subject: '수학',
        grade: 4,
        date: tuesday,
      );
      expect(quiz.questions, hasLength(5));
      for (final question in quiz.questions) {
        expect(question.standard.subject, '수학');
        expect(question.standard.gradeBand, '3-4');
      }
    });

    test('수학 1학년: 1-2 문항 우선 + 3-4 fallback으로 5문항', () async {
      final quiz = await makeRepository().buildQuiz(
        subject: '수학',
        grade: 1,
        date: tuesday,
      );
      expect(quiz.questions, hasLength(5));
      expect(quiz.questions.first.standard.gradeBand, '1-2');
      for (final question in quiz.questions) {
        expect(question.standard.subject, '수학');
      }
    });

    test('국어: 은행에 4문항뿐이라 있는 만큼만 나온다', () async {
      final quiz = await makeRepository().buildQuiz(
        subject: '국어',
        grade: 3,
        date: tuesday,
      );
      expect(quiz.questions, hasLength(4));
      for (final question in quiz.questions) {
        expect(question.standard.subject, '국어');
      }
    });

    test('재도전(attempt+1)은 다른 순서를 준다', () async {
      final repository = makeRepository();
      Future<List<String>> ids(int attempt) async {
        final quiz = await repository.buildQuiz(
          subject: '수학',
          grade: 4,
          date: tuesday,
          attempt: attempt,
        );
        return quiz.questions.map((question) => question.id).toList();
      }

      expect(await ids(0), isNot(await ids(1)));
    });
  });
}
