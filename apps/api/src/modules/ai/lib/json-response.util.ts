import type { z } from 'zod';

import { ERROR_MESSAGE_KEY_BY_CODE, ErrorCode, IntegrationError } from '../../../core/errors';
import { AI_INVALID_RESPONSE_MESSAGE } from '../model/gemini.constants';

import { sanitizeAiResponseText } from './ai-response-sanitizer';

const invalidResponse = (): IntegrationError =>
  new IntegrationError(
    AI_INVALID_RESPONSE_MESSAGE,
    ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.AiResponseInvalid],
    ErrorCode.AiResponseInvalid,
  );

/**
 * Parses raw model text into a schema-validated object. Invalid JSON or a
 * shape mismatch rejects the response — the pipeline never guesses.
 */
export const parseAiJsonResponse = <TSchema extends z.ZodType>(
  rawText: string,
  schema: TSchema,
): z.infer<TSchema> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(sanitizeAiResponseText(rawText));
  } catch {
    throw invalidResponse();
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw invalidResponse();
  }

  return result.data;
};
