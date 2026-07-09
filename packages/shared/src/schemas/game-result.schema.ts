import { z } from 'zod';

import { GAME_PROMPT_VERSION } from '../constants/app.constants';
import {
  MAX_DISCLAIMER_LENGTH,
  MAX_FALLBACK_MESSAGE_LENGTH,
  MAX_JUDGE_NOTES_LENGTH,
  MAX_NAME_LENGTH,
  MAX_REASON_LENGTH,
  MAX_TRAIT_ARRAY_ITEMS,
  MAX_TRAIT_REFERENCE_LENGTH,
} from '../constants/response-bounds.constants';
import {
  MAX_RESULT_COUNT,
  MAX_SCORE,
  MIN_RESULT_COUNT,
  MIN_SCORE,
} from '../constants/trait.constants';
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
const traitReferenceSchema = z.string().trim().min(1).max(MAX_TRAIT_REFERENCE_LENGTH);

export const FinalResultSafetyCheckSchema = z.strictObject({
  containsFaceRecognitionClaim: z.literal(false),
  containsBiometricClaim: z.literal(false),
  containsIdentityClaim: z.literal(false),
  containsExactLookalikeClaim: z.literal(false),
  containsSensitiveInference: z.literal(false),
  meetsMinimumEvidence: z.boolean(),
});

/**
 * One displayed match in the final API response: identity-safe name, rank,
 * conservative score, and localized reasoning detail.
 */
export const FinalResultItemSchema = z.strictObject({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  rank: z.number().int().min(1).max(MAX_RESULT_COUNT),
  finalStyleVibeFitScore: z.number().int().min(MIN_SCORE).max(MAX_SCORE),
  confidenceLevel: z.enum(CONFIDENCE_LEVEL_VALUES),
  verdict: z.enum(VERDICT_VALUES),
  countryOrRegion: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  publicCategory: z.enum(PUBLIC_CATEGORY_VALUES),
  finalReason: z.string().trim().min(1).max(MAX_REASON_LENGTH),
  topMatchingTraits: z.array(traitReferenceSchema).max(MAX_TRAIT_ARRAY_ITEMS),
  secondaryMatchingTraits: z.array(traitReferenceSchema).max(MAX_TRAIT_ARRAY_ITEMS),
  weakOrUncertainTraits: z.array(traitReferenceSchema).max(MAX_TRAIT_ARRAY_ITEMS),
  mismatchWarnings: z.array(traitReferenceSchema).max(MAX_TRAIT_ARRAY_ITEMS),
  judgeNotes: z.string().trim().min(1).max(MAX_JUDGE_NOTES_LENGTH),
  safetyCheck: FinalResultSafetyCheckSchema,
});

/**
 * The final API response of POST /api/v1/game/analyze (and the unit the
 * translate endpoint localizes). Aggregation builds it exclusively from
 * validated, safety-filtered parts; the disclaimer and fallback are always
 * the server's own localized constants, never model text.
 */
export const FinalGameResultSchema = z
  .strictObject({
    promptVersion: z.literal(GAME_PROMPT_VERSION),
    languageCode: LanguageCodeSchema,
    resultCount: z.number().int().min(MIN_RESULT_COUNT).max(MAX_RESULT_COUNT),
    traitCount: z.number().int().min(0).max(MAX_TRAIT_COUNT),
    traits: TraitsSchema,
    compactTraitSummary: z
      .array(z.string().trim().min(1).max(MAX_TRAIT_TEXT_LENGTH))
      .min(1)
      .max(MAX_COMPACT_TRAIT_SUMMARY),
    results: z.array(FinalResultItemSchema).max(MAX_RESULT_COUNT),
    fallbackMessage: z.string().max(MAX_FALLBACK_MESSAGE_LENGTH),
    disclaimer: z.string().trim().min(1).max(MAX_DISCLAIMER_LENGTH),
  })
  .refine((response) => response.results.length <= response.resultCount, {
    message: 'results must not exceed the requested resultCount',
    path: ['results'],
  })
  .refine(
    (response) =>
      response.results.length > 0 ||
      (response.fallbackMessage.length > 0 && response.results.length === 0),
    {
      message: 'fallbackMessage is required when results are empty',
      path: ['fallbackMessage'],
    },
  );

export type FinalResultItem = z.infer<typeof FinalResultItemSchema>;
export type FinalGameResult = z.infer<typeof FinalGameResultSchema>;
