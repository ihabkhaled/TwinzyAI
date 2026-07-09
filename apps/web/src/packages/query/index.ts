export { AppQueryProvider } from './app-query-provider';
export { makeQueryClient } from './query-client';
export {
  AppQueryClient,
  AppQueryClientProvider,
  useAppMutation,
  useAppQuery,
  useAppQueryClient,
  useAppSuspenseQuery,
} from './query-hooks';
export type { AppMutationOptions, AppQueryKey, AppQueryOptions } from './query-types';
export type { UseQueryResult as AppQueryResult } from '@tanstack/react-query';
