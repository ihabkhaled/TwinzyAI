import { cookies } from 'next/headers';

import { THEME_COOKIE_NAME } from '@/shared/constants/theme-cookie.constants';
import { AppTheme, type AppThemeValue } from '@/shared/enums/app-theme.enum';

import 'server-only';

/**
 * Resolve the `data-theme` attribute to render on `<html>` from the theme
 * cookie, server-side. Defaults to light when the cookie is absent (first
 * visit) or holds anything other than the explicit dark scheme, so the very
 * first paint already matches the user's persisted choice.
 */
export const readThemeAttribute = async (): Promise<AppThemeValue> => {
  const cookieStore = await cookies();

  return cookieStore.get(THEME_COOKIE_NAME)?.value === AppTheme.Dark
    ? AppTheme.Dark
    : AppTheme.Light;
};
