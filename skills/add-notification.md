# Skill: Add a Notification

> Status: not applicable today — Twinzy has no accounts, addresses, or channels to notify,
> and no events/queues by standing decision (memory/architecture-decisions.md,
> memory/privacy-decisions.md). Recipient data would be personal data: an ADR plus privacy
> review precedes ANY of this. This is the binding pattern if a channel is ever approved.

1. Channel enum (`as const` + `*_VALUES`) and payload types live in `model/` — no inline
   shapes.
2. The provider hides behind an adapter in `adapters/` with a port interface in `model/`;
   the vendor SDK never appears in business code and gets its
   `eslint/package-boundaries.config.mjs` entry (add-library.md).
3. Trigger through a domain event after the main work completes (add-event-handler.md) —
   never inline in a service call path; delivery latency must not touch the request.
4. Delivery is fail-safe: the handler catches provider failures, logs via `AppLogger`, and
   never fails the originating request. Provider keys come through the Zod env schema and
   typed config (add-config-value.md) — misconfiguration fails at boot, not at first send.
5. Copy follows the i18n discipline (add-i18n-message-key.md); recipient identity comes
   from verified server-side data, never from client input; PII is redacted from every log.
6. Tests: adapter mapping, fail-safe swallow (provider down -> request still succeeds),
   per-locale rendering, and the subscriber-count assertion.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
