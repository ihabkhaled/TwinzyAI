import type { AppLocale } from '@/packages/i18n';
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
  /** False until the client has hydrated from storage; gates theme-dependent
   * rendering so the server and first client paint agree (no hydration mismatch). */
  hasHydrated: boolean;
  onToggleTheme: () => void;
}

/**
 * View-model returned by `useLocaleSwitcher` for the header language control:
 * the active locale, the locale a click switches to, and the switch handler.
 */
export interface LocaleSwitcherController {
  activeLocale: AppLocale;
  nextLocale: AppLocale;
  onSwitchLocale: () => void;
}
