import { HttpStatus } from '@nestjs/common';

import { AppError } from './app-error';
import type { ErrorMessageKey } from './error.types';
import type { ErrorCodeValue } from './error-code.constants';

/**
 * A request that must not run because its payment is missing, unapproved,
 * already consumed, or fails verification. 402 so clients can distinguish
 * "pay first" from validation and provider failures.
 */
export class PaymentError extends AppError {
  public readonly status = HttpStatus.PAYMENT_REQUIRED;

  public constructor(message: string, messageKey: ErrorMessageKey, errorCode: ErrorCodeValue) {
    super(message, messageKey, errorCode);
  }
}
