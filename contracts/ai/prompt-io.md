---
id: contracts-ai-prompt-io
title: Prompt I/O Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: The placeholder contract of each of the four prompt templates (REQUIRED_PLACEHOLDERS) and the zod schema every prompt's output must validate against.
keywords: [prompt, placeholders, templates, traits, candidates, judge, translation, schema, written-traits-v5]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/model/prompt-version.constants.ts, apps/api/src/modules/ai/infrastructure/prompt-template.repository.ts, packages/shared/src/constants/app.constants.ts]
relatedTests: [apps/api/src/modules/ai/tests/prompt-template.repository.test.ts, apps/api/src/modules/ai/tests/ai-pipeline.test.ts]
relatedDocs: [contracts/ai/README.md, docs/ai-safety.md]
readWhen: You are editing a prompt template, its placeholders, or a step's response schema.
---

# Prompt I/O Contract

Owner of keys, files, and placeholders:
`apps/api/src/modules/ai/model/prompt-version.constants.ts` (`PromptKey`, `PROMPT_FILES`,
`PromptPlaceholder`, `REQUIRED_PLACEHOLDERS`). Templates live in
`apps/api/src/modules/ai/prompts/`. Loader:
`apps/api/src/modules/ai/infrastructure/prompt-template.repository.ts` — it fails
(`INTERNAL_ERROR` with the safe `GENERIC_PROMPT_ERROR` copy) if a required placeholder is
missing from the template, and rejects any built prompt that still contains **any** known
placeholder. Replacement is split/join (no regex injection).

## Placeholders and output schemas per prompt

| Template | Step | REQUIRED_PLACEHOLDERS | Validated output schema |
| --- | --- | --- | --- |
| `use-1st-prompt.md` | extraction | `[LANGUAGE_CODE]` | `TraitExtractionResponseSchema` (`packages/shared/src/schemas/traits.schema.ts`) |
| `use-2nd-prompt.md` | generation | `[TRAITS_JSON]`, `[LANGUAGE_CODE]`, `[RESULT_COUNT]`, `[REGION_HINT]` | `CandidateGenerationResponseSchema` (`packages/shared/src/schemas/candidates.schema.ts`) |
| `use-3rd-prompt.md` | judge | `[TRAITS_JSON]`, `[CANDIDATES_JSON]`, `[LANGUAGE_CODE]`, `[RESULT_COUNT]` | `CandidateJudgeResponseSchema` (`packages/shared/src/schemas/judge.schema.ts`) |
| `translate-result-prompt.md` | translation | `[RESULT_JSON]`, `[TARGET_LANGUAGE_CODE]` | `FinalGameResultSchema` (`packages/shared/src/schemas/game-result.schema.ts`) |

Placeholder inputs:

- `[TRAITS_JSON]` — the matching-evidence distillation of the extraction, **not** the raw
  image (`apps/api/src/modules/ai/lib/matching-evidence.util.ts`).
- `[REGION_HINT]` — from `REGION_HINT_BY_LANGUAGE`
  (`apps/api/src/modules/ai/model/region-hint.constants.ts`); a coverage hint, never a
  constraint.
- `[RESULT_COUNT]` — the request's resultCount (1–10, see
  [../api/analyze.md](../api/analyze.md)).
- `[RESULT_JSON]` / `[TARGET_LANGUAGE_CODE]` — the existing `FinalGameResult` and the strict
  target language for translation.

## Output invariants (schema-enforced)

- `promptVersion` is a `z.literal('written-traits-v5')`
  (`GAME_PROMPT_VERSION`, `packages/shared/src/constants/app.constants.ts`) in every schema —
  a stale model/template pairing fails validation.
- Every schema carries literal-`false` `safetyCheck` booleans (a model self-reporting `true`
  fails validation) and a `languageCode` that must echo the requested code
  (`apps/api/src/modules/ai/lib/response-language.guard.ts`).
- Derived counts are never trusted: `traitCount` is overwritten by
  `countPopulatedTraitFields` and `candidateCount` by the candidates transform (see the
  schema files).
- Judge/final results: `results` ≤ resultCount and `fallbackMessage` required when `results`
  is empty (refines in `judge.schema.ts` / `game-result.schema.ts`).
- Disclaimer and no-match fallback are always replaced with the server-owned localized
  constants — model copy is never trusted for them
  (`packages/shared/src/constants/app.constants.ts`,
  `apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts`).

A lock-step test pins the prompt template to the 221-field taxonomy so prompt and schema
cannot drift (`apps/api/src/modules/ai/tests/ai-pipeline.test.ts`). Wording restrictions and
the forbidden-phrase scan are owned by [docs/ai-safety.md](../../docs/ai-safety.md).
