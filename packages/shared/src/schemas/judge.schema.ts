import { z } from 'zod';

import { GAME_PROMPT_VERSION } from '../constants/app.constants';
import { MAX_CANDIDATES, MAX_SCORE, MIN_SCORE } from '../constants/trait.constants';
import { CONFIDENCE_LEVEL_VALUES } from '../enums/confidence.enum';
import { PUBLIC_CATEGORY_VALUES } from '../enums/public-category.enum';
import { VERDICT_VALUES } from '../enums/verdict.enum';

import { LanguageCodeSchema } from './language.schema';

/** Short localized trait-reference text used across judged detail arrays. */
const traitReferenceSchema = z.string().trim().min(1).max(200);

/**
 * One strictly-judged final candidate: rescored, verdict-banded, localized
 * reasoning, and the judge's explicit display decision.
 */
export const JudgedResultSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  rank: z.number().int().min(1).max(MAX_CANDIDATES),
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
  shouldDisplay: z.boolean(),
});

/** A candidate the judge refused, with its localized removal reason. */
export const RemovedCandidateSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  reasonRemoved: z.string().trim().min(1).max(500),
});

/** Full Prompt 3 response contract (backend still re-enforces every bound). */
export const CandidateJudgeResponseSchema = z.strictObject({
  promptVersion: z.literal(GAME_PROMPT_VERSION),
  languageCode: LanguageCodeSchema,
  results: z.array(JudgedResultSchema).max(MAX_CANDIDATES),
  removedCandidates: z.array(RemovedCandidateSchema).max(MAX_CANDIDATES),
  fallbackMessage: z.string().max(500),
  disclaimer: z.string().trim().min(1).max(500),
});

export type JudgedResult = z.infer<typeof JudgedResultSchema>;
export type RemovedCandidate = z.infer<typeof RemovedCandidateSchema>;
export type CandidateJudgeResponse = z.infer<typeof CandidateJudgeResponseSchema>;
