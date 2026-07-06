import type { HttpStatus } from '@nestjs/common';

import type { ErrorMessageKey } from './error.types';
import type { ErrorCodeValue } from './error-code.constants';

/**
 * Base class for every user-facing error. Subclasses declare their HTTP
 * status; every instance carries a stable legacy errorCode plus a messageKey
 * (errors.<feature>.<key>) that the global exception filter maps to a
 * sanitized response body. Never throw a raw Error across the HTTP boundary.
 */
export abstract class AppError extends Error {
  public abstract readonly status: HttpStatus;

  public readonly messageKey: ErrorMessageKey;

  public readonly errorCode: ErrorCodeValue;

  protected constructor(message: string, messageKey: ErrorMessageKey, errorCode: ErrorCodeValue) {
    super(message);
    this.messageKey = messageKey;
    this.errorCode = errorCode;
    this.name = new.target.name;
  }
}
