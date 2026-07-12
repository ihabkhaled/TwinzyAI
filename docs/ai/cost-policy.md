---
id: ai-cost-policy
title: AI Cost Policy
type: doc
authority: canonical
status: current
owner: repository owner
summary: The env caps that bound AI spend — concurrency, throttles, timeouts, response byte caps, route-chain length, and the shadow sampling rate.
keywords: [ai, cost, spend, caps, env, sampling, shadow, budget, quota]
contextTier: 2
relatedCode: [apps/api/src/config/env.schema.ts, apps/api/src/config/env-bounds.constants.ts, apps/api/src/modules/ai/adapters/ai-shadow.service.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-shadow.service.test.ts]
relatedDocs: [docs/ai/concurrency-policy.md, docs/ai/retry-timeout-policy.md, docs/ai/shadow-routing.md]
readWhen: You are assessing or bounding AI spend, or changing any cap that multiplies provider calls.
---

# AI Cost Policy

There is no billing meter in the app; **cost is bounded structurally** by env-driven caps
(CLAUDE.md Twinzy constraint #6: every operational cap is env-driven). All caps live in
[`apps/api/src/config/env.schema.ts`](../../apps/api/src/config/env.schema.ts) with bounds in
`env-bounds.constants.ts`.

## What one user run can cost

A full analyze run makes **3 AI calls** by default (extraction, generation, judge — aggregation is
not an AI call; more when parallel recall is enabled, see below); a language switch adds 1
translation call ([pipeline.md](pipeline.md)). Each call is bounded by:

- time: `GEMINI_TIMEOUT_MS` total + `GEMINI_STREAM_IDLE_TIMEOUT_MS` idle
  ([retry-timeout-policy.md](retry-timeout-policy.md));
- size: `AI_MAX_RESPONSE_BYTES` (default 500 000);
- retries: fallback hops are capped by the route-chain length (`MAX_AI_ROUTE_ENTRIES` enforced
  at boot — `apps/api/src/config/ai-route.util.ts`), and only typed error codes hop
  ([fallback-routing.md](fallback-routing.md)) — no unbounded retry loops exist.

## How many runs can happen at once

Admission caps (defaults 50 global / 3 per IP / 1 per tab, queue 100) plus per-route throttles
(analyze/translate 10/min, cancel 60/min) and the global rate limit (30/60 s) — owned by
[concurrency-policy.md](concurrency-policy.md). Cancellation and watchdog aborts propagate into
provider calls, so abandoned runs stop spending
([retry-timeout-policy.md](retry-timeout-policy.md) §Abort bridging).

## Shadow spend (an optional multiplier)

Shadow runs add at most one extra text call per sampled primary, bounded by:

| Var | Default | Effect |
| --- | --- | --- |
| `AI_SHADOW_ENABLED` | `false` | Off by default — zero shadow spend |
| `AI_SHADOW_SAMPLE_RATE` | `0` | Fraction 0..1 of eligible calls; the schema comment states it exists to bound cost (`env.schema.ts:170-173`) |
| `AI_SHADOW_TIMEOUT_MS` | 30 000 | Caps each shadow call's duration |

Extraction is never shadowed (no image duplication, no vision-call spend) —
[shadow-routing.md](shadow-routing.md).

## Parallel recall spend (flag-gated, OFF by default)

`AI_PARALLEL_PIPELINE_ENABLED=true` (default `false`) fans the generation step out into
`AI_GENERATION_LANES` (default 2) provider calls instead of one, multiplying generation spend to
buy latency/recall. It is hard-bounded two ways: lane count is clamped so
`extraction + lanes + judge ≤ AI_MAX_CALLS_PER_ANALYSIS` (default 5), and a process-global
`AI_GENERATION_CONCURRENCY` gate caps concurrent generation calls across all analyses. Cost is an
explicit acceptance criterion before the flag is enabled in any environment — see
[concurrency-policy.md](concurrency-policy.md) and
[ADR-004](../../architecture/adrs/adr-004-parallel-ai-pipeline.md).

## Benchmark spend

`npm run ai:benchmark` defaults to **mock mode** (zero provider calls); `--mode=real` is opt-in
and prints a billed-calls warning (`apps/api/src/benchmark/benchmark.main.ts`). Owner:
[docs/ai-benchmarking.md](../ai-benchmarking.md).

## Levers, cheapest first

1. Keep `AI_SHADOW_SAMPLE_RATE` at 0 unless actively evaluating a candidate model.
2. Trim per-step route chains — every extra entry is a potential paid retry.
3. Pin cheap models to cheap steps via `GEMINI_MODEL_<STEP>` / `AI_ROUTE_<STEP>` (translation is
   "a cheap mechanical" step per `gemini-step.constants.ts`'s doc comment) —
   [model-routing.md](model-routing.md).
4. Lower concurrency caps / throttles under budget pressure.
