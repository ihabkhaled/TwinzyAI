import { z } from 'zod';

import { MAX_CANDIDATES, MAX_SCORE, MIN_CANDIDATES, MIN_SCORE } from '../constants/trait.constants';
import { PUBLIC_CATEGORY_VALUES } from '../enums/public-category.enum';

export const CandidateSafetyCheckSchema = z.object({
  containsFaceRecognitionClaim: z.literal(false),
  containsBiometricClaim: z.literal(false),
  containsIdentityClaim: z.literal(false),
  containsExactLookalikeClaim: z.literal(false),
});

export const CandidateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  publicCategory: z.enum(PUBLIC_CATEGORY_VALUES),
  countryOrRegion: z.string().trim().min(1).max(120),
  styleVibeFitScore: z.number().int().min(MIN_SCORE).max(MAX_SCORE),
  reason: z.string().trim().min(1).max(1000),
  alignedTraits: z.array(z.string().trim().min(1).max(200)).max(15),
  weakOrUncertainTraits: z.array(z.string().trim().min(1).max(200)).max(15),
  safetyCheck: CandidateSafetyCheckSchema,
});

export const CandidateGenerationResponseSchema = z.object({
  candidates: z.array(CandidateSchema).min(MIN_CANDIDATES).max(MAX_CANDIDATES),
});

export type Candidate = z.infer<typeof CandidateSchema>;
export type CandidateGenerationResponse = z.infer<typeof CandidateGenerationResponseSchema>;
