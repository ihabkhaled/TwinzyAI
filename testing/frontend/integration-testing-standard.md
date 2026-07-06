# Frontend Integration Testing Standard (`apps/web`)

Integration tests prove a feature slice end-to-end inside jsdom: container → hooks → queries →
`httpClient` → MSW-intercepted gateway response → rendered outcome. They live in
`apps/web/src/tests/integration/` and run in the same Vitest pass as unit tests (`npm run test`).

## The `renderWithProviders` contract

Every integration test mounts through `renderWithProviders` from
`apps/web/src/tests/helpers/render-with-providers.tsx`. It is the single owner of the provider stack
a container needs in tests:

- **Query provider** — a fresh, test-scoped TanStack Query client per test (retries disabled so
  error states surface immediately, no cache bleed between tests), wrapped exactly like the app wraps
  `AppQueryProvider` from `apps/web/src/packages/query`.
- **Intl provider** — `AppIntlProvider` from `apps/web/src/packages/i18n` loaded with the real
  message catalogs (`apps/web/src/packages/i18n/messages/en.json` by default; pass a locale option
  for `ar`). Tests assert real translated copy, never message keys.

Rules:

- MUST use `renderWithProviders` — never hand-roll a `QueryClientProvider` or intl wrapper in a
  spec. If a test needs a provider the helper does not supply, extend the helper.
- MUST NOT share a query client across tests. The helper creates one per call; do not hoist it.
- Assertions target user-visible output: rendered text, roles, and `data-testid` values from
  `TEST_IDS` (`apps/web/src/shared/constants`), e.g. the error and empty states of the play-flow
  container's state machine.

## MSW server lifecycle

The lifecycle is owned by the global setup file `apps/web/src/tests/setup/vitest.setup.ts`
(registered in the Vitest config via `setupFiles`). It:

1. Loads `@testing-library/jest-dom` matchers.
2. Mocks the `server-only` marker so server-guarded modules can be imported in jsdom.
3. Starts the MSW node server from `apps/web/src/tests/msw/server.ts` before the suite
   (`onUnhandledRequest: 'error'` — any request without a handler fails the test), resets handlers
   after each test, and closes the server after the suite.

Consequences for spec authors:

- Never call `server.listen()` / `server.close()` in a spec — the setup file already did.
- Default handlers in `apps/web/src/tests/msw/handlers/` are the API truth
  ([test-data-and-fixtures.md](test-data-and-fixtures.md)). Handlers intercept the same-origin
  gateway paths built by `buildGatewayPath` (`/api/gateway/...`) because client code never calls any
  other host.
- Per-test overrides use `server.use(...)` inside the test body — for example swapping the match
  handler for a 500 response to drive the container's error state, then asserting the retry button
  re-fetches. `afterEach` reset makes the override vanish automatically.

## user-event over fireEvent

Interactions MUST use `@testing-library/user-event`, never `fireEvent`. `userEvent` dispatches the
full browser-realistic event chain (pointer → focus → keyboard → input), which is what our
components actually respond to; `fireEvent` fires one synthetic event and routinely passes tests
that fail for real users. Pattern:

```ts
const user = userEvent.setup();
await user.click(screen.getByTestId(TEST_IDS.uploadConsent));
await user.upload(screen.getByTestId(TEST_IDS.uploadInput), file);
await user.click(screen.getByTestId(TEST_IDS.uploadSubmit));
```

Async outcomes are awaited with `findBy*` queries or `waitFor` — never fixed sleeps.

## Scope discipline

- One spec file per user flow (e.g. the play flow's upload → traits → matches states, including the
  consent-missing and AI-safety-filtered negative paths), not per component.
- Do not re-prove pure-logic edge cases here — they belong in module unit tests
  ([unit-testing-standard.md](unit-testing-standard.md)).
- Privacy: an integration test may exercise an upload with an in-memory `File`, but MUST NOT assert
  the image was stored anywhere — it is wiped after the request by design.
- Authoring steps: [skills/write-integration-tests.md](../../skills/write-integration-tests.md).
