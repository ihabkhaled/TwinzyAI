# Frontend Test Data and Fixtures (`apps/web`)

Test data in the Twinzy frontend has exactly three sources. Anything else — an object literal typed
inline in a spec, a hardcoded id, a copy-pasted response body — is a violation.

## 1. Factories: `apps/web/src/tests/factories`

Factories build **domain-shaped** objects (post-mapper, camelCase) for unit and integration tests.
One factory file per domain type, exporting a `build*` function that returns a valid default and
accepts a partial override:

```ts
const match = buildMatch({ confidence: 0.42, isSafe: true });
```

Rules:

- Defaults are always valid against the module's Zod schema (e.g.
  `apps/web/src/modules/<feature>/schemas/<feature>.schema.ts`). A factory that emits invalid data by
  default poisons every consumer.
- Overrides express only what the test cares about. A test that overrides five fields to set up one
  assertion is testing at the wrong layer.
- Factories never generate random data (no faker-style randomness) — a failing test MUST reproduce
  identically on re-run. Distinct ids come from explicit suffixes, using `buildIndexedTestId`
  (`apps/web/src/shared/testing`) when the id feeds a testid.
- Wire-shaped (snake_case) builders exist only for mapper tests and MSW handlers; they mirror the
  `*.api.types.ts` contracts (e.g. `apps/web/src/modules/<feature>/api/<feature>.api.types.ts`).
- Trait/match fixtures are **text only**. There is no image byte fixture, because Twinzy never
  persists or re-renders an uploaded image; upload specs construct a synthetic in-memory `File` at
  the point of use and never store it.

## 2. Module mock fixtures: the gateway's data

Each feature module owns its demo backend data in `api/*.mock.ts` —
`apps/web/src/modules/<feature>/api/<feature>.mock.ts` exports the list/detail mock responses and the
negative-path sentinels (e.g. a consent-missing or oversize-file upload rejection, and an
AI-safety-filtered "no safe match" response). These fixtures are served by the BFF gateway
(`/api/gateway/[...path]`) when `SERVER_API_MOCKING=enabled`, which is how Playwright suites get
their data ([e2e-testing-standard.md](e2e-testing-standard.md)).

- E2e, a11y, and visual assertions reference this fixture content (a fixed set of matches with
  stable ids, one flagged `isSafe: false`). Change the fixture and the specs that depend on it fail
  in one obvious place — that coupling is intentional.
- Fixture content is **data, not UI copy** — it is exempt from `no-raw-i18n-text` (stated in the
  fixture file header). Do not translate fixtures.
- Fixtures stay deterministic: fixed ISO dates, stable ordering. Any `Date.now()`-based id exists
  for a create/echo flow only; specs assert on the echoed field, not the generated id.

## 3. MSW handlers: the API truth for jsdom tests

`apps/web/src/tests/msw/handlers/` defines the default network behavior for unit/integration runs,
wired through `apps/web/src/tests/msw/server.ts` and the lifecycle in
`apps/web/src/tests/setup/vitest.setup.ts` ([integration-testing-standard.md](integration-testing-standard.md)).
`apps/web/src/tests/msw` is the sole owner of the `msw` package.

- Handlers intercept the same-origin gateway paths produced by `buildGatewayPath`
  (`apps/web/src/shared/api`) and respond with the **module mock fixtures** — the same data the real
  mocked gateway serves. jsdom tests and Playwright tests therefore see one consistent world.
- Handler responses are wire-shaped (`snake_case`), matching `*.api.types.ts`. If a handler returns
  camelCase, it silently bypasses the mapper layer and the test proves nothing.
- Per-test deviations (errors, empty lists, delays) are `server.use(...)` overrides in the spec,
  never edits to the default handlers.
- MSW is test-only. Runtime mocking is the gateway's job, controlled by `SERVER_API_MOCKING`.

## No inline magic data

- No literal ids, dates, or response bodies typed directly into specs. Named constants from
  factories/fixtures document _why_ a value matters — a `UPLOAD_MOCK_REJECTED_NO_CONSENT` sentinel
  reads as a negative-path marker; an inline duplicate reads as noise and drifts.
- Testids come from `TEST_IDS` (`apps/web/src/shared/constants`); routes from `ROUTE_PATHS`; storage
  keys from `STORAGE_KEYS`.
- Expected translated copy in integration tests is read against the real catalogs in
  `apps/web/src/packages/i18n/messages/` — never re-typed by hand.
