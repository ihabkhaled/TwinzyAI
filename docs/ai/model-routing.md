---
id: ai-model-routing
title: AI Model Routing
type: doc
authority: canonical
status: current
owner: repository owner
summary: How each pipeline step resolves its provider:model chain from AI_ROUTE_* and GEMINI_MODEL_* env vars, and why image dispatch is fail-closed to Gemini.
keywords: [ai, routing, models, env, ai-route, gemini-model, chains, fail-closed, vision]
contextTier: 2
relatedCode: [apps/api/src/config/app-config.service.ts, apps/api/src/config/ai-route.util.ts, apps/api/src/config/gemini-step.constants.ts, apps/api/src/modules/ai/adapters/provider-registry.service.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-router.service.test.ts, apps/api/src/modules/ai/tests/provider-registry.service.test.ts]
relatedDocs: [docs/provider-routing.md, docs/ai/fallback-routing.md, docs/env-vars.md]
readWhen: You are changing which model or provider serves a pipeline step, or debugging why a step routed where it did.
---

# AI Model Routing

**Owner of the full routing detail:** [docs/provider-routing.md](../provider-routing.md). This
page is the resolution contract in brief.

## Resolution precedence (per step; values REPLACE, never merge)

Resolved in [`apps/api/src/config/app-config.service.ts:103-131`](../../apps/api/src/config/app-config.service.ts):

1. **Explicit multi-provider route** — `AI_ROUTE_<EXTRACTION|GENERATION|JUDGE|TRANSLATION>`:
   comma-separated `provider:model` tokens. A bare token means `gemini:<model>`
   (`apps/api/src/config/ai-route.util.ts::parseAiRouteToken`). Parse errors, unknown providers,
   empty models, or more than `MAX_AI_ROUTE_ENTRIES` throw **at boot**.
2. **Per-step Gemini chain** — `GEMINI_MODEL_<STEP>` + `GEMINI_FALLBACK_MODELS_<STEP>`
   (env key map: `apps/api/src/config/gemini-step.constants.ts`).
3. **Global Gemini chain** — `GEMINI_MODEL` + `GEMINI_FALLBACK_MODELS` (the safety net for any
   step left unconfigured).

Live example values are documented in `.env.example` (AI section). Model names are **never
hardcoded**: an empty resolved chain throws `AiProviderUnavailable`
(`apps/api/src/modules/ai/adapters/gemini.adapter.ts:296-302`), and no model id exists in
production source (CLAUDE.md Twinzy constraint #6).

## Fail-closed image dispatch

`provider-registry.service.ts:82` filters usable entries per step with
`(!carriesImage || entry.provider === AiProvider.Gemini)`:

- The extraction step (`AI_IMAGE_STEPS = [Extraction]`, `gemini-step.constants.ts:62`) can only
  dispatch to Gemini entries, no matter what `AI_ROUTE_EXTRACTION` says — non-Gemini entries are
  silently unusable for image calls.
- This is hardcoded; there is no env override (the comment at
  `apps/api/src/config/env.schema.ts:153-157` describing a vision-declaration env var is stale —
  no such variable exists).
- Boot validation: an **explicit** `AI_ROUTE_<STEP>` whose usable entry list is empty throws;
  implicit/legacy empty routes only warn (CI-friendly).

## Dispatch mechanics

`AiRouterService` (`apps/api/src/modules/ai/adapters/ai-router.service.ts`) implements the
provider port: it walks the step's resolved chain, pins each dispatch to exactly one model
(`models: [entry.model]`), checks `signal.throwIfAborted()` per hop, and advances only on the
hoppable error codes — see [fallback-routing.md](fallback-routing.md). After a successful TEXT
primary it may trigger a sampled shadow run — see [shadow-routing.md](shadow-routing.md); image
calls are never shadowed.

Changing a model or chain: [model-change-checklist.md](model-change-checklist.md).
