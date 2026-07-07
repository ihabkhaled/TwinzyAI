import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { type AppMessages, DEFAULT_LOCALE, IntlMessagesProvider } from '@/packages/i18n';
import enMessages from '@/packages/i18n/messages/en.json';
import { AppQueryClient, AppQueryClientProvider } from '@/packages/query';

const messages: AppMessages = enMessages;

/**
 * Render a component inside the same providers the app supplies at runtime: a
 * fresh isolated React Query client (retries disabled for determinism) and the
 * i18n context seeded with the English message dictionary. Component tests use
 * this so hooks that read the query cache or resolve translations behave as in
 * production.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  const queryClient = new AppQueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <AppQueryClientProvider client={queryClient}>
      <IntlMessagesProvider locale={DEFAULT_LOCALE} messages={messages}>
        {children}
      </IntlMessagesProvider>
    </AppQueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
