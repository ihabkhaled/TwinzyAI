import { cookies } from 'next/headers';
import type { AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import type { LanguageCodeValue } from './locale.constants';
import {
  DEFAULT_LOCALE,
  DEFAULT_TIME_ZONE,
  isSupportedLanguageCode,
  LOCALE_COOKIE_NAME,
} from './locale.constants';

/**
 * next-intl request configuration. Locale is read from the {@link LOCALE_COOKIE_NAME}
 * cookie (the locale proxy writes it for prefixed routes); messages for the
 * active locale are loaded lazily.
 */

const resolveLocaleFromCookie = async (): Promise<LanguageCodeValue> => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  return isSupportedLanguageCode(cookieValue) ? cookieValue : DEFAULT_LOCALE;
};

export const loadMessagesForLocale = async (
  locale: LanguageCodeValue,
): Promise<AbstractIntlMessages> => {
  // Dynamic specifier: only the active locale's dictionary reaches the bundle.
  const imported = (await import(`./messages/${locale}.json`)) as {
    readonly default: AbstractIntlMessages;
  };

  return imported.default;
};

export default getRequestConfig(async () => {
  const locale = await resolveLocaleFromCookie();
  const messages = await loadMessagesForLocale(locale);

  return { locale, messages, timeZone: DEFAULT_TIME_ZONE };
});
