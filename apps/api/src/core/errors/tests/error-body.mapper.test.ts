import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { toErrorBody } from '../error-body.mapper';
import { ErrorCode } from '../error-code.constants';
import { IntegrationError } from '../integration.error';
import { ValidationError } from '../validation.error';

describe('toErrorBody', () => {
  it('keeps the status, code, and messageKey of a typed AppError', () => {
    const body = toErrorBody(
      new IntegrationError('Provider down.', 'errors.ai.providerUnavailable'),
    );

    expect(body).toEqual({
      statusCode: 502,
      errorCode: ErrorCode.AiProviderUnavailable,
      message: 'Provider down.',
      messageKey: 'errors.ai.providerUnavailable',
    });
  });

  it('keeps the status, code, and messageKey of a 4xx AppError subclass', () => {
    const body = toErrorBody(
      new ValidationError('Consent is required.', 'errors.upload.consentRequired'),
    );

    expect(body.statusCode).toBe(400);
    expect(body.errorCode).toBe(ErrorCode.ValidationFailed);
    expect(body.messageKey).toBe('errors.upload.consentRequired');
    expect(body.message).toBe('Consent is required.');
  });

  it('maps a framework 404 to the legacy validation-coded envelope with its route message', () => {
    const body = toErrorBody(new NotFoundException('Cannot GET /api/v1/unknown'));

    expect(body.statusCode).toBe(404);
    expect(body.errorCode).toBe(ErrorCode.ValidationFailed);
    expect(body.message).toBe('Cannot GET /api/v1/unknown');
    expect(body.messageKey).toBe('errors.validation.failed');
  });

  it('hides the message of a 5xx framework HttpException behind the generic message', () => {
    const body = toErrorBody(
      new HttpException('internal wiring detail', HttpStatus.INTERNAL_SERVER_ERROR),
    );

    expect(body.statusCode).toBe(500);
    expect(body.message).not.toContain('wiring');
  });

  it('maps legacy multipart wording in HttpExceptions to MULTIPLE_FILES_NOT_ALLOWED', () => {
    const body = toErrorBody(new HttpException('Unexpected field', HttpStatus.BAD_REQUEST));

    expect(body.statusCode).toBe(400);
    expect(body.errorCode).toBe(ErrorCode.MultipleFilesNotAllowed);
    expect(body.messageKey).toBe('errors.upload.multipleFilesNotAllowed');
  });

  it('maps a plain transport error carrying a 413 status to FILE_TOO_LARGE', () => {
    const transportError = Object.assign(new Error('body too large'), {
      code: 'FST_ERR_CTP_BODY_TOO_LARGE',
      statusCode: 413,
    });

    const body = toErrorBody(transportError);

    expect(body.statusCode).toBe(413);
    expect(body.errorCode).toBe(ErrorCode.FileTooLarge);
    expect(body.message).not.toContain('body too large');
  });

  it('maps non-error throw values to the opaque 500 envelope', () => {
    const body = toErrorBody('a thrown string');

    expect(body.statusCode).toBe(500);
    expect(body.errorCode).toBe(ErrorCode.InternalError);
    expect(body.messageKey).toBe('errors.common.internalError');
  });
});
