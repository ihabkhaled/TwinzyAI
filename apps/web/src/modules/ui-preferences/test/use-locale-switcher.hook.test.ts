import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as i18nPackage from '@/packages/i18n';
import * as navigationPackage from '@/packages/navigation';
import * as storagePackage from '@/packages/storage';

import { useLocaleSwitcher } from '../hooks/useLocaleSwitcher.hook';

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

const selectEvent = (value: string): ChangeEvent<HTMLSelectElement> =>
  ({ target: { value } }) as ChangeEvent<HTMLSelectElement>;

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
  it('reports the active locale', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    expect(result.current.activeLocale).toBe('en');
  });

  it('writes the locale cookie for the picked locale and refreshes the server tree', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    act(() => {
      result.current.onSelectLocale(selectEvent('fr'));
    });

    expect(storagePackage.writeCookie).toHaveBeenCalledWith(
      i18nPackage.LOCALE_COOKIE_NAME,
      'fr',
      expect.objectContaining({ maxAgeSeconds: i18nPackage.LOCALE_COOKIE_MAX_AGE_SECONDS }),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('ignores selecting the already-active locale', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    act(() => {
      result.current.onSelectLocale(selectEvent('en'));
    });

    expect(storagePackage.writeCookie).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('ignores an unsupported locale value (fails closed)', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    act(() => {
      result.current.onSelectLocale(selectEvent('xx'));
    });

    expect(storagePackage.writeCookie).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
