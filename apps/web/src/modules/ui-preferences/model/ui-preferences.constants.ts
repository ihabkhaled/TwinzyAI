import { getRootAttribute, matchesMediaQuery } from '@/packages/browser';
import type { AppThemeValue } from '@/shared/enums/app-theme.enum';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import type { ResolvedColorScheme } from '../types/ui-preferences.types';

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
 * Resolve the initial theme from the server-rendered `<html data-theme>`
 * attribute. Used only on first load when no preference has been persisted
 * yet: a dark first paint (driven by the theme cookie) is adopted instead of
 * being flipped back to the default by the first DOM mirror. A light or
 * missing attribute keeps the caller's in-store default — the cookie only
 * distinguishes an explicit dark scheme.
 */
export const resolveInitialTheme = (fallbackTheme: AppThemeValue): AppThemeValue => {
  const attribute = getRootAttribute(UI_PREFERENCE_DOM_ATTRIBUTES.theme);

  return attribute === AppTheme.Dark ? AppTheme.Dark : fallbackTheme;
};
