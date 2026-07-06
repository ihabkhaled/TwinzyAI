import type { ApiErrorResponse } from '@twinzy/shared';

/** Every user-facing error carries a message key of the form errors.<feature>.<key>. */
export type ErrorMessageKey = `errors.${string}`;

/**
 * The sanitized envelope the global exception filter sends. It is the legacy
 * ApiErrorResponse (statusCode, errorCode, message) plus the additive
 * messageKey field — existing clients keep working unchanged.
 */
export interface ErrorBody extends ApiErrorResponse {
  readonly messageKey: ErrorMessageKey;
}
