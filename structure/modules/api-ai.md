---
id: structure-module-api-ai
title: Module — api ai (AI Provider Pipeline)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The AI provider pipeline module — four step services behind the AI_PROVIDER_ADAPTER port, provider routing with fallbacks and shadow runs, safety filtering, and file-based prompt templates.
keywords: [ai, gemini, provider, router, extraction, candidates, judge, translation, safety, prompts]
contextTier: 2
relatedCode: [apps/api/src/modules/ai, apps/api/src/config/gemini-step.constants.ts]
relatedTests: [apps/api/src/modules/ai/tests, apps/api/src/tests/game-analyze.integration.test.ts]
relatedDocs: [docs/ai-safety.md, docs/provider-routing.md, rules/14-ai-safety.md, structure/flows/analyze-flow.md]
readWhen: You are changing AI steps, providers, models, prompts, or safety filtering.
---

# Module — `apps/api/src/modules/ai`

**Responsibility.** The AI provider pipeline: trait extraction (the ONLY image-capable step),
candidate generation, candidate judging, and result translation — behind the
`AI_PROVIDER_ADAPTER` port served by `AiRouterService`. No controller; the `game` module is
the consumer.

## Public surface (`index.ts`)

`AiModule`, the four step services (`TraitExtractionService`, `CandidateGenerationService`,
`CandidateJudgeService`, `ResultTranslationService`), `AiSafetyService`,
`PromptTemplateRepository`, `buildAiImageInput`, `buildMatchingEvidence`, and the port/types
from `model/ai-provider-adapter.types.ts` (incl. the `AI_PROVIDER_ADAPTER` symbol).
The module exports only the four step services to DI consumers (`ai.module.ts`).

## Key files

| File | Role |
| --- | --- |
| `application/trait-extraction.service.ts` | The only step allowed to send the image; zod + language + safety validation |
| `application/candidate-generation.service.ts` | Text-only recall; region hint by language; unsafe candidates dropped |
| `application/candidate-judge.service.ts` | Text-only strict judge; unsafe judged results filtered |
| `application/result-translation.service.ts` | Text-only; re-imposes canonical fields server-side; shape drift rejected |
| `application/ai-safety.service.ts` | Forbidden-wording scanning over `ALL_FORBIDDEN_PHRASES` (shared lists) |
| `adapters/ai-router.service.ts` | Walks the env-configured `provider:model` route chain; fail-closed image dispatch; 429/502 on exhaustion |
| `adapters/provider-registry.service.ts` | Provider→adapter map; boot-time route validation; `usableEntriesFor(step, carriesImage)` |
| `adapters/gemini.adapter.ts` | The ONLY `@google/genai` importer; model-chain retry, timeouts, byte cap, redacted logs |
| `adapters/openai-compat.adapter.ts` | One fetch-based adapter for openai/deepseek/qwen/kimi/glm; image methods reject |
| `adapters/ai-shadow.service.ts` | Sampled, metrics-only, fire-and-forget shadow runs (text-only steps) |
| `infrastructure/prompt-template.repository.ts` | Loads `prompts/*.md` with required-placeholder validation |
| `prompts/` | `use-1st/2nd/3rd-prompt.md`, `translate-result-prompt.md` |

## Invariants

- Only extraction carries the image — `AI_IMAGE_STEPS = [Extraction]`
  (`apps/api/src/config/gemini-step.constants.ts`) + vision-capable router filter + image-less
  method signatures downstream. Never weaken.
- Every response is zod-validated (shared schemas) and safety-filtered before use
  ([docs/ai-safety.md](../../docs/ai-safety.md)); unsafe wording → `ErrorCode.AiResponseUnsafe`.
- Models and caps are env-only: `GEMINI_MODEL[_<STEP>]`, `GEMINI_FALLBACK_MODELS[_<STEP>]`,
  `AI_ROUTE_<STEP>`, `AI_SHADOW_*`, provider `*_API_KEY`/`*_BASE_URL`, timeouts and
  `AI_MAX_RESPONSE_BYTES` — see [docs/env-vars.md](../../docs/env-vars.md) and
  [docs/provider-routing.md](../../docs/provider-routing.md).
- Provider error text is redacted via the privacy module's `redactForLog` before logging.
- Shadow output never touches user results.

## Tests

Unit: `apps/api/src/modules/ai/tests/` (14 files — pipeline, router, registry, shadow, safety,
both adapters, prompt repository, response/JSON utils). Indirect integration via
`apps/api/src/tests/game-analyze*.integration.test.ts` with `FakeAiAdapter` proving the image
never reaches text-only steps.

## Common changes and risks

- **Add/reroute a provider or model**: env change (`AI_ROUTE_<STEP>`) plus, for a new provider
  family, registry + adapter work. Benchmark first (`npm run ai:benchmark`,
  [docs/ai-benchmarking.md](../../docs/ai-benchmarking.md)); never auto-apply benchmark output.
- **Prompt edits**: `prompts/*.md`; a contract-affecting change must move
  `GAME_PROMPT_VERSION` and the shared schemas together ([shared.md](shared.md)).
- **Risk**: relaxing `.catch`/literal safety flags or the forbidden-wording lists violates
  product constraints ([CLAUDE.md](../../CLAUDE.md), [rules/14-ai-safety.md](../../rules/14-ai-safety.md)).
