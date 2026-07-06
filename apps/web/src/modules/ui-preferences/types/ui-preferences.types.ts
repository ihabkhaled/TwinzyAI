import type { AppDirectionValue } from '@/shared/enums/app-direction.enum';
import type { AppTheme, AppThemeValue } from '@/shared/enums/app-theme.enum';

import type { UiPreferencesSnapshot } from '../schemas/ui-preferences.schema';

/**
 * The concrete color scheme written to the `data-theme` attribute once the
 * `system` preference has been resolved against the OS `prefers-color-scheme`.
 */
export type ResolvedColorScheme = typeof AppTheme.Light | typeof AppTheme.Dark;

/**
 * Client-global UI-preferences state plus its pure, synchronous mutation
 * actions. All side effects (storage, DOM) live outside the store, so this
 * shape stays trivially testable.
 */
export interface UiPreferencesState {
  theme: AppThemeValue;
  direction: AppDirectionValue;
  hasHydrated: boolean;
  setTheme: (theme: AppThemeValue) => void;
  setDirection: (direction: AppDirectionValue) => void;
  hydrate: (snapshot: UiPreferencesSnapshot) => void;
}

/**
 * View-model returned by {@link useThemeToggle} for the header theme control:
 * the current preference, whether the resolved scheme is dark, and a handler
 * that flips between explicit light and dark.
 */
export interface ThemeToggleController {
  theme: AppThemeValue;
  isDark: boolean;
  onToggleTheme: () => void;
}
