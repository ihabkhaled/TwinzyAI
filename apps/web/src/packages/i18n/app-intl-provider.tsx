'use client';
// client-boundary-reason: NextIntlClientProvider seeds the React i18n context that client components read at runtime.
import { type AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import type { AppLocale } from './locale.constants';
import { DEFAULT_TIME_ZONE } from './locale.constants';

interface AppIntlProviderProps {
  locale: AppLocale;
  messages: AbstractIntlMessages;
  children: ReactNode;
}

/**
 * Client provider for the app tree. A client provider cannot inherit the server
 * request configuration on its own, so the server layout resolves the active
 * locale's messages ({@link ./request}) and forwards them here explicitly —
 * without this, client components' useTranslations throws "No messages
 * configured".
 */
export const AppIntlProvider = ({
  locale,
  messages,
  children,
}: AppIntlProviderProps): ReactNode => (
  <NextIntlClientProvider locale={locale} messages={messages} timeZone={DEFAULT_TIME_ZONE}>
    {children}
  </NextIntlClientProvider>
);
