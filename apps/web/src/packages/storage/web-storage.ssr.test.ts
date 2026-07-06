import { describe, expect, it, vi } from 'vitest';

import { z } from '@/packages/zod';

import { readStorageJson, removeStorageItem, writeStorageJson } from './web-storage';

vi.mock('@/packages/browser', () => ({
  getSafeWindow: (): Window | null => null,
}));

const schema = z.object({ id: z.string() });

describe('web-storage without a browser window (SSR)', () => {
  it('reads return null when there is no window', () => {
    expect(readStorageJson('local', 'k', schema)).toBeNull();
  });

  it('writes return false when there is no window', () => {
    expect(writeStorageJson('session', 'k', { id: 'a' })).toBe(false);
  });

  it('removes are a no-op when there is no window', () => {
    expect(() => {
      removeStorageItem('local', 'k');
    }).not.toThrow();
  });
});
