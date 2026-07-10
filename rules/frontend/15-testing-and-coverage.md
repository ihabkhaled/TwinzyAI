# 15 — Testing and Coverage

Testing here is TDD-shaped and gate-enforced. The full standards live under
[testing/frontend/](../../testing/frontend/); this rule is the normative summary every `apps/web` PR is
held to.

## TDD flow

1. Write or extend the failing test first (unit for the layer you are changing; integration for a user
   flow).
2. Implement the minimum code to pass.
3. Refactor with the tests green; run `npm run test:coverage` before pushing (the `.husky/pre-push`
   hook runs typecheck + tests regardless).

Skills: [skills/write-unit-tests.md](../../skills/write-unit-tests.md),
[skills/write-integration-tests.md](../../skills/write-integration-tests.md),
[skills/write-e2e-tests.md](../../skills/write-e2e-tests.md).

## Test category matrix

| Category      | Location                                | Runner                         | Script                        |
| ------------- | --------------------------------------- | ------------------------------ | ----------------------------- |
| Unit          | `apps/web/src/modules/<feature>/test/`  | Vitest (jsdom, `web-unit`)     | `npm run test:unit`           |
| Integration   | module `test/` / `apps/web/src/tests/`  | Vitest + Testing Library       | `npm run test:unit`           |
| E2E           | `apps/web/e2e/*.spec.ts`                | Playwright                     | `npm run test:e2e`            |
| Accessibility | `apps/web/e2e/*.a11y.spec.ts`           | Playwright + axe               | `npm run test:a11y`           |
| Visual        | `apps/web/e2e/*.visual.spec.ts`         | Playwright screenshots         | `npm run test:visual`         |

Setup: `apps/web/src/tests/setup.ts` (jest-dom + browser polyfills).
Provider-aware rendering uses `apps/web/src/tests/helpers/render-with-providers.tsx`.

## Coverage thresholds (enforced in vitest.config.mts)

[vitest.config.mts](../../vitest.config.mts) enforces the root full-stack logic allowlist:

- **95%** lines / statements / functions and **90%** branches.
- Web helpers, mappers, services, gateways, schemas, critical hooks/store, and browser/storage
  wrappers are included alongside API/shared logic.

Thresholds MUST never be lowered to make a PR pass. Full policy:
[testing/frontend/coverage-policy.md](../../testing/frontend/coverage-policy.md).

## Mock the owned boundary

Gateway tests fake the owned `@/packages/axios` transport; service tests fake gateways; hook tests
fake query/service seams. Playwright uses `page.route` against the same-origin test API. Never mock
the transformation or validation logic being proved. Fixtures policy:
[testing/frontend/test-data-and-fixtures.md](../../testing/frontend/test-data-and-fixtures.md).

## Anti-patterns (each one blocks review)

- **No `.only` and no skipped required tests.** CI runs full suites only.
- **No snapshot-only component tests.** Snapshots may complement, never replace, behavioral assertions.
  Visual regressions belong in the Playwright visual suite
  ([testing/frontend/visual-testing-standard.md](../../testing/frontend/visual-testing-standard.md)).
- **No implementation-detail tests.** Component and container tests assert what the user sees and does
  (roles, accessible names, `TEST_IDS`) — never internal state, hook call counts, or private function
  spies.
- **No testing library internals.** Package wrappers are tested through their public exports; the vendor
  underneath is not re-tested.
- **No shared mutable fixtures.** Test data comes from factories in `apps/web/src/tests/factories/`.

## Gates

`npm run test:coverage` runs in CI and via `.husky/pre-push`; Playwright suites run through
`npm run test:e2e`. See [19-release-gates.md](19-release-gates.md) and
[testing/frontend/quality-gates.md](../../testing/frontend/quality-gates.md).
