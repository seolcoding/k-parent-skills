# k-parent-memory

Privacy-minimized memory contracts for K-Parent Skills.

The package separates TTL session context, user-controlled profile references,
public knowledge cache records, and HITL approval/audit records. It provides the
original process-local in-memory store and a zero-dependency encrypted durable
file adapter. Both stores pass writes through the same allowlisted
`createMemoryRecord` validation.

## Encrypted durable store

`createEncryptedFileStore` binds every instance to one tenant and one namespace.
The caller must inject an exact 32-byte key and an explicit file path; the key is
kept in memory only and is never written to the envelope.

```js
const { randomBytes } = require("node:crypto");
const {
  MEMORY_SCOPE,
  createEncryptedFileStore,
} = require("k-parent-memory");

const store = createEncryptedFileStore({
  filePath: "/var/lib/k-parent/memory.enc",
  encryptionKey: randomBytes(32), // Load from a secret store in real use.
  tenantId: "parent-account-123",
  namespace: "family-calendar",
});

store.set({
  scope: MEMORY_SCOPE.SESSION,
  key: "calendar-region",
  value: { region: "서울" },
});

store.exportNamespace(); // Records from this tenant + namespace only.
store.deleteNamespace(); // Deletes this namespace only.
store.revokeConsent(); // Consent withdrawal deletes this namespace's records.
```

The adapter stores one AES-256-GCM authenticated envelope, replaces it
atomically after successful writes, and enforces mode `0600`. Reads, lists, and
exports remove expired records from the durable file; `cleanupExpired()` is
also available for an explicit sweep of the bound namespace. Authentication
failure (including the wrong key or file tampering) throws without logging raw
records. Keep the key outside the data directory and provide separate access
control, backup, and key-rotation policy when integrating this local adapter.

See [`docs/memory.md`](../../docs/memory.md).
