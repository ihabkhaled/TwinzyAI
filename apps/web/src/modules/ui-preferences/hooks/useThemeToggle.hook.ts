'use client';
// client-boundary-reason: exposes interactive theme-toggle state and a click handler backed by the client preferences store.

import { useCallback } from 'react';

import { AppTheme } from '@/shared/enums/app-theme.enum';

import { resolveThemeAttribute } from '../model/ui-preferences.constants';
import { selectTheme } from '../store/ui-preferences.selectors';
import { useUiPreferencesStore } from '../store/ui-preferences.store';
import type { ThemeToggleController } from '../types/ui-preferences.types';

/**
 * Header theme-toggle controller. Reports the current theme preference, whether
 * the resolved scheme is currently dark, and a handler that flips between
 * explicit light and dark — collapsing `system` to a concrete choice on the
 * first toggle so the user sees an immediate, deterministic switch.
 */
export function useThemeToggle(): ThemeToggleController {
  const theme = useUiPreferencesStore(selectTheme);
  const setTheme = useUiPreferencesStore((state) => state.setTheme);
  const hasHydrated = useUiPreferencesStore((state) => state.hasHydrated);
  const isDark = resolveThemeAttribute(theme) === AppTheme.Dark;

  const onToggleTheme = useCallback((): void => {
    setTheme(isDark ? AppTheme.Light : AppTheme.Dark);
  }, [isDark, setTheme]);

  return { theme, isDark, hasHydrated, onToggleTheme };
}
