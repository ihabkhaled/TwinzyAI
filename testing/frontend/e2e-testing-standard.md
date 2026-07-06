# Frontend End-to-End Testing Standard (`apps/web`)

E2e tests run real browsers against the **production build** of the app. Configuration is
`apps/web/playwright.config.ts`; specs live in `apps/web/src/tests/e2e/` and run with
`npm run test:e2e` (`npm run test:e2e:ui` for the inspector).

## What the config guarantees

From `apps/web/playwright.config.ts` (verified facts, not aspirations):

- **Production server, zero backend.** The `webServer` block runs `npm run build && npm run start`
  (or the dedicated `dev:e2e` server on port `3100`) and injects `SERVER_API_MOCKING: 'enabled'`, so
  the BFF gateway (`/api/gateway/[...path]`) serves module mock fixtures such as
  `apps/web/src/modules/<feature>/api/*.mock.ts`. E2e never depends on the real `apps/api` backend
  being up. `NEXT_PUBLIC_APP_ENV` is `test` and the base URL defaults to `http://localhost:3100` (a
  dedicated port so a developer dev server on 3000 is never mistaken for the server under test;
  override with `PLAYWRIGHT_BASE_URL`).
- **Suffix-routed suites.** `testMatch` is
  `['e2e/**/*.e2e.ts', 'accessibility/**/*.a11y.ts', 'visual/**/*.visual.ts']` under
  `testDir: './src/tests'`. The file suffix decides the suite — a spec named `play.spec.ts` will
  simply never run. Use `*.e2e.ts` for this layer.
- **CI discipline.** `forbidOnly: isCi` makes a committed `.only` fail the pipeline; retries are `2`
  on CI and `0` locally (a locally flaky test must be fixed, not retried).
- **Diagnostics on failure only.** `trace: 'on-first-retry'` and `screenshot: 'only-on-failure'` —
  do not add always-on tracing; it slows the suite and bloats artifacts. The HTML report is written
  with `open: 'never'`.
- **Server reuse locally.** `reuseExistingServer: !isCi` means a running `npm run start` will be
  reused locally; make sure it was started with `SERVER_API_MOCKING=enabled` or your data will not
  match the fixtures.
- The single configured project is Desktop Chrome (`chromium`).

## Selector discipline: TEST_IDS only

- Locate elements via `data-testid` values from `TEST_IDS` (`apps/web/src/shared/constants`):
  `page.getByTestId(TEST_IDS.uploadSubmit)`. Specs import the constant — a raw `'upload-submit'`
  string literal in a spec is a violation, the same rule components follow.
- Repeated elements use `buildIndexedTestId` from `apps/web/src/shared/testing` (e.g.
  `match-card-<id>`), matching what containers render.
- Navigation targets come from `ROUTE_PATHS` (`apps/web/src/shared/constants`):
  `page.goto(ROUTE_PATHS.play)`. No hardcoded path strings.

## Writing rules

- One spec file per user journey (e.g. `play-flow.e2e.ts`, `preferences.e2e.ts`), covering the happy
  path plus the flow's critical negative path — for the play flow, the upload negative-path sentinel
  (consent missing / oversize / bad MIME) drives the visible upload-error state, and an
  AI-safety-filtered fixture drives the safe "no match" state.
- Assert user-visible outcomes: URL changes, rendered translated copy, toast content — never network
  internals or client state.
- Waiting uses Playwright's web-first assertions (`await expect(locator).toBeVisible()`);
  `page.waitForTimeout` is banned.
- Fixture data referenced in assertions comes from the module mocks
  ([test-data-and-fixtures.md](test-data-and-fixtures.md)), so a fixture change fails loudly in
  exactly one place.
- Privacy: e2e uploads use a synthetic in-memory file; specs assert the traits/matches UI, never
  that an image was stored — Twinzy never persists the image.
- Edge cases already proven at unit/integration level are not repeated here — see
  [testing-strategy.md](testing-strategy.md).

## CI

The e2e suite runs in the frontend CI workflow and blocks merge ([quality-gates.md](quality-gates.md)).
Authoring steps: [skills/write-e2e-tests.md](../../skills/write-e2e-tests.md).
