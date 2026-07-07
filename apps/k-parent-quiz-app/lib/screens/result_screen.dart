import 'package:flutter/material.dart';

import '../data/quiz_repository.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../widgets/app_shell.dart';
import '../widgets/subject_sticker.dart';
import 'quiz_screen.dart';

/// 결과 화면 — 칭찬 스티커판.
///
/// 점수·등수·비교 없이 모은 스티커 개수만 보여준다.
/// 오답은 "한 번 더 보면 좋은 문제"로 부드럽게 안내한다.
class ResultScreen extends StatefulWidget {
  const ResultScreen({
    required this.repository,
    required this.profile,
    required this.quiz,
    required this.correctFlags,
    required this.givenAnswers,
    super.key,
  });

  final QuizRepository repository;
  final ChildProfile profile;
  final QuizSet quiz;
  final List<bool> correctFlags;
  final List<String> givenAnswers;

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  int _revealed = 0;

  int get _correctCount => widget.correctFlags.where((flag) => flag).length;

  @override
  void initState() {
    super.initState();
    _revealStickers();
  }

  Future<void> _revealStickers() async {
    final total = widget.correctFlags.length;
    for (var i = 1; i <= total; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 180));
      if (!mounted) {
        return;
      }
      setState(() => _revealed = i);
    }
  }

  String get _headline {
    final count = _correctCount;
    final total = widget.correctFlags.length;
    if (count == total) {
      return '다 모았어요! 오늘 복습 최고예요';
    }
    if (count >= 3) {
      return '오늘도 잘했어요!';
    }
    if (count >= 1) {
      return '좋아요, 하나씩 알아가고 있어요';
    }
    return '괜찮아요, 오늘 처음 본 것들이에요';
  }

  void _retry() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => QuizScreen(
          repository: widget.repository,
          profile: widget.profile,
          subject: widget.quiz.subject,
          date: widget.quiz.date,
          attempt: widget.quiz.attempt + 1,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final disableAnimations = MediaQuery.of(context).disableAnimations;
    final wrongQuestions = [
      for (var i = 0; i < widget.correctFlags.length; i++)
        if (!widget.correctFlags[i]) widget.quiz.questions[i],
    ];

    return Scaffold(
      body: AppShell(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 40),
          children: [
            Text(
              '${widget.quiz.subject} 복습 끝!',
              textAlign: TextAlign.center,
              style: textTheme.titleMedium?.copyWith(color: AppColors.inkSoft),
            ),
            const SizedBox(height: 8),
            Text(
              '칭찬 스티커 $_correctCount개!',
              textAlign: TextAlign.center,
              style: textTheme.displayMedium,
            ),
            const SizedBox(height: 6),
            Text(
              _headline,
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(color: AppColors.inkSoft),
            ),
            const SizedBox(height: 28),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 14,
              runSpacing: 14,
              children: [
                for (var i = 0; i < widget.correctFlags.length; i++)
                  AnimatedScale(
                    scale: disableAnimations || i < _revealed ? 1 : 0,
                    duration: disableAnimations
                        ? Duration.zero
                        : const Duration(milliseconds: 260),
                    curve: Curves.easeOutBack,
                    child: widget.correctFlags[i]
                        ? SubjectSticker(
                            subject: widget.quiz.subject,
                            size: 64,
                            checked: true,
                          )
                        : const EmptyStickerSlot(size: 64),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '다시 풀면 문제 순서가 바뀌어요.',
              textAlign: TextAlign.center,
              style: textTheme.labelMedium,
            ),
            if (wrongQuestions.isNotEmpty) ...[
              const SizedBox(height: 28),
              Text('한 번 더 보면 좋은 문제', style: textTheme.titleMedium),
              const SizedBox(height: 12),
              for (final question in wrongQuestions)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(question.prompt, style: textTheme.bodyMedium),
                          const SizedBox(height: 8),
                          Text(
                            '정답: ${question.answer}',
                            style: textTheme.bodyMedium?.copyWith(
                              color: AppColors.leaf,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            question.explanation,
                            style: textTheme.labelMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
            const SizedBox(height: 24),
            ElevatedButton(onPressed: _retry, child: const Text('다시 풀기')),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () =>
                  Navigator.of(context).popUntil((route) => route.isFirst),
              child: const Text('오늘 화면으로'),
            ),
          ],
        ),
      ),
    );
  }
}
