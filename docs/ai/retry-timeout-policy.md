---
id: ai-retry-timeout-policy
title: AI Retry and Timeout Policy
type: doc
authority: canonical
status: current
owner: repository owner
summary: Per-call total and idle timeouts, the pipeline watchdog, model-chain retries, and how external aborts bridge into provider calls.
keywords: [ai, timeout, retry, watchdog, abort, idle, streaming, cancellation, resilience]
contextTier: 2
relatedCode: [apps/api/src/config/env-bounds.constants.ts, apps/api/src/modules/ai/adapters/gemini.adapter.ts, apps/api/src/modules/ai/lib/abort-bridge.util.ts, apps/api/src/core/streaming/stream-registry.service.ts]
relatedTests: [apps/api/src/modules/ai/tests/gemini.adapter.test.ts, apps/api/src/tests/game-stream-isolation.integration.test.ts]
relatedDocs: [docs/ai/fallback-routing.md, docs/ai/latency-budget.md, docs/env-vars.md]
readWhen: You are tuning timeouts, changing retry behavior, or debugging AI_TIMEOUT / hung streams.
---

# AI Retry and Timeout Policy

All knobs are env vars validated in `apps/api/src/config/env.schema.ts`; bounds and defaults are
centralized in
[`env-bounds.constants.ts`](../../apps/api/src/config/env-bounds.constants.ts). Env var reference:
[docs/env-vars.md](../env-vars.md).

## Timeout layers (innermost first)

| Layer | Env var | Default (bounds) | Behavior |
| --- | --- | --- | --- |
| Per provider call, total | `GEMINI_TIMEOUT_MS` | 30 000 (1 000–120 000) | AbortController on the whole call; reused by the OpenAI-compat adapter |
| Per stream, idle | `GEMINI_STREAM_IDLE_TIMEOUT_MS` | 60 000 (1 000–300 000) | Inter-chunk timer reset on every chunk — a model that keeps producing tokens is never cut off; silence for this long aborts (`env.schema.ts` comment: the pipeline "listens and waits") |
| Per shadow call | `AI_SHADOW_TIMEOUT_MS` | 30 000 (1 000–120 000) | `AbortSignal.timeout` on metrics-only shadow runs |
| Whole pipeline watchdog | `ANALYSIS_TIMEOUT_MS` | 120 000 (1 000–600 000) | Presenter watchdog; also the max queue wait; expiry ⇒ `AI_TIMEOUT` frame, status Failed |
| Orphan sweep | `STREAM_TTL_MS` | 180 000 (must be ≥ `ANALYSIS_TIMEOUT_MS`, superRefine) | `StreamRegistry.sweep` aborts forgotten streams |

Related size cap: `AI_MAX_RESPONSE_BYTES` (default 500 000) aborts oversized responses mid-flight
([output-validation.md](output-validation.md)).

## Retries

There is **no blind retry loop**. Recovery is chain-walking with typed conditions:

- Within one Gemini dispatch: `runAcrossModels` advances across the model list on
  RateLimited/Unavailable classification or content-validator failure.
- Across the route chain: `AiRouterService` hops on the four hoppable codes only.
  Both levels, exhaustion mapping, and error classification are owned by
  [fallback-routing.md](fallback-routing.md).

## Abort bridging

External aborts (client disconnect, explicit cancel, watchdog) propagate into in-flight provider
calls via
[`lib/abort-bridge.util.ts`](../../apps/api/src/modules/ai/lib/abort-bridge.util.ts)
(`attachExternalAbort` bridges the external signal onto the per-call AbortController — the Gemini
SDK's `abortSignal` and fetch's `signal`). The router checks `signal.throwIfAborted()` per hop,
and **an aborted signal is never route-hoppable** — cancellation ends the walk immediately.
Abort sources and their terminal frames are classified in
`apps/api/src/modules/game/lib/game-stream.ts::resolveStreamTermination`
([pipeline.md](pipeline.md) §Streaming).

## Operational reading

These timeouts double as the de-facto latency ceilings — see
[latency-budget.md](latency-budget.md). For sustained timeout storms, follow
[incident-response.md](incident-response.md).
