import { z } from 'zod';

import { GAME_PROMPT_VERSION } from '../constants/app.constants';
import {
  MAX_ARCHETYPE_LENGTH,
  MAX_CANDIDATE_SEARCH_HINTS,
  MAX_HIGH_SIGNAL_TOKENS,
  MAX_IMAGE_QUALITY_CAPS,
  MAX_IMAGE_QUALITY_IMPACT_LENGTH,
  MAX_SEARCH_HINT_REASON_LENGTH,
  MAX_TRAIT_EVIDENCE_WEIGHT,
  MAX_TRAIT_TOKEN_LENGTH,
  MAX_VISUAL_ARCHETYPE_HINTS,
  MAX_WEIGHTED_EVIDENCE_ITEMS,
} from '../constants/response-bounds.constants';
import {
  MAX_COMPACT_TRAIT_SUMMARY,
  MAX_TRAIT_COUNT,
  MAX_TRAIT_TEXT_LENGTH,
  MAX_UNCERTAINTY_NOTES_PER_FIELD,
  TRAIT_CATEGORY_FIELDS,
  UNCERTAINTY_NOTE_FIELDS,
} from '../constants/trait-category.constants';

import { LanguageCodeSchema } from './language.schema';

/** One localized trait observation (or the localized equivalent of "unclear"). */
export const traitValueSchema = z.string().trim().min(1).max(MAX_TRAIT_TEXT_LENGTH);

/**
 * A single trait field as the EXTRACTION model reports it. Tolerant by design:
 * a model that leaves an unobservable feature null / empty / missing (across
 * 221 fields it always leaves a few) yields `undefined` for that field instead
 * of failing the whole extraction and burning a model-chain fallback. Populated
 * fields are still bounded, non-empty, localized strings; downstream matching
 * uses the aggregates plus whatever fields are present.
 */
const optionalTraitValue = traitValueSchema.optional().catch('');

/** Build the field shape for one trait category from its field list. */
const buildCategoryShape = (fields: readonly string[]): Record<string, typeof optionalTraitValue> =>
  Object.fromEntries(fields.map((field) => [field, optionalTraitValue]));

/** Strict per-category schemas derived from the single taxonomy source. */
const categoryShape = Object.fromEntries(
  Object.entries(TRAIT_CATEGORY_FIELDS).map(([category, fields]) => [
    category,
    z.object(buildCategoryShape(fields)),
  ]),
) as Record<
  keyof typeof TRAIT_CATEGORY_FIELDS,
  z.ZodObject<Record<string, typeof optionalTraitValue>>
>;

/** Structured honesty block: what the model could NOT observe, and why. */
const uncertaintyNotesShape = Object.fromEntries(
  UNCERTAINTY_NOTE_FIELDS.map((field) => [
    field,
    z.array(traitValueSchema).max(MAX_UNCERTAINTY_NOTES_PER_FIELD),
  ]),
) as Record<(typeof UNCERTAINTY_NOTE_FIELDS)[number], z.ZodArray<typeof traitValueSchema>>;

export const UncertaintyNotesSchema = z.object(uncertaintyNotesShape);

/**
 * The visual-similarity-v4 nested trait payload: all 16 categories (221 named
 * fields, every populated value localized text) plus the uncertainty-notes
 * block. Each category is required, but individual fields are tolerant (see
 * `optionalTraitValue`): a model that omits/nulls a few of 221 fields yields a
 * partial category rather than a failed extraction. Unknown extra fields are
 * stripped (not smuggled through) — the safety filter still scans every value.
 */
export const TraitsSchema = z.object({
  ...categoryShape,
  uncertaintyNotes: UncertaintyNotesSchema,
});

/**
 * Extraction self-report (visual-similarity mode): extraction DESCRIBES the
 * person only — it must not assert who they are, must not name candidates itself
 * (that is the generator's job), must not make sensitive inferences, and must not
 * phrase output in clinical biometric-identification vocabulary. Downstream
 * visual-similarity matching is the product; these booleans guard the OUTPUT
 * VOICE, not the mechanism.
 */
