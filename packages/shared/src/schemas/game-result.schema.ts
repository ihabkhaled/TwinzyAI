import { z } from 'zod';

import { MAX_FINAL_RESULTS, MAX_SCORE, MIN_SCORE } from '../constants/trait.constants';
import { VERDICT_VALUES } from '../enums/verdict.enum';

import { TraitsSchema } from './traits.schema';

export const FinalResultItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  rank: z.number().int().min(1).max(MAX_FINAL_RESULTS),
  finalStyleVibeFitScore: z.number().int().min(MIN_SCORE).max(MAX_SCORE),
  verdict: z.enum(VERDICT_VALUES),
  reason: z.string().trim().min(1).max(1000),
  matchingTraits: z.array(z.string().trim().min(1).max(200)).max(15),
  weakOrUncertainTraits: z.array(z.string().trim().min(1).max(200)).max(15),
});

/**
 * The final API response returned by POST /api/v1/game/analyze.
 */
export const FinalGameResultSchema = z.object({
  traits: TraitsSchema,
  results: z.array(FinalResultItemSchema).max(MAX_FINAL_RESULTS),
  fallbackMessage: z.string().max(500),
  disclaimer: z.string().trim().min(1).max(500),
});

export type FinalResultItem = z.infer<typeof FinalResultItemSchema>;
export type FinalGameResult = z.infer<typeof FinalGameResultSchema>;
