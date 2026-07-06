# Skill: Create a Feature Module (Frontend)

Scaffold a new frontend feature under `apps/web/src/modules/<feature>/` with the same anatomy as
the flagship `apps/web/src/modules/game/` module. A module is the only unit of feature code on the
web side — never put feature logic in `apps/web/src/app/` (routes only) or `apps/web/src/shared/`
(generic building blocks only).

> Backend module scaffolding is a different skill — see [create-module.md](./create-module.md).
> This one is the Next.js frontend playbook.

## Read first

- [rules/frontend/01-next-app-router-architecture.md](../rules/frontend/01-next-app-router-architecture.md)
- [rules/frontend/00-non-negotiable-rules.md](../rules/frontend/00-non-negotiable-rules.md)
- [context/frontend/reference-patterns.md](../context/frontend/reference-patterns.md)

## Step 0 — Test plan first (TDD)

Before creating any file, write the test plan: which behaviors the module must exhibit, which
layers get unit tests in `apps/web/src/modules/<feature>/test/`, which flows get integration tests
in `apps/web/src/tests/integration/`, and which user journeys get e2e specs in
`apps/web/src/tests/e2e/`. Follow [testing/testing-strategy.md](../testing/testing-strategy.md).
Write failing tests alongside each layer as you build it — never after the fact.

## Steps

1. Pick a kebab-case feature name and create `apps/web/src/modules/<feature>/`.
2. Create only the layers the feature needs, using the naming from `game`:

   | Layer                 | File pattern                                                                                           | Reference                                                        |
   | --------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
   | `types/`              | `<feature>.types.ts`                                                                                   | `apps/web/src/modules/game/types/game.types.ts`                  |
   | `enums/`              | `<name>.enum.ts` (as-const object — the TS `enum` keyword is banned repo-wide)                         | `apps/web/src/modules/game/enums/match-status.enum.ts`           |
   | `constants/`          | `<feature>.constants.ts`, `<feature>-message-keys.constants.ts`, `<feature>-style.constants.ts`        | `apps/web/src/modules/game/constants/`                           |
   | `api/`                | `<feature>.api.types.ts` (wire snake_case), `<feature>.mock.ts`                                        | `apps/web/src/modules/game/api/`                                 |
   | `schemas/`            | `<feature>.schema.ts` (Zod via `@/packages/zod`)                                                       | `apps/web/src/modules/game/schemas/match-result.schema.ts`       |
   | `gateway/`            | `<feature>.gateway.ts` (httpClient + `buildGatewayPath` + `parseSchema`)                               | `apps/web/src/modules/game/gateway/game.gateway.ts`              |
   | `mappers/`            | `<feature>.mapper.ts` (wire → domain camelCase)                                                        | `apps/web/src/modules/game/mappers/match-result.mapper.ts`       |
   | `services/`           | `<feature>.service.ts` (React-free use-cases)                                                          | `apps/web/src/modules/game/services/game.service.ts`             |
   | `queries/`            | `<feature>-query-keys.ts`, `<feature>.queries.ts`, `<feature>.mutations.ts`, `<feature>.invalidate.ts` | `apps/web/src/modules/game/queries/`                             |
   | `store/`              | `<feature>.store.ts`, `<feature>.selectors.ts` (only for true client global state)                     | `apps/web/src/modules/ui-preferences/store/`                     |
   | `hooks/`              | `use-<name>.hook.ts` (view models)                                                                     | `apps/web/src/modules/game/hooks/use-match-results.hook.ts`      |
   | `components/`         | `<name>.component.tsx` (JSX-only)                                                                      | `apps/web/src/modules/game/components/`                          |
   | `containers/`         | `<name>.container.tsx` (`'use client'` + reason)                                                       | `apps/web/src/modules/game/containers/`                          |
   | `utils/` / `helpers/` | `<name>.utils.ts`, `<name>.helper.ts` (pure)                                                           | `apps/web/src/modules/game/utils/`, `helpers/`                   |
   | `test/`               | unit tests colocated per module                                                                        | `apps/web/src/modules/<feature>/test/`                           |

