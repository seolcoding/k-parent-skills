# Local pointer map

Public SSOT registries use redacted `local://` identifiers for machine-specific
archives and private documents. Resolve them only through
`ssot/local/paths.json`, which is gitignored and must never be committed.

Expected local shape:

```json
{
  "schemaVersion": 1,
  "paths": {
    "local://archives/example": "/absolute/path/kept-only-on-this-machine"
  }
}
```

Do not place secrets, auth state, raw personal conversations, or copied archive
contents in this directory.
