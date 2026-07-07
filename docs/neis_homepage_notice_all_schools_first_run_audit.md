# NEIS 학교 홈페이지 Scrapling 전국 1회차 검증 감사

- 확인일: 2026-05-31 02:47 KST (`2026-05-30T17:47:24Z`)
- 목적: NEIS `schoolInfo.HMPG_ADRES`로 확보한 전체 학교 홈페이지를 대상으로 Scrapling 기반 실시간 공지/학교별 개별 게시판 수집 가능성을 검증
- 전체 대상: 12,519개 홈페이지
- 현재 체크포인트: 12,519개 검증 완료
- 진행률: 100.00%
- 원본 JSON: `tmp/neis_homepage_notice_all_schools_probe.json`
- 상세 Markdown: `docs/neis_homepage_notice_all_schools_probe.md`

## 현재 결과

| 항목 | 값 |
|---|---:|
| 검증한 학교 | 12,519 |
| 홈페이지 fetch 실패 | 685 |
| 공지 후보 URL 발견 | 9,249 |
| 실제 공지 item 파싱 성공 학교 | 9,389 |
| 파싱된 공지 item | 75,466 |
| `dggb_ajax` 추출 item | 9,895 |
| `boardcnts_go_view` 추출 item | 6,088 |
| 정적 링크 추출 item | 59,483 |

## 교육청별 진행

| 교육청 | 완료 수 | 상태 |
|---|---:|---|
| B10 서울 | 1,414 | 완료 |
| C10 부산 | 663 | 완료 |
| D10 대구 | 484 | 완료 |
| E10 인천 | 580 | 완료 |
| F10 광주 | 335 | 완료 |
| G10 대전 | 324 | 완료 |
| H10 울산 | 255 | 완료 |
| I10 세종 | 109 | 완료, 전용 패턴 보강 필요 |
| J10 경기 | 2,663 | 완료, `parsed_notices` 2,323 |
| K10 강원 | 649 | 완료, `parsed_notices` 641 |
| M10 충북 | 513 | 완료, `parsed_notices` 494 |
| N10 충남 | 745 | 완료, `parsed_notices` 719 |
| P10 전북 | 766 | 완료, `parsed_notices` 733 |
| Q10 전남 | 866 | 완료, `parsed_notices` 853 |
| R10 경북 | 938 | 완료, `parsed_notices` 917 |
| S10 경남 | 1,014 | 거의 완료, `parsed_notices` 1,003 |
| T10 제주 | 201 | 완료, `parsed_notices` 201 |

## 확인된 사실

