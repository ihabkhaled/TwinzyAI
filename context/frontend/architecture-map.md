# Frontend Architecture Map

The canonical map of the Twinzy frontend operating system, installed under `apps/web/src`.
This is a **second, parallel track** to the backend OS in the repository root: the flat
`context/` and `memory/` folders describe the NestJS backend (`apps/api`); this `context/frontend/`
track describes the Next.js frontend (`apps/web`). The layer policy at the bottom is enforced
mechanically by the frontend architecture ESLint rule `no-restricted-layer-imports` — this page is
its human-readable twin. The normative rule is [`rules/frontend/01-next-app-router-architecture.md`](../../rules/frontend/01-next-app-router-architecture.md).

> This map was adapted from the reference frontend OS (a strict Next.js 16 frontend architecture)
> for Twinzy. Directory names below are the target shape; the actual `apps/web` modules are owned
> and built by the frontend workstream.

## Annotated source tree

```
apps/web/src/
├── proxy.ts                     # Next 16 proxy: per-request nonce CSP (script-src 'self' 'nonce-…' 'strict-dynamic')
├── app/                         # Routes, layouts, route handlers ONLY — no business logic
│   ├── (marketing)/             # Public landing / how-to-play / privacy / terms (route group)
│   ├── (game)/play/             # The Twinzy game flow route (upload consent → traits → matches)
│   ├── (settings)/settings/     # Theme / language / direction preferences route
│   ├── (workbench)/workbench/   # Living primitive showcase (adopted instead of Storybook)
│   ├── api/gateway/[...path]/   # BFF gateway route → gateway-handler.ts (mock fixtures or upstream proxy to apps/api)
│   ├── api/health/              # Health route → buildHealthReport service
│   ├── layout.tsx, providers.tsx, error.tsx, global-error.tsx, loading.tsx, not-found.tsx
│   └── styles.css               # Tailwind v4 CSS-first tokens; dark theme via [data-theme='dark']
├── modules/                     # Feature modules — cross-module imports ONLY via @/modules/<feature> (index.ts)
│   ├── <feature>/               # Flagship reference module: full layer anatomy (e.g. match, upload, results)
│   │   ├── api/                 # Wire types (snake_case) + mock fixtures served by the BFF gateway
│   │   ├── gateway/             # HTTP contract layer: httpClient + buildGatewayPath + schema parse
│   │   ├── services/            # React-free use-case functions (gateway → mapper → domain)
│   │   ├── queries/             # Query-key builder, useAppQuery/useAppMutation bindings, invalidation
│   │   ├── store/               # Zustand client-only state via createAppStore (no server data)
│   │   ├── mappers/             # Wire snake_case → domain camelCase
│   │   ├── schemas/             # Zod schemas (wire validation, form validation) — messages are i18n keys
│   │   ├── hooks/               # Orchestration: query + i18n + helpers → view models
│   │   ├── containers/          # 'use client' glue: hooks → components, does the .map()
│   │   ├── components/          # JSX-only *.component.tsx — no hooks, no logic, no raw copy
│   │   ├── helpers/ utils/      # Pure display/logic functions (100% coverage required)
│   │   ├── types/ enums/ constants/  # Domain types, as-const enum-like objects, message keys, style bundles
│   │   ├── test/                # Module unit tests (colocated per module)
│   │   └── index.ts             # Public surface — the only legal cross-module entry point
│   ├── ui-preferences/          # Theme/direction/language store + hydration/persistence/DOM-sync effects
│   └── health/                  # buildHealthReport service behind /api/health
├── shared/                      # Generic building blocks — MUST never import from modules or app
│   ├── accessibility/           # Landmark ids, skip-link helpers
│   ├── api/                     # API_ROUTES, buildGatewayPath (api-routes.constants.ts)
│   ├── components/              # data-display/ feedback/ forms/ layout/ primitives/ types/
│   ├── config/                  # appConfig (app-config.ts)
│   ├── constants/               # ROUTE_PATHS, STORAGE_KEYS, TEST_IDS, FALLBACK_ERROR_COPY
│   ├── enums/                   # AppTheme, AppDirection (as-const objects)
│   ├── errors/                  # AppError + toAppError, ERROR_MESSAGE_KEYS, mapErrorToMessageKey
│   ├── fonts/                   # app-fonts.ts — the only next/font owner
│   ├── helpers/                 # buildPageTitle and friends
│   ├── i18n/                    # I18N_NAMESPACES
│   ├── mappers/                 # mapSchemaIssuesToFieldErrors
│   ├── security/                # isSafeExternalUrl
│   ├── testing/                 # buildIndexedTestId
│   ├── types/ utils/            # Shared types; isDefined, assertNever
├── packages/                    # One owning wrapper per third-party vendor (facades) — bottom of the stack
│   ├── axios/ query/ zustand/ zod/ date/ forms/ i18n/ toast/ icons/
│   ├── ui-primitives/ virtuoso/ link/ image/ navigation/ env/ browser/ storage/ logger/
│   └── (see context/frontend/package-boundaries.md for the full vendor → exports table)
└── tests/                       # Cross-module test infrastructure
    ├── setup/                   # vitest.setup.ts (jest-dom, MSW server, server-only mock)
    ├── msw/                     # MSW node server + handlers (the only MSW owner)
    ├── helpers/                 # render-with-providers.tsx
    ├── unit/ integration/       # Cross-module Vitest suites
    ├── e2e/ accessibility/ visual/  # Playwright *.e2e.ts, *.a11y.ts, *.visual.ts
    └── factories/               # Test data factories
```

