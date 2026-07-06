import { HttpStatus } from '@nestjs/common';

import { AppError } from './app-error';
import type { ErrorMessageKey } from './error.types';
import { ErrorCode, type ErrorCodeValue } from './error-code.constants';

export class IntegrationError extends AppError {
  public readonly status = HttpStatus.BAD_GATEWAY;

  public constructor(
    message: string,
    messageKey: ErrorMessageKey,
    errorCode: ErrorCodeValue = ErrorCode.AiProviderUnavailable,
  ) {
    super(message, messageKey, errorCode);
  }
}
