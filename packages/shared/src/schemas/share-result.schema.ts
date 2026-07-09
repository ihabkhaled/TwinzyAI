import { z } from 'zod';

import { FinalGameResultSchema } from './game-result.schema';
import { LanguageCodeSchema } from './language.schema';

/** A share id is an unguessable v4 UUID minted server-side. */
export const ShareIdSchema = z.uuid();

/**
 * Body of POST /api/v1/share-results: the client's existing, already-validated
 * final result. Strict — unknown keys are rejected (no image/file slot exists
 * by construction), and every nested field is bounded by the result schema.
 * The languageCode travels inside `result`, so it is never sent (or trusted)
 * as a separate, drift-prone field.
 */
export const CreateShareResultRequestSchema = z.strictObject({
  result: FinalGameResultSchema,
});

/** Metadata returned after a temporary share record is created. */
export const CreateShareResultResponseSchema = z.strictObject({
  shareId: ShareIdSchema,
  shareUrl: z.url(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  ttlSeconds: z.number().int().positive(),
});

/**
 * Active-record response of GET /api/v1/share-results/:shareId. `remainingSeconds`
 * is computed from the server clock so the client countdown is anchored to the
 * authoritative `expiresAt`, not to any client-side creation time.
 */
export const ShareResultResponseSchema = z.strictObject({
  shareId: ShareIdSchema,
  languageCode: LanguageCodeSchema,
  result: FinalGameResultSchema,
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  remainingSeconds: z.number().int().min(0),
});

export type ShareId = z.infer<typeof ShareIdSchema>;
export type CreateShareResultRequest = z.infer<typeof CreateShareResultRequestSchema>;
export type CreateShareResultResponse = z.infer<typeof CreateShareResultResponseSchema>;
export type ShareResultResponse = z.infer<typeof ShareResultResponseSchema>;
