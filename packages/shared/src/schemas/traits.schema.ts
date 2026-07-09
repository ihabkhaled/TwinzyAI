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

/** Build the strict field shape for one trait category from its field list. */
const buildCategoryShape = (fields: readonly string[]): Record<string, typeof traitValueSchema> =>
  Object.fromEntries(fields.map((field) => [field, traitValueSchema]));

/** Strict per-category schemas derived from the single taxonomy source. */
const categoryShape = Object.fromEntries(
  Object.entries(TRAIT_CATEGORY_FIELDS).map(([category, fields]) => [
    category,
    z.strictObject(buildCategoryShape(fields)),
  ]),
) as Record<
  keyof typeof TRAIT_CATEGORY_FIELDS,
  z.ZodObject<Record<string, typeof traitValueSchema>>
>;

/** Structured honesty block: what the model could NOT observe, and why. */
const uncertaintyNotesShape = Object.fromEntries(
  UNCERTAINTY_NOTE_FIELDS.map((field) => [
    field,
    z.array(traitValueSchema).max(MAX_UNCERTAINTY_NOTES_PER_FIELD),
  ]),
) as Record<(typeof UNCERTAINTY_NOTE_FIELDS)[number], z.ZodArray<typeof traitValueSchema>>;

export const UncertaintyNotesSchema = z.strictObject(uncertaintyNotesShape);

/**
 * The advanced-global-traits-v3 nested trait payload: all 16 categories (221
 * named fields, every value localized text) plus the uncertainty-notes block.
 * `strictObject` end-to-end: a drifting model response cannot smuggle new
 * fields in, and a missing category/field fails validation outright.
 */
export const TraitsSchema = z.strictObject({
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
export const TraitSafetyCheckSchema = z.strictObject({
  containsIdentityClaim: z.literal(false),
  containsCelebrityComparison: z.literal(false),
  containsSensitiveInference: z.literal(false),
  containsFaceRecognitionClaim: z.literal(false),
  containsBiometricClaim: z.literal(false),
});

const tokenSchema = z.string().trim().min(1).max(MAX_TRAIT_TOKEN_LENGTH);
const weightedEvidenceSchema = z.strictObject({
  token: tokenSchema,
  weight: z.number().int().min(1).max(MAX_TRAIT_EVIDENCE_WEIGHT),
});

const imageQualityCapSchema = z.strictObject({
  quality: z.enum(['clear', 'moderate', 'low', 'very-low']),
  impact: z.string().trim().min(1).max(MAX_IMAGE_QUALITY_IMPACT_LENGTH),
});

const candidateSearchHintSchema = z.strictObject({
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
  .strictObject({
    promptVersion: z.literal(GAME_PROMPT_VERSION),
    languageCode: LanguageCodeSchema,
    traitCount: z.number().int().min(0).max(MAX_TRAIT_COUNT),
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
  .refine((response) => response.traitCount === countPopulatedTraitFields(response.traits), {
    message: 'traitCount must equal the number of populated trait fields',
    path: ['traitCount'],
  });

export type Traits = z.infer<typeof TraitsSchema>;
export type UncertaintyNotes = z.infer<typeof UncertaintyNotesSchema>;
export type TraitExtractionResponse = z.infer<typeof TraitExtractionResponseSchema>;
