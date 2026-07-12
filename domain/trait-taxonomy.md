---
id: domain-trait-taxonomy
title: Trait Taxonomy — 16 Categories, 221 Visible-Trait Fields
type: domain
authority: canonical
status: current
owner: repository owner
summary: The advanced-global-traits-v2 taxonomy of visible, non-identifying trait fields defined once in shared constants and consumed by the schema builder, prompt, fixtures, and i18n.
keywords: [taxonomy, traits, categories, fields, extraction, schema, uncertainty-notes, localization, lock-step]
contextTier: 2
relatedCode: [packages/shared/src/constants/trait-category.constants.ts, packages/shared/src/schemas/traits.schema.ts, apps/api/src/modules/ai/prompts/use-1st-prompt.md]
relatedTests: [apps/api/src/modules/ai/tests/ai-pipeline.test.ts, packages/shared/tests/schemas.test.ts]
relatedDocs: [domain/entities.md, domain/calculations.md, docs/ai-safety.md]
readWhen: You are touching the trait taxonomy, the extraction schema, extraction prompt, fixtures, or trait i18n labels.
---

# Trait Taxonomy — 16 Categories, 221 Visible-Trait Fields

**Single source of truth:** `packages/shared/src/constants/trait-category.constants.ts`
(`TRAIT_CATEGORY_FIELDS`, the "advanced-global-traits-v2" taxonomy). Its doc comment records
the contract: the same definition feeds the Zod schema builder
(`packages/shared/src/schemas/traits.schema.ts`), the extraction prompt
(`apps/api/src/modules/ai/prompts/use-1st-prompt.md`), the test fixtures
(`packages/shared/tests/fixtures/advanced-fixtures.ts`), and the frontend i18n label keys —
so the taxonomy is defined exactly once.

A lock-step test pins prompt ↔ taxonomy agreement: "lists every taxonomy field in the prompt
template" (`apps/api/src/modules/ai/tests/ai-pipeline.test.ts`, line 94).

## Categories and field counts

16 categories, 221 named fields (`TOTAL_TRAIT_FIELDS` is computed at runtime by reduce):

| Category key | Fields | Category key | Fields |
| --- | --- | --- | --- |
| `imageQuality` | 11 | `nose` | 15 |
| `overallFace` | 10 | `cheeksAndCheekbones` | 11 |
| `faceShapeAndProportions` | 17 | `mouthAndLips` | 16 |
| `foreheadAndHairline` | 12 | `jawlineAndChin` | 15 |
| `hair` | 20 | `facialHair` | 20 |
| `eyebrows` | 14 | `skinToneAndVisibleTexture` | 12 |
| `eyes` | 20 | `expressionAndPose` | 11 |
| — | — | `groomingAndStyle` | 10 |
| — | — | `styleVibeDescriptors` | 7 |

(Field names are the authoritative list in `trait-category.constants.ts`; e.g. `imageQuality`
holds `lightingQuality`, `sharpness`, `faceVisibility`, `faceAngle`, `occlusionLevel`, ….)

## Rules encoded in the taxonomy

- **Visible, non-identifying only.** Fields describe what is visible (shape, texture, tone,
  styling, expression); they never assert who or what the person IS. The extraction prompt
  forbids identity/celebrity/biometric/sensitive inference
  (`apps/api/src/modules/ai/prompts/use-1st-prompt.md`); enforcement layers in
  [safety-boundaries.md](safety-boundaries.md).
- **Keys are English camelCase in every language; VALUES are localized** by the model into the
  request's `languageCode` (doc comment, `trait-category.constants.ts`).
- **Every field is tolerant-optional** in the schema (`.optional().catch('')`) so a model
  omitting a few of 221 fields does not fail the whole extraction
  (`packages/shared/src/schemas/traits.schema.ts`).
- **Bounded text:** each value ≤ `MAX_TRAIT_TEXT_LENGTH` (300); `compactTraitSummary` ≤
  `MAX_COMPACT_TRAIT_SUMMARY` (35) entries (`trait-category.constants.ts`).
- **Honest uncertainty:** four `UNCERTAINTY_NOTE_FIELDS` (`imageLimitations`,
  `unclearCategories`, `lowConfidenceObservations`, `traitsNotVisible`), each array capped at
  `MAX_UNCERTAINTY_NOTES_PER_FIELD` (10). Values beginning with an
  `UNCLEAR_TRAIT_VALUE_MARKERS` prefix (bilingual — `packages/shared/src/constants/trait.constants.ts`)
  are excluded from the derived `traitCount` (`packages/shared/src/utils/trait-count.util.ts`).

## Extraction aggregates (beyond the 221 fields)

`TraitExtractionResponseSchema` also carries bounded matching aggregates produced by Prompt 1:
`highSignalTraitTokens` (≤30), `weightedTraitEvidence` (≤30 items, weight 1–10),
`visualArchetypeHints` (≤10), `imageQualityCaps` (≤5; levels
clear/moderate/low/very-low from `IMAGE_QUALITY_LEVELS`), and `candidateSearchHints` (≤10) —
bounds in `packages/shared/src/constants/response-bounds.constants.ts`.

## Changing the taxonomy

Adding/renaming/removing a field is a **contract change**: the schema, the extraction prompt,
the lock-step test, the shared fixtures, and the i18n labels all derive from
`TRAIT_CATEGORY_FIELDS`, and the prompt version (`written-traits-v5`,
`packages/shared/src/constants/app.constants.ts`) exists to version exactly this pairing.
