# Canonical paths

## Repository-owned artifacts

Use repository-relative paths for files and directories owned by
`k-parent-skills`. The registry points to the implementation; it never becomes a
second copy of that implementation.

Examples:

- `skills/k-parent-school-info/SKILL.md`
- `packages/k-parent-source-neis`
- `scripts/neis_homepage_notice_probe.py`
- `apps/k-parent-quiz-app`

## Ignored generated artifacts

Generated raw data under `tmp/` may be recorded with `tracking: ignored` when it
is useful local evidence. CI does not require an ignored path to exist. A
tracked report, generator, or schema must be linked when one exists.

## External and archived artifacts

Absolute paths are allowed only for local archive assets outside the repository.
Use `tracking: external` and either `availability: archived` or
`availability: remote-pointer`. Do not copy an archive solely to make the path
repository-relative.

Artifacts that no longer exist locally use `availability: historical-evidence`
and `tracking: git-history`. Their evidence path belongs in `evidence`, while
`canonicalPath` records the last known path or remote identity.

## Aliases and duplicates

- `aliases` records compatibility paths or former locations.
- `duplicateOf` identifies byte-identical or semantically identical copies.
- `supersedes` identifies an intentional replacement.

Only one registry item may claim canonical ownership of the same artifact.
