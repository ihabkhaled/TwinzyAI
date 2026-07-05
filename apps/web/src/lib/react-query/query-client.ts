import { environmentManager, QueryClient } from '@tanstack/react-query';

const QUERY_STALE_TIME_MS = 60_000;

const makeQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

/**
 * Server: always a fresh client per render (no cross-request leaking).
 * Browser: a singleton so React re-renders never lose the cache.
 * Keeping this in lib/ lets provider TSX stay hook-free.
 */
export const getQueryClient = (): QueryClient => {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }

  browserQueryClient = browserQueryClient ?? makeQueryClient();
  return browserQueryClient;
};
