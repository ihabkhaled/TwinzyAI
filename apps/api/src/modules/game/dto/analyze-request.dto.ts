import { z } from 'zod';

/**
 * Multipart body of POST /api/v1/game/analyze. Multipart fields arrive as
 * strings; consent must be the literal string "true" (or boolean true from
 * JSON clients) — anything else is not consent.
 */
export const AnalyzeRequestBodySchema = z.object({
  consent: z.union([z.literal('true'), z.literal(true)]).optional(),
});

export type AnalyzeRequestBody = z.infer<typeof AnalyzeRequestBodySchema>;

export const isConsentGiven = (body: unknown): boolean => {
  const parsed = AnalyzeRequestBodySchema.safeParse(body);
  return parsed.success && parsed.data.consent !== undefined;
};
