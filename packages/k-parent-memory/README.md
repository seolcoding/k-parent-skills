# k-parent-memory

Privacy-minimized memory contracts for K-Parent Skills.

The package separates TTL session context, user-controlled profile references,
public knowledge cache records, and HITL approval/audit records. Its built-in
store is in-memory and process-local; production persistence must implement the
same contract with authentication, encryption, tenant isolation, and retention
controls.

See [`docs/memory.md`](../../docs/memory.md).
