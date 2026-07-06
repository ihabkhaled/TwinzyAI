import { HttpStatus } from '@nestjs/common';

import { AppError } from './app-error';
import type { ErrorMessageKey } from './error.types';
import { ErrorCode, type ErrorCodeValue } from './error-code.constants';

export class ForbiddenError extends AppError {
  public readonly status = HttpStatus.FORBIDDEN;

  public constructor(
    message: string,
    messageKey: ErrorMessageKey,
    errorCode: ErrorCodeValue = ErrorCode.ValidationFailed,
  ) {
    super(message, messageKey, errorCode);
  }
}
