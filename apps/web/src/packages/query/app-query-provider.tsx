'use client';
// client-boundary-reason: React Query cache + devtools must run in the browser

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

import { publicEnv } from '@/packages/env';

import { makeQueryClient } from './query-client';

export function AppQueryProvider({ children }: { readonly children: ReactNode }): ReactNode {
  const [queryClient] = useState(makeQueryClient);
  const showDevtools = publicEnv.appEnv === 'local';

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
