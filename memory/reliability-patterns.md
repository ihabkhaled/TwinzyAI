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

## Provider resilience doctrine: immediate model-fallback, not retry-with-backoff

The Gemini adapter resolves a **retryable** failure (transient/5xx/timeout) by falling through
to the **next model** in the configured chain immediately — content-level fallback across the
model list, bounded per-model by `GEMINI_TIMEOUT_MS`. This is deliberate, and the classic
resilience patterns are intentionally **not** used here:

- **No jittered retry/backoff on the same model.** The whole pipeline runs while a user watches
  an SSE stream; inserting backoff delays between attempts would add visible latency to an
  interactive flow whose explicit product goal is a fast, transparent loading experience.
  Falling straight to a different model both recovers *and* stays fast. Backoff/jitter is the
  right tool for high-throughput background work against a rate-limited dependency — not for a
  single interactive request.
- **No circuit breaker.** Instances are stateless and per-request; there is no shared hot loop
  hammering one model, so there is no thundering herd to trip a breaker on. A breaker would add
  cross-request state (the thing the stateless design avoids) for no workload that needs it.
- **When these WOULD apply:** if a future path does fan-out or background batch calls against
  the provider, add jittered exponential backoff there and reconsider a breaker — but keep the
  interactive request path on immediate fallback. Terminal non-retryable failures still surface
  as the typed `IntegrationError` envelope so the UI shows a friendly, stage-aware message.

## Bounded parallel recall (ADR-004, flag-gated OFF)

The flag-gated parallel candidate-recall fan-out follows the same fail-safe doctrine:

- **Per-step `Semaphore` gate** (`core/concurrency/semaphore.ts` via `AiStepConcurrencyGate`) bounds
  concurrent provider calls across all analyses — never an unbounded `Promise.all`.
- **`Promise.allSettled` fan-out**: one failed or permit-timed-out lane is dropped, never failing
  the analysis; an empty merge falls back exactly as the single-call path.
- **Abort propagation**: the analysis `AbortSignal` threads into every lane and its gate wait; a
  queued lane whose signal aborts never starts.
- **Deterministic merge** by canonical name (keep higher score, order score-desc then name-asc) so
  results are stable regardless of lane finish order.

Owners: [ADR-004](../architecture/adrs/adr-004-parallel-ai-pipeline.md),
[concurrency-policy.md](../docs/ai/concurrency-policy.md).
