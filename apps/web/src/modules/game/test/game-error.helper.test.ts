import { describe, expect, it } from 'vitest';

import { AppError } from '@/shared/errors/app-error';
import { ERROR_MESSAGE_KEYS } from '@/shared/errors/error-keys.constants';

import { toFriendlyErrorMessageKey } from '../helpers/game-error.helper';

describe('toFriendlyErrorMessageKey', () => {
  it('returns an AppError message key verbatim', () => {
    expect(toFriendlyErrorMessageKey(new AppError(ERROR_MESSAGE_KEYS.upload))).toBe(
      ERROR_MESSAGE_KEYS.upload,
    );
  });

  it('falls back to generic for non-HttpError values', () => {
    expect(toFriendlyErrorMessageKey(new Error('boom'))).toBe(ERROR_MESSAGE_KEYS.generic);
    expect(toFriendlyErrorMessageKey('boom')).toBe(ERROR_MESSAGE_KEYS.generic);
    expect(toFriendlyErrorMessageKey(null)).toBe(ERROR_MESSAGE_KEYS.generic);
  });
});
