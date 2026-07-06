# Skill: Add an Event Handler

> Status: not applicable today — Twinzy has no events, queues, or message bus by standing
> decision (memory/architecture-decisions.md); the analyze flow is one synchronous
> request/response. This is the binding pattern the moment an event mechanism is
> introduced.

1. Wrap the bus once behind an adapter in `src/core`; business code never imports the
   vendor emitter (`architecture/no-raw-library-imports`), and the vendor gets its entry in
   `eslint/package-boundaries.config.mjs`.
2. Event names are `as const` constants in the PUBLISHING module's `model/`; payloads are
   typed there too — identifiers, facts, and the request id only. Never full entities, and
   never image or trait payloads (memory/privacy-decisions.md).
3. The handler lives in the CONSUMING module and delegates to a service; the handler itself
   stays thin — putting it in the publisher reintroduces the coupling events exist to
   remove.
4. Fail-safe: the handler catches and logs its own errors via `AppLogger` — a delivery
   failure never breaks or rolls back the publisher (rules/08).
5. Idempotent: dedupe on a stable key; re-delivery must not double-apply the effect.
6. Emit only AFTER the primary work has completed; never await fan-out inside the request
   path.
7. Tests: handler success, adapter-failure-swallowed (the publisher still resolves), and a
   listener-count assertion — a silently unregistered handler must fail CI, not production.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
