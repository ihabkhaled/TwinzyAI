import { HttpException, HttpStatus } from '@nestjs/common';

import { MULTIPART_FILE_TOO_LARGE_ERROR_CODE } from '../http/multipart.constants';

import { AppError } from './app-error';
import {
  ERROR_MESSAGE_KEY_BY_CODE,
  FILE_TOO_LARGE_MESSAGE,
  GENERIC_ERROR_MESSAGE,
  GENERIC_ERROR_MESSAGE_KEY,
  ONE_FILE_MESSAGE,
  RATE_LIMIT_MESSAGE,
  TOO_MANY_FILES_MESSAGE_MARKER,
  UNEXPECTED_FIELD_MESSAGE_MARKER,
  VALIDATION_FAILED_MESSAGE_KEY,
} from './error.constants';
import type { ErrorBody } from './error.types';
import { ErrorCode } from './error-code.constants';

const FILE_TOO_LARGE_BODY: ErrorBody = {
  statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
  errorCode: ErrorCode.FileTooLarge,
  message: FILE_TOO_LARGE_MESSAGE,
  messageKey: ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.FileTooLarge],
};

const GENERIC_ERROR_BODY: ErrorBody = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  errorCode: ErrorCode.InternalError,
  message: GENERIC_ERROR_MESSAGE,
  messageKey: GENERIC_ERROR_MESSAGE_KEY,
};

const fromAppError = (exception: AppError): ErrorBody => ({
  statusCode: exception.status,
  errorCode: exception.errorCode,
  message: exception.message,
  messageKey: exception.messageKey,
});

const fromHttpException = (exception: HttpException): ErrorBody => {
  const statusCode = exception.getStatus();

  if (statusCode === HttpStatus.TOO_MANY_REQUESTS.valueOf()) {
    return {
      statusCode,
      errorCode: ErrorCode.RateLimited,
      message: RATE_LIMIT_MESSAGE,
      messageKey: ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.RateLimited],
    };
  }

  if (statusCode === HttpStatus.PAYLOAD_TOO_LARGE.valueOf()) {
    return FILE_TOO_LARGE_BODY;
  }

  if (
    exception.message.includes(UNEXPECTED_FIELD_MESSAGE_MARKER) ||
    exception.message.includes(TOO_MANY_FILES_MESSAGE_MARKER)
  ) {
    return {
      statusCode,
      errorCode: ErrorCode.MultipleFilesNotAllowed,
      message: ONE_FILE_MESSAGE,
      messageKey: ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.MultipleFilesNotAllowed],
    };
  }

  const message =
    statusCode >= HttpStatus.INTERNAL_SERVER_ERROR.valueOf()
      ? GENERIC_ERROR_MESSAGE
      : exception.message;

  return {
    statusCode,
    errorCode: ErrorCode.ValidationFailed,
    message,
    messageKey: VALIDATION_FAILED_MESSAGE_KEY,
  };
};

/**
 * Oversized uploads can be rejected by the HTTP platform itself (multipart
 * file-size limit or transport body limit) before any handler runs; both
 * arrive as plain errors carrying a 413 status or the plugin's code.
 */
const fromTransportPayloadError = (exception: Error): ErrorBody | undefined => {
  const transportError = exception as Partial<Record<'code' | 'statusCode', unknown>>;

  const isPayloadTooLarge =
    transportError.code === MULTIPART_FILE_TOO_LARGE_ERROR_CODE ||
    transportError.statusCode === HttpStatus.PAYLOAD_TOO_LARGE.valueOf();

  return isPayloadTooLarge ? FILE_TOO_LARGE_BODY : undefined;
};

/**
 * Maps any thrown value to the safe, client-facing error envelope. Typed
 * AppErrors keep their status, code, and messageKey; framework HttpExceptions
 * (rate limit, oversize, multipart) map to the matching code; anything unknown
 * becomes an opaque 500. Never leaks stacks, provider errors, or file contents.
 */
export const toErrorBody = (exception: unknown): ErrorBody => {
  if (exception instanceof AppError) {
    return fromAppError(exception);
  }

  if (exception instanceof HttpException) {
    return fromHttpException(exception);
  }

  if (exception instanceof Error) {
    const transportBody = fromTransportPayloadError(exception);
    if (transportBody !== undefined) {
      return transportBody;
    }
  }

  return GENERIC_ERROR_BODY;
};
