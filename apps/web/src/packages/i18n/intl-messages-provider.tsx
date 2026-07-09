'use client';
// client-boundary-reason: injects explicit i18n messages into NextIntlClientProvider context for tests and stories rendered outside the request pipeline.
import { type AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import type { LanguageCodeValue } from './locale.constants';
import { DEFAULT_TIME_ZONE } from './locale.constants';

/** The message dictionary shape passed to the provider. */
export type AppMessages = AbstractIntlMessages;

interface IntlMessagesProviderProps {
  locale: LanguageCodeValue;
  messages: AppMessages;
  children: ReactNode;
}

/**
 * Provider that carries an explicit message dictionary. Use it in unit tests
 * and stories where there is no server request to inherit messages from; the
 * app itself uses {@link AppIntlProvider}.
 */
export const IntlMessagesProvider = ({
  locale,
  messages,
  children,
}: IntlMessagesProviderProps): ReactNode => (
  <NextIntlClientProvider locale={locale} messages={messages} timeZone={DEFAULT_TIME_ZONE}>
    {children}
  </NextIntlClientProvider>
);
