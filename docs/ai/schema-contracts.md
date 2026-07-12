---
id: ai-schema-contracts
title: AI Schema Contracts
type: doc
authority: canonical
status: current
owner: repository owner
summary: The per-step Zod schemas every AI response must pass, plus the streaming per-model validator that burns a fallback hop instead of the request.
keywords: [ai, zod, schemas, contracts, validation, traits, candidates, judge, translation, streaming]
contextTier: 2
relatedCode: [packages/shared/src/schemas/traits.schema.ts, packages/shared/src/schemas/candidates.schema.ts, packages/shared/src/schemas/judge.schema.ts, packages/shared/src/schemas/game-result.schema.ts, apps/api/src/modules/ai/lib/json-response.util.ts]
relatedTests: [apps/api/src/modules/ai/tests/json-response.util.test.ts, apps/api/src/modules/ai/tests/ai-pipeline.test.ts]
relatedDocs: [docs/ai/output-validation.md, docs/ai-safety.md, docs/ai/prompt-catalog.md]
readWhen: You are changing an AI response shape, a shared schema, or the per-model validation hook.
---

# AI Schema Contracts

Every AI response is parsed against a strict shared Zod schema before any use (CLAUDE.md Twinzy
constraint #7). Schemas live in `packages/shared/src/schemas/` so backend, frontend, tests, and
the benchmark harness share one contract. All carry the `promptVersion` literal
`'written-traits-v5'` (`packages/shared/src/constants/app.constants.ts:49`).

## Per-step schemas

| Step | Schema | Key constraints |
| --- | --- | --- |
| Extraction | `TraitExtractionResponseSchema` ([`traits.schema.ts`](../../packages/shared/src/schemas/traits.schema.ts)) | Per-category shapes derived from the single-source 16-category/221-field taxonomy (`packages/shared/src/constants/trait-category.constants.ts`); individual trait fields tolerant (`optional().catch('')`); bounded arrays/strings (`response-bounds.constants.ts`); `traitCount` recomputed authoritatively by a transform; `TraitSafetyCheckSchema` = five `z.literal(false)` flags |
| Generation | `CandidateGenerationResponseSchema` ([`candidates.schema.ts`](../../packages/shared/src/schemas/candidates.schema.ts)) | Pool 1..25 (`MIN/MAX_CANDIDATE_POOL`, `packages/shared/src/constants/trait.constants.ts`); bounded per-candidate text; enum `.catch` softening for publicCategory/popularity/confidence; four `z.literal(false)` safety flags; `candidateCount` derived by transform |
| Judge | `CandidateJudgeResponseSchema` ([`judge.schema.ts`](../../packages/shared/src/schemas/judge.schema.ts)) | Results ≤ `MAX_RESULT_COUNT` (10); `JudgeSafetyCheckSchema` = five `z.literal(false)` + `meetsMinimumEvidence: z.boolean()`; rank normalized by preprocess; refine: empty results require `fallbackMessage` |
| Translation / final response | `FinalGameResultSchema` ([`game-result.schema.ts`](../../packages/shared/src/schemas/game-result.schema.ts)) | `strictObject`; results ≤ resultCount refine; fallback-required-when-empty refine; strict safety-check shape |

Adjacent contracts: `game-stream.schema.ts` (SSE union — see
[pipeline.md](pipeline.md) §Streaming), `translate-result.schema.ts` (strictObject, no image
field), `result-count.schema.ts` (1–10, default 10), `language.schema.ts` (en/ar).

## The streaming (per-model) validator

[`apps/api/src/modules/ai/lib/json-response.util.ts`](../../apps/api/src/modules/ai/lib/json-response.util.ts)
provides two layers:

1. `buildSchemaValidator(schema)` — passed to the adapters as `AiCallOptions.validate`. Each
   adapter runs it on a model's assembled text **before accepting that model's output**, so a
   schema-failing model burns a fallback hop (`AI_RESPONSE_INVALID` is route-hoppable, see
   [fallback-routing.md](fallback-routing.md)) instead of failing the whole request.
2. `parseAiJsonResponse` — the step services' final parse: sanitizer fence-strip →
   first-`{`-to-last-`}` extraction fallback → `schema.safeParse`; failure ⇒
   `AI_RESPONSE_INVALID`. Details in [output-validation.md](output-validation.md).

## Why literal-false safety flags are schema-level

A model that self-reports `containsIdentityClaim: true` (or any other flag) fails Zod validation
outright — safety violations are contract violations, not soft warnings. Enforcement policy on
top of the schemas is owned by [docs/ai-safety.md](../ai-safety.md).

## Changing a schema

Schemas, prompts, and the taxonomy move in lock-step (test at
`apps/api/src/modules/ai/tests/ai-pipeline.test.ts:94`). Follow
[prompt-change-checklist.md](prompt-change-checklist.md) — a schema change is a prompt-contract
change.
