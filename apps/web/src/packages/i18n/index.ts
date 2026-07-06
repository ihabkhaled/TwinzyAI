/**
 * Public facade for the i18n package. next-intl is imported only inside this
 * package; the rest of the app depends on these exports.
 */

export { AppIntlProvider } from './app-intl-provider';
export { type AppMessages, IntlMessagesProvider } from './intl-messages-provider';
export type { AppLocale, AppTextDirection } from './locale.constants';
export {
  DEFAULT_LOCALE,
  getLocaleDirection,
  isSupportedLocale,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
} from './locale.constants';
export { getServerLocale, getServerTranslations } from './server-messages';
export { useAppLocale, useAppTranslation } from './translation-hooks';
