import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';

export type AppQueryKey = readonly unknown[];

export type AppQueryOptions<TData, TError = Error> = UseQueryOptions<TData, TError>;

export type AppMutationOptions<TData, TError = Error, TVariables = void> = UseMutationOptions<
  TData,
  TError,
  TVariables
>;
