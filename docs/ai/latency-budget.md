---
id: ai-latency-budget
title: AI Latency Budget
type: doc
authority: canonical
status: current
owner: repository owner
summary: The timeout envelope as the de-facto latency ceilings — per call, per stream, per pipeline — with the env defaults that define them.
keywords: [ai, latency, budget, timeout, ceiling, performance, streaming, watchdog]
contextTier: 2
relatedCode: [apps/api/src/config/env-bounds.constants.ts, apps/api/src/modules/game/api/game-stream.presenter.ts]
relatedTests: [apps/api/src/tests/game-analyze-stream.integration.test.ts]
relatedDocs: [docs/ai/retry-timeout-policy.md, docs/ai-benchmarking.md, docs/ai/cost-policy.md]
readWhen: You are reasoning about how long a run may take, or changing anything that affects perceived latency.
---

# AI Latency Budget

There is no SLO document for AI latency; **the timeout envelope is the de-facto latency
ceiling**, all env-driven (defaults from
[`apps/api/src/config/env-bounds.constants.ts`](../../apps/api/src/config/env-bounds.constants.ts);
mechanics owned by [retry-timeout-policy.md](retry-timeout-policy.md)).

## The ceilings (env defaults)

| Budget | Ceiling | Source |
| --- | --- | --- |
| One provider call (total) | `GEMINI_TIMEOUT_MS` = 30 s default (hard max 120 s) | `env-bounds.constants.ts:23-25` |
| Stream stall (inter-chunk silence) | `GEMINI_STREAM_IDLE_TIMEOUT_MS` = 60 s default | `env-bounds.constants.ts:27-29` |
| Whole analyze pipeline (incl. queue wait) | `ANALYSIS_TIMEOUT_MS` = 120 s default (hard max 600 s) | `env-bounds.constants.ts:60-62`; watchdog in `game-stream.presenter.ts` |
| Stream lifetime hard stop | `STREAM_TTL_MS` = 180 s default, ≥ `ANALYSIS_TIMEOUT_MS` by schema | `env-bounds.constants.ts:64-66` |
| Shadow call (never user-visible) | `AI_SHADOW_TIMEOUT_MS` = 30 s default | `env.schema.ts` |

Worst-case arithmetic: a pipeline of 3 sequential AI calls with fallback hops is still cut off by
the 120 s watchdog — the user always gets a terminal frame (`AI_TIMEOUT`) rather than an endless
spinner ([pipeline.md](pipeline.md) §Streaming). Note `.env.example` raises `GEMINI_TIMEOUT_MS`
to the 120 s max for live operation, so in that configuration the watchdog is the binding
constraint.

## Perceived latency

The streaming path exists to make real latency tolerable:

- `accepted` and `stage` frames arrive immediately per phase (validating → scanning →
  extracting-traits → generating-candidates → judging → aggregating);
- `traits` and `candidates` frames give mid-run payloads before the final `result`;
- SSE comment keep-alives every 10 s prevent proxy idle cuts
  (`game.constants.ts:52`, `game-stream.presenter.ts:111-113`).

## Measuring

- The benchmark harness scores speed against a 120 s ceiling with a 0.2 weight
  ([docs/ai-benchmarking.md](../ai-benchmarking.md), `model/benchmark.types.ts:62-69`) — use it
  to compare model latency before routing changes ([model-change-checklist.md](model-change-checklist.md)).
- Adapters log per-call durations (`Call/Stream ok (model=…, ms=…)` in the Gemini adapter;
  `Step … served by …` in the OpenAI-compat adapter); shadow runs log `ms=` per sampled call
  ([shadow-routing.md](shadow-routing.md)).
- `scripts/load-test.mjs` exists for load exercises against a running API.

Latency and cost trade against the same knobs — see [cost-policy.md](cost-policy.md).
