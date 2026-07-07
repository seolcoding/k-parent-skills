/// 프로필 저장 — SharedPreferences 로컬 저장만.
///
/// 저장 항목은 학교(코드·이름)/학년/반이 전부다.
/// 아이 이름 등 개인정보는 키 자체가 존재하지 않으며 서버 전송도 없다.
library;

import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';

class ProfileStore {
  static const String _keyOfficeCode = 'profile.school.officeCode';
  static const String _keySchoolCode = 'profile.school.code';
  static const String _keySchoolName = 'profile.school.name';
  static const String _keyGrade = 'profile.grade';
  static const String _keyClassNm = 'profile.classNm';

  Future<ChildProfile?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final officeCode = prefs.getString(_keyOfficeCode);
    final schoolCode = prefs.getString(_keySchoolCode);
    final schoolName = prefs.getString(_keySchoolName);
    final grade = prefs.getInt(_keyGrade);
    final classNm = prefs.getString(_keyClassNm);
    if (officeCode == null ||
        schoolCode == null ||
        schoolName == null ||
        grade == null ||
        classNm == null) {
      return null;
    }
    return ChildProfile(
      school: SchoolInfo(
        officeCode: officeCode,
        schoolCode: schoolCode,
        name: schoolName,
      ),
      grade: grade,
      classNm: classNm,
    );
  }

  Future<void> save(ChildProfile profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyOfficeCode, profile.school.officeCode);
    await prefs.setString(_keySchoolCode, profile.school.schoolCode);
    await prefs.setString(_keySchoolName, profile.school.name);
    await prefs.setInt(_keyGrade, profile.grade);
    await prefs.setString(_keyClassNm, profile.classNm);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyOfficeCode);
    await prefs.remove(_keySchoolCode);
    await prefs.remove(_keySchoolName);
    await prefs.remove(_keyGrade);
    await prefs.remove(_keyClassNm);
  }
}
