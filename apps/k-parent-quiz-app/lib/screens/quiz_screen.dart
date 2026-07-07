import 'package:flutter/material.dart';

import '../data/quiz_repository.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../widgets/app_shell.dart';
import '../widgets/subject_sticker.dart';
import 'result_screen.dart';

/// 퀴즈 화면 — 5문항 (OX·3지선다·빈칸). 문항마다 바로 확인하고
/// 해설을 함께 읽는다. 오답에도 다그치는 문구를 쓰지 않는다.
class QuizScreen extends StatefulWidget {
  const QuizScreen({
    required this.repository,
    required this.profile,
    required this.subject,
    required this.date,
    this.attempt = 0,
    super.key,
  });

  final QuizRepository repository;
  final ChildProfile profile;
  final String subject;
  final DateTime date;
  final int attempt;

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  late final Future<QuizSet> _quizFuture;
  final TextEditingController _blankController = TextEditingController();

  int _index = 0;
  String? _givenAnswer;
  final List<bool> _correctFlags = [];
  final List<String> _givenAnswers = [];

  @override
  void initState() {
    super.initState();
    _quizFuture = widget.repository.buildQuiz(
      subject: widget.subject,
      grade: widget.profile.grade,
      date: widget.date,
      attempt: widget.attempt,
    );
  }

  @override
  void dispose() {
    _blankController.dispose();
    super.dispose();
  }

  void _answer(QuizSet quiz, String given) {
    if (_givenAnswer != null) {
      return;
    }
    final question = quiz.questions[_index];
    setState(() {
      _givenAnswer = given;
      _givenAnswers.add(given);
      _correctFlags.add(question.isCorrect(given));
    });
  }

  void _next(QuizSet quiz) {
    if (_index + 1 < quiz.questions.length) {
      setState(() {
        _index += 1;
        _givenAnswer = null;
        _blankController.clear();
      });
      return;
    }
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => ResultScreen(
          repository: widget.repository,
          profile: widget.profile,
          quiz: quiz,
          correctFlags: List.of(_correctFlags),
          givenAnswers: List.of(_givenAnswers),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AppShell(
        child: FutureBuilder<QuizSet>(
          future: _quizFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError || snapshot.requireData.questions.isEmpty) {
              return _EmptyQuiz(subject: widget.subject);
            }
            final quiz = snapshot.requireData;
            return _buildQuiz(context, quiz);
          },
        ),
      ),
    );
  }

  Widget _buildQuiz(BuildContext context, QuizSet quiz) {
    final textTheme = Theme.of(context).textTheme;
    final question = quiz.questions[_index];
    final answered = _givenAnswer != null;
    final total = quiz.questions.length;

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 16),
      children: [
        Row(
          children: [
            IconButton(
              tooltip: '그만하기',
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.close_rounded, color: AppColors.ink),
            ),
            const SizedBox(width: 4),
            SubjectSticker(subject: widget.subject, size: 34, tilted: false),
            const SizedBox(width: 10),
            Text('${widget.subject} 복습', style: textTheme.titleMedium),
            const Spacer(),
            Text('${_index + 1} / $total', style: textTheme.labelMedium),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            for (var slot = 0; slot < total; slot++)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 5),
                child: slot < _correctFlags.length
                    ? (_correctFlags[slot]
                          ? SubjectSticker(
                              subject: widget.subject,
                              size: 34,
                              tilted: false,
                              checked: true,
                            )
                          : const EmptyStickerSlot(size: 34))
                    : EmptyStickerSlot(size: 34, active: slot == _index),
              ),
          ],
        ),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('문제 ${_index + 1}', style: textTheme.labelMedium),
                const SizedBox(height: 8),
                Text(question.prompt, style: textTheme.bodyLarge),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        ..._buildAnswerArea(context, quiz, question, answered),
        if (answered) ...[
          const SizedBox(height: 16),
          _FeedbackCard(question: question, correct: _correctFlags.last),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _next(quiz),
            child: Text(_index + 1 < total ? '다음 문제' : '결과 보기'),
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }

  List<Widget> _buildAnswerArea(
    BuildContext context,
    QuizSet quiz,
    Question question,
    bool answered,
  ) {
    switch (question.type) {
      case QuestionType.ox:
        return [
          Row(
            children: [
              Expanded(
                child: _OxButton(
                  mark: 'O',
                  label: '맞아요',
                  state: _choiceState(question, 'O', answered),
                  onTap: answered ? null : () => _answer(quiz, 'O'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _OxButton(
                  mark: 'X',
                  label: '아니에요',
                  state: _choiceState(question, 'X', answered),
                  onTap: answered ? null : () => _answer(quiz, 'X'),
                ),
              ),
            ],
          ),
        ];
      case QuestionType.choice3:
        final choices = question.choices ?? const [];
        return [
          for (final choice in choices)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _ChoiceButton(
                label: choice,
                state: _choiceState(question, choice, answered),
                onTap: answered ? null : () => _answer(quiz, choice),
              ),
            ),
        ];
      case QuestionType.blank:
        return [
          TextField(
            controller: _blankController,
            enabled: !answered,
            textInputAction: TextInputAction.done,
            onSubmitted: answered ? null : (value) => _answer(quiz, value),
            decoration: const InputDecoration(hintText: '정답을 적어 보세요'),
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 12),
          if (!answered)
            ElevatedButton(
              onPressed: () => _answer(quiz, _blankController.text),
              child: const Text('정답 확인'),
            ),
        ];
    }
  }

  _ChoiceVisualState _choiceState(
    Question question,
    String choice,
    bool answered,
  ) {
    if (!answered) {
      return _ChoiceVisualState.idle;
    }
    if (question.isCorrect(choice)) {
      return _ChoiceVisualState.answer;
    }
    if (_givenAnswer == choice) {
      return _ChoiceVisualState.chosenWrong;
    }
    return _ChoiceVisualState.dimmed;
  }
}

