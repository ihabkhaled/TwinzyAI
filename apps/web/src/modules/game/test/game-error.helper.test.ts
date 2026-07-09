import { describe, expect, it } from 'vitest';

import { HttpError } from '@/packages/axios';
import { AppError } from '@/shared/errors/app-error';
import { ERROR_MESSAGE_KEYS } from '@/shared/errors/error-keys.constants';

import {
  extractFailedStage,
  isTransientGameError,
  toFriendlyErrorMessageKey,
} from '../helpers/game-error.helper';

const withErrorCode = (errorCode: string, status: number | null = null): HttpError =>
  new HttpError('http', 'backend failure', status, { errorCode, message: 'backend failure' });

describe('toFriendlyErrorMessageKey', () => {
  it('returns an AppError message key verbatim', () => {
    expect(toFriendlyErrorMessageKey(new AppError(ERROR_MESSAGE_KEYS.upload))).toBe(
      ERROR_MESSAGE_KEYS.upload,
    );
  });

  it.each([
    ['CONSENT_REQUIRED', 'errors.consentRequired'],
    ['FILE_MISSING', 'errors.fileMissing'],
    ['FILE_TOO_LARGE', 'errors.fileTooLarge'],
    ['FILE_TYPE_NOT_ALLOWED', 'errors.fileTypeNotAllowed'],
    ['FILE_INVALID', 'errors.fileTypeNotAllowed'],
    ['MULTIPLE_FILES_NOT_ALLOWED', 'errors.multipleFiles'],
    ['RATE_LIMITED', 'errors.rateLimited'],
    ['AI_PROVIDER_UNAVAILABLE', 'errors.aiUnavailable'],
    ['AI_TIMEOUT', 'errors.aiUnavailable'],
    ['AI_RESPONSE_INVALID', 'errors.aiUnavailable'],
    ['AI_RESPONSE_UNSAFE', 'errors.aiUnavailable'],
    ['NETWORK_ERROR', 'errors.network'],
  ])('maps backend errorCode %s to its friendly key', (errorCode, expected) => {
    expect(toFriendlyErrorMessageKey(withErrorCode(errorCode))).toBe(expected);
  });

  it('falls back to the status mapping for an unknown backend errorCode', () => {
    expect(toFriendlyErrorMessageKey(withErrorCode('SOMETHING_NEW', 500))).toBe(
      ERROR_MESSAGE_KEYS.server,
    );
  });

  it('falls back to the status mapping for an HttpError without an errorCode body', () => {
    expect(toFriendlyErrorMessageKey(new HttpError('http', 'nope', 404, null))).toBe(
      ERROR_MESSAGE_KEYS.notFound,
    );
  });

  it('classifies a transport network HttpError as the network key', () => {
    expect(toFriendlyErrorMessageKey(new HttpError('network', 'down', null, null))).toBe(
      ERROR_MESSAGE_KEYS.network,
    );
  });

  it('falls back to generic for non-HttpError values', () => {
    expect(toFriendlyErrorMessageKey(new Error('boom'))).toBe(ERROR_MESSAGE_KEYS.generic);
    expect(toFriendlyErrorMessageKey('boom')).toBe(ERROR_MESSAGE_KEYS.generic);
    expect(toFriendlyErrorMessageKey(null)).toBe(ERROR_MESSAGE_KEYS.generic);
  });
});

describe('extractFailedStage', () => {
  it('returns the stage from a stream error body and validates it', () => {
    const withStage = new HttpError('http', 'fail', null, {
      errorCode: 'AI_TIMEOUT',
      message: 'fail',
      stage: 'judging',
    });
    expect(extractFailedStage(withStage)).toBe('judging');
  });

  it('returns undefined for a missing or unknown stage', () => {
    expect(extractFailedStage(withErrorCode('AI_TIMEOUT'))).toBeUndefined();
    const bogus = new HttpError('http', 'fail', null, {
      errorCode: 'AI_TIMEOUT',
      message: 'fail',
      stage: 'not-a-stage',
    });
    expect(extractFailedStage(bogus)).toBeUndefined();
    expect(extractFailedStage(new Error('boom'))).toBeUndefined();
  });
});

describe('isTransientGameError', () => {
  it.each([
    'RATE_LIMITED',
    'AI_RATE_LIMITED',
    'SERVER_BUSY',
    'AI_TIMEOUT',
    'AI_PROVIDER_UNAVAILABLE',
  ])('treats %s as transient (retry with the same photo can succeed)', (code) => {
    expect(isTransientGameError(withErrorCode(code))).toBe(true);
  });

  it('treats a raw network failure as transient', () => {
    expect(isTransientGameError(new HttpError('network', 'down', null, null))).toBe(true);
  });

  it('treats validation/consent/file errors and AppErrors as NOT transient', () => {
    expect(isTransientGameError(withErrorCode('CONSENT_REQUIRED'))).toBe(false);
    expect(isTransientGameError(withErrorCode('FILE_INVALID'))).toBe(false);
    expect(isTransientGameError(new AppError(ERROR_MESSAGE_KEYS.upload))).toBe(false);
    expect(isTransientGameError(new Error('boom'))).toBe(false);
  });
});
