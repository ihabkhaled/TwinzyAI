import { z } from 'zod';

import { TRAIT_KEYS } from '../constants/trait.constants';

const traitValueSchema = z.string().trim().min(1).max(300);

const traitShape = Object.fromEntries(TRAIT_KEYS.map((key) => [key, traitValueSchema])) as Record<
  (typeof TRAIT_KEYS)[number],
  typeof traitValueSchema
>;

/**
 * Exactly 15 visible, non-identifying trait fields. `strict()` rejects
 * extra fields so a drifting model response cannot smuggle new data in.
 */
export const TraitsSchema = z.strictObject(traitShape);

export const TraitSafetyCheckSchema = z.object({
  containsIdentityClaim: z.literal(false),
  containsCelebrityComparison: z.literal(false),
  containsSensitiveInference: z.literal(false),
  containsFaceRecognitionClaim: z.literal(false),
  containsBiometricClaim: z.literal(false),
});

export const TraitExtractionResponseSchema = z.object({
  traits: TraitsSchema,
  safetyCheck: TraitSafetyCheckSchema,
});

export type Traits = z.infer<typeof TraitsSchema>;
export type TraitExtractionResponse = z.infer<typeof TraitExtractionResponseSchema>;
