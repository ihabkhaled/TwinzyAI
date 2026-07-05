# 08 — Reliability & Durability

- Fail closed on security checks (ClamAV enabled but unreachable in production means reject).
- Cleanup in finally — buffer wipe runs on success and failure.
- Graceful shutdown hooks enabled; health endpoint for orchestration.
- Retries only where idempotent; the analyze pipeline is not auto-retried server-side.
- User always gets a friendly, actionable error; never a hung request (timeouts everywhere).
