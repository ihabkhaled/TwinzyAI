# Frontend Codebase Navigation

Task → location lookup for the Twinzy frontend (`apps/web`). If the table does not answer your
question, the normative rule in [`rules/frontend/`](../../rules/frontend/) walks the full contract.
Paths below are relative to `apps/web/src` unless stated otherwise. Code paths are shown as inline
code (not links) because feature files are built and owned by the frontend workstream.

## Where do I put X?

| I need to add…                           | Location                                                                                                | Normative rule                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A new page / route                       | `app/(<group>)/<route>/page.tsx`, path constant in `shared/constants/route-paths.constants.ts`          | [`rules/frontend/01-next-app-router-architecture.md`](../../rules/frontend/01-next-app-router-architecture.md) |
| A whole feature                          | `modules/<feature>/` with a public `index.ts`                                                           | [`rules/frontend/01-next-app-router-architecture.md`](../../rules/frontend/01-next-app-router-architecture.md) |
| A presentational piece of UI             | `modules/<f>/components/<name>.component.tsx` (JSX-only)                                                | [`rules/frontend/02-components-and-containers.md`](../../rules/frontend/02-components-and-containers.md) |
| The glue between hooks and components    | `modules/<f>/containers/<name>.container.tsx` (`'use client'` + reason comment)                         | [`rules/frontend/02-components-and-containers.md`](../../rules/frontend/02-components-and-containers.md) |
| Orchestration / view-model building      | `modules/<f>/hooks/use-<name>.hook.ts`                                                                  | [`rules/frontend/03-hooks.md`](../../rules/frontend/03-hooks.md)                                |
| An HTTP call                             | `modules/<f>/gateway/<f>.gateway.ts` (via `httpClient` + `buildGatewayPath`)                            | [`rules/frontend/04-services-api-gateway.md`](../../rules/frontend/04-services-api-gateway.md)  |
| A React-free use case                    | `modules/<f>/services/<f>.service.ts`                                                                   | [`rules/frontend/04-services-api-gateway.md`](../../rules/frontend/04-services-api-gateway.md)  |
| A query / mutation                       | `modules/<f>/queries/*.queries.ts` / `*.mutations.ts`; keys ONLY in the builder file                   | [`rules/frontend/05-tanstack-query.md`](../../rules/frontend/05-tanstack-query.md)              |
| Client global state                      | `modules/<f>/store/<f>.store.ts` via `createAppStore`                                                   | [`rules/frontend/06-zustand.md`](../../rules/frontend/06-zustand.md)                            |
| Validation                               | `modules/<f>/schemas/<f>.schema.ts` (error messages = i18n keys)                                        | [`rules/frontend/07-types-enums-constants.md`](../../rules/frontend/07-types-enums-constants.md) |
| Wire → domain conversion                 | `modules/<f>/mappers/<f>.mapper.ts`                                                                     | [`rules/frontend/08-utils-helpers-mappers.md`](../../rules/frontend/08-utils-helpers-mappers.md) |
| Wire types + mock fixtures               | `modules/<f>/api/` (`*.api.types.ts`, `*.mock.ts`)                                                      | [`rules/frontend/04-services-api-gateway.md`](../../rules/frontend/04-services-api-gateway.md)  |
| User-visible copy                        | Message key constants in `constants/`, catalog entries in `packages/i18n/messages/{en,ar}.json`        | [`rules/frontend/14-i18n-rtl.md`](../../rules/frontend/14-i18n-rtl.md)                          |
| Tailwind class bundles                   | `*.variants.ts` or `constants/<f>-style.constants.ts` — never inline outside the design system         | [`rules/frontend/02-components-and-containers.md`](../../rules/frontend/02-components-and-containers.md) |
| A generic reusable component             | `shared/components/{data-display,feedback,forms,layout,primitives}/`                                    | [`rules/frontend/02-components-and-containers.md`](../../rules/frontend/02-components-and-containers.md) |
| A generic pure function                  | `shared/utils/` or `shared/helpers/`                                                                    | [`rules/frontend/08-utils-helpers-mappers.md`](../../rules/frontend/08-utils-helpers-mappers.md) |
| A new third-party package                | `packages/<vendor>/` owner wrapper + boundary entry                                                    | [`rules/frontend/09-library-wrapping.md`](../../rules/frontend/09-library-wrapping.md)          |
| An environment variable                  | `apps/web/.env.example` + `packages/env` (client) or `packages/env/server`                             | [`rules/frontend/17-configuration-environment.md`](../../rules/frontend/17-configuration-environment.md) |
| Module unit tests                        | `modules/<f>/test/`                                                                                     | [`rules/frontend/15-testing-and-coverage.md`](../../rules/frontend/15-testing-and-coverage.md)  |
| Cross-module / e2e / a11y / visual tests | `tests/{integration,e2e,accessibility,visual}/`                                                        | [`rules/frontend/15-testing-and-coverage.md`](../../rules/frontend/15-testing-and-coverage.md)  |
| An eslint-disable                        | Never inline without a documented, reviewed exception                                                  | [`rules/frontend/10-eslint-typescript.md`](../../rules/frontend/10-eslint-typescript.md)        |