enum _ChoiceVisualState { idle, answer, chosenWrong, dimmed }

({Color border, Color background, double width}) _choiceColors(
  _ChoiceVisualState state,
) {
  switch (state) {
    case _ChoiceVisualState.idle:
      return (border: AppColors.line, background: AppColors.card, width: 1.5);
    case _ChoiceVisualState.answer:
      return (border: AppColors.leaf, background: AppColors.leafBg, width: 2.5);
    case _ChoiceVisualState.chosenWrong:
      return (
        border: AppColors.coral,
        background: AppColors.coralBg,
        width: 2.5,
      );
    case _ChoiceVisualState.dimmed:
      return (border: AppColors.line, background: AppColors.paper, width: 1.5);
  }
}

class _OxButton extends StatelessWidget {
  const _OxButton({
    required this.mark,
    required this.label,
    required this.state,
    required this.onTap,
  });

  final String mark;
  final String label;
  final _ChoiceVisualState state;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = _choiceColors(state);
    final textTheme = Theme.of(context).textTheme;

    return Material(
      color: colors.background,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: colors.border, width: colors.width),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Semantics(
          button: true,
          label: label,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 22),
            child: Column(
              children: [
                Text(
                  mark,
                  style: TextStyle(
                    fontFamily: AppType.display,
                    fontFamilyFallback: AppType.fallback,
                    fontSize: 44,
                    height: 1,
                    color: mark == 'O' ? AppColors.leaf : AppColors.coral,
                  ),
                ),
                const SizedBox(height: 6),
                Text(label, style: textTheme.labelMedium),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ChoiceButton extends StatelessWidget {
  const _ChoiceButton({
    required this.label,
    required this.state,
    required this.onTap,
  });

  final String label;
  final _ChoiceVisualState state;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = _choiceColors(state);

    return Material(
      color: colors.background,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: colors.border, width: colors.width),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(fontSize: 19),
          ),
        ),
      ),
    );
  }
}

class _FeedbackCard extends StatelessWidget {
  const _FeedbackCard({required this.question, required this.correct});

  final Question question;
  final bool correct;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final background = correct ? AppColors.leafBg : AppColors.coralBg;
    final accent = correct ? AppColors.leaf : AppColors.coral;
    final title = correct ? '딩동댕! 맞았어요' : '괜찮아요, 같이 확인해 봐요';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                correct ? Icons.check_circle_rounded : Icons.wb_sunny_rounded,
                color: accent,
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: textTheme.titleMedium?.copyWith(color: accent),
              ),
            ],
          ),
          if (!correct) ...[
            const SizedBox(height: 10),
            Text('정답: ${question.answer}', style: textTheme.bodyMedium),
          ],
          const SizedBox(height: 8),
          Text(
            question.explanation,
            style: textTheme.bodyMedium?.copyWith(color: AppColors.ink),
          ),
        ],
      ),
    );
  }
}

class _EmptyQuiz extends StatelessWidget {
  const _EmptyQuiz({required this.subject});

  final String subject;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SubjectSticker(subject: subject, size: 64),
            const SizedBox(height: 16),
            Text('$subject 문제가 아직 준비 중이에요', style: textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              '다른 과목 카드를 먼저 복습해 볼까요?',
              style: textTheme.bodyMedium?.copyWith(color: AppColors.inkSoft),
            ),
            const SizedBox(height: 20),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('오늘 화면으로'),
            ),
          ],
        ),
      ),
    );
  }
}
