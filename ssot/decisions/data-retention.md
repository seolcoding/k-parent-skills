# Data retention and sensitivity

## Commit to Git

- Schemas, small public fixtures, deterministic generated assets, source code,
  and human-readable reports intended for review.
- Registry metadata such as record counts, hashes, sizes, public provenance,
  and confirmation dates.

## Keep ignored or external

- Large crawl results and intermediate extraction files under `tmp/`.
- Browser screenshots, downloaded source documents, and temporary curriculum
  extraction outputs unless they are intentionally promoted as reviewed source
  material.
- Videos, audio, PDFs, and archived repositories already preserved elsewhere.

## Never register as content

- API keys, passwords, cookies, auth profiles, session state, raw headers, or
  credential-bearing URLs.
- Raw private family conversations, student records, child names, birth dates,
  identifiers, or learner telemetry.
- SQLite/database state, personal exports, or opaque backups.

Pointers to personal or access-controlled documents may be registered only with
`sensitivity: personal-pointer`; omit account identifiers, document bodies, and
access tokens.

## Dialogue fixtures

Parent-child dialogue tests must use synthetic cases by default. Any later use
of real family material requires explicit consent, minimization, redaction,
retention limits, and a separate restricted-data review.
