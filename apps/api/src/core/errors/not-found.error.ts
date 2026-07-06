import { HttpStatus } from '@nestjs/common';

import { AppError } from './app-error';
import type { ErrorMessageKey } from './error.types';
import { ErrorCode, type ErrorCodeValue } from './error-code.constants';

export class NotFoundError extends AppError {
  public readonly status = HttpStatus.NOT_FOUND;

  public constructor(
    message: string,
    messageKey: ErrorMessageKey,
    errorCode: ErrorCodeValue = ErrorCode.ValidationFailed,
  ) {
    super(message, messageKey, errorCode);
  }
}
