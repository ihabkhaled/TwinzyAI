---
id: operations-ai-cost-budget
title: AI Cost Budget
type: operations
authority: canonical
status: current
owner: repository owner
summary: The env-driven caps that bound AI provider spend — concurrency and rate ceilings, per-call deadlines, response-size caps, shadow sampling, and the opt-in billed benchmark.
keywords: [ai, cost, budget, spend, caps, shadow, sampling, benchmark, billed, gemini]
contextTier: 2
relatedCode: [apps/api/src/config/env.schema.ts, apps/api/src/modules/ai/adapters/ai-shadow.service.ts, apps/api/src/benchmark/benchmark.main.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-shadow.service.test.ts, apps/api/src/benchmark/tests/benchmark.test.ts]
relatedDocs: [docs/ai-benchmarking.md, docs/provider-routing.md, operations/performance-budgets.md]
readWhen: You are enabling shadow mode, running the real benchmark, or reasoning about what bounds AI provider spend.
---

# AI Cost Budget

No monetary budget (currency amount per month) is recorded anywhere in the repository —
Deferred — needs an owner figure. What IS recorded is the set of mechanical caps that bound
spend. All are env-driven ([apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts));
models are never hardcoded (product constraint, CLAUDE.md).

## Call-volume ceilings (per API instance)

- At most `MAX_GLOBAL_ACTIVE_ANALYSES` (50) concurrent analyses; 3 per IP; 1 per tab; each
  analysis is one image call (extraction) plus text-only generation/judge calls
  ([scaling-model.md](scaling-model.md); pipeline shape proven by
  [apps/api/src/tests/game-analyze.integration.test.ts](../apps/api/src/tests/game-analyze.integration.test.ts)).
- Analyze is throttled at 10/min per IP; translate at 10/min
  ([performance-budgets.md](performance-budgets.md)).
- Every run is deadline-bounded (`GEMINI_TIMEOUT_MS` 30 s per call, `ANALYSIS_TIMEOUT_MS`
  120 s per run — [timeout-budget.md](timeout-budget.md)), so a stuck provider cannot burn
  unbounded time.
- Responses are size-capped at `AI_MAX_RESPONSE_BYTES` (500 000)
  ([apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts)).
- Fallback chains multiply worst-case calls per step but are bounded: chain length plus at most
  10 route entries per step ([retry-budget.md](retry-budget.md)).

## Shadow sampling (extra spend, off by default)

Shadow mode runs a second, metrics-only provider call after a successful text-only primary call
([apps/api/src/modules/ai/adapters/ai-shadow.service.ts](../apps/api/src/modules/ai/adapters/ai-shadow.service.ts)):

| Lever | Default | Effect on cost |
| --- | --- | --- |
| `AI_SHADOW_ENABLED` | `false` | Master switch — default spends nothing |
| `AI_SHADOW_SAMPLE_RATE` | `0` (range 0–1) | Fraction of eligible calls that also hit the shadow route |
| `AI_SHADOW_ROUTE_{GENERATION,JUDGE,TRANSLATION}` | `''` | Only these text-only steps can shadow; extraction (the image step) never does |
| `AI_SHADOW_TIMEOUT_MS` | 30 000 ms | Bounds each shadow call |

A sampled call costs roughly double for that step; set the rate deliberately.

## Benchmark (opt-in billed spend)

`npm run ai:benchmark` defaults to **mock mode** (deterministic, zero API keys, CI-safe). Real
mode (`--mode=real`) warns that it makes "live, billed provider calls" and runs `--samples`
(default 3) per usable route entry per step
([apps/api/src/benchmark/benchmark.main.ts](../apps/api/src/benchmark/benchmark.main.ts),
[docs/ai-benchmarking.md](../docs/ai-benchmarking.md)). Recommendations are never auto-applied;
review safety + cost first ([apps/api/src/benchmark/benchmark-report.ts](../apps/api/src/benchmark/benchmark-report.ts)).

## Enablement is spend authorization

A provider can only be called when its API key is configured (`isProviderEnabled` = key
presence — [apps/api/src/config/app-config.service.ts](../apps/api/src/config/app-config.service.ts)).
Leaving a key unset is the hard "this provider costs nothing" guarantee; the same lever shape
applies to the PayPal paywall ([docs/env-vars.md](../docs/env-vars.md)).
