import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as browserPackage from '@/packages/browser';
import type * as i18nPackage from '@/packages/i18n';
import * as storagePackage from '@/packages/storage';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import { useUiPreferencesEffects } from '../hooks/useUiPreferencesEffects.hook';
import { UI_PREFERENCE_DOM_ATTRIBUTES } from '../model/ui-preferences.constants';
import { useUiPreferencesStore } from '../store/ui-preferences.store';

vi.mock('@/packages/browser', async (importActual) => ({
  ...(await importActual<typeof browserPackage>()),
  getRootAttribute: vi.fn(() => null),
  getSafeWindow: vi.fn(() => null),
  matchesMediaQuery: vi.fn(() => false),
  setRootAttribute: vi.fn(),
}));
vi.mock('@/packages/i18n', async (importActual) => ({
  ...(await importActual<typeof i18nPackage>()),
  useAppLocale: vi.fn(() => 'ar'),
}));
vi.mock('@/packages/storage', async (importActual) => ({
  ...(await importActual<typeof storagePackage>()),
  readStorageJson: vi.fn(() => null),
  writeCookie: vi.fn(),
  writeStorageJson: vi.fn(),
}));

const initialState = useUiPreferencesStore.getState();

beforeEach(() => {
  useUiPreferencesStore.setState(initialState, true);
  vi.mocked(storagePackage.readStorageJson).mockReturnValue(null);
  vi.mocked(browserPackage.getSafeWindow).mockReturnValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
  useUiPreferencesStore.setState(initialState, true);
});

describe('useUiPreferencesEffects', () => {
  it('hydrates theme, derives rtl from locale, and persists theme only', async () => {
    renderHook(() => {
      useUiPreferencesEffects();
    });

    await waitFor(() => {
      expect(useUiPreferencesStore.getState().hasHydrated).toBe(true);
    });
    expect(browserPackage.setRootAttribute).toHaveBeenCalledWith(
      UI_PREFERENCE_DOM_ATTRIBUTES.direction,
      'rtl',
    );
    expect(storagePackage.writeStorageJson).toHaveBeenCalledWith('local', expect.any(String), {
      theme: AppTheme.System,
    });
  });

  it('hydrates a stored theme without a stored direction', async () => {
    vi.mocked(storagePackage.readStorageJson).mockReturnValue({ theme: AppTheme.Dark });

    renderHook(() => {
      useUiPreferencesEffects();
    });

    await waitFor(() => {
      expect(useUiPreferencesStore.getState().theme).toBe(AppTheme.Dark);
    });
    expect(browserPackage.setRootAttribute).toHaveBeenCalledWith(
      UI_PREFERENCE_DOM_ATTRIBUTES.theme,
      AppTheme.Dark,
    );
  });

  it('tracks system color-scheme changes and removes the listener', async () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    Object.defineProperty(globalThis, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener,
        removeEventListener,
      })),
    });
    vi.mocked(browserPackage.getSafeWindow).mockReturnValue(globalThis.window);
    const { unmount } = renderHook(() => {
      useUiPreferencesEffects();
    });

    await waitFor(() => {
      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
