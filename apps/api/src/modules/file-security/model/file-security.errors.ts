import { HttpStatus } from '@nestjs/common';

import { AppError, ERROR_MESSAGE_KEY_BY_CODE, ErrorCode } from '../../../core/errors';

/**
 * Typed upload-rejection errors for the HTTP statuses the shared core error
 * hierarchy does not provide a subclass for (415 / 422 / 503). Each carries
 * the same stable errorCode, status, and derived messageKey the legacy
 * envelope did, so the sanitized response body is byte-identical — only the
 * thrown type changes from the deprecated DomainException to a typed AppError.
 */

/** 415 — MIME/extension not on the allowlist, or the two disagree. */
export class UnsupportedImageTypeError extends AppError {
  public readonly status = HttpStatus.UNSUPPORTED_MEDIA_TYPE;

  public constructor(message: string) {
    super(
      message,
      ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.FileTypeNotAllowed],
      ErrorCode.FileTypeNotAllowed,
    );
  }
}

/** 422 — magic bytes, structure, or dimensions do not form a valid image. */
export class InvalidImageError extends AppError {
  public readonly status = HttpStatus.UNPROCESSABLE_ENTITY;

  public constructor(message: string) {
    super(message, ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.FileInvalid], ErrorCode.FileInvalid);
  }
}

/** 422 — the virus scanner flagged the upload as infected. */
export class InfectedFileError extends AppError {
  public readonly status = HttpStatus.UNPROCESSABLE_ENTITY;

  public constructor(message: string) {
    super(message, ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.VirusScanFailed], ErrorCode.VirusScanFailed);
  }
}

/** 503 — scanning is enabled but the scanner is unreachable (fail closed). */
export class VirusScanUnavailableError extends AppError {
  public readonly status = HttpStatus.SERVICE_UNAVAILABLE;

  public constructor(message: string) {
    super(message, ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.VirusScanFailed], ErrorCode.VirusScanFailed);
  }
}
