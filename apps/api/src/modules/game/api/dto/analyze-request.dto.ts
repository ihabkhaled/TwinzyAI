import { z } from 'zod';

/**
 * Multipart body of POST /api/v1/game/analyze. Multipart fields arrive as
 * strings; consent must be the literal string "true" (or boolean true from
 * JSON clients) — anything else is not consent. `languageCode` is free-form
 * at the transport edge and NORMALIZED to a supported code (default `en`) by
 * the language lib — a friendly UX decision for multipart clients; the
 * translate endpoint rejects unsupported codes strictly instead.
 */
export const AnalyzeRequestBodySchema = z.object({
  consent: z.union([z.literal('true'), z.literal(true)]).optional(),
  languageCode: z.string().max(35).optional(),
});

export type AnalyzeRequestBody = z.infer<typeof AnalyzeRequestBodySchema>;
