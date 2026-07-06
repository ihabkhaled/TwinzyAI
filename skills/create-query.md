# Skill: Create a Query

Add a TanStack Query read to a module: a key in the key-builder file, an options builder, and a
`useAppQuery`-based hook. Server state lives only in TanStack Query (never in Zustand), and cache
addresses come only from the module's query-key builder — inline key arrays are an ESLint
violation (`no-inline-query-keys`).

## Read first

- [rules/frontend/05-tanstack-query.md](../rules/frontend/05-tanstack-query.md)
- Reference: `apps/web/src/modules/game/queries/`

## Steps

1. Add or extend the key builder in `apps/web/src/modules/<feature>/queries/<feature>-query-keys.ts`.
   Keys form a hierarchy rooted at the module name so invalidation can target exact scopes:

   ```ts
   export const gameQueryKeys = {
     root: ['game'] as const,
     lists: () => [...gameQueryKeys.root, 'match-list'] as const,
     list: (params: MatchResultsParams) => [...gameQueryKeys.lists(), params] as const,
     details: () => [...gameQueryKeys.root, 'match-detail'] as const,
     detail: (id: string) => [...gameQueryKeys.details(), id] as const,
   };
   ```

   Every parameter that changes the result MUST be part of the key (the `params` object above).

2. Ensure the data function exists as a service use-case
   ([skills/create-service-frontend.md](./create-service-frontend.md)) — the query layer never
   fetches on its own.
3. Add an exported options builder plus the hook in
   `apps/web/src/modules/<feature>/queries/<feature>.queries.ts`, mirroring the flagship:

   ```ts
   /** Exported for reuse in integration tests and prefetching. */
   export function buildMatchResultsQueryOptions(params: MatchResultsParams): {
     queryKey: ReturnType<typeof gameQueryKeys.list>;
     queryFn: () => Promise<MatchResultsResult>;
   } {
     return {
       queryKey: gameQueryKeys.list(params),
       queryFn: () => listMatchResults(params),
     };
   }

   export function useMatchResultsQuery(
     params: MatchResultsParams,
   ): ReturnType<typeof useAppQuery<MatchResultsResult, Error>> {
     return useAppQuery<MatchResultsResult>(buildMatchResultsQueryOptions(params));
   }
   ```

   Import `useAppQuery` (or `useAppSuspenseQuery`) from `@/packages/query` — never from
   `@tanstack/react-query` directly (`no-raw-package-imports`). The provider defaults come from
   `AppQueryProvider` in `apps/web/src/packages/query/app-query-provider.tsx`; only override
   `staleTime` or `retry` per-query with a written justification.

4. Consume the query hook from a view-model hook ([skills/create-hook.md](./create-hook.md)) that
   folds `isPending`/`isError`/`data` into a state union — containers never touch query objects.
5. If a mutation will later touch this data, plan the invalidation scope now
   ([skills/create-mutation.md](./create-mutation.md)); `lists()`/`list(params)` granularity exists
   exactly so invalidation can be surgical.
6. Test it:
   - Key-builder file: direct unit tests in `apps/web/src/modules/<feature>/test/` (100% bucket)
     asserting hierarchy and param inclusion.
   - Query flow: integration test in `apps/web/src/tests/integration/` using `renderWithProviders`
     (`apps/web/src/tests/helpers/render-with-providers.tsx`) and an MSW handler in
     `apps/web/src/tests/msw/handlers/` that serves the wire-shape fixture from
     `api/<feature>.mock.ts` — assert the ready state renders and the error state appears when the
     handler returns 500, per
     [testing/integration-testing-standard.md](../testing/integration-testing-standard.md).

## Forbidden

- Inline `queryKey: ['game', ...]` arrays anywhere outside the key-builder file.
- Calling the gateway from `queryFn` directly, or putting query results into a Zustand store.
- `useEffect`-based data fetching of any kind.

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global, 100% for query-key builders
npm run build               # next build
npm run quality:dead-code   # knip — no orphaned exports
npm run quality:circular    # madge — no import cycles
npm run test:e2e            # relevant Playwright suite
```

## Definition of done

- Key added to the builder with all result-affecting params; options builder exported.
- Hook wraps `useAppQuery` with domain types; consumed only via a view-model hook.
- Key-builder unit tests at 100%; MSW integration test covers ready + error paths.
