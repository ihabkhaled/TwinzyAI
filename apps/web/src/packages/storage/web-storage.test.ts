import { afterEach, describe, expect, it, vi } from 'vitest';

import { z } from '@/packages/zod';

import { readStorageJson, removeStorageItem, writeStorageJson } from './web-storage';

const profileSchema = z.object({ id: z.string(), score: z.number() });

describe('web-storage', () => {
  afterEach(() => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('round-trips a JSON value through local storage', () => {
    expect(writeStorageJson('local', 'profile', { id: 'a', score: 3 })).toBe(true);
    expect(readStorageJson('local', 'profile', profileSchema)).toStrictEqual({
      id: 'a',
      score: 3,
    });
  });

  it('keeps session storage independent from local storage', () => {
    writeStorageJson('session', 'profile', { id: 'b', score: 1 });

    expect(readStorageJson('local', 'profile', profileSchema)).toBeNull();
    expect(readStorageJson('session', 'profile', profileSchema)).toStrictEqual({
      id: 'b',
      score: 1,
    });
  });

  it('returns null for a missing key', () => {
    expect(readStorageJson('local', 'absent', profileSchema)).toBeNull();
  });

  it('returns null and warns when the stored JSON is malformed', () => {
    const warnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(vi.fn());
    globalThis.localStorage.setItem('broken', 'not-json{');

    expect(readStorageJson('local', 'broken', profileSchema)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when the stored value fails schema validation', () => {
    const warnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(vi.fn());
    globalThis.localStorage.setItem('wrong', JSON.stringify({ id: 5 }));

    expect(readStorageJson('local', 'wrong', profileSchema)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('removes a stored item', () => {
    writeStorageJson('local', 'temp', { id: 'c', score: 9 });
    removeStorageItem('local', 'temp');

    expect(readStorageJson('local', 'temp', profileSchema)).toBeNull();
  });

  it('returns false when the underlying write throws', () => {
    vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(writeStorageJson('local', 'x', { id: 'd', score: 0 })).toBe(false);
  });
});
