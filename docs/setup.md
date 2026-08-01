# 공통 설정

K-Parent Skills는 fixture-first로 개발한다. API 키가 없어도 저장된 공개 fixture와
순수 로직 테스트를 실행할 수 있고, 라이브 조회 또는 fixture 갱신을 할 때만 해당
공식 API의 키가 필요하다.

## 환경 점검

```bash
bash scripts/check-setup.sh
```

이 명령은 Node/npm과 선택적 시크릿 파일의 경로·권한만 확인한다. 시크릿 값을
출력하거나 네트워크 요청을 보내지 않는다.

## Credential resolution order

1. 현재 프로세스에 이미 설정된 환경변수
2. 사용자가 운영 중인 1Password, Bitwarden, macOS Keychain 등 secret vault
3. `~/.config/k-parent-skills/secrets.env` (`0600`)
4. 필요한 변수 이름과 공식 발급처를 사용자에게 안내

기존 단수 경로 `~/.config/k-parent-skill/secrets.env`는 읽기 호환만 제공한다.
새 파일은 plural 경로에 둔다.

```bash
mkdir -p ~/.config/k-parent-skills
cp .env.example ~/.config/k-parent-skills/secrets.env
chmod 0600 ~/.config/k-parent-skills/secrets.env
```

필요한 값만 채운다. 빈 항목을 임의의 값으로 대체하지 않는다.

## 기능별 환경변수

| 영역 | 환경변수 | 기본 동작 |
| --- | --- | --- |
| NEIS 학교·급식·시간표 | `KEDU_INFO_KEY` | fixture 사용 |
| 학교알리미 | `SCHOOLINFO_API_KEY` | 문서·probe만 사용 |
| 유치원알리미 | `CHILDSCHOOLINFO_API_KEY` | fixture 또는 probe 사용 |
| data.go.kr 부모 데이터 | `KSKILL_DATAGOKR_KEY` | fixture 사용 |
| TourAPI | `KSKILL_TOURAPI_KEY` | fixture 사용 |
| 서울 공공서비스예약 | `KSKILL_SEOUL_KEY` | fixture 사용 |
| 도서관 정보나루 | `KSKILL_LIBRARY_KEY` | fixture 사용 |
| 문화포털 | `KSKILL_CULTURE_KEY` | fixture 사용 |
| Naver 검색·쇼핑 | `KSKILL_NAVER_CLIENT_ID`, `KSKILL_NAVER_CLIENT_SECRET` | fixture 사용 |
| Coupang Partners | `KSKILL_COUPANG_ACCESS_KEY`, `KSKILL_COUPANG_SECRET_KEY` | fixture 사용, 제휴 고지 유지 |
| YouTube Data API | `KSKILL_YOUTUBE_KEY` | fixture 사용, SafeSearch strict |

프록시를 self-host할 때의 서버 전용 키는 일반 사용자 시크릿과 분리한다. 현재
브랜치의 NEIS 프록시 배포 상태는 SSOT에서 `deployment-unverified`로 관리한다.

## 안전 경계

- 시크릿이 없으면 정확한 변수 이름을 알리고 중단한다.
- 로그인, 신청 제출, 결제, 자녀 개인정보 입력은 명시적 승인 전에는 실행하지 않는다.
- 실제 가족 대화, 학생 기록, 자녀 식별자를 fixture나 SSOT에 저장하지 않는다.
- 라이브 결과에는 출처와 확인 날짜를 함께 남긴다.

자세한 보안 규칙은 [보안과 시크릿](security-and-secrets.md)을 본다.
