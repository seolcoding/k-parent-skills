import 'package:shared_preferences/shared_preferences.dart';

/// Local preference only. It never stores session contents or child data.
abstract interface class MemoryConsentStore {
  Future<bool> loadEphemeralSessionConsent();

  Future<void> saveEphemeralSessionConsent({required bool enabled});
}

class SharedPreferencesMemoryConsentStore implements MemoryConsentStore {
  const SharedPreferencesMemoryConsentStore();

  static const String _key = 'privacy.ephemeralSessionMemory.enabled';

  @override
  Future<bool> loadEphemeralSessionConsent() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getBool(_key) ?? false;
  }

  @override
  Future<void> saveEphemeralSessionConsent({required bool enabled}) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_key, enabled);
  }
}
