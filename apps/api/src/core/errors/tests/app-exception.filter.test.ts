import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';
import { AppExceptionFilter } from '../app-exception.filter';
import type { ErrorBody } from '../error.types';
import { ErrorCode } from '../error-code.constants';
import { PayloadTooLargeError } from '../payload-too-large.error';
import { ValidationError } from '../validation.error';

interface CapturedResponse {
  statusCode: number | undefined;
  body: ErrorBody | undefined;
}

interface RunResult extends CapturedResponse {
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
}

const runFilter = (exception: unknown): RunResult => {
  const captured: CapturedResponse = { statusCode: undefined, body: undefined };

  interface ReplyMock {
    status: (code: number) => ReplyMock;
    send: (body: ErrorBody) => ReplyMock;
  }

  const reply: ReplyMock = {
    status: vi.fn((code: number): ReplyMock => {
      captured.statusCode = code;
      return reply;
    }),
    send: vi.fn((body: ErrorBody): ReplyMock => {
      captured.body = body;
      return reply;
    }),
  };

  const httpContext = { getResponse: (): ReplyMock => reply };
  const host = {
    switchToHttp: (): typeof httpContext => httpContext,
  } as unknown as ArgumentsHost;

  const { logger } = buildAppLoggerStub();
  const filter = new AppExceptionFilter(logger);
  const handleException = filter.catch.bind(filter);
  handleException(exception, host);

  return {
    ...captured,
    warn: logger.warn as unknown as ReturnType<typeof vi.fn>,
    error: logger.error as unknown as ReturnType<typeof vi.fn>,
  };
};

class FakeMultipartLimitError extends Error {
  public code: string;

  public statusCode: number;

  public constructor(code: string, statusCode: number) {
    super('multipart transport failure');
    this.name = 'FastifyError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

describe('AppExceptionFilter', () => {
  it('passes a typed AppError status, code, and safe message through with its messageKey', () => {
    const result = runFilter(new PayloadTooLargeError('Too big.', 'errors.upload.fileTooLarge'));

    expect(result.statusCode).toBe(413);
    expect(result.body).toEqual({
      statusCode: 413,
      errorCode: ErrorCode.FileTooLarge,
      message: 'Too big.',
      messageKey: 'errors.upload.fileTooLarge',
    });
  });

  it('passes a typed AppError through with its own messageKey and errorCode', () => {
    const result = runFilter(
      new ValidationError(
        'Please upload just one photo.',
        'errors.upload.multipleFilesNotAllowed',
        ErrorCode.MultipleFilesNotAllowed,
      ),
    );

    expect(result.statusCode).toBe(400);
    expect(result.body).toEqual({
      statusCode: 400,
      errorCode: ErrorCode.MultipleFilesNotAllowed,
      message: 'Please upload just one photo.',
      messageKey: 'errors.upload.multipleFilesNotAllowed',
    });
  });

  it('maps unknown errors to a generic envelope without leaking details', () => {
    const result = runFilter(new Error('ECONNREFUSED secret-host:5432 password=hunter2'));

    expect(result.statusCode).toBe(500);
    expect(result.body?.errorCode).toBe(ErrorCode.InternalError);
    expect(result.body?.messageKey).toBe('errors.common.internalError');
    expect(result.body?.message).not.toContain('hunter2');
    expect(JSON.stringify(result.body)).not.toContain('stack');
  });

  it('maps HTTP 429 to the rate-limit envelope', () => {
    const result = runFilter(
      new (class extends BadRequestException {
        public override getStatus(): number {
          return HttpStatus.TOO_MANY_REQUESTS.valueOf();
        }
      })(),
    );

    expect(result.body?.errorCode).toBe(ErrorCode.RateLimited);
    expect(result.body?.messageKey).toBe('errors.common.rateLimited');
  });

  it('maps the transport file-size error to FILE_TOO_LARGE', () => {
    const result = runFilter(
      new FakeMultipartLimitError('FST_REQ_FILE_TOO_LARGE', HttpStatus.PAYLOAD_TOO_LARGE.valueOf()),
    );

    expect(result.statusCode).toBe(413);
    expect(result.body?.errorCode).toBe(ErrorCode.FileTooLarge);
    expect(result.body?.messageKey).toBe('errors.upload.fileTooLarge');
  });

  it('maps a typed payload-too-large error to the FILE_TOO_LARGE envelope', () => {
    const result = runFilter(
      new PayloadTooLargeError(
        'That photo is too big. Please pick one under 5 MB.',
        'errors.upload.fileTooLarge',
      ),
    );

    expect(result.statusCode).toBe(413);
    expect(result.body?.errorCode).toBe(ErrorCode.FileTooLarge);
  });

  it('logs 4xx envelopes as warn without the exception object', () => {
    const result = runFilter(
      new ValidationError(
        'Consent required.',
        'errors.upload.consentRequired',
        ErrorCode.ConsentRequired,
      ),
    );

    expect(result.warn).toHaveBeenCalledWith('Consent required.', {
      statusCode: 400,
      errorCode: ErrorCode.ConsentRequired,
      messageKey: 'errors.upload.consentRequired',
    });
    expect(result.error).not.toHaveBeenCalled();
  });

  it('logs 5xx envelopes as error with the original exception attached', () => {
    const boom = new Error('boom');
    const result = runFilter(boom);

    expect(result.error).toHaveBeenCalledTimes(1);
    const [message, meta] = result.error.mock.calls[0] ?? [];
    expect(message).toBeTypeOf('string');
    expect(meta).toMatchObject({ statusCode: 500, err: boom });
    expect(result.warn).not.toHaveBeenCalled();
  });
});
