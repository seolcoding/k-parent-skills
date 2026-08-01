# 보안과 시크릿

저장소는 필요한 환경변수 이름과 빈 템플릿만 관리한다. 실제 키, 토큰, 쿠키,
브라우저 세션, 인증 헤더, 데이터베이스, 개인 문서는 Git에 넣지 않는다.

## 저장 위치

- 권장: 사용자가 이미 운영하는 secret vault 또는 OS keychain
- 파일 fallback: `~/.config/k-parent-skills/secrets.env`
- 호환 읽기 경로: `~/.config/k-parent-skill/secrets.env`
- 파일 권한: `0600`

환경변수 → vault → plural fallback 파일 → 사용자 질문 순으로 해결한다. 저장소의
`.env.example`에는 실제 값이나 그럴듯한 예시 키를 넣지 않는다.

## 표준 변수

- `KEDU_INFO_KEY`
- `SCHOOLINFO_API_KEY`
- `CHILDSCHOOLINFO_API_KEY`
- `KSKILL_DATAGOKR_KEY`
- `KSKILL_TOURAPI_KEY`
- `KSKILL_SEOUL_KEY`
- `KSKILL_LIBRARY_KEY`
- `KSKILL_CULTURE_KEY`
- `KSKILL_NAVER_CLIENT_ID`, `KSKILL_NAVER_CLIENT_SECRET`
- `KSKILL_COUPANG_ACCESS_KEY`, `KSKILL_COUPANG_SECRET_KEY`
- `KSKILL_YOUTUBE_KEY`

프록시 운영자용 환경변수는 배포 환경의 secret store에만 둔다. 일반 사용자에게
서버 키를 복사하거나 hosted 프록시의 배포 상태를 추정하지 않는다.

## 아동·가족 데이터

- private family conversations(실제 가족 대화), 학생 기록, 자녀 이름·생년월일·학교
  식별자·연락처·학습 로그를 저장소, fixture, SSOT에 넣지 않는다.
- 부모-자녀 대화 테스트는 기본적으로 synthetic case만 사용한다.
- OCR 문서와 앱 캡처는 사용자 통제 로컬 저장소에 두고 Git에 커밋하지 않는다.
- 로그인, 신청 제출, 예약, 취소, 결제, 개인정보 입력은 명시적 승인 없이는 실행하지 않는다.

## 점검

```bash
bash scripts/check-setup.sh
```

점검기는 값 자체를 출력하지 않고 파일 존재 여부와 권한만 확인한다.
