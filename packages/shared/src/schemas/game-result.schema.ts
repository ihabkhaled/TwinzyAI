import { z } from 'zod';

import { GAME_PROMPT_VERSION } from '../constants/app.constants';
import { MAX_FINAL_RESULTS, MAX_SCORE, MIN_SCORE } from '../constants/trait.constants';
import {
  MAX_COMPACT_TRAIT_SUMMARY,
  MAX_TRAIT_COUNT,
  MAX_TRAIT_TEXT_LENGTH,
} from '../constants/trait-category.constants';
import { CONFIDENCE_LEVEL_VALUES } from '../enums/confidence.enum';
import { PUBLIC_CATEGORY_VALUES } from '../enums/public-category.enum';
import { VERDICT_VALUES } from '../enums/verdict.enum';

import { LanguageCodeSchema } from './language.schema';
import { TraitsSchema } from './traits.schema';

/** Short localized trait-reference text shown in result detail lists. */
const traitReferenceSchema = z.string().trim().min(1).max(200);

/**
 * One displayed match in the final API response: identity-safe name, rank,
 * conservative score, and localized reasoning detail.
 */
export const FinalResultItemSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  rank: z.number().int().min(1).max(MAX_FINAL_RESULTS),
  finalStyleVibeFitScore: z.number().int().min(MIN_SCORE).max(MAX_SCORE),
  confidenceLevel: z.enum(CONFIDENCE_LEVEL_VALUES),
  verdict: z.enum(VERDICT_VALUES),
  countryOrRegion: z.string().trim().min(1).max(120),
  publicCategory: z.enum(PUBLIC_CATEGORY_VALUES),
  finalReason: z.string().trim().min(1).max(1000),
  topMatchingTraits: z.array(traitReferenceSchema).max(15),
  secondaryMatchingTraits: z.array(traitReferenceSchema).max(15),
  weakOrUncertainTraits: z.array(traitReferenceSchema).max(15),
  mismatchWarnings: z.array(traitReferenceSchema).max(15),
  judgeNotes: z.string().trim().min(1).max(600),
});

/**
 * The final API response of POST /api/v1/game/analyze (and the unit the
 * translate endpoint localizes). Aggregation builds it exclusively from
 * validated, safety-filtered parts; the disclaimer and fallback are always
 * the server's own localized constants, never model text.
 */
export const FinalGameResultSchema = z.strictObject({
  promptVersion: z.literal(GAME_PROMPT_VERSION),
  languageCode: LanguageCodeSchema,
  traitCount: z.number().int().min(0).max(MAX_TRAIT_COUNT),
  traits: TraitsSchema,
  compactTraitSummary: z
    .array(z.string().trim().min(1).max(MAX_TRAIT_TEXT_LENGTH))
    .min(1)
    .max(MAX_COMPACT_TRAIT_SUMMARY),
  results: z.array(FinalResultItemSchema).max(MAX_FINAL_RESULTS),
  fallbackMessage: z.string().max(500),
  disclaimer: z.string().trim().min(1).max(500),
});

export type FinalResultItem = z.infer<typeof FinalResultItemSchema>;
export type FinalGameResult = z.infer<typeof FinalGameResultSchema>;
