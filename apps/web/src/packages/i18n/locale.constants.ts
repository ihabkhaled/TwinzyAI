/**
 * Locale primitives for the cookie-based (non-routed) i18n setup.
 *
 * This file owns the canonical locale identity: which locales exist, which is
 * the default, the cookie the active locale is read from, and text direction.
 * It has no dependency on next-intl, so it is safe to import from server code,
 * client code, tests, and configuration alike.
 */

/** Every locale the product ships. Order is display order. */
export const SUPPORTED_LOCALES = ['en', 'ar'] as const;

/** Union of the shipped locale codes, derived from {@link SUPPORTED_LOCALES}. */
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** Locale used when no valid cookie is present. */
export const DEFAULT_LOCALE: AppLocale = 'en';

/**
 * Global default time zone. next-intl needs a stable zone on both server and
 * client to avoid hydration markup mismatches (the ENVIRONMENT_FALLBACK
 * warning); the game shows no localized dates, so UTC is a safe fixed default.
 */
export const DEFAULT_TIME_ZONE = 'UTC';

/** Cookie the active locale is persisted in (shared with the app-shell wave). */
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

/** Lifetime of the locale cookie written by the switcher: one year. */
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Text direction a locale renders in. */
export type AppTextDirection = 'ltr' | 'rtl';

/** Locales that render right-to-left. */
const RTL_LOCALES: ReadonlySet<AppLocale> = new Set<AppLocale>(['ar']);

/** Narrow an unknown value to a supported locale code. */
export const isSupportedLocale = (value: unknown): value is AppLocale =>
  typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);

/** Resolve the writing direction for a supported locale. */
export const getLocaleDirection = (locale: AppLocale): AppTextDirection =>
  RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
