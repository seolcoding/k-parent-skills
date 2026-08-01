import 'package:flutter/material.dart';

import 'data/fixture_quiz_repository.dart';
import 'data/profile_store.dart';
import 'data/proxy_quiz_repository.dart';
import 'data/quiz_repository.dart';
import 'models/models.dart';
import 'screens/onboarding_screen.dart';
import 'screens/today_screen.dart';
import 'theme/app_theme.dart';

/// fixture-first: 기본은 번들 fixture + 문항 은행(오프라인 데모).
/// `--dart-define=PROXY_BASE_URL=...` 를 주면 k-parent-proxy 연동으로 바뀐다.
const String _proxyBaseOverride = String.fromEnvironment('PROXY_BASE_URL');

QuizRepository _buildRepository() {
  if (_proxyBaseOverride.isNotEmpty) {
    return ProxyQuizRepository(baseUrl: _proxyBaseOverride);
  }
  return FixtureQuizRepository();
}

void main() {
  final binding = WidgetsFlutterBinding.ensureInitialized();
  // 웹에서도 시맨틱 트리를 켠다 — 스크린리더와 E2E 검증 공통 기반.
  binding.ensureSemantics();
  runApp(KParentQuizApp(repository: _buildRepository()));
}

class KParentQuizApp extends StatelessWidget {
  const KParentQuizApp({required this.repository, super.key});

  final QuizRepository repository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '오늘 뭐 배웠지?',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: HomeGate(repository: repository, profileStore: ProfileStore()),
    );
  }
}

/// 저장된 프로필이 있으면 오늘 화면, 없으면 온보딩.
class HomeGate extends StatefulWidget {
  const HomeGate({
    required this.repository,
    required this.profileStore,
    super.key,
  });

  final QuizRepository repository;
  final ProfileStore profileStore;

  @override
  State<HomeGate> createState() => _HomeGateState();
}

class _HomeGateState extends State<HomeGate> {
  late Future<ChildProfile?> _profileFuture;

  @override
  void initState() {
    super.initState();
    _profileFuture = widget.profileStore.load();
  }

  Future<void> _saveProfile(ChildProfile profile) async {
    await widget.profileStore.save(profile);
    setState(() {
      _profileFuture = widget.profileStore.load();
    });
  }

  Future<void> _clearProfile() async {
    await widget.profileStore.clear();
    setState(() {
      _profileFuture = widget.profileStore.load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ChildProfile?>(
      future: _profileFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final profile = snapshot.data;
        if (profile == null) {
          return OnboardingScreen(
            repository: widget.repository,
            onComplete: _saveProfile,
          );
        }
        return TodayScreen(
          repository: widget.repository,
          profile: profile,
          onEditProfile: _clearProfile,
        );
      },
    );
  }
}
