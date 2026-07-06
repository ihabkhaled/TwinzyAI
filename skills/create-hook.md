# Skill: Create a Hook (View Model)

Create a `use-<name>.hook.ts` file in a module's `hooks/` layer. Hooks are the orchestration
layer: they combine queries, stores, i18n, and pure helpers into a fully-computed view model that
a container can render without thinking. Everything user-visible — labels, formatted values, class
names, callbacks — is finished here.

## Read first

- [rules/frontend/03-hooks.md](../rules/frontend/03-hooks.md)
- [rules/frontend/14-i18n-rtl.md](../rules/frontend/14-i18n-rtl.md)
- Reference: `apps/web/src/modules/game/hooks/use-match-results.hook.ts`

## Steps

1. Define the view-model types first in `types/<feature>.types.ts`: a state union plus a readonly
   interface, e.g. `MatchResultsState = 'loading' | 'error' | 'empty' | 'ready'` and
   `MatchResultsViewModel` in `apps/web/src/modules/game/types/game.types.ts`. The container will
   switch on `state`; design the union before writing the hook.
2. Create `apps/web/src/modules/<feature>/hooks/use-<name>.hook.ts` exporting one function
   `use<Name>(): <Name>ViewModel`.
3. Gather inputs at the top: query hooks from the module's `queries/` layer, store selectors from
   `store/`, and i18n via `useAppTranslation(I18N_NAMESPACES.<feature>)` and `useAppLocale` from
   `@/packages/i18n`. Message keys come from `constants/<feature>-message-keys.constants.ts` —
   never string literals.
4. Resolve the state union with a pure module-scope function (not inline logic), like
   `resolveListState` in the reference hook:

   ```ts
   function resolveListState(options: {
     isPending: boolean;
     isError: boolean;
     itemCount: number;
   }): MatchResultsState {
     if (options.isPending) {
       return 'loading';
     }
     if (options.isError) {
       return 'error';
     }
     return options.itemCount === 0 ? 'empty' : 'ready';
   }
   ```

   Module-scope pure functions are fine; declaring components or JSX inside a hook is not
   (`no-inline-declarations`). If a helper grows, move it to `helpers/` like
   `buildMatchCardViewModel` in `apps/web/src/modules/game/helpers/match-display.helper.ts`.

5. Apply memoization discipline:
   - `useMemo` for derived collections — the reference hook memoizes `items` over
     `[query.data, locale, t]`, mapping domain matches through the display helper.
   - `useCallback` for every callback handed to the view model — e.g. `onRetry` wrapping
     `query.refetch` with a `void` call.
   - Dependency arrays MUST be exact; never silence `react-hooks/exhaustive-deps`.
6. Return the finished view model: state, display-ready items (each carrying its own `testId`
   from `TEST_IDS`), and every label already translated (`loadingLabel`, `emptyMessage`,
   `errorMessage`, `retryLabel` in the reference).
7. Unit-test the hook in `apps/web/src/modules/<feature>/test/` with `renderHook`, MSW-backed
   providers, and assertions on the returned view model per
   [testing/unit-testing-standard.md](../testing/unit-testing-standard.md). Pure helpers extracted
   in step 4 get their own 100%-coverage tests.

## Forbidden

- Returning raw query objects, message keys, or untranslated strings to the container.
- HTTP calls or mapping wire data here — that is service/mapper territory
  ([skills/create-service-frontend.md](./create-service-frontend.md)).
- Declaring React components, JSX, or hooks-inside-conditionals.
- Reading `process.env`, `window`, or `document` — use `@/packages/env` and `@/packages/browser`.

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

- Hook returns a single readonly view model; the container needs zero logic to render it.
- All copy translated via `useAppTranslation` + message-key constants (en + ar keys exist).
- Callbacks are `useCallback`-stable; derived data is `useMemo`-bounded with exact deps.
- Hook and extracted helpers are tested; coverage thresholds hold.
