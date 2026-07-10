import { z } from 'zod';

import { GAME_PROMPT_VERSION } from '../constants/app.constants';
import {
  MAX_CHOSEN_REASON_LENGTH,
  MAX_FALLBACK_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_REASON_LENGTH,
  MAX_TRAIT_ARRAY_ITEMS,
  MAX_TRAIT_REFERENCE_LENGTH,
} from '../constants/response-bounds.constants';
import {
  MAX_CANDIDATE_POOL,
  MAX_RESULT_COUNT,
  MAX_SCORE,
  MIN_CANDIDATE_POOL,
  MIN_RESULT_COUNT,
  MIN_SCORE,
} from '../constants/trait.constants';
import { CONFIDENCE_LEVEL_VALUES, ConfidenceLevel } from '../enums/confidence.enum';
import { POPULARITY_LEVEL_VALUES, PopularityLevel } from '../enums/popularity.enum';
import { PUBLIC_CATEGORY_VALUES, PublicCategory } from '../enums/public-category.enum';

import { LanguageCodeSchema } from './language.schema';

/** Short localized trait-reference text used across candidate detail arrays. */
const traitReferenceSchema = z.string().trim().min(1).max(MAX_TRAIT_REFERENCE_LENGTH);

/**
 * Candidate self-report for the written-traits-only style/vibe step. Identity,
 * exact-lookalike, face-recognition, and biometric claims must all be false;
 * free text is also checked against the shared forbidden-wording lists.
 */
export const CandidateSafetyCheckSchema = z.object({
  containsFaceRecognitionClaim: z.literal(false),
  containsBiometricClaim: z.literal(false),
  containsIdentityClaim: z.literal(false),
  containsExactLookalikeClaim: z.literal(false),
});

/**
 * One advanced-global-traits-v2 candidate: the public figure's common
 * spelling name plus localized, bounded reasoning detail. Every free-text
 * field is additionally safety-filtered server-side.
 */
export const CandidateSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  publicCategory: z.enum(PUBLIC_CATEGORY_VALUES).catch(PublicCategory.Other),
  countryOrRegion: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  globalPopularityLevel: z.enum(POPULARITY_LEVEL_VALUES).catch(PopularityLevel.Medium),
  styleVibeFitScore: z.number().int().min(MIN_SCORE).max(MAX_SCORE),
  confidenceLevel: z.enum(CONFIDENCE_LEVEL_VALUES).catch(ConfidenceLevel.Low),
  reason: z.string().trim().min(1).max(MAX_REASON_LENGTH),
  strongAlignedTraits: z.array(traitReferenceSchema).max(MAX_TRAIT_ARRAY_ITEMS),
  mediumAlignedTraits: z.array(traitReferenceSchema).max(MAX_TRAIT_ARRAY_ITEMS),
  weakOrUncertainTraits: z.array(traitReferenceSchema).max(MAX_TRAIT_ARRAY_ITEMS),
  majorMismatchRisks: z.array(traitReferenceSchema).max(MAX_TRAIT_ARRAY_ITEMS),
  whyThisCandidateWasChosen: z.string().trim().min(1).max(MAX_CHOSEN_REASON_LENGTH),
  scoreExplanation: z.string().trim().min(1).max(MAX_CHOSEN_REASON_LENGTH),
  safetyCheck: CandidateSafetyCheckSchema,
});

/**
 * Full Prompt 2 response contract. `candidateCount` must equal the actual
 * list length — a sloppy model self-report fails validation. The pool is
 * larger than the requested result count so the judge has headroom to filter.
 */
export const CandidateGenerationResponseSchema = z
  .object({
    promptVersion: z.literal(GAME_PROMPT_VERSION),
    languageCode: LanguageCodeSchema,
    // Advisory self-reports: neither is consumed downstream (only `candidates`
    // is). Tolerate whatever the model echoes rather than failing the whole
    // generation over a miscount, then derive candidateCount authoritatively.
    resultCount: z
      .number()
      .int()
      .min(MIN_RESULT_COUNT)
      .max(MAX_RESULT_COUNT)
      .catch(MIN_RESULT_COUNT),
    candidateCount: z.number().int().min(0).max(MAX_CANDIDATE_POOL).catch(0),
    candidates: z.array(CandidateSchema).min(MIN_CANDIDATE_POOL).max(MAX_CANDIDATE_POOL),
    fallbackMessage: z.string().max(MAX_FALLBACK_MESSAGE_LENGTH),
  })
  .transform((response) => ({
    ...response,
    candidateCount: response.candidates.length,
  }));

export type Candidate = z.infer<typeof CandidateSchema>;
export type CandidateGenerationResponse = z.infer<typeof CandidateGenerationResponseSchema>;