## File suffix conventions

| Suffix                                                                | Layer                 | Contract                                                                                                         |
| --------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `.component.tsx`                                                      | components            | JSX only: no hooks, no logic, no inline declarations, no raw copy, no raw `className` outside the design system. |
| `.container.tsx`                                                      | containers            | `'use client'` + `// client-boundary-reason: …`; connects hooks to components; owns the `.map()`.                |
| `.hook.ts`                                                            | hooks                 | `use*` orchestration; returns a fully-computed view model.                                                       |
| `.service.ts`                                                         | services              | React-free use-case functions.                                                                                   |
| `.gateway.ts`                                                         | gateway               | HTTP contract only: `httpClient`, `buildGatewayPath`, schema parse.                                              |
| `.queries.ts` / `.mutations.ts` / `-query-keys.ts` / `.invalidate.ts` | queries               | Cache bindings; keys only from the builder file.                                                                 |
| `.store.ts` / `.selectors.ts`                                         | store                 | `createAppStore` state + pure selectors.                                                                         |
| `.schema.ts`                                                          | schemas               | Zod via `@/packages/zod`; messages are i18n keys.                                                                |
| `.mapper.ts`                                                          | mappers               | Wire snake_case → domain camelCase.                                                                              |
| `.api.types.ts` / `.mock.ts`                                          | api                   | Wire types and gateway mock fixtures.                                                                            |
| `.variants.ts`                                                        | design system         | cva class bundles consumed by components.                                                                        |
| `.util.ts` / `.helper.ts`                                             | utils/helpers         | Pure functions; 100% coverage required.                                                                          |
| `.types.ts` / `.enum.ts` / `.constants.ts`                            | types/enums/constants | Types, as-const enum-like objects, frozen constants.                                                             |
| `.test.ts(x)` / `.e2e.ts` / `.a11y.ts` / `.visual.ts`                 | tests                 | Vitest / Playwright e2e / axe / visual suites.                                                                   |

## Path aliases

Declared in `apps/web/tsconfig.json`; Vitest resolves them via `vite-tsconfig-paths`.

| Alias         | Resolves to        | Typical use                                                                                        |
| ------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| `@/*`         | `./src/*`          | General absolute imports (`@/packages/zod`, `@/shared/constants/...`).                             |
| `@app/*`      | `./src/app/*`      | Rarely needed — only app-internal wiring.                                                          |
| `@modules/*`  | `./src/modules/*`  | Cross-module imports of a public surface (`@/modules/<feature>` form is equivalent and preferred). |
| `@shared/*`   | `./src/shared/*`   | Shared building blocks.                                                                            |
| `@packages/*` | `./src/packages/*` | Owner wrapper facades.                                                                            |
| `@tests/*`    | `./src/tests/*`    | Test helpers, MSW handlers, factories.                                                             |

Deep imports into another module's internals (anything past `@/modules/<feature>`) are blocked by
the frontend architecture rule `no-cross-module-deep-imports` — the only legal cross-module entry
point is a module's `index.ts` public surface. See
[`rules/frontend/01-next-app-router-architecture.md`](../../rules/frontend/01-next-app-router-architecture.md).

## Relationship to the backend track

The backend NestJS engineering OS lives in the repository-root flat [`context/`](../) and
[`memory/`](../../memory/) folders and in the root [`rules/`](../../rules/) (00–27). This frontend
track (`context/frontend/`, `memory/frontend/`, `rules/frontend/`) is parallel and independent. The
frontend calls the backend only through the same-origin BFF gateway (`app/api/gateway/[...path]/`),
which either serves mock fixtures or proxies to `apps/api`. Neither track imports the other's code.
