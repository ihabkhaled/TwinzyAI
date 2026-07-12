---
id: contracts-ai-readme
title: AI Provider Port and Routing Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: The AiProviderAdapter port that separates image-capable from text-only AI calls, the per-step response schemas, the AI_ROUTE_* env routing contract, and the fail-closed image rule.
keywords: [ai, provider, port, adapter, routing, ai-route, gemini, fail-closed, image, steps, schemas]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/model/ai-provider-adapter.types.ts, apps/api/src/modules/ai/adapters/ai-router.service.ts, apps/api/src/modules/ai/adapters/provider-registry.service.ts, apps/api/src/config/gemini-step.constants.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-router.service.test.ts, apps/api/src/modules/ai/tests/provider-registry.service.test.ts]
relatedDocs: [docs/provider-routing.md, docs/ai-safety.md, contracts/ai/prompt-io.md]
readWhen: You are adding a provider, changing step routing, or touching anything that calls the AI port.
---

# AI Provider Port and Routing Contract

## The port: `AiProviderAdapter`

Owner: `apps/api/src/modules/ai/model/ai-provider-adapter.types.ts`. The injection token
`AI_PROVIDER_ADAPTER` is bound to `AiRouterService` in `apps/api/src/modules/ai/ai.module.ts`.
The port's method split **is** the AI-safety boundary:

- `generateFromImage` / `generateFromImageStream` — the only image-capable methods; called
  exclusively by `apps/api/src/modules/ai/application/trait-extraction.service.ts`.
- `generateFromText` / `generateFromTextStream` — no image parameter exists, so image leakage
  into generation/judge/translation is a **type error**, not a runtime check.

Options: `AiCallOptions = { validate?, step?, models? }`; `AiStreamOptions` adds `onChunk?`
and `signal?` (abort propagation — see the abort bridge in
`apps/api/src/modules/ai/lib/abort-bridge.util.ts`). The `validate` content validator (built
by `buildSchemaValidator`, `apps/api/src/modules/ai/lib/json-response.util.ts`) runs
per-model **before** a model's output is accepted, so a schema-failing model burns a fallback
hop instead of the request.

## Steps and per-step schemas

Steps are enumerated in `apps/api/src/config/gemini-step.constants.ts` (`GeminiStep`:
extraction, generation, judge, translation). Every response is zod-validated against the
step's shared schema and pinned to `promptVersion: 'written-traits-v5'`:

| Step | Image? | Response schema (`packages/shared/src/schemas/`) |
| --- | --- | --- |
| extraction | **yes — the only one** | `traits.schema.ts` (`TraitExtractionResponseSchema`) |
| generation | no | `candidates.schema.ts` (`CandidateGenerationResponseSchema`) |
| judge | no | `judge.schema.ts` (`CandidateJudgeResponseSchema`) |
| translation | no | `game-result.schema.ts` (`FinalGameResultSchema`) |

Prompt inputs/outputs per step: [prompt-io.md](prompt-io.md). Safety filtering after
validation is owned by [docs/ai-safety.md](../../docs/ai-safety.md).

## Fail-closed image rule

`AI_IMAGE_STEPS = [GeminiStep.Extraction]` (`apps/api/src/config/gemini-step.constants.ts`)
plus the registry filter `usableEntriesFor(step, carriesImage)` — a photo-carrying call can
only ever dispatch to a **Gemini** entry; the vision restriction is hardcoded in
`apps/api/src/modules/ai/adapters/provider-registry.service.ts`, not env-configurable. The
OpenAI-compatible adapter additionally rejects any image call with `AI_PROVIDER_UNAVAILABLE`
(`apps/api/src/modules/ai/adapters/openai-compat.adapter.ts`). Known drift: a comment in
`apps/api/src/config/env.schema.ts` describes a "vision capability declaration" env var that
does not exist — the code above is the truth.

## Routing env contract

Full semantics owned by [docs/provider-routing.md](../../docs/provider-routing.md); the
contract surface is:

- `AI_ROUTE_{EXTRACTION|GENERATION|JUDGE|TRANSLATION}` — comma-separated `provider:model`
  tokens (bare token = `gemini:<model>`; max 10 entries; unknown provider or empty model
  crashes startup — `apps/api/src/config/ai-route.util.ts`).
- Precedence in `apps/api/src/config/app-config.service.ts`: explicit `AI_ROUTE_<STEP>` →
  per-step `GEMINI_MODEL_<STEP>` + `GEMINI_FALLBACK_MODELS_<STEP>` → global `GEMINI_MODEL` +
  `GEMINI_FALLBACK_MODELS`. Per-step values REPLACE, never merge.
- Provider enablement = API-key presence: `{OPENAI|DEEPSEEK|QWEN|KIMI|GLM}_API_KEY` (+
  optional `_BASE_URL`, defaults in `apps/api/src/config/ai-provider.constants.ts`); Gemini
  is always registered.
- Shadow mode (text steps only, metrics-only): `AI_SHADOW_ENABLED`, `AI_SHADOW_SAMPLE_RATE`,
  `AI_SHADOW_TIMEOUT_MS`, `AI_SHADOW_ROUTE_{GENERATION|JUDGE|TRANSLATION}` — no extraction
  key exists (`AI_STEP_SHADOW_ROUTE_ENV_KEYS`).

## Router failure semantics

`AiRouterService` (`apps/api/src/modules/ai/adapters/ai-router.service.ts`) walks the step's
route chain, pinning each dispatch to one model; it advances only on
`ROUTE_HOPPABLE_ERROR_CODES` (`AI_RATE_LIMITED`, `AI_PROVIDER_UNAVAILABLE`, `AI_TIMEOUT`,
`AI_RESPONSE_INVALID` — `apps/api/src/modules/ai/model/ai-router.constants.ts`). Aborted
signals and non-AppErrors propagate immediately. Chain exhaustion → **429** if any hop was
rate-limited, else **502**. Boot validation: an explicit `AI_ROUTE_<STEP>` with zero usable
entries throws at startup; implicit routes only warn
(`provider-registry.service.ts`).
