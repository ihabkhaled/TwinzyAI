---
id: summary-domain
title: Domain Summary — Pipeline, Entities, Invariants, Limits
type: summary
authority: canonical
status: current
owner: repository owner
generated: false
summary: Routing digest of the game domain — the 4+1 AI pipeline stages, core entities, hard invariants, and every numeric limit with its owning constant.
keywords: [domain, pipeline, traits, candidates, judge, translation, invariants, limits, taxonomy, disclaimer, verdict]
contextTier: 1
relatedCode: [packages/shared/src/constants/trait-category.constants.ts, packages/shared/src/schemas/game-result.schema.ts, apps/api/src/modules/game/application/style-match.service.ts]
relatedTests: [packages/shared/tests/schemas.test.ts, apps/api/src/modules/ai/tests/ai-pipeline.test.ts]
relatedDocs: [docs/ai-safety.md, context/ai-context.md, rules/14-ai-safety.md]
readWhen: You need pipeline stages, domain entities, or any game limit/threshold and its single source of truth.
---

# Domain Summary — Pipeline, Entities, Invariants, Limits

## Pipeline stages (steps in `apps/api/src/config/gemini-step.constants.ts`; only `extraction` may carry the image)

1. **Trait extraction** (image → written traits) — `apps/api/src/modules/ai/application/trait-extraction.service.ts`, prompt `apps/api/src/modules/ai/prompts/use-1st-prompt.md`, schema `packages/shared/src/schemas/traits.schema.ts`. Output: 16-category/221-field localized trait JSON + aggregates (compact summary, high-signal tokens, weighted evidence, archetype hints, image-quality caps, search hints), all-false `safetyCheck`.
2. **Candidate generation** (text-only) — `candidate-generation.service.ts`, prompt `use-2nd-prompt.md`, schema `candidates.schema.ts`. Input is `buildMatchingEvidence(extraction)` + a region hint (en = global, ar = Arabic industries first-class, `model/region-hint.constants.ts`). Pool 1–25.
3. **Judge** (text-only, strict) — `candidate-judge.service.ts`, prompt `use-3rd-prompt.md`, schema `judge.schema.ts`. Re-scores, flags `shouldDisplay`/`meetsMinimumEvidence`, returns `removedCandidates` (never shown to the client).
4. **Aggregation** (pure, no AI) — `apps/api/src/modules/result-aggregation/`: displayable = `shouldDisplay && verdict !== weak && score >= MIN_DISPLAY_SCORE && meetsMinimumEvidence`; re-rank desc; slice to `resultCount`; server-side localized disclaimer/fallback always overwrite model text.
5. **Translation** (text-only, on locale switch) — `result-translation.service.ts`, prompt `translate-result-prompt.md`: every canonical field (names/ranks/scores/verdicts/disclaimer/fallback) restored from the original; shape drift rejected (`lib/json-shape.util.ts`).

Orchestration: `apps/api/src/modules/game/application/analyze-game{,-stream}.use-case.ts` (consent → file-security → payment capture → extraction → buffer wipe in `finally` → text-only `StyleMatchService`).

## Entities (contracts owned by `packages/shared/src/schemas/`)

- `TraitExtractionResponse` — traits + uncertaintyNotes; `traitCount` DERIVED via `countPopulatedTraitFields` transform, never trusted.
- `Candidate` / `CandidateGenerationResponse` — name, publicCategory, styleVibeFitScore 0–100, confidence, 4 literal-false safety flags.
- `JudgedResult` / `CandidateJudgeResponse` — finalStyleVibeFitScore, verdict, `shouldDisplay`, 5 literal-false flags + `meetsMinimumEvidence`.
- `FinalGameResult` / `FinalResultItem` — the strict `/game/analyze` response and translation unit (`game-result.schema.ts`).
- SSE frames — discriminated union on `event` with a tabId/requestId/streamId/status envelope (`game-stream.schema.ts`).
- Share record — safe result JSON + timing only, never an image (`share-result.schema.ts`).
- Enums (as-const, `packages/shared/src/enums/`): ConfidenceLevel, Verdict (strong/medium/weak), PublicCategory, PopularityLevel, GameStreamEvent/Stage, StreamStatus.

## Invariants

- Prompt contract version `GAME_PROMPT_VERSION = 'written-traits-v5'` is a `z.literal` in every AI response schema (`packages/shared/src/constants/app.constants.ts`); a stale prompt/model pairing fails validation. Lock-step test: `apps/api/src/modules/ai/tests/ai-pipeline.test.ts`.
- All `safetyCheck` flags are `z.literal(false)` — any `true` fails Zod outright.
- Response `languageCode` must echo the request (`lib/response-language.guard.ts`); analyze normalizes unknown languages to default, translate rejects (`packages/shared/src/constants/language.constants.ts`).
- Disclaimer + no-match fallback are server constants `RESULT_DISCLAIMER_BY_LANGUAGE` / `NO_MATCH_FALLBACK_BY_LANGUAGE` (`app.constants.ts`) — model text never trusted.
- Judge score calibration is owned by `use-3rd-prompt.md`, deliberately NOT mirrored in shared constants (comment in `trait.constants.ts`).

## Limits (single source: `packages/shared/src/constants/`)

| Limit | Value | Owner |
| --- | --- | --- |
| Result count | 1–10, default 10 | `trait.constants.ts` |
| Candidate pool | 1–25 | `trait.constants.ts` |
| Score range / display floor | 0–100 / ≥70 (`MIN_DISPLAY_SCORE`) | `trait.constants.ts` |
| Trait taxonomy | 16 categories, 221 fields | `trait-category.constants.ts` |
| Trait value length / compact summary | ≤300 chars / 1–35 items | `trait-category.constants.ts` |
| Text/array bounds (names 120, reasons 1000, trait arrays ≤15 …) | see file | `response-bounds.constants.ts` |
| Upload | 5 MiB business / 10 MiB transport cap; jpg/jpeg/png/webp only | `upload.constants.ts` |
| Share TTL | default 600 s (60–3600), payload ≤50 KB, ≤1000 active | `share-result.constants.ts` |
| Languages | en, ar (default en) | `language.constants.ts` |

Safety wordlists (bilingual, 33+33 entries): `packages/shared/src/constants/safety.constants.ts` — see `knowledge/summaries/ai-pipeline.md` for the enforcement chain.
