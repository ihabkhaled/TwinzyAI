import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppTheme } from '@/shared/enums/app-theme.enum';

import { readThemeAttribute } from './read-theme-cookie.helper';

const { getCookie } = vi.hoisted(() => ({ getCookie: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ get: getCookie })),
}));
vi.mock('server-only', () => ({}));

describe('readThemeAttribute', () => {
  beforeEach(() => {
    getCookie.mockReset();
  });

  it('returns an explicit persisted light or dark theme', async () => {
    getCookie.mockReturnValue({ value: AppTheme.Dark });
    await expect(readThemeAttribute()).resolves.toBe(AppTheme.Dark);

    getCookie.mockReturnValue({ value: AppTheme.Light });
    await expect(readThemeAttribute()).resolves.toBe(AppTheme.Light);
  });

  it('omits the attribute when no valid theme cookie exists', async () => {
    getCookie.mockReturnValue(undefined);
    await expect(readThemeAttribute()).resolves.toBeUndefined();

    getCookie.mockReturnValue({ value: 'sepia' });
    await expect(readThemeAttribute()).resolves.toBeUndefined();
  });
});
