import { describe, expect, it } from 'vitest';

import { AppError, isAppError, toAppError } from './app-error';
import { ERROR_MESSAGE_KEYS } from './error-keys.constants';

describe('AppError', () => {
  it('carries the message key as both messageKey and Error message', () => {
    const error = new AppError(ERROR_MESSAGE_KEYS.upload);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
    expect(error.messageKey).toBe(ERROR_MESSAGE_KEYS.upload);
    expect(error.message).toBe(ERROR_MESSAGE_KEYS.upload);
  });

  it('preserves a provided cause', () => {
    const cause = new Error('root cause');
    const error = new AppError(ERROR_MESSAGE_KEYS.server, { cause });

    expect(error.cause).toBe(cause);
  });

  it('leaves cause undefined when no options are given', () => {
    const error = new AppError(ERROR_MESSAGE_KEYS.generic);

    expect(error.cause).toBeUndefined();
  });
});

describe('isAppError', () => {
  it('is true for an AppError', () => {
    expect(isAppError(new AppError(ERROR_MESSAGE_KEYS.generic))).toBe(true);
  });

  it('is false for a plain Error and for non-errors', () => {
    expect(isAppError(new Error('plain'))).toBe(false);
    expect(isAppError('nope')).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});

describe('toAppError', () => {
  it('returns the same instance when given an AppError', () => {
    const original = new AppError(ERROR_MESSAGE_KEYS.validation);

    expect(toAppError(original)).toBe(original);
  });

  it('wraps an unknown value as a generic AppError, preserving it as cause', () => {
    const wrapped = toAppError('boom');

    expect(isAppError(wrapped)).toBe(true);
    expect(wrapped.messageKey).toBe(ERROR_MESSAGE_KEYS.generic);
    expect(wrapped.cause).toBe('boom');
  });

  it('wraps a plain Error as a generic AppError', () => {
    const source = new Error('kaboom');
    const wrapped = toAppError(source);

    expect(wrapped.messageKey).toBe(ERROR_MESSAGE_KEYS.generic);
    expect(wrapped.cause).toBe(source);
  });
});
