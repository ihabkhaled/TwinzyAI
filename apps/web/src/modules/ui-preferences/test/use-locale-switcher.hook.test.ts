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
const replace = vi.fn();
const reloadAt = vi.fn();

const selectEvent = (value: string): ChangeEvent<HTMLSelectElement> =>
  ({ target: { value } }) as ChangeEvent<HTMLSelectElement>;

beforeEach(() => {
  vi.mocked(i18nPackage.useAppLocale).mockReturnValue('en');
  vi.mocked(navigationPackage.useAppNavigation).mockReturnValue({
    pathname: '/',
    push: vi.fn(),
    replace,
    reloadAt,
    back: vi.fn(),
    refresh,
  });
  vi.mocked(storagePackage.writeCookie).mockReset();
  refresh.mockReset();
  replace.mockReset();
  reloadAt.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useLocaleSwitcher', () => {
  it('reports the active locale', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    expect(result.current.activeLocale).toBe('en');
  });

  it('falls back to English when the runtime locale is unsupported', () => {
    vi.mocked(i18nPackage.useAppLocale).mockReturnValue('unknown');

    const { result } = renderHook(() => useLocaleSwitcher());

    expect(result.current.activeLocale).toBe('en');
  });

  it('writes the locale cookie and exposes a busy state until full navigation', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    act(() => {
      result.current.onSelectLocale(selectEvent('fr'));
    });

    expect(storagePackage.writeCookie).toHaveBeenCalledWith(
      i18nPackage.LOCALE_COOKIE_NAME,
      'fr',
      expect.objectContaining({ maxAgeSeconds: i18nPackage.LOCALE_COOKIE_MAX_AGE_SECONDS }),
    );
    expect(result.current.isSwitchingLocale).toBe(true);
    expect(reloadAt).toHaveBeenCalledWith('/fr');
    expect(refresh).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('navigates to the selected prefix on a localized editorial page', () => {
    vi.mocked(navigationPackage.useAppNavigation).mockReturnValue({
      pathname: '/en/about',
      push: vi.fn(),
      replace,
      reloadAt,
      back: vi.fn(),
      refresh,
    });
    const { result } = renderHook(() => useLocaleSwitcher());

    act(() => {
      result.current.onSelectLocale(selectEvent('fr'));
    });

    expect(reloadAt).toHaveBeenCalledWith('/fr/about');
    expect(result.current.isSwitchingLocale).toBe(true);
    expect(replace).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('refreshes a non-editorial route so in-memory game state survives', () => {
    vi.mocked(navigationPackage.useAppNavigation).mockReturnValue({
      pathname: '/game',
      push: vi.fn(),
      replace,
      reloadAt,
      back: vi.fn(),
      refresh,
    });
    const { result } = renderHook(() => useLocaleSwitcher());

    act(() => {
      result.current.onSelectLocale(selectEvent('ar'));
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(reloadAt).not.toHaveBeenCalled();
  });

  it('ignores selecting the already-active locale', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    act(() => {
      result.current.onSelectLocale(selectEvent('en'));
    });

    expect(storagePackage.writeCookie).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.isSwitchingLocale).toBe(false);
  });

  it('ignores an unsupported locale value (fails closed)', () => {
    const { result } = renderHook(() => useLocaleSwitcher());

    act(() => {
      result.current.onSelectLocale(selectEvent('xx'));
    });

    expect(storagePackage.writeCookie).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.isSwitchingLocale).toBe(false);
  });
});