export const TraitSafetyCheckSchema = z.object({
  containsIdentityClaim: z.literal(false),
  containsCelebrityComparison: z.literal(false),
  containsSensitiveInference: z.literal(false),
  containsFaceRecognitionClaim: z.literal(false),
  containsBiometricClaim: z.literal(false),
});

const tokenSchema = z.string().trim().min(1).max(MAX_TRAIT_TOKEN_LENGTH);
const weightedEvidenceSchema = z.object({
  token: tokenSchema,
  weight: z.number().int().min(1).max(MAX_TRAIT_EVIDENCE_WEIGHT),
});

const imageQualityCapSchema = z.object({
  quality: z.enum(['clear', 'moderate', 'low', 'very-low']).catch('moderate'),
  impact: z.string().trim().min(1).max(MAX_IMAGE_QUALITY_IMPACT_LENGTH),
});

const candidateSearchHintSchema = z.object({
  archetype: z.string().trim().min(1).max(MAX_ARCHETYPE_LENGTH),
  why: z.string().trim().min(1).max(MAX_SEARCH_HINT_REASON_LENGTH),
});

/**
 * Count the number of populated (non-empty) trait fields across all categories.
 * Uncertainty notes are not counted as trait observations.
 */
export const countPopulatedTraitFields = (traits: Record<string, unknown>): number =>
  Object.entries(traits).reduce((count, [key, value]) => {
    if (key === 'uncertaintyNotes') return count;
    if (typeof value !== 'object' || value === null) return count;
    return (
      count +
      Object.values(value as Record<string, unknown>).filter(
        (fieldValue) => typeof fieldValue === 'string' && fieldValue.trim().length > 0,
      ).length
    );
  }, 0);

/**
 * Full Prompt 1 response contract. `promptVersion` is a literal — a stale
 * template/model pairing fails fast instead of silently serving old data.
 */
export const TraitExtractionResponseSchema = z
  .object({
    promptVersion: z.literal(GAME_PROMPT_VERSION),
    languageCode: LanguageCodeSchema,
    // Advisory only — the model's self-reported count is tolerated (models
    // over/under-count) and then overwritten by the authoritative transform
    // below. `.catch` keeps an out-of-range or missing value from failing the
    // whole extraction.
    traitCount: z.number().int().min(0).max(MAX_TRAIT_COUNT).catch(0),
    traits: TraitsSchema,
    compactTraitSummary: z.array(traitValueSchema).min(1).max(MAX_COMPACT_TRAIT_SUMMARY),
    highSignalTraitTokens: z.array(tokenSchema).max(MAX_HIGH_SIGNAL_TOKENS),
    weightedTraitEvidence: z.array(weightedEvidenceSchema).max(MAX_WEIGHTED_EVIDENCE_ITEMS),
    visualArchetypeHints: z
      .array(z.string().trim().min(1).max(MAX_ARCHETYPE_LENGTH))
      .max(MAX_VISUAL_ARCHETYPE_HINTS),
    imageQualityCaps: z.array(imageQualityCapSchema).max(MAX_IMAGE_QUALITY_CAPS),
    candidateSearchHints: z.array(candidateSearchHintSchema).max(MAX_CANDIDATE_SEARCH_HINTS),
    safetyCheck: TraitSafetyCheckSchema,
  })
  // traitCount is a DERIVED value: overwrite the model's self-report with the
  // authoritative count rather than requiring the model to count 221 fields
  // exactly (which it cannot do reliably — a mismatch used to fail the whole
  // extraction and burn a model-chain fallback). The bounded field above still
  // guards against absurd values before we recompute.
  .transform((response) => ({
    ...response,
    traitCount: countPopulatedTraitFields(response.traits),
  }));

export type Traits = z.infer<typeof TraitsSchema>;
export type UncertaintyNotes = z.infer<typeof UncertaintyNotesSchema>;
export type TraitExtractionResponse = z.infer<typeof TraitExtractionResponseSchema>;
