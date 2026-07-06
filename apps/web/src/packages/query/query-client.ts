import { QueryClient } from '@tanstack/react-query';

/**
 * Builds a `QueryClient` with the app's default cache policy. A factory (rather
 * than a shared singleton) so each render tree — and each test — gets an
 * isolated cache.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 300_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