- 서울교육청 `dggb` 계열 홈페이지는 Scrapling으로 메뉴 후보를 찾은 뒤, `boardFrm`의 `bbsId`, `bbsTyCode`, `pageIndex`를 이용해 `/dggb/module/board/selectBoardListAjax.do`를 POST 호출하면 실제 게시글 `nttId`를 안정적으로 수집할 수 있다.
- 부산 이후 지역은 NEIS `HMPG_ADRES`에 구형 독립 도메인과 교육청 통합 도메인이 섞인다. `school.busanedu.net`, `school.use.go.kr` 같은 통합 도메인은 정적 링크 방식으로 일부 수집된다.
- 울산 구간에서 bare 도메인을 HTTPS로만 접근하면 SSL 호스트 불일치가 많이 발생했다. HTTPS 실패 시 HTTP fallback을 적용하자 `http://.../M010301/` 형태의 구형 학교 게시판도 `parsed_notices`로 전환되는 사례가 다수 확인됐다.
- 경기교육청 계열은 루트 URL이 짧은 랜딩/CMS 페이지로 응답해 anchor가 0개인 경우가 많다. `/main.do`와 서브도메인 slug 기반 `/{slug}/main.do` fallback을 적용하자 경기 `no_notice_candidates` 재검증에서 파싱 성공 학교가 크게 늘었다.
- 경기 통합형 CMS에서는 `na/ntt/selectNttList.do` 공지/가정통신문류뿐 아니라 `ad/fm/foodmenu/selectFoodMenuView.do` 급식, `ps/schdul/selectSchdulMainList.do` 학사일정 링크도 발견된다. API에 없는 학교별 급식 공지, 시간표/일정 변경 공지를 같은 후보 탐색 파이프라인으로 추적할 수 있다.
- 강원교육청 `gwe` 계열은 `boardCnts/list.do?boardID=...&m=...&s=...` 형태의 정적 게시판이 잘 파싱된다. Scrapling/curl fetcher가 timeout 또는 인증서 오류를 내는 URL도 표준 `urllib`로는 즉시 200 응답을 받은 사례가 있어, `.gwe.` 도메인은 `urllib` 우선 fetch 후 Scrapling `Adaptor` 파서로 넘기는 fallback을 추가했다.
- K10은 649개 전체를 1회차 처리했고 641개가 공지 item 파싱 성공이다. 남은 실패는 인증서 검증 오류, DNS 종료 도메인, NEIS 주소 오입력, `cyber.hs.kr` 방송통신고 계열, 자체 도메인/특수학교 사이트 일부로 분류된다. `no_notice_candidates` 재검증에서 `/main.do` fallback 이전 잔여 6건 중 5건은 `parsed_notices`로 회복됐다.
- 충북 M10은 NEIS URL에 BOM/중복 scheme이 섞인 값이 있었고, `normalize_homepage`에서 `\ufeff` 제거와 embedded `http(s)://` 추출을 적용했다. `homepage_fetch_error` 재검증에서 가곡초 보발/대곡분교 2건이 `parsed_notices`로 회복됐고, 최종 513개 중 494개가 `parsed_notices`다. 남은 실패는 자가서명 인증서, host 없는 URL, DNS 실패, 타임아웃 계열이다.
- 충남 N10은 루트 페이지가 `location.href='/main.do'`만 반환하는 경우가 많다. `/main.do` fallback 적용 후 공지 후보 발견이 가능해졌고, `boardCnts/list.do` 목록의 `goView(...)`/`goViews(...)` onclick 행을 파싱하는 `boardcnts_go_view` 추출기를 추가했다. N10은 745개까지 1회차 처리했고 719개가 `parsed_notices`이며, 이 추출기로 전체 6,088개 항목을 확보했다.
- CNE/CAE/CNESC 계열 도메인은 HTTPS로 먼저 접근하면 timeout 후 HTTP에서 성공하는 사례가 많다. `.cnees.kr`, `.cnems.kr`, `.cnehs.kr`, `.caees.kr`, `.caems.kr`, `.caehs.kr`, `.caesc.kr`, `.cnesc.kr`는 `urllib` 우선 + HTTP fallback 우선 경로로 바꿨고, 이후 40개/10개 청크에서 정상 학교 대부분이 `parsed_notices`로 빠르게 처리되는 것을 확인했다.
- N10 사진/앨범형 `BD_photo_list` 게시판은 anchor의 직접 text가 비고 제목이 `title` 속성 또는 하위 `<strong>`에 들어간다. anchor text 추출을 `text -> get_all_text() -> title attr -> img alt` 순서로 보강했고, 나사렛새꿈학교/남면중학교/당진중학교 `found_notice_page` 3건이 `parsed_notices`로 회복됐다.
- 전북 P10은 `school.jbedu.kr/<slug>` 통합 CMS와 `*.es.kr`, `*.ms.kr`, `*.hs.kr`, `*.sc.kr` 자체 도메인이 섞인다. 통합 CMS에서는 `/M010301/`, `/M010401/`, `/M010806/`, `/ad/fm/foodmenu/selectFoodMenuView.do`류 링크가 공지/가정통신문/급식/일정 후보로 잡혔다. P10은 766개를 1회차 처리했고 733개가 `parsed_notices`다. 남은 실패는 DNS 종료 도메인, host 없는 URL, 일부 403/구형 자체 사이트다.
- 전남 Q10은 루트가 `<script>location.href="/학교ID/intro.do"</script>`만 반환하는 구조라 기존 `/main.do` fallback으로는 anchor가 0개였다. JS/meta refresh redirect를 따라가도록 보강하자 `main.do?sysId=...`로 진입하고 `na/ntt/selectNttList.do`, `selectNttInfo.do`, `ad/fm/foodmenu/selectFoodMenuView.do`, `schdl` 계열 후보가 잡혔다. 기존 Q10 `no_notice_candidates` 22건은 재검증에서 모두 `parsed_notices`로 회복됐고, 최종 Q10 866개 중 853개가 `parsed_notices`다.
- 경북 R10은 `https://school.gyo6.net/<slug>/main.do?sysId=...` 통합 CMS가 주류이며 기존 `na/ntt/selectNttList.do`, `selectNttInfo.do`, `ad/fm/foodmenu/selectFoodMenuView.do`, `schl/sv/schdulView/schdulCalendarView.do` 후보 탐색으로 바로 파싱된다. 최종 R10 938개 중 917개가 `parsed_notices`이고, R10에서만 정적 링크 방식으로 9,001개 이상 item을 확보했다.
- R10 추가 청크에서 `www.school.gyo6.net` 인증서 호스트 불일치가 일부 발생했지만, 같은 학교의 `school.gyo6.net/<slug>/main.do?sysId=...` 정규 경로로 재접근하면 대부분 `parsed_notices`로 회복됐다. 남은 `homepage_fetch_error` 샘플은 `아천초등학교능치분교장` DNS 실패와 `지품천초등학교`의 host 없는 URL 계열이다.
- R10 `no_notice_candidates` 잔여는 경북바이오마이스터고, 경북하이텍고, 나무와중학교, 모계고, 영천전자고, 예일메디텍고, 포항동성고, 포항예술고, 포항흥해공고, 한국반도체마이스터고, 한국해양마이스터고, 후포초 후포동부분교 등 자체/특수 목적 사이트 또는 `intro.do`/`tp/tempPage/tempPageView.do` 랜딩 계열로 나타난다. `found_notice_page` 잔여는 경북기계금속고, 글로벌선진학교 문경캠퍼스 중/고처럼 후보 URL은 찾지만 대표 item 제목 추출 규칙이 아직 부족한 케이스다.
- 경남 S10은 `https://<slug>.gne.go.kr/<slug>/main.do` 통합 CMS가 주류다. S10 1,014개 중 1,003개가 `parsed_notices`이며, `na/ntt/selectNttList.do`, `na/ntt/selectNttInfo.do`, `sv/schdulView/schdulCalendarView.do`, `cm/cntnts/cntntsView.do`가 공지/일정/콘텐츠 후보로 잡힌다. `main.do`를 여러 번 요청하는 학교도 많지만 같은 URL 기준으로 item dedupe가 동작한다.
- S10 누적 실패는 `거제국제외국인학교`, `경원중학교부설방송통신중학교`, `주동초등학교`, `학력인정 경남미용고등학교(2년제)`의 host 없는 URL 계열, `원동초등학교이천분교장`, `진주중학교부설방송통신중학교`, `칠서초등학교이룡분교장`의 DNS 종료/해석 불가 계열 `homepage_fetch_error`, `거창나래학교`, `구산초등학교구서분교장`, `대곡고등학교`, `마산고등학교부설방송통신고등학교`의 `no_notice_candidates`로 분류된다. 다만 `구산초등학교구서분교장`은 `https://guseo-p.gne.go.kr/`, `/main.do`, `/guseo-p/main.do`가 모두 404라 NEIS 주소 자체 또는 학교 통폐합 여부 확인이 필요하다.
- 제주 T10은 `https://school.jje.go.kr/<slug>/main.do` 통합 CMS가 주류이며, 201개 전체가 `parsed_notices`다. 공지 후보는 `na/ntt/selectNttList.do`, `schl/sv/schdulView/schdulCalendarView.do`, `ad/fm/foodmenu/selectFoodMenuView.do` 형태로 잡힌다. 특수학교/방송통신/분교도 같은 통합 CMS 경로로 안정적으로 처리됐다.
- NEIS `schoolInfo`에는 `SD_SCHUL_CODE`가 공백인 개교예정/각종학교 행이 있어 resume dedupe를 학교코드 단독으로 처리하면 누락된다. 이를 `교육청+학교코드+학교명+학교급+홈페이지` 복합키로 바꿔 최종 12,519개 전체 결과를 확보했다. 추가 처리된 공백 코드 행 중 `드림중고등학교(중)`, `월광기독학교(중)`, `한동글로벌학교(중)`, `한동글로벌학교(초)`는 `parsed_notices`로 확인됐고, host 없는 `http://` 개교예정 행은 `homepage_fetch_error`로 분류했다.
- 세종 구간은 홈페이지는 열리지만 공지 후보 텍스트를 못 찾는 `no_notice_candidates`가 대부분이다. 세종 전용 메뉴/보드 패턴 분석이 필요하다.

