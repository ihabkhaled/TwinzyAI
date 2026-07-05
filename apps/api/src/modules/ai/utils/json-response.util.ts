import { HttpStatus } from '@nestjs/common';
import type { z } from 'zod';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { AI_INVALID_RESPONSE_MESSAGE } from '../constants/gemini.constants';

import { sanitizeAiResponseText } from './ai-response-sanitizer';

const invalidResponse = (): DomainException =>
  new DomainException(
    ErrorCode.AiResponseInvalid,
    AI_INVALID_RESPONSE_MESSAGE,
    HttpStatus.BAD_GATEWAY,
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
