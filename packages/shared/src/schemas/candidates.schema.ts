import { z } from 'zod';

import { GAME_PROMPT_VERSION } from '../constants/app.constants';
import { MAX_CANDIDATES, MAX_SCORE, MIN_CANDIDATES, MIN_SCORE } from '../constants/trait.constants';
import { CONFIDENCE_LEVEL_VALUES } from '../enums/confidence.enum';
import { POPULARITY_LEVEL_VALUES } from '../enums/popularity.enum';
import { PUBLIC_CATEGORY_VALUES } from '../enums/public-category.enum';

import { LanguageCodeSchema } from './language.schema';

/** Short localized trait-reference text used across candidate detail arrays. */
const traitReferenceSchema = z.string().trim().min(1).max(200);

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
  name: z.string().trim().min(1).max(120),
  publicCategory: z.enum(PUBLIC_CATEGORY_VALUES),
  countryOrRegion: z.string().trim().min(1).max(120),
  globalPopularityLevel: z.enum(POPULARITY_LEVEL_VALUES),
  styleVibeFitScore: z.number().int().min(MIN_SCORE).max(MAX_SCORE),
  confidenceLevel: z.enum(CONFIDENCE_LEVEL_VALUES),
  reason: z.string().trim().min(1).max(1000),
  strongAlignedTraits: z.array(traitReferenceSchema).max(15),
  mediumAlignedTraits: z.array(traitReferenceSchema).max(15),
  weakOrUncertainTraits: z.array(traitReferenceSchema).max(15),
  majorMismatchRisks: z.array(traitReferenceSchema).max(15),
  whyThisCandidateWasChosen: z.string().trim().min(1).max(600),
  scoreExplanation: z.string().trim().min(1).max(600),
  safetyCheck: CandidateSafetyCheckSchema,
});

/**
 * Full Prompt 2 response contract. `candidateCount` must equal the actual
 * list length — a sloppy model self-report fails validation.
 */
export const CandidateGenerationResponseSchema = z
  .strictObject({
    promptVersion: z.literal(GAME_PROMPT_VERSION),
    languageCode: LanguageCodeSchema,
    candidateCount: z.number().int().min(0).max(MAX_CANDIDATES),
    candidates: z.array(CandidateSchema).min(MIN_CANDIDATES).max(MAX_CANDIDATES),
    fallbackMessage: z.string().max(500),
  })
  .refine((response) => response.candidateCount === response.candidates.length, {
    message: 'candidateCount must equal the number of candidates',
    path: ['candidateCount'],
  });

export type Candidate = z.infer<typeof CandidateSchema>;
export type CandidateGenerationResponse = z.infer<typeof CandidateGenerationResponseSchema>;
