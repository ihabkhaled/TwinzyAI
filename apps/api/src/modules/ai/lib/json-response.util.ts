import type { z } from 'zod';

import { buildIntegrationError, ErrorCode, type IntegrationError } from '../../../core/errors';
import type { AiContentValidator, AiValidationResult } from '../model/ai-provider-adapter.types';
import { AI_INVALID_RESPONSE_MESSAGE } from '../model/gemini.constants';

import { extractJsonObject, sanitizeAiResponseText } from './ai-response-sanitizer';

/** Callback the caller uses to log a bounded validation-failure summary. */
export type AiIssueListener = (issueSummary: string) => void;

/** How many schema issues the diagnostic summary includes at most. */
const MAX_REPORTED_ISSUES = 8;

const invalidResponse = (): IntegrationError =>
  buildIntegrationError(ErrorCode.AiResponseInvalid, AI_INVALID_RESPONSE_MESSAGE);

/**
 * Bounded, privacy-safe diagnostic: field PATHS and zod issue codes only —
 * never response values, never raw model text.
 */
const summarizeIssues = (error: z.ZodError): string =>
  error.issues
    .slice(0, MAX_REPORTED_ISSUES)
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.code}`)
    .join('; ');

type JsonParseOutcome = { readonly ok: true; readonly value: unknown } | { readonly ok: false };

/**
 * Attempts to parse the model's JSON body. First the fence-stripped text, then —
 * only if that fails — the object extracted from the first `{` to the last `}`,
 * which tolerates leading/trailing prose the model sometimes adds around the
 * JSON. Never guesses at malformed JSON; both attempts failing rejects.
 */
const parseJsonBody = (rawText: string): JsonParseOutcome => {
  const sanitized = sanitizeAiResponseText(rawText);
  const candidates = [sanitized, extractJsonObject(sanitized)].filter(
    (candidate): candidate is string => candidate !== undefined,
  );
  for (const candidate of candidates) {
    try {
      return { ok: true, value: JSON.parse(candidate) };
    } catch {
      // Fall through to the next, more tolerant candidate.
    }
  }
  return { ok: false };
};

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
  normalize?: (parsed: unknown) => unknown,
): z.infer<TSchema> => {
  const parseResult = parseJsonBody(rawText);
  if (!parseResult.ok) {
    onIssues?.('response is not valid JSON');
    throw invalidResponse();
  }

  const parsed = normalize === undefined ? parseResult.value : normalize(parseResult.value);

  const result = schema.safeParse(parsed);
  if (!result.success) {
    onIssues?.(summarizeIssues(result.error));
    throw invalidResponse();
  }

  return result.data;
};

/**
 * Builds a content validator for the model chain. Returns `ok: true` only when
 * the raw text parses as JSON and satisfies the schema; on failure it returns a
 * bounded, privacy-safe `reason` (field paths + issue codes, never values) so
 * the adapter can log WHY a model's output was rejected before falling through
 * to the next model.
 */
export const buildSchemaValidator = (schema: z.ZodType): AiContentValidator => {
  return (text: string): AiValidationResult => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(sanitizeAiResponseText(text));
    } catch {
      return { ok: false, reason: 'not valid JSON' };
    }
    const result = schema.safeParse(parsed);
    return result.success ? { ok: true } : { ok: false, reason: summarizeIssues(result.error) };
  };
};
