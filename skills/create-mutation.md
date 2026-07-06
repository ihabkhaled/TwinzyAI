# Skill: Create a Mutation

Add a write operation to a module: a `useAppMutation`-based hook plus an exact-scope invalidation
helper. Mutations call service use-cases and reconcile the cache deliberately — never with a
blanket "invalidate everything".

## Read first

- [rules/frontend/05-tanstack-query.md](../rules/frontend/05-tanstack-query.md)
- Reference: `apps/web/src/modules/game/queries/game.mutations.ts` and `game.invalidate.ts`

## Steps

1. Ensure the write exists as a service use-case (e.g. `submitPhoto` in
   `apps/web/src/modules/game/services/game.service.ts`) per
   [skills/create-service-frontend.md](./create-service-frontend.md).
2. Create or extend the invalidation helper in
   `apps/web/src/modules/<feature>/queries/<feature>.invalidate.ts`. It takes a `QueryClientLike`
   (from `@/packages/query`) and invalidates the narrowest key scope that the write affects:

   ```ts
   /** Exact-scope invalidation: only match lists refetch, nothing else. */
   export function invalidateMatchResults(queryClient: QueryClientLike): Promise<void> {
     return queryClient.invalidateQueries({ queryKey: gameQueryKeys.lists() });
   }
   ```

   Keys come only from the builder file ([skills/create-query.md](./create-query.md)). One helper
   per scope; a mutation that touches lists and one detail calls two helpers.

3. Create the mutation hook in `apps/web/src/modules/<feature>/queries/<feature>.mutations.ts`:

   ```ts
   export function useSubmitPhotoMutation(): ReturnType<
     typeof useAppMutation<MatchResultsResult, Error, SubmitPhotoInput>
   > {
     const queryClient = useAppQueryClient();

     return useAppMutation<MatchResultsResult, Error, SubmitPhotoInput>({
       mutationFn: submitPhoto,
       onSuccess: () => invalidateMatchResults(queryClient),
     });
   }
   ```

   `useAppMutation` and `useAppQueryClient` come from `@/packages/query` — never the vendor
   package. Type all three generics: result, error, input.

4. Surface the outcome in the view-model hook that consumes the mutation: success/error toasts go
   through `showToast` from `@/packages/toast` with messages translated from keys (error mapping
   via `mapErrorToMessageKey` from
   `apps/web/src/shared/errors/http-error-to-message-key.mapper.ts`).
5. Optimistic updates are opt-in, not default. Use them only when the UI must reflect the write
   instantly, and always with rollback:
   - `onMutate`: `await queryClient.cancelQueries({ queryKey: gameQueryKeys.lists() })`,
     snapshot the previous data with `getQueryData`, write the optimistic value with
     `setQueryData` (keys from the builder), and return `{ previous }` as context.
   - `onError`: restore the snapshot with `setQueryData(key, context.previous)`.
   - `onSettled`: call the invalidation helper so the cache reconverges with the server.
     Skipping any of the three steps is a defect, not a simplification.
6. Test it:
   - Unit test the invalidation helper in `apps/web/src/modules/<feature>/test/` with a stubbed
     `QueryClientLike`, asserting the exact `queryKey` scope (100% bucket for query-key code).
   - Integration test the flow in `apps/web/src/tests/integration/`: MSW handler accepts the POST,
     the affected list query refetches, and the error path (handler returns 400/500) leaves the
     cache unchanged and surfaces the translated error. For optimistic updates, assert the rollback
     by checking the rendered list after a failed mutation.

## Twinzy guardrail

- The photo-submit mutation transports the `File` for this request only; do not persist it to a
  store or cache after the mutation settles. There is no payment or account write path — the game
  is free and identity-free.

## Forbidden

- `queryClient.invalidateQueries()` with no key, or inline key arrays in mutation callbacks.
- Mutating Zustand stores to mirror server state after a write — the query cache is the single
  source of server truth.
- Optimistic writes without snapshot + rollback + settle-invalidate.

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

- Mutation hook wraps `useAppMutation` with full generics and calls a named invalidation helper.
- Invalidation scope is the narrowest key that covers the write; helper is unit-tested.
- Success and failure paths are integration-tested against MSW, including rollback if optimistic.
