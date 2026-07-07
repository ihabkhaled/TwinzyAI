'use client';
// client-boundary-reason: hosts the React Query cache and mounts the UI-preferences DOM/persistence effects, both browser-only.

import type { ReactNode } from 'react';

import { UiPreferencesEffects } from '@/modules/ui-preferences';
import { AppQueryProvider } from '@/packages/query';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps): ReactNode => (
  <AppQueryProvider>
    <UiPreferencesEffects />
    {children}
  </AppQueryProvider>
);
