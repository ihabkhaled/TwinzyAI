'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { getQueryClient } from '@/lib/react-query';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps): ReactNode => (
  <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
);