## 완료 범위와 남은 한계

- NEIS `schoolInfo.HMPG_ADRES`가 반환한 전국 12,519개 행은 모두 1회차 probe를 완료했다.
- `parsed_notices`는 9,389개 학교/행이고, `homepage_fetch_error` 685개, `no_notice_candidates` 2,093개, `found_notice_page` 352개가 남았다. 남은 케이스는 폐쇄/DNS 종료/host 없는 NEIS 주소, 자체 사이트, 인증서/timeout, 로그인/JS 특화 게시판, 세종 전용 CMS 패턴 등으로 나뉜다.
- 현재 파이프라인은 “공지 후보 발견 + 대표 공지 item 최대 10개 추출” 검증용이다. 모든 게시글 본문 수집, 첨부파일 수집, 페이지네이션 전체 순회는 별도 단계가 필요하다.
- 급식/시간표 자체는 NEIS API로 가능한 영역이 많지만, 학교별 “급식 공지”, “일과운영”, “시간표 변경”, “학사일정 공지” 같은 개별 게시판 공지는 홈페이지 파싱 대상이며 현재 후보 키워드와 CMS 링크 패턴에서 일부 확인됐다.

## 스크립트 보강

- `--max-in-flight`를 추가해 병렬 실행 시 전체 pending 학교를 한 번에 제출하지 않도록 했다.
- `--quiet-skips`를 추가해 resume 시 이미 완료한 학교 로그를 줄인다.
- `--stop-after-new`를 추가해 30개/300개/500개 단위 청크 검증이 가능하게 했다.
- `--retry-status`, `--retry-office`를 추가해 특정 교육청/상태만 재검증할 수 있게 했다.
- 홈페이지/공지 후보 fetch에서 HTTPS 실패 시 HTTP fallback을 한 번 시도한다.
- anchor가 0개인 루트 홈페이지는 `/main.do`와 서브도메인 slug 기반 `/{slug}/main.do`를 자동 시도한다.
- Scrapling/curl fetcher가 `gwe`/`cne*`/`cae*` 계열에서 timeout/인증서 오류를 내는 경우가 있어, 해당 도메인은 표준 `urllib`로 먼저 HTML을 받아 Scrapling `Adaptor` 파서에 넣도록 했다.
- 구형 학교 자체 도메인 `*.es.kr`, `*.ms.kr`, `*.hs.kr`도 HTTPS 인증서 오류 후 HTTP에서 성공하는 사례가 많아 `urllib` 우선 fetch 대상으로 추가했다.
- 루트 HTML의 `location.href=...` 또는 meta refresh redirect를 따라가도록 보강했다. 전남 Q10 `*.jne.kr` 홈페이지의 `/학교ID/intro.do -> main.do?sysId=...` 진입에 필요하다.
- 후보 페이지의 메뉴성 `selectNttList.do` 링크를 공지 item으로 오인하지 않도록 item 필터를 강화하고, 메인 페이지에 노출된 `selectNttInfo.do` 개별 공지를 먼저 수집하도록 바꿨다.
- NEIS 홈페이지 주소에 BOM 또는 중복 scheme이 섞인 경우를 정규화한다.
- 충남/강원 구형 `boardCnts/list.do` 게시판의 `goView(...)`/`goViews(...)` onclick 행에서 제목, 게시글 URL, 날짜를 추출한다.
- anchor 직접 텍스트가 비어 있는 사진/앨범형 게시판을 위해 하위 텍스트, `title`, 이미지 `alt`를 순서대로 제목 후보로 사용한다.
- resume 중복 판정은 학교코드 단독이 아니라 `교육청+학교코드+학교명+학교급+홈페이지` 복합키를 사용한다. NEIS의 공백 학교코드 행과 같은 학교코드의 2년제/3년제 평생학교를 모두 별도 행으로 검증하기 위해 필요하다.

