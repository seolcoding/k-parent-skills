# NEIS Homepage Notice Handoff

- Last updated: 2026-05-31 KST
- Scope: 전국 NEIS `schoolInfo.HMPG_ADRES` 12,521개 학교 행의 홈페이지/공지사항 수집 가능성 반복 검증
- Current source of truth: `tmp/neis_homepage_notice_all_schools_probe.json`
- Human-readable report: `docs/neis_homepage_notice_all_schools_probe.md`
- Audit/history: `docs/neis_homepage_notice_all_schools_first_run_audit.md`

## Current Status

| Metric | Value |
|---|---:|
| NEIS school rows checked | 12,521 |
| `parsed_notices` | 12,247 |
| `homepage_fetch_error` | 197 |
| `no_notice_candidates` | 60 |
| `found_notice_page` | 17 |
| Parsed notice items | 101,110 |
| Browser-recovered rows | 581 |

Final residual: 274 rows. These were repeatedly retried with Scrapling and Playwright. The remaining rows are mostly invalid NEIS homepage URLs, DNS/closed domains, timeouts, foreign/international school nonstandard pages, temp/intro pages, or external-link false positives.

## Files To Preserve

- `scripts/neis_homepage_notice_probe.py`: main Scrapling/urllib probe, resume/retry logic, CMS-specific extractors.
- `scripts/neis_playwright_recover_notices.py`: Playwright DOM recovery for JS-rendered or Scrapling-invisible pages.
- `tmp/neis_homepage_notice_all_schools_probe.json`: current 70 MB result JSON. This is the authoritative machine-readable state.
- `tmp/neis_homepage_notice_all_schools_probe.first_pass_12519.json`: first-pass 55 MB backup before later recovery passes.
- `docs/neis_homepage_notice_all_schools_probe.md`: generated summary/table from the current JSON.
- `docs/neis_homepage_notice_all_schools_first_run_audit.md`: narrative audit and commands.

Do not assume every dirty file in the repository belongs to this NEIS work. The worktree contains many unrelated pre-existing changes and moves. Only the files above plus this handoff document are part of the NEIS homepage notice probe handoff.

## Important Implementation Notes

- Resume identity is composite: `officeCode + schoolCode + schoolName + schoolKind + homepage`. Do not simplify it to `schoolCode`; NEIS has blank school-code and duplicate-code edge cases.
- `fetch_with_http_fallback` prefers `urllib` for fragile Korean school domains and falls back from HTTPS to HTTP where useful.
- `best_html_encoding` detects Korean legacy pages mislabeled as UTF-8 and falls back to CP949/EUC-KR when that produces fewer replacement characters.
- `homepage_variant_urls` handles `/main.do`, `/{slug}/main.do`, and Busan `school.busanedu.net/<slug>/main.do`/`intro.do`.
- `homepage_redirect_urls` follows script/meta redirects such as `location.href='/intro.do'`.
- Extractors currently in use:
  - `static_link`
  - `dggb_ajax`
  - `boardcnts_go_view`
  - `select_ntt_data_id`
  - `dated_board_row`
- Playwright recovery accepts `--status`, `--office`, and `--school`. Use `--school` for targeted recalculation after an extractor change.

## Residual Classification

| Status | Type | Count |
|---|---|---:|
| `homepage_fetch_error` | host 없음/잘못된 NEIS 홈페이지 | 70 |
| `homepage_fetch_error` | DNS 미해결/종료 도메인 | 98 |
| `homepage_fetch_error` | timeout | 19 |
| `homepage_fetch_error` | address unreachable | 9 |
| `homepage_fetch_error` | 기타 fetch 오류 | 1 |
| `no_notice_candidates` | 외국인/국제학교 표준 공지 없음 | 10 |
| `no_notice_candidates` | 경북 `school.gyo6.net` intro/temp | 14 |
| `no_notice_candidates` | 공식 학교 사이트이나 공지 링크 미노출 | 15 |
| `no_notice_candidates` | 기타 reachable site no notice | 21 |
| `found_notice_page` | 외국인/국제학교 비표준 공지/뉴스 | 9 |
| `found_notice_page` | 외부/비공지 링크 오탐 | 2 |
| `found_notice_page` | 브라우저 접속 실패 | 4 |
| `found_notice_page` | 잔여 자체 게시판 미파싱 | 2 |

Remaining `found_notice_page` rows as of this handoff:

