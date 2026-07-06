# Skill: Write Unit Tests (Frontend)

Unit tests cover a single file's contract in isolation with Vitest (jsdom environment; import
`describe/it/expect` from `vitest`). Standard:
[testing/unit-testing-standard.md](../testing/unit-testing-standard.md); policy:
[rules/frontend/15-testing-and-coverage.md](../rules/frontend/15-testing-and-coverage.md).

> The backend unit-test playbook is [write-unit-tests.md](./write-unit-tests.md). This one is for
> `apps/web` (the `web-unit` Vitest project).

## What MUST be unit tested

- **Pure logic at 100% coverage** — the web coverage config enforces 100%
  lines/statements/functions/branches for `apps/web/src/**/{utils,helpers,mappers,schemas}/**/*.ts`
  and `apps/web/src/**/queries/*query-keys*.ts`. That means: mappers
  (`apps/web/src/modules/game/mappers/match-result.mapper.ts`), display helpers
  (`apps/web/src/modules/game/helpers/match-display.helper.ts`), utils, Zod schemas
  (`apps/web/src/modules/game/schemas/upload-form.schema.ts`), and query-key builders
  (`apps/web/src/modules/game/queries/game-query-keys.ts`).
- **Services and gateways** (React-free): request shaping, response validation, error
  normalization to `HttpError`/`AppError`.
- **Package wrapper logic** under `apps/web/src/packages/**` (inside the 95% global gate).
- Shared helpers like `buildPageTitle`, `buildIndexedTestId`, `isSafeExternalUrl`,
  `mapErrorToMessageKey`.

Do NOT unit-test JSX-only `*.component.tsx` files for internals — component behavior is asserted
user-visibly at the integration level
([skills/write-integration-tests-frontend.md](./write-integration-tests-frontend.md)).

## Steps

1. **Locate the test file.** Module unit tests live in `apps/web/src/modules/<feature>/test/`,
   named after the subject: `match-result.mapper.test.ts`. Shared/package tests follow the same
   `*.test.ts` convention.
2. **Setup is global.** The web Vitest setup file already loads jest-dom, starts the MSW node
   server, and mocks `server-only` — do not repeat this per file.
3. **Test the contract, not the implementation.** One `describe` per export. Example contract for
   `mapMatchResultApiItem`: snake_case wire fields (`vibe_label`, `confidence_score`) map to
   camelCase domain fields — assert the full output object.
4. **Prefer table-driven cases** for pure functions and schemas:

   ```ts
   it.each([
     { input: {}, expectedKey: GAME_VALIDATION_MESSAGE_KEYS.consentRequired },
     { input: { consentGiven: true }, expectedKey: GAME_VALIDATION_MESSAGE_KEYS.photoRequired },
   ])('rejects $input with $expectedKey', ({ input, expectedKey }) => {
     const result = uploadFormSchema.safeParse(input);

     expect(result.success).toBe(false);
   });
   ```

   Schemas that embed i18n keys are asserted against the `*_MESSAGE_KEYS` constants, never against
   literal key strings.

5. **Cover every branch.** 100% branch coverage on pure logic means: empty input, boundary values
   (e.g. `MAX_UPLOAD_BYTES` exactly), each enum-object member (use `assertNever`-guarded switches to
   make this mechanical), and error paths.
6. **Use factories, not inline fixtures,** for domain objects — see
   [testing/test-data-and-fixtures.md](../testing/test-data-and-fixtures.md) and the factories under
   `apps/web/src/tests/factories/`.
7. **Run the gates.** `npm run test:coverage` before pushing — the thresholds (95% global, 100%
   pure-logic) fail the build. No `.only`, no skipped tests without a documented, approved waiver.

## Definition of done

- Every exported pure function has table-driven cases covering all branches.
- `npm run test:coverage` passes both threshold tiers; no `.only`/`.skip` left behind.

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global, 100% pure-logic layers
npm run build               # next build
npm run quality:dead-code   # knip — no orphaned test helpers
npm run quality:circular    # madge — no import cycles
```