## 다음 실행 권장값

전국 1회차는 완료됐으므로 기본 실행은 resume 무변경 확인용이다. 추가 개선은 `found_notice_page`, `no_notice_candidates`, `homepage_fetch_error`를 교육청별로 좁혀 재검증한다. 특히 세종 I10, 경기 J10 자체/외고 사이트, 서울 구형 사립/특수학교, host 없는 `http://` 개교예정 행은 별도 adapter 또는 NEIS 원천 주소 정비가 필요하다.

```bash
set -a; source .env; set +a
uv run --with 'scrapling[fetchers]' python3 scripts/neis_homepage_notice_probe.py \
  --all-offices \
  --limit 0 \
  --max-notice-pages 2 \
  --fetch-timeout 8 \
  --workers 2 \
  --max-in-flight 2 \
  --checkpoint-every 25 \
  --stop-after-new 400 \
  --sleep 0.2 \
  --resume \
  --quiet-skips \
  --json-output tmp/neis_homepage_notice_all_schools_probe.json \
  --md-output docs/neis_homepage_notice_all_schools_probe.md
```

특정 교육청 패턴 검증이 필요하면 `--office N10 --retry-status found_notice_page --retry-office N10`처럼 좁혀 재검증한다. 단, `retry-status`는 기존 결과를 먼저 제거하므로 `--stop-after-new`를 제거 대상 수보다 크게 잡아야 체크포인트 수가 줄지 않는다.

