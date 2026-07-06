'use client';
// client-boundary-reason: NextIntlClientProvider seeds the React i18n context that client components read at runtime.
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import type { AppLocale } from './locale.constants';

interface AppIntlProviderProps {
  locale: AppLocale;
  children: ReactNode;
}

/**
 * Client provider for the app tree. Messages are inherited from the server
 * request configuration ({@link ./request}), so only the active locale is
 * forwarded here.
 */
export const AppIntlProvider = ({ locale, children }: AppIntlProviderProps): ReactNode => (
  <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
);