## One-way dependency diagram

Arrows mean "may import from". There are no arrows in the other direction — ever.

```
apps/web/src/app (routes/layouts/handlers)
   │
   ▼
apps/web/src/modules/<feature>  (cross-module: only via the other module's index.ts)
   │  containers ──► components            containers ──► hooks
   │  hooks ──► queries ──► services ──► gateway ──► api types
   │  hooks ──► store        mappers/schemas/utils/helpers ──► types/enums/constants only
   ▼
apps/web/src/shared (generic building blocks — knows nothing about modules or app)
   │
   ▼
apps/web/src/packages/<vendor> (owner wrappers — know nothing about shared, modules, or app)
   │
   ▼
node_modules (raw vendors — importable ONLY inside their owner wrapper)
```

## Layer import policy table

This is the policy the frontend architecture ESLint rule `no-restricted-layer-imports` enforces.
"Forbidden imports" means the ESLint rule errors — and lint runs with `--max-warnings=0`.

| From layer                                                           | Forbidden imports                                                                          | Rationale (rule message)                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `module-components`                                                  | module-hooks, module-queries, module-services, module-gateway, module-store, app           | Components receive computed props; behavior lives in containers/hooks.           |
| `module-hooks`                                                       | module-components, module-containers, app                                                  | Hooks orchestrate data and state; they never reach into the view layer.          |
| `module-queries`                                                     | module-components, module-containers, app                                                  | Query files bind services to the cache; they never import view code.             |
| `module-services`                                                    | module-components, module-containers, module-hooks, module-store, module-queries, app      | Services are pure API/use-case functions; React does not exist here.             |
| `module-gateway`                                                     | module-components, module-containers, module-hooks, module-store, module-queries, app      | Gateways speak HTTP contracts only.                                              |
| `module-store`                                                       | module-components, module-containers, module-services, module-queries, module-gateway, app | Stores hold client global state only; server data belongs to the query cache.    |
| `module-containers`                                                  | module-services, module-gateway, app                                                       | Containers consume hooks/queries, never services directly.                       |
| `module-utils`, `module-helpers`, `module-mappers`, `module-schemas` | every module layer except types/enums/constants, plus app                                  | Pure logic layers depend only on types/constants/enums and other pure logic.     |
| `shared`                                                             | every module layer, app                                                                    | Shared code is generic; it must never know about feature modules or routes.      |
| `packages`                                                           | every module layer, shared, app                                                            | Package wrappers own one vendor and expose a facade; they sit below every layer. |

Related reading: [`rules/frontend/01-next-app-router-architecture.md`](../../rules/frontend/01-next-app-router-architecture.md)
(the normative rule), [`context/frontend/package-boundaries.md`](./package-boundaries.md) (vendor
ownership), [`context/frontend/glossary.md`](./glossary.md) (term definitions). Governance
precedence and the SDLC gates live in the root [`CLAUDE.md`](../../CLAUDE.md); when this map and a
`rules/frontend/*` rule disagree, the rule wins and this map has a bug.
