import { describe, expect, it, vi } from 'vitest';

import { AppError, ErrorCode } from '../../../core/errors';
import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';
import { AiSafetyService } from '../application/ai-safety.service';

/**
 * The forbidden-wording guard is mocked so that a value can be flagged unsafe
 * while the diagnostic phrase lookup returns nothing. This exercises the
 * `?? 'unknown'` fallback in the rejection log — a defensive branch that the
 * real guard (which uses the same phrase list for both calls) never triggers.
 */
vi.mock('../lib/forbidden-wording.guard', () => ({
  containsForbiddenWording: vi.fn(() => true),
  // A bare mock returns undefined when called, standing in for the case where
  // the phrase lookup finds nothing even though the value was flagged unsafe.
  findForbiddenPhrase: vi.fn(),
}));

describe('AiSafetyService.assertTraitTextSafe (diagnostic fallback)', () => {
  it('logs an "unknown" match and rejects when the phrase lookup returns nothing', () => {
    const { logger, messages } = buildAppLoggerStub();
    const service = new AiSafetyService(logger);

    let caught: unknown;
    try {
      service.assertTraitTextSafe(['a flagged trait value']);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).errorCode).toBe(ErrorCode.AiResponseUnsafe);
    expect(messages().some((message) => message.includes('matched: unknown'))).toBe(true);
  });
});
