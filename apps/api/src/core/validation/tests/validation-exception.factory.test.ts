import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';
import { ErrorCode } from '../../errors/error-code.constants';
import { ValidationError } from '../../errors/validation.error';
import { createValidationException } from '../validation-exception.factory';

describe('createValidationException', () => {
  it('logs the flattened issues and returns a typed ValidationError', () => {
    const { logger } = buildAppLoggerStub();
    const result = z.strictObject({ consent: z.literal('true') }).safeParse({ consent: 'nope' });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    const error = createValidationException(logger, result.error);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.messageKey).toBe('errors.validation.failed');
    expect(error.errorCode).toBe(ErrorCode.ValidationFailed);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const [message, meta] = vi.mocked(logger.warn).mock.calls[0] ?? [];
    expect(message).toBe('Request DTO validation failed');
    expect(meta).toMatchObject({ issues: [{ field: 'consent' }] });
  });
});
