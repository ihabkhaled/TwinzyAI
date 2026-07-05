import { HttpException } from '@nestjs/common';

import type { ErrorCodeValue } from '../constants/error-codes.constant';

/**
 * Application error carrying a stable machine-readable error code and a
 * user-safe message. The global exception filter serializes it; raw provider
 * or filesystem errors must be mapped into this before leaving a service.
 */
export class DomainException extends HttpException {
  public readonly errorCode: ErrorCodeValue;

  public constructor(errorCode: ErrorCodeValue, message: string, statusCode: number) {
    super(message, statusCode);
    this.errorCode = errorCode;
  }
}
