import { cookies } from 'next/headers';
import type { AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import type { AppLocale } from './locale.constants';
import {
  DEFAULT_LOCALE,
  DEFAULT_TIME_ZONE,
  isSupportedLocale,
  LOCALE_COOKIE_NAME,
} from './locale.constants';

/**
 * next-intl request configuration. Locale is read from the {@link LOCALE_COOKIE_NAME}
 * cookie (there is no locale routing); messages for the active locale are loaded
 * lazily. Wire this into `next.config` via `withNextIntl('./src/packages/i18n/request.ts')`
 * in the app-shell wave.
 */

const resolveLocaleFromCookie = async (): Promise<AppLocale> => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  return isSupportedLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;
};

const loadMessages = async (locale: AppLocale): Promise<AbstractIntlMessages> => {
  // Dynamic specifier: only the active locale's dictionary reaches the bundle.
  const imported = (await import(`./messages/${locale}.json`)) as {
    readonly default: AbstractIntlMessages;
  };

  return imported.default;
};

export default getRequestConfig(async () => {
  const locale = await resolveLocaleFromCookie();
  const messages = await loadMessages(locale);

  return { locale, messages, timeZone: DEFAULT_TIME_ZONE };
});
