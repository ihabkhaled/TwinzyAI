import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ApiErrorResponse } from '@twinzy/shared';

import { buildLoggerStub } from '../../../tests/fixtures/stubs';
import { ErrorCode } from '../../constants/error-codes.constant';
import { DomainException } from '../../exceptions/domain.exception';
import { AllExceptionsFilter } from '../all-exceptions.filter';

interface CapturedResponse {
  statusCode: number | undefined;
  body: ApiErrorResponse | undefined;
}

const runFilter = (exception: unknown): CapturedResponse => {
  const captured: CapturedResponse = { statusCode: undefined, body: undefined };

  interface ResponseMock {
    status: (code: number) => ResponseMock;
    json: (body: ApiErrorResponse) => ResponseMock;
  }

  const response: ResponseMock = {
    status: vi.fn((code: number): ResponseMock => {
      captured.statusCode = code;
      return response;
    }),
    json: vi.fn((body: ApiErrorResponse): ResponseMock => {
      captured.body = body;
      return response;
    }),
  };

  const httpContext = { getResponse: (): ResponseMock => response };
  const host = {
    switchToHttp: (): typeof httpContext => httpContext,
  } as unknown as ArgumentsHost;

  const filter = new AllExceptionsFilter(buildLoggerStub().logger);
  const handleException = filter.catch.bind(filter);
  handleException(exception, host);
  return captured;
};

class FakeMulterError extends Error {
  public code: string;

  public constructor(code: string) {
    super('multer failure');
    this.name = 'MulterError';
    this.code = code;
  }
}

describe('AllExceptionsFilter', () => {
  it('passes DomainException status, code, and safe message through', () => {
    const result = runFilter(
      new DomainException(ErrorCode.FileTooLarge, 'Too big.', HttpStatus.PAYLOAD_TOO_LARGE),
    );

    expect(result.statusCode).toBe(413);
    expect(result.body).toEqual({
      statusCode: 413,
      errorCode: ErrorCode.FileTooLarge,
      message: 'Too big.',
    });
  });

  it('maps unknown errors to a generic envelope without leaking details', () => {
    const result = runFilter(new Error('ECONNREFUSED secret-host:5432 password=hunter2'));

    expect(result.statusCode).toBe(500);
    expect(result.body?.errorCode).toBe(ErrorCode.InternalError);
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
  });

  it('maps a multer size error to FILE_TOO_LARGE', () => {
    const result = runFilter(new FakeMulterError('LIMIT_FILE_SIZE'));

    expect(result.statusCode).toBe(413);
    expect(result.body?.errorCode).toBe(ErrorCode.FileTooLarge);
  });

  it('maps an unexpected-file multer error to MULTIPLE_FILES_NOT_ALLOWED', () => {
    const result = runFilter(new FakeMulterError('LIMIT_UNEXPECTED_FILE'));

    expect(result.statusCode).toBe(400);
    expect(result.body?.errorCode).toBe(ErrorCode.MultipleFilesNotAllowed);
  });
});
