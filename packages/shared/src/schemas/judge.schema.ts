import { z } from 'zod';

import { GAME_PROMPT_VERSION } from '../constants/app.constants';
import {
  MAX_DISCLAIMER_LENGTH,
  MAX_FALLBACK_MESSAGE_LENGTH,
  MAX_JUDGE_NOTES_LENGTH,
  MAX_NAME_LENGTH,
  MAX_REASON_LENGTH,
  MAX_REMOVED_REASON_LENGTH,
  MAX_TRAIT_ARRAY_ITEMS,
  MAX_TRAIT_REFERENCE_LENGTH,
} from '../constants/response-bounds.constants';
import {
  MAX_CANDIDATE_POOL,
  MAX_RESULT_COUNT,
  MAX_SCORE,
  MIN_RESULT_COUNT,
  MIN_SCORE,
} from '../constants/trait.constants';
import { CONFIDENCE_LEVEL_VALUES } from '../enums/confidence.enum';
import { PUBLIC_CATEGORY_VALUES } from '../enums/public-category.enum';
import { VERDICT_VALUES } from '../enums/verdict.enum';

import { LanguageCodeSchema } from './language.schema';

/** Short localized trait-reference text used across judged detail arrays. */
const traitReferenceSchema = z.string().trim().min(1).max(MAX_TRAIT_REFERENCE_LENGTH);

/** Gemini sometimes omits or mangles rank; keep the result and let backend sorting re-rank later. */
const normalizeRank = (value: unknown): unknown =>
  typeof value === 'number' && Number.isInteger(value) ? value : MIN_RESULT_COUNT;

export const JudgeSafetyCheckSchema = z.strictObject({
  containsFaceRecognitionClaim: z.literal(false),
  containsBiometricClaim: z.literal(false),
  containsIdentityClaim: z.literal(false),
  containsExactLookalikeClaim: z.literal(false),
  containsSensitiveInference: z.literal(false),
  meetsMinimumEvidence: z.boolean(),
});

/**
 * One strictly-judged final candidate: rescored, verdict-banded, localized
 * reasoning, and the judge's explicit display decision.
 */
export const JudgedResultSchema = z.strictObject({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  rank: z.preprocess(normalizeRank, z.number().int().min(MIN_RESULT_COUNT).max(MAX_RESULT_COUNT)),
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
  shouldDisplay: z.boolean(),
  safetyCheck: JudgeSafetyCheckSchema,
});

/** A candidate the judge refused, with its localized removal reason. */
export const RemovedCandidateSchema = z.strictObject({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  reasonRemoved: z.string().trim().min(1).max(MAX_REMOVED_REASON_LENGTH),
});

/** Full Prompt 3 response contract (backend still re-enforces every bound). */
export const CandidateJudgeResponseSchema = z
  .strictObject({
    promptVersion: z.literal(GAME_PROMPT_VERSION),
    languageCode: LanguageCodeSchema,
    resultCount: z.number().int().min(MIN_RESULT_COUNT).max(MAX_RESULT_COUNT),
    results: z.array(JudgedResultSchema).min(MIN_RESULT_COUNT).max(MAX_RESULT_COUNT),
    removedCandidates: z.array(RemovedCandidateSchema).max(MAX_CANDIDATE_POOL),
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

export type JudgedResult = z.infer<typeof JudgedResultSchema>;
export type RemovedCandidate = z.infer<typeof RemovedCandidateSchema>;
export type CandidateJudgeResponse = z.infer<typeof CandidateJudgeResponseSchema>;
