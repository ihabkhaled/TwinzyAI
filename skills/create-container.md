# Skill: Create a Container

Create a `*.container.tsx` file — the client boundary that connects one view-model hook to
JSX-only components. Containers are the only module layer allowed to be a client entry point, and
the only place `.map()` from view models to child elements happens.

## Read first

- [rules/frontend/02-components-and-containers.md](../rules/frontend/02-components-and-containers.md)
- Reference: `apps/web/src/modules/game/containers/match-results.container.tsx`

## Steps

1. Create `apps/web/src/modules/<feature>/containers/<name>.container.tsx` starting with exactly:

   ```tsx
   'use client';
   // client-boundary-reason: connects the interactive match-results query hook to presentational components.
   ```

   The reason comment is mandatory and checked by the `require-client-component-reason` rule.
   State what interactivity forces the boundary — "needs hooks" is not a reason.

2. Call exactly one view-model hook from the module's `hooks/` layer
   ([skills/create-hook.md](./create-hook.md)). The container holds no state of its own and computes
   nothing — it renders what the hook returns.
3. Render by switching on the view model's `state` union. This is the canonical pattern from
   `MatchResultsContainer`:

   ```tsx
   export function MatchResultsContainer(): ReactElement {
     const viewModel = useMatchResults();

     switch (viewModel.state) {
       case 'loading': {
         return <LoadingState label={viewModel.loadingLabel} testId={TEST_IDS.matchesLoading} />;
       }
       case 'error': {
         return (
           <ErrorState
             message={viewModel.errorMessage}
             retryLabel={viewModel.retryLabel}
             onRetry={viewModel.onRetry}
             testId={TEST_IDS.matchesError}
           />
         );
       }
       case 'empty': {
         return <EmptyState message={viewModel.emptyMessage} testId={TEST_IDS.matchesEmpty} />;
       }
       case 'ready': {
         return (
           <MatchList testId={TEST_IDS.matchesList}>
             {viewModel.items.map((item) => (
               <MatchCard key={item.id} viewModel={item} />
             ))}
           </MatchList>
         );
       }
       default: {
         return assertNever(viewModel.state);
       }
     }
   }
   ```

4. Cover every state: loading, error, empty, ready — using the shared feedback components
   `LoadingState`, `ErrorState`, `EmptyState` from `apps/web/src/shared/components/feedback/`. Close
   the switch with `assertNever` from `apps/web/src/shared/utils/assert-never.util.ts` so adding a
   state later is a compile error, not a silent fall-through.
5. The `.map()` from view-model items to child elements happens here, keyed by a stable domain id.
   Components receive fully-built items; they never iterate.
6. Export the container from the module's `index.ts` if a route renders it, then mount it in a
   server page like `apps/web/src/app/(game)/game/page.tsx` does.
7. Write an integration test in `apps/web/src/tests/integration/` with `renderWithProviders`
   (`apps/web/src/tests/helpers/render-with-providers.tsx`) and MSW handlers, asserting each state
   renders per
   [testing/integration-testing-standard.md](../testing/integration-testing-standard.md).

## Forbidden

- More than one orchestration hook, `useState`/`useEffect` in the container, or any translation,
  formatting, or class selection here — push it down into the hook.
- Rendering raw query objects (`query.isPending` checks belong in the hook's state resolution).
- Making the page itself a client component to avoid a container.

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global, 100% pure layers
npm run build               # next build
npm run quality:dead-code   # knip — no orphaned exports
npm run quality:circular    # madge — no import cycles
npm run test:e2e            # relevant Playwright suite (+ test:a11y / test:visual when UI changed)
```

## Definition of done

- `'use client'` + documented `client-boundary-reason` on lines 1–2.
- Exhaustive state switch ending in `assertNever`; every branch has a `TEST_IDS` entry.
- Container exported via the module `index.ts` and rendered from a server page.
- Integration test proves loading, error, empty, and ready behavior against MSW.
