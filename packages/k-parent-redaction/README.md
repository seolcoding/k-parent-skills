# k-parent-redaction

Zero-dependency, JSON-safe redaction for K-Parent log, trace, and error
payloads. The package recursively copies input, removes credentials and
child/family identity fields, handles circular references, and bounds the data
that can reach an observability sink.

## Usage

```js
const {
  createSanitizedLogger,
  sanitize,
  sanitizeError,
} = require("k-parent-redaction");

const safePayload = sanitize({
  sourceUrl: "https://data.example.org/notices/42",
  fetchedAt: "2026-08-01T00:00:00.000Z",
  authorization: "example-credential-value",
});

const safeError = sanitizeError(new Error("public failure"));
const logger = createSanitizedLogger(console);
logger.info("notice fetched", safePayload);
logger.error(safeError);
```

`createSanitizedLogger(logger, options)` wraps the logger's `trace`, `debug`,
`info`, `log`, `warn`, and `error` methods when present. Only sanitized argument
copies are passed to the original methods. Credential-bearing printf-style log
calls such as `password=%s` are conservatively redacted with all following
arguments so a standalone credential cannot be reconstructed by the sink.

## Redaction policy

Keys are Unicode NFKC-normalized, lowercased, and stripped of punctuation and
spacing before comparison. Credential keys, child/family identity keys, raw
family-dialogue/document/OCR keys, and request/response body keys are replaced
with `[REDACTED]` without reading their values. Generic identity leaves such as
`name` and `email` are also blocked inside a child/family container, while fields
such as age and grade remain useful. Strings containing a
Bearer value, JWT shape, cookie header, labeled API key or credential, or a
well-known credential prefix are also replaced.

Public HTTP(S) provenance in URL fields is retained. Userinfo is removed and
sensitive query parameters, path segments, and fragments are masked. ISO
timestamp strings and `Date` values are retained. Binary content is represented
only by its byte length.

Defaults are:

- maximum depth: 8
- maximum visited entries: 500
- maximum string length: 2,048 characters
- maximum serialized payload: 64 KiB

Override them with `maxDepth`, `maxEntries`, `maxStringLength`, and
`maxPayloadBytes`. Truncation and circular markers are JSON-safe strings. The
input is never mutated, and property getters behind forbidden keys are not
invoked.

This module is a final observability safety boundary, not a replacement for
data minimization. Applications should still avoid constructing log payloads
from credentials, raw child data, or family dialogue.

## Development

```sh
npm run lint
npm test
```