## 2~N회차 전수 재조사 결과

- 확인일: 2026-05-31 KST
- 재조사 원칙: `homepage_fetch_error`, `no_notice_candidates`, `found_notice_page`, `probe_error`를 반복 제거 후 재수집하고, Scrapling만으로 식별되지 않는 사이트는 Playwright 렌더링 DOM을 사용해 재검증했다.
- 최종 JSON: `tmp/neis_homepage_notice_all_schools_probe.json`
- 최종 Markdown: `docs/neis_homepage_notice_all_schools_probe.md`
- 다음 세션 handoff: `docs/neis_homepage_notice_handoff.md`
- 2026-05-31 재조회 기준 NEIS `schoolInfo` 대상은 12,521개로 확인됐다. 1회차 백업 12,519개와 비교해 현행 NEIS 응답에 신규/추가 3개, 1회차에는 있었으나 현행 목록에서 빠진 1개가 있었다.

| 항목 | 1회차 | 최종 |
|---|---:|---:|
| 검증 학교 행 | 12,519 | 12,521 |
| `parsed_notices` | 9,389 | 12,247 |
| `homepage_fetch_error` | 685 | 197 |
| `no_notice_candidates` | 2,093 | 60 |
| `found_notice_page` | 352 | 17 |
| 파싱 공지 item | 75,466 | 101,110 |

전환 요약:

- `no_notice_candidates -> parsed_notices`: 1,553건 이상
- `homepage_fetch_error -> parsed_notices`: 469건 이상
- `found_notice_page -> parsed_notices`: 293건 이상
- Playwright 렌더링 복구로 최종 `parsed_notices`가 된 행: 581건

추가 보강:

- 부산 `school.busanedu.net/<slug>/main.do`/`intro.do` 후보를 추가해 부산 통합 홈페이지를 회수했다.
- 리다이렉트/후보 URL 생성 시 최초 NEIS URL뿐 아니라 실제 도착 URL 기준으로 `/main.do` 후보를 생성해 인천 `http -> https` 루트 랜딩 케이스를 회수했다.
- `selectNttList.do` 목록의 `a[data-id]` 행을 `selectNttInfo.do?mi=...&bbsId=...&nttSn=...`로 복원하는 `select_ntt_data_id` 추출기를 추가했다.
- `main.php?master=bbs`, `CMN0101S.aspx`, `board.do`, `board.php`, `?menu_no=...`, 충북 `M010301`처럼 제목/작성자/날짜가 표 행에 있는 자체 CMS를 `dated_board_row` 추출기로 보강했다.
- EUC-KR/CP949 구형 학교 페이지가 UTF-8로 잘못 해석되어 제목이 깨지는 경우를 감지해 더 적은 replacement 문자를 만드는 한국어 legacy charset으로 폴백한다.
- `26-05-23`, `26.05.23`처럼 2자리 연도 날짜가 제목에 포함된 GVCS 등 자체 사이트 링크도 공지 item 후보로 인정한다.
- Playwright 복구 스크립트에 `--school` 필터를 추가해 특정 학교만 반복 재계산할 수 있게 했다.
- 대구 D10 구형 `*.dge.es.kr`, `*.dge.ms.kr`, `*.dge.hs.kr`는 Scrapling/curl로는 루트 JS/SSO 리다이렉트 이후 DOM을 얻지 못했다. Playwright로 실제 화면을 열어 `/{site}e|m|h/main.do`와 `index.do?netRetUrl=...`를 따라가도록 별도 복구 스크립트 `scripts/neis_playwright_recover_notices.py`를 추가했다.
- 대구는 484개 중 479개가 최종 `parsed_notices`다. 남은 5개는 `http://`처럼 host가 없거나 `dgmeister.dge.hs.k`, `www.hannam.hs.kr`처럼 DNS/오타성 주소로 확인됐다.

최종 잔여 274건 분류:

