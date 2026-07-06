# Reliability Patterns

Rule: [/rules/08-reliability-durability.md](../rules/08-reliability-durability.md).

- **finally-based cleanup** for the image buffer — the zero-fill runs on success and every
  failure path. This is the one cleanup that is never optional.
- **Fail-closed virus scanning**: ClamAV enabled + unreachable rejects the upload (clamd
  INSTREAM TCP adapter in `modules/file-security/adapters/`) — never fail open in production
  ([security-decisions.md](./security-decisions.md)).
- **Hard timeouts on the only external dependency**: Gemini calls are bounded by
  `GEMINI_TIMEOUT_MS` via AbortController; a hung provider becomes a typed `IntegrationError`
  (502), not a hung request.
- **Fail-fast startup**: the zod env schema validates at boot; a misconfigured instance dies
  immediately instead of failing on the first request
  ([backend-stack.md](./backend-stack.md)).
- **Typed error envelope**: the `AppError` hierarchy maps to a sanitized, stable envelope —
  legacy `ErrorCode` kept, `messageKey` additive — so the frontend can always render a friendly
  i18n message ([architecture-decisions.md](./architecture-decisions.md)).
- **In-process, fail-safe side effects only**: no queues/broker by design; anything beyond the
  primary response is try/caught, logged, and never rethrown into the request flow
  ([event-notification-decisions.md](./event-notification-decisions.md)).
- **Stateless instances**: nothing persisted ([database-decisions.md](./database-decisions.md)),
  so restart/redeploy is always safe and horizontal scaling needs no coordination.
- Health endpoints wired into Docker healthchecks; readiness reflects critical adapters.
