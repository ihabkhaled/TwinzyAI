import { z } from 'zod';

import { DEFAULT_RESULT_COUNT, MAX_RESULT_COUNT, MIN_RESULT_COUNT } from '@twinzy/shared';

import { LANGUAGE_CODE_MAX_LENGTH } from '../../model/game.constants';

/**
 * Multipart body of POST /api/v1/game/analyze. Multipart fields arrive as
 * strings; consent must be the literal string "true" (or boolean true from
 * JSON clients) — anything else is not consent. `languageCode` is free-form
 * at the transport edge and NORMALIZED to a supported code (default `en`) by
 * the language lib — a friendly UX decision for multipart clients; the
 * translate endpoint rejects unsupported codes strictly instead.
 *
 * `resultCount` is coerced from string for multipart clients and defaults to
 * the server-defined value when absent or invalid.
 */
export const AnalyzeRequestBodySchema = z.object({
  consent: z.union([z.literal('true'), z.literal(true)]).optional(),
  languageCode: z.string().max(LANGUAGE_CODE_MAX_LENGTH).optional(),
  resultCount: z.coerce
    .number()
    .int()
    .min(MIN_RESULT_COUNT)
    .max(MAX_RESULT_COUNT)
    .default(DEFAULT_RESULT_COUNT),
});
