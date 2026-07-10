import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  canUseWebShare,
  copyTextToClipboard,
  createObjectUrl,
  getSafeDocument,
  getSafeWindow,
  matchesMediaQuery,
  randomUuid,
  revokeObjectUrl,
  shareViaWebShare,
} from './browser-environment';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('browser environment facade', () => {
  it('returns browser globals and evaluates media queries', () => {
    const matchMedia = vi.fn(() => ({ matches: true }));
    Object.defineProperty(globalThis, 'matchMedia', { configurable: true, value: matchMedia });

    expect(getSafeWindow()).toBe(globalThis);
    expect(getSafeDocument()).toBe(globalThis.document);
    expect(matchesMediaQuery('(prefers-color-scheme: dark)')).toBe(true);
  });

  it('returns safe fallbacks when browser globals are unavailable', async () => {
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'document');
    try {
      expect(getSafeWindow()).toBeNull();
      expect(getSafeDocument()).toBeNull();
      expect(matchesMediaQuery('screen')).toBe(false);
      expect(canUseWebShare()).toBe(false);
      await expect(copyTextToClipboard('copy')).resolves.toBe(false);
      await expect(shareViaWebShare({ url: 'https://twinzy.test' })).resolves.toBe(false);
    } finally {
      if (windowDescriptor !== undefined) {
        Object.defineProperty(globalThis, 'window', windowDescriptor);
      }
      if (documentDescriptor !== undefined) {
        Object.defineProperty(globalThis, 'document', documentDescriptor);
      }
    }
  });

  it('copies and shares through supported browser APIs', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperties(globalThis.navigator, {
      clipboard: {
        configurable: true,
        value: { writeText },
      },
      share: { configurable: true, value: share },
    });

    await expect(copyTextToClipboard('copy')).resolves.toBe(true);
    expect(canUseWebShare()).toBe(true);
    await expect(shareViaWebShare({ text: 'text', url: 'https://twinzy.test' })).resolves.toBe(
      true,
    );
  });

  it('returns false when clipboard or share operations fail', async () => {
    Object.defineProperties(globalThis.navigator, {
      clipboard: {
        configurable: true,
        value: { writeText: vi.fn(() => Promise.reject(new Error('denied'))) },
      },
      share: {
        configurable: true,
        value: vi.fn(() => Promise.reject(new Error('cancelled'))),
      },
    });

    await expect(copyTextToClipboard('copy')).resolves.toBe(false);
    await expect(shareViaWebShare({ url: 'https://twinzy.test' })).resolves.toBe(false);
  });

  it('wraps UUID and object URL APIs', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(vi.fn());

    expect(randomUuid()).toMatch(/^[0-9a-f-]{36}$/u);
    expect(createObjectUrl(new Blob(['x']))).toBe('blob:test');
    revokeObjectUrl('blob:test');
    expect(create).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:test');
  });
});
