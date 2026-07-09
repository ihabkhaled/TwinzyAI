import { ERROR_MESSAGE_KEY_BY_CODE } from './error.constants';
import type { ErrorCodeValue } from './error-code.constants';
import { IntegrationError } from './integration.error';
import { TooManyRequestsError } from './too-many-requests.error';

/**
 * The ONLY constructors of the (message, messageKey, errorCode) triple: the
 * messageKey is always derived from the errorCode via the canonical map, so a
 * mismatched key/code pair is impossible by construction. Every module builds
 * these errors through the factories instead of re-assembling the triple.
 */
export const buildIntegrationError = (
  errorCode: ErrorCodeValue,
  message: string,
): IntegrationError =>
  new IntegrationError(message, ERROR_MESSAGE_KEY_BY_CODE[errorCode], errorCode);

export const buildTooManyRequestsError = (
  errorCode: ErrorCodeValue,
  message: string,
): TooManyRequestsError =>
  new TooManyRequestsError(message, ERROR_MESSAGE_KEY_BY_CODE[errorCode], errorCode);
