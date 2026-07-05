import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Response } from 'express';

import type { ApiErrorResponse } from '@twinzy/shared';

import { LoggerService } from '../../infrastructure/logger/logger.service';
import { ErrorCode } from '../constants/error-codes.constant';
import { DomainException } from '../exceptions/domain.exception';

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const RATE_LIMIT_MESSAGE = 'Too many requests. Please wait a moment and try again.';

const FILE_TOO_LARGE_MESSAGE = 'That photo is too big. Please pick one under 5 MB.';

const ONE_FILE_MESSAGE = 'Please upload just one photo.';

const MULTER_ERROR_NAME = 'MulterError';

const MULTER_SIZE_CODE = 'LIMIT_FILE_SIZE';

/**
 * Converts every thrown error into the safe ApiErrorResponse envelope.
 * Raw provider errors, stack traces, and internals never reach the client.
 */
@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  public constructor(private readonly logger: LoggerService) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toErrorBody(exception);

    this.logException(exception, body);
    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown): ApiErrorResponse {
    if (exception instanceof DomainException) {
      return {
        statusCode: exception.getStatus(),
        errorCode: exception.errorCode,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    const multerBody = this.fromMulterError(exception);
    if (multerBody !== undefined) {
      return multerBody;
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode.InternalError,
      message: GENERIC_ERROR_MESSAGE,
    };
  }

  /**
   * Multer throws transport-level upload errors (hard size cap, unexpected
   * extra files) before our validation chain runs — map them to the same
   * friendly envelope instead of a generic 500.
   */
  private fromMulterError(exception: unknown): ApiErrorResponse | undefined {
    if (!(exception instanceof Error) || exception.name !== MULTER_ERROR_NAME) {
      return undefined;
    }

    const code = (exception as { code?: string }).code;
    if (code === MULTER_SIZE_CODE) {
      return {
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        errorCode: ErrorCode.FileTooLarge,
        message: FILE_TOO_LARGE_MESSAGE,
      };
    }

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ErrorCode.MultipleFilesNotAllowed,
      message: ONE_FILE_MESSAGE,
    };
  }

  private fromHttpException(exception: HttpException): ApiErrorResponse {
    const statusCode = exception.getStatus();

    if (statusCode === HttpStatus.TOO_MANY_REQUESTS.valueOf()) {
      return { statusCode, errorCode: ErrorCode.RateLimited, message: RATE_LIMIT_MESSAGE };
    }

    // Nest's FileInterceptor re-wraps multer errors into HttpExceptions.
    if (statusCode === HttpStatus.PAYLOAD_TOO_LARGE.valueOf()) {
      return { statusCode, errorCode: ErrorCode.FileTooLarge, message: FILE_TOO_LARGE_MESSAGE };
    }

    if (
      exception.message.includes('Unexpected field') ||
      exception.message.includes('Too many files')
    ) {
      return {
        statusCode,
        errorCode: ErrorCode.MultipleFilesNotAllowed,
        message: ONE_FILE_MESSAGE,
      };
    }

    const message =
      statusCode >= HttpStatus.INTERNAL_SERVER_ERROR.valueOf()
        ? GENERIC_ERROR_MESSAGE
        : exception.message;

    return { statusCode, errorCode: ErrorCode.ValidationFailed, message };
  }

  private logException(exception: unknown, body: ApiErrorResponse): void {
    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR.valueOf()) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      const message = exception instanceof Error ? exception.message : 'Unknown error';
      this.logger.error('ExceptionFilter', message, stack);
      return;
    }

    this.logger.warn('ExceptionFilter', `${body.errorCode}: ${body.message}`);
  }
}
