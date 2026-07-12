---
id: summary-testing
title: Testing Summary — Projects, E2E, Coverage, Commands, Fixtures
type: summary
authority: canonical
status: current
owner: repository owner
generated: false
summary: Routing digest of the test system — Vitest multi-project layout, Playwright e2e, the 95/90/95/95 coverage gate, canonical commands, and where fixtures live.
keywords: [testing, vitest, playwright, coverage, e2e, fixtures, integration tests, a11y, visual, tdd, commands]
contextTier: 1
relatedCode: [apps/api/src/bootstrap/create-test-app.ts, apps/api/src/tests/fixtures/fake-ai-adapter.ts, apps/web/src/tests/setup.ts, apps/web/playwright.config.ts]
relatedTests: [apps/api/src/tests/game-analyze.integration.test.ts, packages/shared/tests/schemas.test.ts]
relatedDocs: [testing/README.md, testing/frontend/README.md, rules/09-testing-coverage.md, docs/testing-strategy.md, TEST_CASES.md]
readWhen: You are writing or running tests, checking coverage gates, or looking for the right fixture/helper.
---

# Testing Summary — Projects, E2E, Coverage, Commands, Fixtures

TDD is the default; bug fixes ship a reproducing regression test (`rules/09-testing-coverage.md`). Runner: **Vitest 4 multi-project + Playwright — never Jest, never `*.spec.ts`** (naming `*.test.ts` / `*.integration.test.ts`; misnamed files silently never run — `memory/known-pitfalls.md`).

## Vitest projects (root `vitest.config.mts`)

| Project | Scope | Notes |
| --- | --- | --- |
| `shared-unit` | `packages/shared/tests/` | contract/schema/util suites |
| `api-unit` | `apps/api/src/modules/*/tests/`, config/bootstrap/core tests | SWC transform (`unplugin-swc`) for decorator metadata |
| `api-integration` | `apps/api/src/tests/*.integration.test.ts` (9 suites) | boots production wiring via `createTestApp` + supertest |
| `web-unit` | `apps/web/src/**/*.test.{ts,tsx}` | jsdom, setup `apps/web/src/tests/setup.ts`, alias `@ → apps/web/src` |
| `lint-rules` | custom ESLint plugin tests | per `rules/09` |

Prerequisite: `npm run build:shared` (stale `packages/shared/dist` breaks lint/tests). Web-unit env pins `PAYPAL_CLIENT_ID/SECRET` empty so the paywall is deterministically off.

## Integration harness (backend)

`Test.createTestingModule({ imports: [AppModule] })` + override `AI_PROVIDER_ADAPTER` → `FakeAiAdapter` and `ClamAvAdapter` → always-clean stub, then `createTestApp(moduleRef)` (`apps/api/src/bootstrap/create-test-app.ts`) — production security/validation/lifecycle wiring on the real Fastify adapter. Providers are always mocked; no real network in CI.

## E2E (Playwright, `apps/web/e2e/`)

Projects: `chromium`, `a11y` (`*.a11y.spec.ts`, @axe-core/playwright — any violation fails), `visual` (`*.visual.spec.ts` + snapshots), `mobile-chromium` (Pixel 5), `mobile-webkit` (iPhone 13). Backend mocked via `page.route` with contract-valid fixtures built from `@twinzy/shared` (`e2e/helpers.ts`). webServer: `next dev` on port 3100, `NEXT_PUBLIC_PAYPAL_CLIENT_ID=''` — **paywall pinned OFF for the whole suite**; donate handle `twinzye2e`. Specs cover game flow, cancel, error states, streaming, translate, privacy, result count, share flow, donations, paywall-off, mobile theme, PWA a11y, visual.

## Coverage gate

**95 statements / 90 branches / 95 functions / 95 lines** on touched/gated scope, enforced by `npm run test:coverage` + Husky pre-push + CI (`.github/workflows/gate-coverage.yml`). Branch floor is 90 only because of SWC decorator synthetic branches. Frontend additionally targets 100% for utils/helpers/mappers/schemas/query-key builders (`testing/frontend/coverage-policy.md`). Thresholds are never lowered; no `.only`/skips; no snapshot-only tests.

## Commands

`npm run test:unit` · `npm run test:coverage` · `npm run test:e2e` (+ `test:e2e:ci`, `test:a11y`, `test:visual`) · focused suites `npm run test:file-security` / `test:ai` / `test:security` (safety-critical routing per `skills/secure-file-upload.md`) · `npm run ai:benchmark` (mock default). Full gate chain: lint 0/0 → typecheck (api via tsgo) → test:unit → test:coverage → build → security:scan (`docs/sdlc/README.md`).

## Fixtures — where they live

- Backend: `apps/api/src/tests/fixtures/` — `fake-ai-adapter.ts` (queued responses; records per-step calls to PROVE the image never reaches text-only steps), `image-fixtures.ts` (byte-level minimal JPEG/PNG/WebP + corrupt builders), `stubs.ts` (logger/ClamAV/full AppConfigService double with paywall off).
- Shared: `packages/shared/tests/fixtures/advanced-fixtures.ts` — deterministic written-traits-v5 builders generated from `TRAIT_CATEGORY_FIELDS` (taxonomy change updates every test).
- Web: `apps/web/src/modules/game/test/game-fixtures.ts`, `apps/web/src/tests/helpers/render-with-providers.tsx` (fresh QueryClient + English i18n).
- Unit test location convention: backend `modules/<module>/tests/`; web module tests in `modules/<feature>/test/`.

## Behavior matrix and standards

`TEST_CASES.md` (root) is the living behavior matrix — every numbered case maps to at least one automated test (file-security cases 1–16, shared contract cases). Standards corpus: `testing/` (8 backend docs) + `testing/frontend/` (9 docs). Note: `TEST_CASES.md` references promptVersion `advanced-global-traits-v3` while the shipped literal is `written-traits-v5` — a recorded staleness signal (`knowledge/summaries/current-risks.md`).
