# Skill: Write Integration Tests (Frontend)

Integration tests render a container with real providers and a mocked network, then assert what the
user sees. They live in `apps/web/src/tests/integration/` and run under Vitest/jsdom. Standard:
[testing/integration-testing-standard.md](../testing/integration-testing-standard.md).

> The backend integration playbook (boot Nest on Fastify) is
> [write-integration-tests.md](./write-integration-tests.md). This one is for `apps/web`.

## The harness

- **`renderWithProviders`** (`apps/web/src/tests/helpers/render-with-providers.tsx`) wraps the
  subject in the same provider stack the app uses — the query provider (fresh query client per
  test) and the intl provider with the real English catalog — so assertions run against real
  translated copy and real query caching.
- **MSW node server** (`apps/web/src/tests/msw/server.ts`) is started/reset/closed by the web Vitest
  setup file. Default handlers live in `apps/web/src/tests/msw/handlers/` and mirror the BFF gateway
  paths that `httpClient` + `buildGatewayPath` produce
  (`apps/web/src/shared/api/api-routes.constants.ts`).

## Steps

1. **Create the spec** at `apps/web/src/tests/integration/<feature>.integration.test.tsx`. The
   subject is a container from a module's public surface (e.g. `MatchResultsContainer` from
   `@/modules/game`) — never a bare component with hand-fed props (that proves nothing about
   wiring).
2. **Arrange the network with MSW.** Use the default happy-path handlers; override per test with
   `server.use(...)` for error/empty variants:

   ```ts
   server.use(
     http.get(buildGatewayPath(GAME_ENDPOINTS.matches), () =>
       HttpResponse.json({ message: 'boom' }, { status: 500 }),
     ),
   );
   ```

   Never mock module services or hooks — the point is exercising
   gateway → service → mapper → query → hook → container as one path.

3. **Assert the loading → ready transition.** Containers like
   `apps/web/src/modules/game/containers/match-results.container.tsx` switch across
   loading/error/empty/ready states. Assert the sequence, not just the end state:

   ```ts
   renderWithProviders(<MatchResultsContainer />);

   expect(screen.getByTestId(TEST_IDS.matchesLoading)).toBeInTheDocument();
   expect(await screen.findByTestId(TEST_IDS.matchesList)).toBeInTheDocument();
   ```

   Use `findBy*` (not manual `waitFor` + `getBy*`) for the async settle. Selectors are `TEST_IDS`
   constants and accessible queries (`getByRole`, `getByLabelText`) — never CSS classes.

4. **Interact with `@testing-library/user-event`,** not `fireEvent`: `await user.click(...)`,
   `await user.type(...)`. For the upload form, follow the game reference: submit with consent
   unchecked and assert the translated validation copy from `en.json` appears in the `role="alert"`
   error region; drive the mock gateway's rejection sentinel and assert the generic error id shows
   ([skills/add-form.md](./add-form.md)).
5. **Assert user-visible outcomes only:** rendered copy, testid presence, disabled states, toast
   text. Never assert hook internals, query cache contents, or store state directly — if an outcome
   matters, it is visible.
6. **Cover the four states** for every list/detail container: loading, error (with retry working —
   click retry, override the handler back to success, assert ready), empty, ready.
7. **Run** `npm run test:coverage`; these specs count toward the 95% gate. Playwright-only
   directories (`apps/web/src/tests/e2e`, `accessibility`, `visual`) are excluded from Vitest — keep
   integration specs out of those folders.

## Definition of done

- Container rendered via `renderWithProviders`; network shaped only by MSW handlers.
- Loading → ready (and error → retry → ready) transitions asserted with `TEST_IDS` and real
  translated copy; interactions via `user-event`.

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global
npm run build               # next build
npm run quality:dead-code   # knip — no orphaned handlers/factories
npm run quality:circular    # madge — no import cycles
```
