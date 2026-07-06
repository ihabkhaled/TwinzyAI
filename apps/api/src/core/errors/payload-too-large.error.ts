import { HttpStatus } from '@nestjs/common';

import { AppError } from './app-error';
import type { ErrorMessageKey } from './error.types';
import { ErrorCode, type ErrorCodeValue } from './error-code.constants';

export class PayloadTooLargeError extends AppError {
  public readonly status = HttpStatus.PAYLOAD_TOO_LARGE;

  public constructor(
    message: string,
    messageKey: ErrorMessageKey,
    errorCode: ErrorCodeValue = ErrorCode.FileTooLarge,
  ) {
    super(message, messageKey, errorCode);
  }
}
