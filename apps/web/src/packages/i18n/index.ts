/**
 * Public facade for the i18n package. next-intl is imported only inside this
 * package; the rest of the app depends on these exports.
 */

export { AppIntlProvider } from './app-intl-provider';
export { type AppMessages, IntlMessagesProvider } from './intl-messages-provider';
export type { LanguageCodeValue } from './locale.constants';
export {
  DEFAULT_LOCALE,
  getLocaleDirection,
  isSupportedLanguageCode,
  LANGUAGE_CODES,
  LANGUAGE_ENDONYMS,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
} from './locale.constants';
export { getServerLocale, getServerMessages, getServerTranslations } from './server-messages';
export { useAppLocale, useAppTranslation } from './translation-hooks';
