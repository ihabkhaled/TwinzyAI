import { z } from 'zod';

import {
  MAX_CANDIDATES,
  MAX_SCORE,
  MIN_SCORE,
} from '../constants/trait.constants';
import { VERDICT_VALUES } from '../enums/verdict.enum';

export const JudgedResultSchema = z.object({
  name: z.string().trim().min(1).max(120),
  rank: z.number().int().min(1).max(MAX_CANDIDATES),
  finalStyleVibeFitScore: z.number().int().min(MIN_SCORE).max(MAX_SCORE),
  verdict: z.enum(VERDICT_VALUES),
  reason: z.string().trim().min(1).max(1000),
  matchingTraits: z.array(z.string().trim().min(1).max(200)).max(15),
  weakOrUncertainTraits: z.array(z.string().trim().min(1).max(200)).max(15),
  shouldDisplay: z.boolean(),
});

export const CandidateJudgeResponseSchema = z.object({
  results: z.array(JudgedResultSchema).max(MAX_CANDIDATES),
  fallbackMessage: z.string().max(500),
  disclaimer: z.string().trim().min(1).max(500),
});

export type JudgedResult = z.infer<typeof JudgedResultSchema>;
export type CandidateJudgeResponse = z.infer<typeof CandidateJudgeResponseSchema>;