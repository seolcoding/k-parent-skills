import 'package:flutter/material.dart';

import '../data/quiz_repository.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../widgets/app_shell.dart';
import '../widgets/subject_sticker.dart';

/// 온보딩 — 학교 검색 → 학년/반 선택.
///
/// 여기서 받는 정보는 학교·학년·반이 전부다. 아이 이름을 묻는
/// 입력란은 만들지 않는다(개인정보 최소화).
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({
    required this.repository,
    required this.onComplete,
    super.key,
  });

  final QuizRepository repository;
  final ValueChanged<ChildProfile> onComplete;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final TextEditingController _queryController = TextEditingController();

  bool _searching = false;
  List<SchoolInfo>? _results;
  SchoolInfo? _school;
  int? _grade;
  String? _classNm;

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final query = _queryController.text.trim();
    if (query.isEmpty) {
      return;
    }
    setState(() {
      _searching = true;
      _results = null;
      _school = null;
    });
    final results = await widget.repository.searchSchools(query);
    if (!mounted) {
      return;
    }
    setState(() {
      _searching = false;
      _results = results;
      if (results.length == 1) {
        _school = results.first;
      }
    });
  }

  bool get _ready => _school != null && _grade != null && _classNm != null;

  void _complete() {
    final school = _school;
    final grade = _grade;
    final classNm = _classNm;
    if (school == null || grade == null || classNm == null) {
      return;
    }
    widget.onComplete(
      ChildProfile(school: school, grade: grade, classNm: classNm),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: AppShell(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 32),
          children: [
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SubjectSticker(subject: '국어', size: 52),
                SizedBox(width: 10),
                SubjectSticker(subject: '수학', size: 60, tilted: false),
                SizedBox(width: 10),
                SubjectSticker(subject: '과학', size: 52),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              '오늘 뭐 배웠지?',
              textAlign: TextAlign.center,
              style: textTheme.displayMedium,
            ),
            const SizedBox(height: 8),
            Text(
              '오늘 학교에서 배운 것을\n아이와 함께 5문항으로 가볍게 복습해요.',
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(color: AppColors.inkSoft),
            ),
            const SizedBox(height: 32),
            Text('우리 아이 학교 찾기', style: textTheme.titleMedium),
            const SizedBox(height: 10),
            TextField(
              controller: _queryController,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _search(),
              decoration: InputDecoration(
                hintText: '학교 이름 (예: 미래)',
                suffixIcon: IconButton(
                  tooltip: '학교 검색',
                  onPressed: _search,
                  icon: const Icon(Icons.search_rounded, color: AppColors.ink),
                ),
              ),
            ),
            const SizedBox(height: 12),
            if (_searching)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (_results != null && _results!.isEmpty)
              Text(
                '찾은 학교가 없어요. 이름 두 글자만 입력해도 돼요.',
                style: textTheme.labelMedium,
              ),
            ...?_results?.map(
              (school) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _SchoolCard(
                  school: school,
                  selected: _school?.schoolCode == school.schoolCode,
                  onTap: () => setState(() => _school = school),
                ),
              ),
            ),
            if (_school != null) ...[
              const SizedBox(height: 24),
              Text('학년', style: textTheme.titleMedium),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (var grade = 1; grade <= 6; grade++)
                    ChoiceChip(
                      label: Text('$grade학년'),
                      selected: _grade == grade,
                      onSelected: (_) => setState(() => _grade = grade),
                    ),
                ],
              ),
              const SizedBox(height: 24),
              Text('반', style: textTheme.titleMedium),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (var classNm = 1; classNm <= 6; classNm++)
                    ChoiceChip(
                      label: Text('$classNm반'),
                      selected: _classNm == '$classNm',
                      onSelected: (_) => setState(() => _classNm = '$classNm'),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 28),
            Text(
              '학교·학년·반은 이 기기에만 저장돼요. 이름은 묻지 않아요.',
              textAlign: TextAlign.center,
              style: textTheme.labelMedium,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _ready ? _complete : null,
              child: const Text('복습 시작하기'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _SchoolCard extends StatelessWidget {
  const _SchoolCard({
    required this.school,
    required this.selected,
    required this.onTap,
  });

  final SchoolInfo school;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: selected ? AppColors.marigold : AppColors.line,
          width: selected ? 2.5 : 1.5,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Icon(Icons.school_rounded, color: AppColors.inkSoft),
              const SizedBox(width: 12),
              Expanded(child: Text(school.name, style: textTheme.titleMedium)),
              if (selected)
                const Icon(
                  Icons.check_circle_rounded,
                  color: AppColors.marigold,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
