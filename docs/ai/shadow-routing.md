---
id: ai-shadow-routing
title: AI Shadow Routing — Sampled, Metrics-Only
type: doc
authority: canonical
status: current
owner: repository owner
summary: Shadow runs compare an alternate provider:model on sampled text-only calls, emit one metrics log line, and can never affect the user-visible result.
keywords: [ai, shadow, sampling, metrics, comparison, routing, text-only, evaluation]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/adapters/ai-shadow.service.ts, apps/api/src/config/gemini-step.constants.ts, apps/api/src/modules/ai/adapters/ai-router.service.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-shadow.service.test.ts]
relatedDocs: [docs/provider-routing.md, docs/ai/cost-policy.md, docs/ai/evaluation-framework.md]
readWhen: You want to trial a candidate model on live traffic safely, or are changing shadow sampling/config.
---

# AI Shadow Routing — Sampled, Metrics-Only

**Owner of the detail:** [docs/provider-routing.md](../provider-routing.md) §"Shadow mode
(metrics-only)". Implementation:
[`apps/api/src/modules/ai/adapters/ai-shadow.service.ts`](../../apps/api/src/modules/ai/adapters/ai-shadow.service.ts).

## What it is

After a **successful text primary** dispatch, `AiRouterService` may fire one additional,
fire-and-observe call to a per-step shadow route so an alternate `provider:model` can be measured
on real prompts. The shadow result is compared for schema validity and timing, logged once, and
discarded.

## Hard guarantees

- **Never user-facing.** The shadow output is never returned, streamed, or merged; failures are
  swallowed entirely. The only observable effect is one log line:
  `shadow step=… route=… ms=… chars=… schemaOk=…`.
- **Text-only by construction.** Only generation, judge, and translation have shadow env keys
  (`AI_STEP_SHADOW_ROUTE_ENV_KEYS` in
  [`gemini-step.constants.ts:52-56`](../../apps/api/src/config/gemini-step.constants.ts) — there
  is no extraction key), and the router only triggers shadows after text calls — image calls are
  never shadowed, so the photo can never be duplicated to a shadow provider.
- **Bounded.** Each shadow call runs under `AbortSignal.timeout(AI_SHADOW_TIMEOUT_MS)`.
- **Sampled with real randomness.** Admission uses crypto `randomInt` against
  `SHADOW_SAMPLE_RESOLUTION = 1_000_000`
  (`apps/api/src/modules/ai/model/ai-router.constants.ts`).

## Configuration (all env; `apps/api/src/config/env.schema.ts:172-184`)

| Var | Default | Meaning |
| --- | --- | --- |
| `AI_SHADOW_ENABLED` | `false` | Master switch |
| `AI_SHADOW_SAMPLE_RATE` | `0` | Fraction 0..1 of eligible calls shadowed (cost bound) |
| `AI_SHADOW_ROUTE_GENERATION` / `_JUDGE` / `_TRANSLATION` | `''` | Single `provider:model` per step; empty = no shadow for that step |
| `AI_SHADOW_TIMEOUT_MS` | `30000` (bounds 1000..120000) | Per-shadow-call timeout |

## When to use it

Shadow mode is the live-traffic leg of model evaluation — see
[evaluation-framework.md](evaluation-framework.md) and
[model-change-checklist.md](model-change-checklist.md). Spend impact is governed by
[cost-policy.md](cost-policy.md).

Known nuance (recorded, benign today): the router's shadow dispatch reuses the primary call's
closure including `options.onChunk`; no text step currently passes `onChunk`, so shadow chunks
cannot reach a user sink — a future text-step caller passing `onChunk` would need to revisit this
(`ai-router.service.ts:86-97`).
