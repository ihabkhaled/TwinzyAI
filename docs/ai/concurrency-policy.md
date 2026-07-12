---
id: ai-concurrency-policy
title: AI Concurrency Policy
type: doc
authority: canonical
status: current
owner: repository owner
summary: Request-level concurrency caps, the bounded FIFO queue, overload behavior, and the rate limits that bound how much AI work one process accepts.
keywords: [ai, concurrency, limits, queue, overload, rate-limit, throttle, admission]
contextTier: 2
relatedCode: [apps/api/src/core/streaming/concurrency-limiter.service.ts, apps/api/src/config/env-bounds.constants.ts, apps/api/src/modules/game/model/game.constants.ts, apps/api/src/core/rate-limit/rate-limit.vendor.ts]
relatedTests: [apps/api/src/tests/game-stream-isolation.integration.test.ts]
relatedDocs: [docs/ai/cost-policy.md, docs/ai/retry-timeout-policy.md, docs/env-vars.md]
readWhen: You are tuning concurrency/queue caps, changing throttles, or debugging SERVER_BUSY rejections.
---

# AI Concurrency Policy

AI work is the expensive path, so admission is controlled **before** any provider call. Two
mechanisms stack: analysis concurrency caps and HTTP rate limits.

## Analysis concurrency caps (the AI-work gate)

Enforced by
[`apps/api/src/core/streaming/concurrency-limiter.service.ts`](../../apps/api/src/core/streaming/concurrency-limiter.service.ts)
— a bounded FIFO queue with in-band `SERVER_BUSY` rejection, in-memory and single-process by
design (the API is stateless, no database). Defaults/bounds from
[`env-bounds.constants.ts:46-58`](../../apps/api/src/config/env-bounds.constants.ts):

| Env var | Default (max bound) | Scope |
| --- | --- | --- |
| `MAX_GLOBAL_ACTIVE_ANALYSES` | 50 (10 000) | Whole process |
| `MAX_ACTIVE_ANALYSES_PER_IP` | 3 (1 000) | Per client IP |
| `MAX_ACTIVE_ANALYSES_PER_TAB` | 1 (100) | Per browser tab (correlation ids) |
| `MAX_ANALYSIS_QUEUE_SIZE` | 100 (10 000) | Waiting-room size; overflow rejected `SERVER_BUSY` |

Queue waits are bounded by the pipeline watchdog `ANALYSIS_TIMEOUT_MS`
([retry-timeout-policy.md](retry-timeout-policy.md)). Duplicate in-flight requests are rejected
by `StreamRegistry.isRequestActive` before admission
(`apps/api/src/modules/game/api/game-stream.presenter.ts`).

## HTTP rate limits

- Global throttler: `RATE_LIMIT_TTL_MS` / `RATE_LIMIT_MAX` (defaults 60 000 ms / 30 —
  `env-bounds.constants.ts:15-21`), wired through the wrapped vendor surface
  `apps/api/src/core/rate-limit/` (controllers import `Throttle` from core, never
  `@nestjs/throttler` directly — `rate-limit.vendor.ts`).
- Per-route throttles (`apps/api/src/modules/game/model/game.constants.ts`):
  `ANALYZE_THROTTLE` 10/min, `TRANSLATE_THROTTLE` 10/min, `CANCEL_THROTTLE` 60/min.

## Overload behavior

- Queue full or caps exceeded ⇒ in-band `SERVER_BUSY` rejection (streamed as an error frame on
  the SSE path — `game/lib/game-stream.ts`), not a hung connection.
- Every admitted run holds its slot until the presenter's guaranteed cleanup releases it
  (slot/registry/stream cleanup in `game-stream.presenter.ts`), so aborts and crashes cannot leak
  capacity.

These caps are also the primary cost lever — see [cost-policy.md](cost-policy.md).
