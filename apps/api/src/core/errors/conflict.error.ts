import { HttpStatus } from '@nestjs/common';

import { AppError } from './app-error';
import type { ErrorMessageKey } from './error.types';
import { ErrorCode, type ErrorCodeValue } from './error-code.constants';

export class ConflictError extends AppError {
  public readonly status = HttpStatus.CONFLICT;

  public constructor(
    message: string,
    messageKey: ErrorMessageKey,
    errorCode: ErrorCodeValue = ErrorCode.ValidationFailed,
  ) {
    super(message, messageKey, errorCode);
  }
}
