import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, Injectable } from '@nestjs/common';

import type { HttpReplyLike } from '../http/http-reply.types';
import { SERVER_ERROR_MIN_STATUS } from '../http/http-status.constants';
import { AppLogger } from '../logger/app-logger.service';

import type { ErrorBody } from './error.types';
import { toErrorBody } from './error-body.mapper';

/**
 * Global exception filter. Sanitizes every thrown value into the safe
 * envelope and logs it: 5xx as error (with the original exception attached
 * for the server-side log), 4xx as warn. Nothing sensitive reaches the
 * client.
 */
@Injectable()
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  public constructor(private readonly logger: AppLogger) {
    this.logger.setContext(AppExceptionFilter.name);
  }

  public catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<HttpReplyLike>();
    const body = toErrorBody(exception);

    this.record(body, exception);
    reply.status(body.statusCode).send(body);
  }

  private record(body: ErrorBody, exception: unknown): void {
    if (body.statusCode >= SERVER_ERROR_MIN_STATUS) {
      this.logger.error(body.message, {
        statusCode: body.statusCode,
        errorCode: body.errorCode,
        messageKey: body.messageKey,
        err: exception,
      });
      return;
    }

    this.logger.warn(body.message, {
      statusCode: body.statusCode,
      errorCode: body.errorCode,
      messageKey: body.messageKey,
    });
  }
}
