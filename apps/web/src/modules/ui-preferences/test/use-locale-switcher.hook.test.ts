import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as i18nPackage from '@/packages/i18n';
import * as navigationPackage from '@/packages/navigation';
import * as storagePackage from '@/packages/storage';

import { useLocaleSwitcher } from '../hooks/useLocaleSwitcher.hook';

vi.mock('@/packages/i18n', async (importActual) => ({
  ...(await importActual<typeof i18nPackage>()),
  useAppLocale: vi.fn(),
  LANGUAGE_CODES: ['en', 'ar'],
}));
vi.mock('@/packages/navigation', async (importActual) => ({
  ...(await importActual<typeof navigationPackage>()),
  useAppNavigation: vi.fn(),
}));
vi.mock('@/packages/storage', async (importActual) => ({
  ...(await importActual<typeof storagePackage>()),
  writeCookie: vi.fn(),
}));

const refresh = vi.fn();

beforeEach(() => {
  vi.mocked(i18nPackage.useAppLocale).mockReturnValue('en');
  vi.mocked(navigationPackage.useAppNavigation).mockReturnValue({
    pathname: '/',
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh,
  });
  vi.mocked(storagePackage.writeCookie).mockReset();
  refresh.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useLocaleSwitcher', () => {
  it('reports the active and next locale', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    expect(result.current.activeLocale).toBe('en');
    expect(result.current.nextLocale).toBe('ar');
  });

  it('writes the locale cookie and refreshes the server-owned direction', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    act(() => {
      result.current.onSwitchLocale();
    });

    expect(storagePackage.writeCookie).toHaveBeenCalledWith(
      i18nPackage.LOCALE_COOKIE_NAME,
      'ar',
      expect.objectContaining({ maxAgeSeconds: i18nPackage.LOCALE_COOKIE_MAX_AGE_SECONDS }),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
