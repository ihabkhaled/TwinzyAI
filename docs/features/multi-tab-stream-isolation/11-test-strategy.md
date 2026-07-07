# 11 - Test Strategy & Coverage Plan

## Requirement → test mapping

| AC | Test(s) | Layer |
| --- | --- | --- |
| AC-1.1 frame envelope + client filtering | `game-stream-lib` (stamp/status), `game-stream.presenter` (envelope on every frame), `game-stream-isolation.integration` (echo), web `stream-frame.helper` (filter), web `game-stream.gateway` (drops foreign requestId) | shared-unit / api-unit / api-integration / web-unit |
| AC-1.2 stable per-tab id | web `stream-identity.helper` (stable + persisted) | web-unit |
| AC-2.1 global/per-IP/per-tab caps | `concurrency-limiter.service` (each cap independently) | api-unit |
| AC-2.2 queue full → busy | `concurrency-limiter.service` (busy when queue full), `game-stream.presenter` (SERVER_BUSY, status rejected) | api-unit |
| AC-2.3 queued waiter times out | `concurrency-limiter.service` (watchdog rejects queued waiter) | api-unit |
| AC-2.4 stuck run bounded | `game-stream.presenter` (watchdog → AI_TIMEOUT / failed) | api-unit |
| AC-3.1 disconnect → abort + wipe | `game-stream.presenter` (disconnect → silent, cleanup), image-wipe covered by existing analyze-stream integration + `finally` | api-unit / api-integration |
| AC-3.2 cancel id-matching | `stream-registry.service` (all-3-ids match), `cancel-analysis.use-case`, `game-stream-isolation.integration` (unknown → cancelled:false; bad body → 400) | api-unit / api-integration |
| AC-3.3 terminal status classification | `game-stream-lib` (resolveStreamTermination cancel/timeout/disconnect/error), `game-stream.presenter` (cancel → cancelled) | api-unit |
| AC-4.1 no regression | existing `game-analyze-stream.integration` (6 tests) + camera/cors/rate-limit suites still green | api-integration / web-unit |
| AC-4.2 bare frame valid | `stream-contract` (shared), `stream-frame.helper` (bare accepted) | shared-unit / web-unit |

## Negative / edge cases covered

- Duplicate in-flight `requestId` → rejected + slot released (`game-stream.presenter`).
- Malformed / non-uuid correlation id header → server mints a fallback (`stream-correlation` +
  `resolveCorrelationId` test).
- Release idempotency (double release does not corrupt counts) — `concurrency-limiter.service`.
- TTL sweep reaps only expired entries and aborts them — `stream-registry.service`.
- Cancel with a mismatching tab/request/stream id → no-op, no abort — `stream-registry.service`.

## Coverage gate

- New logic-bearing files added to the vitest coverage `include`:
  `core/streaming/concurrency-limiter.service.ts`, `core/streaming/stream-registry.service.ts`.
  The gated `modules/**/application` + `modules/**/lib` globs already capture the new use-case,
  presenter helpers (`lib/game-stream.ts`, `lib/stream-correlation.ts`), and pipeline changes.
- Thresholds unchanged (95 stmts / 90 branches / 95 funcs / 95 lines, global).
- `apps/web` remains un-gated (waived to the web workstream) but new web logic is unit-tested.

## Determinism

- Time controlled via `vi.useFakeTimers()` (registry sweep) and small real timeouts (limiter
  watchdog, 20 ms). Randomness (UUIDs) asserted by format, not value. No arbitrary sleeps.

## Evidence

See [15-dev-validation-report.md](15-dev-validation-report.md) for the executed gate results.
