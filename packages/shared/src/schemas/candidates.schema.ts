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
import { CONFIDENCE_LEVEL_VALUES } from '../enums/confidence.enum';
import { POPULARITY_LEVEL_VALUES } from '../enums/popularity.enum';
import { PUBLIC_CATEGORY_VALUES } from '../enums/public-category.enum';

import { LanguageCodeSchema } from './language.schema';

/** Short localized trait-reference text used across candidate detail arrays. */
const traitReferenceSchema = z.string().trim().min(1).max(MAX_TRAIT_REFERENCE_LENGTH);

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
export const CandidateSchema = z.strictObject({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  publicCategory: z.enum(PUBLIC_CATEGORY_VALUES),
  countryOrRegion: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  globalPopularityLevel: z.enum(POPULARITY_LEVEL_VALUES),
  styleVibeFitScore: z.number().int().min(MIN_SCORE).max(MAX_SCORE),
  confidenceLevel: z.enum(CONFIDENCE_LEVEL_VALUES),
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
  .strictObject({
    promptVersion: z.literal(GAME_PROMPT_VERSION),
    languageCode: LanguageCodeSchema,
    resultCount: z.number().int().min(MIN_RESULT_COUNT).max(MAX_RESULT_COUNT),
    candidateCount: z.number().int().min(0).max(MAX_CANDIDATE_POOL),
    candidates: z.array(CandidateSchema).min(MIN_CANDIDATE_POOL).max(MAX_CANDIDATE_POOL),
    fallbackMessage: z.string().max(MAX_FALLBACK_MESSAGE_LENGTH),
  })
  .refine((response) => response.candidateCount === response.candidates.length, {
    message: 'candidateCount must equal the number of candidates',
    path: ['candidateCount'],
  })
  .refine((response) => response.candidateCount >= response.resultCount, {
    message: 'candidateCount must be at least resultCount',
    path: ['candidateCount'],
  });

export type Candidate = z.infer<typeof CandidateSchema>;
export type CandidateGenerationResponse = z.infer<typeof CandidateGenerationResponseSchema>;
