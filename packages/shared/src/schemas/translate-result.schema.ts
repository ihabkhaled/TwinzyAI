import { z } from 'zod';

import { FinalGameResultSchema } from './game-result.schema';
import { LanguageCodeSchema } from './language.schema';

/**
 * Body of POST /api/v1/game/translate-result: the client's existing
 * structured result plus the language to localize it into. Strict: unknown
 * keys are rejected, no file/image slot exists by construction, and every
 * nested field is bounded by the result schema itself.
 */
export const TranslateResultRequestSchema = z.strictObject({
  targetLanguageCode: LanguageCodeSchema,
  result: FinalGameResultSchema,
});

/**
 * The translated result: identical structure, text fields localized, names/
 * scores/ranks/verdicts preserved (enforced server-side, not trusted).
 */
export const TranslateResultResponseSchema = FinalGameResultSchema;

export type TranslateResultRequest = z.infer<typeof TranslateResultRequestSchema>;
export type TranslateResultResponse = z.infer<typeof TranslateResultResponseSchema>;
