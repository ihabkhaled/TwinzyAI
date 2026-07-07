import type { z } from 'zod';

import { ERROR_MESSAGE_KEY_BY_CODE, ErrorCode, IntegrationError } from '../../../core/errors';
import { AI_INVALID_RESPONSE_MESSAGE } from '../model/gemini.constants';

import { sanitizeAiResponseText } from './ai-response-sanitizer';

/** Callback the caller uses to log a bounded validation-failure summary. */
export type AiIssueListener = (issueSummary: string) => void;

/** How many schema issues the diagnostic summary includes at most. */
const MAX_REPORTED_ISSUES = 8;

const invalidResponse = (): IntegrationError =>
  new IntegrationError(
    AI_INVALID_RESPONSE_MESSAGE,
    ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.AiResponseInvalid],
    ErrorCode.AiResponseInvalid,
  );

/**
 * Bounded, privacy-safe diagnostic: field PATHS and zod issue codes only —
 * never response values, never raw model text.
 */
const summarizeIssues = (error: z.ZodError): string =>
  error.issues
    .slice(0, MAX_REPORTED_ISSUES)
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.code}`)
    .join('; ');

/**
 * Parses raw model text into a schema-validated object. Invalid JSON or a
 * shape mismatch rejects the response — the pipeline never guesses. When the
 * caller passes `onIssues`, a bounded paths-only summary is reported so a
 * failing live model is diagnosable without ever logging its content.
 */
export const parseAiJsonResponse = <TSchema extends z.ZodType>(
  rawText: string,
  schema: TSchema,
  onIssues?: AiIssueListener,
): z.infer<TSchema> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(sanitizeAiResponseText(rawText));
  } catch {
    onIssues?.('response is not valid JSON');
    throw invalidResponse();
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    onIssues?.(summarizeIssues(result.error));
    throw invalidResponse();
  }

  return result.data;
};