- B10 덜위치칼리지서울영국학교: foreign school, chat/marketing page candidate.
- B10 서울드와이트외국인학교: foreign school, IB page candidate.
- B10 아시아퍼시픽국제외국인학교: foreign school, blog/update board without standard dated rows.
- B10 한국외국인학교: foreign school, bidding notice page.
- B10 한국영등포화교소학교: Chinese/Korean notice board, nonstandard item/date structure.
- C10 부산국제외국인학교: Google Docs/policy links, no dated school notice row.
- C10 부산외국인학교: Instagram/CDN candidate false positive.
- C10 남성초등학교: `nisb.kr` non-NEIS site, `NS DAILY & NEWS` no standard dated rows.
- F10 광주중앙초등학교: browser HTTPS connection refused; static HTTP may show old CP949 menu but not reliable.
- F10 광주동초등학교: browser HTTPS connection refused and candidate URL is malformed external Wee link.
- F10 일곡초등학교: browser HTTPS connection refused; old HTTP board candidate is not the main public notice board.
- E10 채드윅송도국제학교: international school, board/news page not standard school notice.
- J10 고양외국어고등학교: site reports homepage server work/maintenance.
- H10 울산현대국제외국인학교: statutory notices page, no standard dated notice rows.
- J10 시흥매화고등학교: browser timeout / error page.
- N10 천안남산초등학교: NEIS homepage points to `gov.kr`, wrong source address.
- R10 경북기계금속고등학교: temp page exposes YouTube only, no school notice board.

## Reproduction Commands

Load the NEIS API key before full Scrapling runs:

```bash
set -a
source .env
set +a
```

Resume without changing already completed rows:

```bash
uv run --with 'scrapling[fetchers]' python3 scripts/neis_homepage_notice_probe.py \
  --all-offices --limit 0 --max-notice-pages 3 --fetch-timeout 8 \
  --workers 8 --max-in-flight 16 --checkpoint-every 50 \
  --sleep 0.02 --resume --quiet-skips \
  --json-output tmp/neis_homepage_notice_all_schools_probe.json \
  --md-output docs/neis_homepage_notice_all_schools_probe.md
```

Retry residual statuses with Scrapling:

```bash
uv run --with 'scrapling[fetchers]' python3 scripts/neis_homepage_notice_probe.py \
  --all-offices --limit 0 --max-notice-pages 3 --fetch-timeout 8 \
  --workers 8 --max-in-flight 16 --checkpoint-every 50 \
  --sleep 0.02 --resume --quiet-skips \
  --retry-status homepage_fetch_error \
  --retry-status no_notice_candidates \
  --retry-status found_notice_page \
  --json-output tmp/neis_homepage_notice_all_schools_probe.json \
  --md-output docs/neis_homepage_notice_all_schools_probe.md
```

Retry residual statuses with Playwright:

```bash
uv run --with playwright --with 'scrapling[fetchers]' python3 scripts/neis_playwright_recover_notices.py \
  --json-output tmp/neis_homepage_notice_all_schools_probe.json \
  --status no_notice_candidates \
  --status found_notice_page \
  --status homepage_fetch_error \
  --workers 4 --max-notice-pages 3 --timeout-ms 30000
```

Target one school after changing an extractor:

```bash
uv run --with playwright --with 'scrapling[fetchers]' python3 scripts/neis_playwright_recover_notices.py \
  --json-output tmp/neis_homepage_notice_all_schools_probe.json \
  --status found_notice_page \
  --school 한국영등포화교소학교 \
  --workers 1 --max-notice-pages 5 --timeout-ms 30000
```

## Verification Commands

Syntax check:

```bash
python3 -m py_compile scripts/neis_homepage_notice_probe.py scripts/neis_playwright_recover_notices.py
```

JSON integrity:

```bash
python3 - <<'PY'
import json
from pathlib import Path
j = json.loads(Path("tmp/neis_homepage_notice_all_schools_probe.json").read_text())
assert len(j["results"]) == j["summary"]["schools"] == sum(j["summary"]["officeCounts"].values())
assert sum(j["summary"]["statusCounts"].values()) == j["summary"]["schools"]
print("integrity ok", j["summary"]["schools"], j["summary"]["statusCounts"], j["summary"]["parsedNoticeCount"])
PY
```

Secret leak check:

```bash
python3 - <<'PY'
from pathlib import Path
key = ""
for line in Path(".env").read_text(errors="ignore").splitlines():
    if line.startswith("KEDU_INFO_KEY="):
        key = line.split("=", 1)[1].strip().strip("\"'")
        break
paths = [
    "scripts/neis_homepage_notice_probe.py",
    "scripts/neis_playwright_recover_notices.py",
    "docs/neis_homepage_notice_all_schools_probe.md",
    "docs/neis_homepage_notice_all_schools_first_run_audit.md",
    "docs/neis_homepage_notice_handoff.md",
    "tmp/neis_homepage_notice_all_schools_probe.json",
]
for path in paths:
    text = Path(path).read_text(errors="ignore")
    if key and key in text:
        raise SystemExit(f"secret leaked in {path}")
    print(path, "ok")
PY
```

## Next Work Options

The current nationwide goal is complete. Further improvement should be treated as a new, narrower task:

- Build site-specific adapters for the 2 remaining custom `found_notice_page` rows.
- Manually correct NEIS source homepage URLs for `gov.kr`, `http://`, typo domains, and closed domains.
- Add a separate body/attachment crawler for schools already classified as `parsed_notices`.
- Convert the 70 MB JSON into a smaller indexed artifact if this needs to be committed or shared.
