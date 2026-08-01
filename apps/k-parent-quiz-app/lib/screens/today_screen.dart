import 'package:flutter/material.dart';

import '../data/memory_consent_store.dart';
import '../data/quiz_repository.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../widgets/app_shell.dart';
import '../widgets/memory_consent_card.dart';
import '../widgets/subject_sticker.dart';
import 'quiz_screen.dart';

/// 오늘 화면 — 오늘 배운 과목 카드. 휴업일이면 안내를 보여준다.
class TodayScreen extends StatefulWidget {
  const TodayScreen({
    required this.repository,
    required this.profile,
    required this.onEditProfile,
    this.memoryConsentStore = const SharedPreferencesMemoryConsentStore(),
    super.key,
  });

  final QuizRepository repository;
  final ChildProfile profile;
  final VoidCallback onEditProfile;
  final MemoryConsentStore memoryConsentStore;

  @override
  State<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends State<TodayScreen> {
  late final DateTime _today = DateTime.now();
  late Future<TodayLesson> _lessonFuture;

  @override
  void initState() {
    super.initState();
    _lessonFuture = widget.repository.fetchToday(widget.profile, _today);
  }

  static const List<String> _weekdays = ['월', '화', '수', '목', '금', '토', '일'];

  String get _dateLabel {
    final weekday = _weekdays[_today.weekday - 1];
    return '${_today.year}년 ${_today.month}월 ${_today.day}일 $weekday요일';
  }

  void _startQuiz(String subject) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => QuizScreen(
          repository: widget.repository,
          profile: widget.profile,
          subject: subject,
          date: _today,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final profile = widget.profile;

    return Scaffold(
      body: AppShell(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 32),
          children: [
            Text(_dateLabel, style: textTheme.labelMedium),
            const SizedBox(height: 6),
            Text('오늘 뭐 배웠지?', style: textTheme.displayMedium),
            const SizedBox(height: 10),
            Row(
              children: [
                Flexible(
                  child: Text(
                    '${profile.school.name} · ${profile.grade}학년 ${profile.classNm}반',
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.bodyMedium?.copyWith(
                      color: AppColors.inkSoft,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: widget.onEditProfile,
                  child: const Text('바꾸기'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            FutureBuilder<TodayLesson>(
              future: _lessonFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                if (snapshot.hasError) {
                  return _NoteCard(
                    title: '시간표를 불러오지 못했어요',
                    note: '네트워크를 확인하고 앱을 다시 열어 보세요.',
                  );
                }
                final lesson = snapshot.requireData;
                if (lesson.isDayOff || lesson.subjects.isEmpty) {
                  return _NoteCard(
                    title: '오늘은 수업이 없어요',
                    note:
                        lesson.dayOffNote ?? '시간표가 아직 올라오지 않았어요. 조금 뒤에 다시 볼까요?',
                  );
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final subject in lesson.subjects)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _SubjectCard(
                          subject: subject,
                          onTap: () => _startQuiz(subject.name),
                        ),
                      ),
                    const SizedBox(height: 8),
                    Text(
                      '카드를 누르면 오늘 복습 5문항이 시작돼요.',
                      textAlign: TextAlign.center,
                      style: textTheme.labelMedium,
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 24),
            MemoryConsentCard(store: widget.memoryConsentStore),
          ],
        ),
      ),
    );
  }
}

class _SubjectCard extends StatelessWidget {
  const _SubjectCard({required this.subject, required this.onTap});

  final LessonSubject subject;
  final VoidCallback onTap;

  String get _periodLabel =>
      '${subject.periods.map((period) => '$period').join('·')}교시';

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              SubjectSticker(subject: subject.name, size: 56),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(subject.name, style: textTheme.titleLarge),
                    const SizedBox(height: 2),
                    Text(_periodLabel, style: textTheme.labelMedium),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.marigoldSoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '5문항',
                  style: textTheme.labelMedium?.copyWith(color: AppColors.ink),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NoteCard extends StatelessWidget {
  const _NoteCard({required this.title, required this.note});

  final String title;
  final String note;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SubjectSticker(subject: '쉼', size: 64),
            const SizedBox(height: 16),
            Text(title, style: textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              note,
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(color: AppColors.inkSoft),
            ),
          ],
        ),
      ),
    );
  }
}