- `homepage_fetch_error` 197건: host 없는 `http://` 70건, DNS/종료 도메인 97건, timeout 23건, 인증서 1건, 연결 실패/네트워크 9건이 주류다. 일부는 개교예정, 폐교/분교, 방송통신 부설, 학력인정/외국인학교 원천 주소 문제다.
- `no_notice_candidates` 60건: Playwright 렌더링 후에도 공지 후보를 식별하지 못한 외국인학교/특수 목적 자체 사이트, 폐교/분교, 임시/통합 전환 페이지가 주류다.
- `found_notice_page` 17건: 후보 메뉴는 확인되지만 사이트별 자체 게시판 제목/본문 구조가 특수하거나 외부 CMS/영문 뉴스/공지 섹션이라 일반 학교 CMS 추출기로 item 확정이 어려운 케이스다.

잔여 유형별 세부 분류:

| 상태 | 유형 | 건수 | 해석 |
|---|---|---:|---|
| `homepage_fetch_error` | host 없음/잘못된 NEIS 홈페이지 | 70 | `http://` 등 URL 자체가 유효하지 않음 |
| `homepage_fetch_error` | DNS 미해결/종료 도메인 | 98 | 도메인 만료, 폐쇄, 오타성 주소 |
| `homepage_fetch_error` | timeout | 19 | 반복 브라우저 접근에서도 응답 없음 |
| `homepage_fetch_error` | address unreachable | 9 | 네트워크 레벨 접속 불가 |
| `homepage_fetch_error` | 기타 fetch 오류 | 1 | 개별 오류 |
| `no_notice_candidates` | 외국인/국제학교 표준 공지 없음 | 10 | 영문/외부 CMS 중심, 학교 공지 게시판 구조 부재 |
| `no_notice_candidates` | 경북 `school.gyo6.net` intro/temp | 14 | 임시/소개 페이지로 공지 링크 미노출 |
| `no_notice_candidates` | 공식 학교 사이트이나 공지 링크 미노출 | 15 | Playwright 렌더링 후에도 후보 링크 0건 |
| `no_notice_candidates` | 기타 reachable site no notice | 21 | 자체/폐쇄/임시 페이지 |
| `found_notice_page` | 외국인/국제학교 비표준 공지/뉴스 | 9 | 공지 후보는 있으나 날짜형 게시글 item으로 확정 불가 |
| `found_notice_page` | 외부/비공지 링크 오탐 | 2 | YouTube, gov.kr 등 NEIS 홈페이지 주소 또는 후보 오염 |
| `found_notice_page` | 브라우저 접속 실패 | 4 | 후보 URL은 있으나 HTTPS/브라우저 접근 실패 |
| `found_notice_page` | 잔여 자체 게시판 미파싱 | 2 | 추가 사이트별 adapter 없이는 item 확정 어려움 |

최종 교육청별 잔여:

| 교육청 | 최종 성공 | 잔여 |
|---|---:|---:|
| B10 서울 | 1,368 | 46 |
| C10 부산 | 630 | 33 |
| D10 대구 | 479 | 5 |
| E10 인천 | 569 | 11 |
| F10 광주 | 322 | 13 |
| G10 대전 | 322 | 2 |
| H10 울산 | 252 | 3 |
| I10 세종 | 109 | 0 |
| J10 경기 | 2,607 | 57 |
| K10 강원 | 643 | 6 |
| M10 충북 | 502 | 11 |
| N10 충남 | 730 | 15 |
| P10 전북 | 735 | 31 |
| Q10 전남 | 854 | 13 |
| R10 경북 | 920 | 18 |
| S10 경남 | 1,004 | 10 |
| T10 제주 | 201 | 0 |

반복 실행 명령:

```bash
set -a; source .env; set +a
uv run --with 'scrapling[fetchers]' python3 scripts/neis_homepage_notice_probe.py \
  --all-offices --limit 0 --max-notice-pages 3 --fetch-timeout 8 \
  --workers 8 --max-in-flight 16 --checkpoint-every 50 \
  --sleep 0.02 --resume --quiet-skips \
  --retry-status homepage_fetch_error \
  --retry-status no_notice_candidates \
  --retry-status found_notice_page \
  --json-output tmp/neis_homepage_notice_all_schools_probe.json \
  --md-output docs/neis_homepage_notice_all_schools_probe.md

uv run --with playwright --with 'scrapling[fetchers]' python3 scripts/neis_playwright_recover_notices.py \
  --json-output tmp/neis_homepage_notice_all_schools_probe.json \
  --status no_notice_candidates \
  --status found_notice_page \
  --status homepage_fetch_error \
  --workers 4 --max-notice-pages 3 --timeout-ms 30000
```
