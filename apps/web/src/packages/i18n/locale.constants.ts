/**
 * Locale primitives for the cookie-based (non-routed) i18n setup.
 *
 * The canonical list of supported language codes and the narrowing helpers live
 * in {@link @twinzy/shared} so backend and frontend share the same contract.
 * This file keeps the frontend-only concerns: default locale, cookie, time zone,
 * and writing direction. It has no dependency on next-intl, so it is safe to
 * import from server code, client code, tests, and configuration alike.
 */

import { DEFAULT_LANGUAGE_CODE, type LanguageCodeValue } from '@twinzy/shared';

/** Locale used when no valid cookie is present. */
export const DEFAULT_LOCALE: LanguageCodeValue = DEFAULT_LANGUAGE_CODE;

/**
 * Global default time zone. next-intl needs a stable zone on both server and
 * client to avoid hydration markup mismatches (the ENVIRONMENT_FALLBACK
 * warning); the game shows no localized dates, so UTC is a safe fixed default.
 */
export const DEFAULT_TIME_ZONE = 'UTC';

/** Cookie the active locale is persisted in (shared with the app-shell wave). */
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;

/** Lifetime of the locale cookie written by the switcher: one year. */
export const LOCALE_COOKIE_MAX_AGE_SECONDS =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;

/** Text direction a locale renders in. */
export type AppTextDirection = 'ltr' | 'rtl';

/** Locales that render right-to-left. */
const RTL_LOCALES: ReadonlySet<LanguageCodeValue> = new Set<LanguageCodeValue>(['ar']);

/** Resolve the writing direction for a supported locale. */
export const getLocaleDirection = (locale: LanguageCodeValue): AppTextDirection =>
  RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';

/** Re-export the shared canonical locale primitives under their shared names. */

export { isSupportedLanguageCode, LANGUAGE_CODES, type LanguageCodeValue } from '@twinzy/shared';
