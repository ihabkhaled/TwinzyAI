import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as i18nPackage from '@/packages/i18n';
import * as navigationPackage from '@/packages/navigation';
import * as storagePackage from '@/packages/storage';
import { AppDirection } from '@/shared/enums/app-direction.enum';

import { useLocaleSwitcher } from '../hooks/useLocaleSwitcher.hook';
import { useUiPreferencesStore } from '../store/ui-preferences.store';

vi.mock('@/packages/i18n', async (importActual) => ({
  ...(await importActual<typeof i18nPackage>()),
  useAppLocale: vi.fn(),
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
  useUiPreferencesStore.getState().setDirection(AppDirection.Ltr);
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

  it('writes the locale cookie, flips direction to rtl, and refreshes on switch', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    act(() => {
      result.current.onSwitchLocale();
    });

    expect(storagePackage.writeCookie).toHaveBeenCalledWith(
      i18nPackage.LOCALE_COOKIE_NAME,
      'ar',
      expect.objectContaining({ maxAgeSeconds: i18nPackage.LOCALE_COOKIE_MAX_AGE_SECONDS }),
    );
    expect(useUiPreferencesStore.getState().direction).toBe(AppDirection.Rtl);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
