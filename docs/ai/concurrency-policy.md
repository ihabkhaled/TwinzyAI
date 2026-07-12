---
id: ai-concurrency-policy
title: AI Concurrency Policy
type: doc
authority: canonical
status: current
owner: repository owner
summary: Request-level concurrency caps, the bounded FIFO queue, overload behavior, the rate limits that bound how much AI work one process accepts, and the flag-gated parallel candidate-recall fan-out with its global per-step gate and per-analysis call budget.
keywords: [ai, concurrency, limits, queue, overload, rate-limit, throttle, admission, parallel, fan-out, lanes, semaphore, gate, call-budget]
contextTier: 2
relatedCode: [apps/api/src/core/streaming/concurrency-limiter.service.ts, apps/api/src/config/env-bounds.constants.ts, apps/api/src/modules/game/model/game.constants.ts, apps/api/src/core/rate-limit/rate-limit.vendor.ts, apps/api/src/core/concurrency/semaphore.ts, apps/api/src/modules/ai/application/ai-step-concurrency.gate.ts, apps/api/src/modules/ai/application/candidate-recall.service.ts]
relatedTests: [apps/api/src/tests/game-stream-isolation.integration.test.ts, apps/api/src/modules/ai/tests/candidate-recall.service.test.ts, apps/api/src/core/concurrency/tests/semaphore.test.ts]
relatedDocs: [docs/ai/cost-policy.md, docs/ai/retry-timeout-policy.md, docs/env-vars.md, architecture/adrs/adr-004-parallel-ai-pipeline.md]
readWhen: You are tuning concurrency/queue caps, changing throttles, tuning the parallel candidate-recall fan-out, or debugging SERVER_BUSY rejections.
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

## Parallel candidate-recall fan-out (Release A, flag-gated)

A second, **inner** concurrency layer applies only when `AI_PARALLEL_PIPELINE_ENABLED=true`
(default `false`; see [ADR-004](../../architecture/adrs/adr-004-parallel-ai-pipeline.md)). It bounds
the fan-out of the text-only candidate-recall step — it does **not** replace the admission caps
above, which still gate whole analyses.

[`CandidateRecallService`](../../apps/api/src/modules/ai/application/candidate-recall.service.ts)
owns the single-vs-parallel strategy: flag off ⇒ one unchanged generation call; flag on ⇒ fan out
into `AI_GENERATION_LANES` text-only lanes (each a distinct recall focus). Two bounds keep this
safe under load:

| Bound | Env var (default, range) | Enforced by |
| --- | --- | --- |
| Global concurrent generation calls across ALL analyses | `AI_GENERATION_CONCURRENCY` (2, 1–16) | [`AiStepConcurrencyGate`](../../apps/api/src/modules/ai/application/ai-step-concurrency.gate.ts) — a process-global [`Semaphore`](../../apps/api/src/core/concurrency/semaphore.ts) per pipeline step |
| Lanes per analysis | `AI_GENERATION_LANES` (2, 1–6) | `CandidateRecallService` lane plan |
| Total provider calls per analysis (extraction + lanes + judge) | `AI_MAX_CALLS_PER_ANALYSIS` (5, 3–20) | lane count clamped to `budget − 2`, with a warning log (never a silent cap) |
| Max wait for a concurrency permit before a lane is dropped | `AI_PARALLEL_QUEUE_TIMEOUT_MS` (30 000, 1000–120 000) | the `Semaphore` acquire timeout |
| Global concurrent judge calls (provisioned for the Release B tournament) | `AI_JUDGE_CONCURRENCY` (1, 1–16) | the gate's judge `Semaphore` |

Behavior guarantees:

- The gate is a NestJS singleton, so its per-step permit pool bounds concurrency across **all**
  simultaneous analyses — a burst of parallel analyses can never multiply generation calls without
  limit.
- Fan-out uses `Promise.allSettled`: a lane that fails or times out waiting for a permit is
  dropped, never fails the analysis. An empty merge falls back exactly as the single-call path does.
- The analysis `AbortSignal` threads into every lane and its gate wait; a queued lane whose signal
  aborts never starts.
- Extraction (image) and judging still run **exactly once** — parallelism never widens the
  [image boundary](written-traits-only-boundary.md).

The parallel path is the primary latency lever and a cost multiplier — see
[cost-policy.md](cost-policy.md) and [latency-budget.md](latency-budget.md).
