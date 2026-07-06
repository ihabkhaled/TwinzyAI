# Skill: Write E2E Tests (Frontend)

E2e specs drive the real built app in Chromium via Playwright. They live in
`apps/web/src/tests/e2e/` with the `.e2e.ts` suffix — `apps/web/playwright.config.ts` matches
`e2e/**/*.e2e.ts` and Vitest excludes the directory, so the suffix is load-bearing. Standard:
[testing/e2e-testing-standard.md](../testing/e2e-testing-standard.md).

> The backend/full-stack e2e context lives in [write-e2e-tests.md](./write-e2e-tests.md). This one
> is the `apps/web` Playwright playbook (`npm run test:e2e`).

## How the app runs

The `webServer` block in `apps/web/playwright.config.ts` builds and starts the app with
`SERVER_API_MOCKING: 'enabled'`, so the BFF gateway (`/api/gateway/[...path]` → `gateway-handler.ts`)
serves the module mock fixtures (`apps/web/src/modules/game/api/game.mock.ts`) and no backend is
needed. Specs MUST NOT stub the network with `page.route` — the mock gateway is the contract.
`forbidOnly` is on in CI and retries are configured there; locally the server is reused between runs.

## Steps

1. **Create the spec** at `apps/web/src/tests/e2e/<flow>.e2e.ts`, one file per user flow (e.g.
   `upload.e2e.ts`, `results.e2e.ts`).
2. **Navigate by route constant semantics.** Go to the path documented in
   `apps/web/src/shared/constants/route-paths.constants.ts` (`/`, `/game`, `/privacy`, `/terms`,
   `/help`) and assert the tab title matches the `buildPageTitle` format ("Section · Twinzy").
3. **Select with `getByTestId` backed by `TEST_IDS`.** Every selector is a constant from
   `apps/web/src/shared/constants/test-ids.constants.ts` — import it, never inline the string:

   ```ts
   import { TEST_IDS } from '@/shared/constants/test-ids.constants';

   await page.getByTestId(TEST_IDS.uploadConsent).check();
   await page.getByTestId(TEST_IDS.uploadInput).setInputFiles('tests/fixtures/sample.jpg');
   await page.getByTestId(TEST_IDS.uploadSubmit).click();
   ```

   Repeated rows use ids derived with `buildIndexedTestId`
   (`apps/web/src/shared/testing/test-id.helper.ts`). Role/label queries are fine for assertions on
   copy; CSS/XPath selectors are forbidden.

4. **Write the happy path AND the negative path.** Every flow needs both. The upload reference: a
   valid consented submission returns matches against the mock gateway; a rejection sentinel in
   `apps/web/src/modules/game/api/game.mock.ts` forces the failure branch — assert the error
   `TEST_IDS` element becomes visible and the user stays on `/game`. New features MUST ship an
   equivalent sentinel in their mock fixtures so e2e can exercise errors deterministically.
5. **Use web-first assertions** (`await expect(locator).toBeVisible()`, `toHaveURL`, `toHaveTitle`)
   and never `waitForTimeout`. Playwright's auto-waiting plus the mock gateway makes every wait
   condition expressible as an assertion.
6. **Keep specs independent.** No shared state between tests; each test starts from `page.goto`.
   There is no session/login — a fresh context is a fresh anonymous player.
7. **Run** `npm run test:e2e`. The full gate is part of `npm run validate`-equivalent and the e2e CI
   job. No `.only` (CI `forbidOnly` fails the run) and no skipped tests without a documented,
   approved waiver.

## Definition of done

- `.e2e.ts` spec in `apps/web/src/tests/e2e/` with happy + negative paths.
- All selectors from `TEST_IDS`; no network stubbing; no timeouts; `npm run test:e2e` green against
  the mock-mode gateway.

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings
npm run typecheck           # tsgo, strict
npm run build               # next build — Playwright builds/starts the app itself
npm run test:e2e            # Playwright e2e (happy + negative) against the mock gateway
```
