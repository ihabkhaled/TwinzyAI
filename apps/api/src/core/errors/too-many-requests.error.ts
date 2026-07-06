import { HttpStatus } from '@nestjs/common';

import { AppError } from './app-error';
import type { ErrorMessageKey } from './error.types';
import { ErrorCode, type ErrorCodeValue } from './error-code.constants';

/**
 * 429 Too Many Requests. Used when an upstream provider rejects a call for
 * exceeding its quota/rate limit — surfaced to the client so the UI can invite
 * a retry rather than showing a generic failure.
 */
export class TooManyRequestsError extends AppError {
  public readonly status = HttpStatus.TOO_MANY_REQUESTS;

  public constructor(
    message: string,
    messageKey: ErrorMessageKey,
    errorCode: ErrorCodeValue = ErrorCode.RateLimited,
  ) {
    super(message, messageKey, errorCode);
  }
}
