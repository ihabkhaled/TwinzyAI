import { z } from 'zod';

import { GAME_PROMPT_VERSION } from '../constants/app.constants';
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
const traitValueSchema = z.string().trim().min(1).max(MAX_TRAIT_TEXT_LENGTH);

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
 * The advanced-global-traits-v2 nested trait payload: all 16 categories (221
 * named fields, every value localized text) plus the uncertainty-notes block.
 * `strictObject` end-to-end: a drifting model response cannot smuggle new
 * fields in, and a missing category/field fails validation outright.
 */
export const TraitsSchema = z.strictObject({
  ...categoryShape,
  uncertaintyNotes: UncertaintyNotesSchema,
});

export const TraitSafetyCheckSchema = z.object({
  containsIdentityClaim: z.literal(false),
  containsCelebrityComparison: z.literal(false),
  containsSensitiveInference: z.literal(false),
  containsFaceRecognitionClaim: z.literal(false),
  containsBiometricClaim: z.literal(false),
});

/**
 * Full Prompt 1 response contract. `promptVersion` is a literal — a stale
 * template/model pairing fails fast instead of silently serving old data.
 */
export const TraitExtractionResponseSchema = z.strictObject({
  promptVersion: z.literal(GAME_PROMPT_VERSION),
  languageCode: LanguageCodeSchema,
  traitCount: z.number().int().min(0).max(MAX_TRAIT_COUNT),
  traits: TraitsSchema,
  compactTraitSummary: z.array(traitValueSchema).min(1).max(MAX_COMPACT_TRAIT_SUMMARY),
  safetyCheck: TraitSafetyCheckSchema,
});

export type Traits = z.infer<typeof TraitsSchema>;
export type UncertaintyNotes = z.infer<typeof UncertaintyNotesSchema>;
export type TraitExtractionResponse = z.infer<typeof TraitExtractionResponseSchema>;
