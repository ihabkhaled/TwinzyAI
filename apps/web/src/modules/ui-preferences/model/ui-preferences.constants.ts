import { getRootAttribute, matchesMediaQuery } from '@/packages/browser';
import type { LanguageCodeValue } from '@/packages/i18n';
import type { AppDirectionValue } from '@/shared/enums/app-direction.enum';
import { AppDirection } from '@/shared/enums/app-direction.enum';
import type { AppThemeValue } from '@/shared/enums/app-theme.enum';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import type { ResolvedColorScheme } from '../types/ui-preferences.types';

/**
 * i18n message key for each locale's endonym (the language name in its own
 * script), shown on the switcher button as the locale it will switch to.
 */
export const LOCALE_LABEL_KEYS: Record<LanguageCodeValue, string> = {
  en: 'app.localeEnglish',
  ar: 'app.localeArabic',
};

/**
 * Attribute names mirrored onto the document root (<html>). `data-theme`
 * preserves the exact attribute the pre-migration theme module wrote, so CSS
 * targeting it keeps working; `dir` is the standard HTML writing-direction
 * attribute consumed by the browser and by RTL-aware styles.
 */
export const UI_PREFERENCE_DOM_ATTRIBUTES = {
  theme: 'data-theme',
  direction: 'dir',
} as const;

/** Media query used to resolve the `system` theme to a concrete scheme. */
export const DARK_COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/**
 * Resolve a theme preference to the concrete scheme written to `data-theme`.
 * `system` defers to the OS `prefers-color-scheme`, exactly like the
 * pre-migration theme module; explicit `light`/`dark` pass through unchanged.
 */
export const resolveThemeAttribute = (theme: AppThemeValue): ResolvedColorScheme => {
  if (theme === AppTheme.System) {
    return matchesMediaQuery(DARK_COLOR_SCHEME_QUERY) ? AppTheme.Dark : AppTheme.Light;
  }

  return theme;
};

/**
 * Resolve the initial writing direction from the server-rendered `<html dir>`
 * attribute, defaulting to left-to-right. Used only on first load when no
 * preference has been persisted yet, so the client adopts whatever the server
 * chose (locale-driven) instead of flashing a wrong direction.
 */
export const resolveInitialDirection = (): AppDirectionValue => {
  const attribute = getRootAttribute(UI_PREFERENCE_DOM_ATTRIBUTES.direction);

  return attribute === AppDirection.Rtl ? AppDirection.Rtl : AppDirection.Ltr;
};
