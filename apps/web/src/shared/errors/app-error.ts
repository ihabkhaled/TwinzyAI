import { ERROR_MESSAGE_KEYS, type ErrorMessageKey } from './error-keys.constants';

/** Options accepted by the {@link AppError} constructor. */
export interface AppErrorOptions {
  cause?: unknown;
}

/**
 * The application's own error type. It carries an i18n {@link ErrorMessageKey}
 * instead of a user-facing string, so the presentation layer decides how to
 * render it (and never leaks a raw, possibly unsafe backend message).
 */
export class AppError extends Error {
  public readonly messageKey: ErrorMessageKey;

  public constructor(messageKey: ErrorMessageKey, options?: AppErrorOptions) {
    super(messageKey, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AppError';
    this.messageKey = messageKey;
  }
}

/** Type guard: is the value already an {@link AppError}? */
export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/**
 * Coerce any thrown value into an {@link AppError}. Existing AppErrors pass
 * through unchanged; everything else is wrapped as a `generic` error with the
 * original value preserved as `cause` for diagnostics.
 */
export function toAppError(value: unknown): AppError {
  if (isAppError(value)) {
    return value;
  }

  return new AppError(ERROR_MESSAGE_KEYS.generic, { cause: value });
}