3. Build bottom-up in this order so each layer only depends on layers below it:
   types → enums/constants → api types + schemas → gateway → mapper → service → query keys →
   queries/mutations → store → hooks → components → container. The layer import policy is
   enforced by `no-restricted-layer-imports` (table in
   [eslint/architecture.config.mjs](../eslint/architecture.config.mjs)).
4. Create `apps/web/src/modules/<feature>/index.ts` as the public surface. Export only what other
   modules or `apps/web/src/app/` genuinely need (container, query keys/options, domain types,
   mock builders for the gateway). Model it on `apps/web/src/modules/game/index.ts`. Everything not
   exported is private; deep imports are blocked by `no-cross-module-deep-imports`.
5. Add message keys to `apps/web/src/packages/i18n/messages/en.json` **and** `ar.json` under a new
   namespace, register the namespace in `apps/web/src/shared/i18n/i18n-namespaces.constants.ts`,
   and mirror the keys in `constants/<feature>-message-keys.constants.ts`
   ([skills/add-i18n-message-key.md](./add-i18n-message-key.md)).
6. Wire the module into a route: add a page under `apps/web/src/app/` per
   [skills/add-route.md](./add-route.md), add the path to
   `apps/web/src/shared/constants/route-paths.constants.ts`, and render the container the way
   `apps/web/src/app/(game)/game/page.tsx` renders `GameContainer` from `@/modules/game`.
7. If the module talks to the backend, add mock fixtures in `api/<feature>.mock.ts`, export the
   builders from `index.ts`, and register the paths in
   `apps/web/src/app/api/gateway/[...path]/gateway-handler.ts` (`respondFromMock`) so the app keeps
   running with `SERVER_API_MOCKING=enabled` and no backend. Add matching MSW handlers in
   `apps/web/src/tests/msw/handlers/` for tests.
8. Add test ids to `apps/web/src/shared/constants/test-ids.constants.ts` and finish the tests from
   Step 0.

## Twinzy product guardrails

- The game is free — never scaffold payment, subscription, or monetization state.
- No identity/auth: there is no login module. Do not add token storage or an auth store.
- Uploaded images are never persisted client-side; the module holds a `File`/`Blob` only for the
  in-flight submission and drops it after the mutation settles.

## Forbidden shortcuts

- Never import a vendor package directly — go through the owner in `apps/web/src/packages/`
  (`no-raw-package-imports`, ownership map in
  [eslint/package-boundaries.config.mjs](../eslint/package-boundaries.config.mjs)).
- Never deep-import another module (`@/modules/game/services/...`) — only `@/modules/game`.
- Never inline query keys, raw copy, raw `className` strings, or `process.env` reads.
- Never start with the UI and "add the service later" — the bottom-up order is mandatory.
- Never skip the `ar.json` catalog or the mock fixtures "for now".

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings
npm run typecheck           # tsgo, strict — no `any`, no unchecked casts
npm run test:coverage       # Vitest — 95% global, 100% pure layers
npm run build               # next build (typedRoutes + env validation)
npm run quality:dead-code   # knip — no orphaned exports/files
npm run quality:circular    # madge — no import cycles
npm run test:e2e            # relevant Playwright suite (+ test:a11y / test:visual when UI changed)
```

## Definition of done

- All layers present are wired bottom-up; `index.ts` is the only cross-module entry point.
- Route renders the container; the flow works end-to-end against gateway mocks.
- en + ar messages exist; unit + integration tests pass; coverage thresholds hold
  (95% global, 100% for utils/helpers/mappers/schemas/query keys — see
  [testing/coverage-policy.md](../testing/coverage-policy.md)).
- The full gate above passes with zero warnings and no new ESLint exceptions.
