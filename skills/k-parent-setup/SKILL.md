---
name: k-parent-setup
description: K-Parent Skills 설치 후 부모·자녀 정보 API 환경과 시크릿 파일을 안전하게 점검한다. "K-Parent 스킬 설치 확인해줘", "NEIS 키 설정 도와줘", "fixture 모드로 쓸 수 있는지 봐줘" 같은 요청에 사용한다. 개별 조회는 해당 기능 스킬을 사용하고, 이 스킬은 공통 설정과 진단만 담당한다.
license: MIT
metadata:
  category: parenting
  locale: ko-KR
  phase: implemented
---

# K-Parent setup

K-Parent Skills가 fixture-first 모드 또는 사용자가 승인한 라이브 API 키로
동작할 수 있는지 확인한다. 시크릿 값 자체를 출력하거나 저장소에 복사하지 않는다.

## 절차

1. 저장소의 `docs/setup.md`, `.env.example`, `docs/security-and-secrets.md`를 읽는다.
2. `bash scripts/check-setup.sh`를 실행해 Node/npm과 선택적 시크릿 파일 권한을 확인한다.
3. 필요한 기능과 대응 환경변수 이름만 알려준다. 값이 없다고 비공식 API로 우회하지 않는다.
4. 사용자가 라이브 조회를 원할 때만 credential resolution order에 따라 키를 확보한다.
5. 로그인, 신청 제출, 결제, 자녀 개인정보 입력은 별도 명시적 승인이 없으면 실행하지 않는다.

## Credential resolution order

1. 현재 프로세스의 환경변수
2. 사용자가 이미 쓰는 secret vault 또는 OS keychain
3. `~/.config/k-parent-skills/secrets.env` (`0600`)
4. 사용자에게 필요한 변수 이름과 발급처를 안내

기존 `~/.config/k-parent-skill/secrets.env`는 읽기 호환만 제공한다. 새 설정은
plural 경로를 사용한다.

## 주요 환경변수

- 학교·급식: `KEDU_INFO_KEY`
- 학교알리미: `SCHOOLINFO_API_KEY`
- 유치원알리미: `CHILDSCHOOLINFO_API_KEY`
- data.go.kr 부모 데이터: `KSKILL_DATAGOKR_KEY`
- TourAPI: `KSKILL_TOURAPI_KEY`
- 서울 공공서비스: `KSKILL_SEOUL_KEY`
- 도서관 정보나루: `KSKILL_LIBRARY_KEY`
- 문화포털: `KSKILL_CULTURE_KEY`
- Naver 검색: `KSKILL_NAVER_CLIENT_ID`, `KSKILL_NAVER_CLIENT_SECRET`
- Coupang Partners: `KSKILL_COUPANG_ACCESS_KEY`, `KSKILL_COUPANG_SECRET_KEY`
- YouTube Data API: `KSKILL_YOUTUBE_KEY`

키가 없어도 저장된 공개 fixture와 순수 로직 패키지의 테스트·데모는 실행할 수 있다.
