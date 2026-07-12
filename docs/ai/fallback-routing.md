---
id: ai-fallback-routing
title: AI Fallback Routing — Hop Conditions and Exhaustion
type: doc
authority: canonical
status: current
owner: repository owner
summary: The exact error codes that let the router hop to the next provider:model entry, and how chain exhaustion maps to 429 vs 502.
keywords: [ai, fallback, routing, errors, rate-limit, timeout, exhaustion, hops, resilience]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/model/ai-router.constants.ts, apps/api/src/modules/ai/adapters/ai-router.service.ts, apps/api/src/modules/ai/lib/provider-error.util.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-router.service.test.ts, apps/api/src/modules/ai/tests/provider-error.util.test.ts]
relatedDocs: [docs/provider-routing.md, docs/ai/model-routing.md, docs/ai/incident-response.md]
readWhen: You are debugging why a request hopped (or failed without hopping), or changing error classification.
---

# AI Fallback Routing — Hop Conditions and Exhaustion

**Owner of the routing architecture:** [docs/provider-routing.md](../provider-routing.md).

## Hop conditions

`AiRouterService` advances to the next `provider:model` entry in a step's chain **only** for the
codes in `ROUTE_HOPPABLE_ERROR_CODES`
([`apps/api/src/modules/ai/model/ai-router.constants.ts`](../../apps/api/src/modules/ai/model/ai-router.constants.ts)):

| Code | Meaning |
| --- | --- |
| `AI_RATE_LIMITED` | Provider returned 429 / quota exhaustion |
| `AI_PROVIDER_UNAVAILABLE` | Provider 5xx/404/overloaded, or the entry cannot serve the call (e.g. text-only provider asked for vision) |
| `AI_TIMEOUT` | Total or idle timeout hit ([retry-timeout-policy.md](retry-timeout-policy.md)) |
| `AI_RESPONSE_INVALID` | Response failed the per-model content validator / byte cap ([output-validation.md](output-validation.md)) |

Everything else propagates immediately:

- **Aborted signals never hop** — the router calls `signal.throwIfAborted()` per hop, so a user
  cancel/disconnect/watchdog abort ends the walk (`ai-router.service.ts`).
- Non-`AppError` exceptions and non-hoppable AppErrors (e.g. `AI_RESPONSE_UNSAFE` from the safety
  filter) fail the request without burning further entries.

## Two levels of retry

1. **Inside the Gemini adapter**: `runAcrossModels` walks that dispatch's model list, classifying
   raw provider errors via
   [`lib/provider-error.util.ts`](../../apps/api/src/modules/ai/lib/provider-error.util.ts)
   (429/quota/rate-limit ⇒ RateLimited; 500/503/404/overloaded/unavailable ⇒ Unavailable; both
   retryable on the next model; anything else Fatal ⇒ 502). A content-validator failure also
   tries the next model. Note: the router pins each dispatch to a single model, so in routed
   operation the router owns the walk.
2. **Across the route chain**: the router hop rules above.

## Exhaustion mapping

When the whole chain is exhausted (`ai-router.service.ts:130-133`):

- **429** if any hop failed with `AI_RATE_LIMITED` (the client may retry later);
- **502** otherwise (provider unavailable / invalid output all the way down).

Error copy shown to users comes from
`apps/api/src/modules/ai/model/gemini.constants.ts` (typed AI error messages); streamed failures
reuse the same `errorCode`/`message` envelope (`game/lib/game-stream.ts::toStreamErrorMessage`).
Operational response to sustained exhaustion: [incident-response.md](incident-response.md).
