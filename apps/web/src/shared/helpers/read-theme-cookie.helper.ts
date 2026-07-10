import { cookies } from 'next/headers';

import { THEME_COOKIE_NAME } from '@/shared/constants/theme-cookie.constants';
import { AppTheme, type AppThemeValue } from '@/shared/enums/app-theme.enum';

import 'server-only';

/**
 * Resolve the `data-theme` attribute to render on `<html>` from the theme
 * cookie, server-side. When no valid cookie exists, omit the attribute so the
 * CSS `prefers-color-scheme` rule owns the first paint.
 */
export const readThemeAttribute = async (): Promise<AppThemeValue | undefined> => {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE_NAME)?.value;

  return value === AppTheme.Dark || value === AppTheme.Light ? value : undefined;
};
