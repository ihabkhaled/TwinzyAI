# 11 - Test Strategy

## Approach

All new behavior is exercised by **deterministic fake-adapter unit tests** — the repo's standard
approach, no live provider — with controlled time (fake timers) and no arbitrary sleeps. The privacy
boundary (zero image calls on lanes/judge) is asserted directly, not assumed.

## Requirement → test mapping

| AC | Test(s) | Layer |
| --- | --- | --- |
| AC-1.1 flag off = one un-focused call | `candidate-recall.service` (flag off → exactly one call, no `lane` arg) | api-unit |
| AC-2.1 fan-out into N focus lanes | `candidate-recall.service` (N calls), `candidate-lane-plan.util` (lane order strongest/diverse/wildcard, focus section built) | api-unit |
| AC-2.2 lanes are text-only | `candidate-recall.service` (fan-out sends exactly N **text** calls and **zero image** calls) | api-unit |
| AC-2.3 per-step concurrency gate | `ai-step-concurrency.gate` (permits bound, FIFO ordering), `core/concurrency/semaphore` (permit accounting) | api-unit |
| AC-2.4 budget clamp-with-warn | `candidate-recall.service` (lane count clamped by `AI_MAX_CALLS_PER_ANALYSIS`, warn emitted) | api-unit |
| AC-3.1 lane permit timeout dropped | `semaphore` (timeout rejection → `ConcurrencyTimeoutError`), `ai-step-concurrency.gate` (timeout), `candidate-recall.service` (timed-out lane dropped via `allSettled`) | api-unit |
| AC-3.2 one failed lane still returns survivors | `candidate-recall.service` (one lane rejects → survivors returned) | api-unit |
| AC-3.3 all-fail → empty → caller fallback | `candidate-recall.service` (all lanes fail → `[]`), `style-match.service` (empty pool → localized fallback) | api-unit |
| AC-4.1 dedupe keeps higher score | `candidate-merge.util` (canonical-name dedupe keeps higher `styleVibeFitScore`) | api-unit |
| AC-4.2 deterministic order | `candidate-merge.util` (score desc, canonical name asc; tie keeps earlier lane; identical outputs aggregate identically regardless of order) | api-unit |
| AC-5.1 extraction/judge call counts unchanged | `style-match.service` (extraction = 1 image call, judge = 1 call) | api-unit |
| AC-5.2 abort propagation | `semaphore` (abort-before-start → task never runs), `ai-step-concurrency.gate` (aborted wait → `ConcurrencyAbortError`) | api-unit |

## Negative / edge cases covered

- **Privacy assertion** — fan-out issues exactly N text calls and **zero** image calls; extraction
  remains the sole image call (`candidate-recall.service`, `style-match.service`).
- **All lanes fail / empty merge** — returns `[]` so the caller falls back exactly as the single-call
  path does.
- **Budget clamp** — configured lanes above the budget are clamped down to
  `AI_MAX_CALLS_PER_ANALYSIS − 2`, with a `warn` (never a silent cap).
- **Abort before start** — a queued lane whose signal aborts never starts its provider call.
- **FIFO ordering & permit accounting** — the semaphore grants in arrival order and never leaks a
  permit (double release safe).
- **Deterministic dedupe** — identical lane pools in different finish orders produce a byte-identical
  merged list.

## Determinism

- Time controlled via fake timers; permits are held in the gate/semaphore tests via a
  `setTimeout`-in-executor promise (the repo's own limiter-test pattern, since
  `Promise.withResolvers` is unavailable under the ES2023 lib — see
  [16-dev-bug-log.md](16-dev-bug-log.md)). No live provider, no network, no arbitrary sleeps.

## Test files

- [`core/concurrency/tests/semaphore.test.ts`](../../../apps/api/src/core/concurrency/tests/semaphore.test.ts)
- [`modules/ai/tests/ai-step-concurrency.gate.test.ts`](../../../apps/api/src/modules/ai/tests/ai-step-concurrency.gate.test.ts)
- [`modules/ai/tests/candidate-recall.service.test.ts`](../../../apps/api/src/modules/ai/tests/candidate-recall.service.test.ts)
- [`modules/ai/tests/candidate-merge.util.test.ts`](../../../apps/api/src/modules/ai/tests/candidate-merge.util.test.ts)
- [`modules/ai/tests/candidate-lane-plan.util.test.ts`](../../../apps/api/src/modules/ai/tests/candidate-lane-plan.util.test.ts)
- [`modules/game/tests/style-match.service.test.ts`](../../../apps/api/src/modules/game/tests/style-match.service.test.ts)
- Config: `env.schema.test.ts`, `app-config.service.test.ts` (new caps parse + bounds).

## Evidence

See [12-coverage-plan.md](12-coverage-plan.md) for the coverage gate and
[15-dev-validation-report.md](15-dev-validation-report.md) for the executed gate results.
