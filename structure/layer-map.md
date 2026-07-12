---
id: structure-layer-map
title: Layer Map — Backend and Frontend Layer Models and Their Enforcement
type: structure
authority: canonical
status: current
owner: repository owner
summary: The one-way layered backend (Controller→Application→Domain→Infrastructure→Adapters) and frontend (Component→Hook→Service→Gateway) models with pointers to the ESLint configs that mechanically enforce them.
keywords: [layers, architecture, controller, application, adapters, gateway, hooks, eslint, boundaries, enforcement]
contextTier: 2
relatedCode: [eslint/architecture.config.mjs, eslint/architecture-plugin.mjs, eslint/frontend/architecture.config.mjs, eslint/frontend-architecture-plugin.mjs]
relatedTests: [eslint/architecture-plugin/tests/architecture-rules.test.mjs, eslint/frontend-architecture-plugin/tests/frontend-architecture-rules.test.mjs]
relatedDocs: [context/architecture-map.md, rules/00-non-negotiable-rules.md, docs/eslint-architecture.md]
readWhen: You are placing new code and need to know which layer owns it and what imports are legal.
---

# Layer Map — Backend and Frontend Layer Models and Their Enforcement

The layer canon is [context/architecture-map.md](../context/architecture-map.md) +
[rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md); this page is the
structural summary with enforcement pointers. Full rule bodies: [rules/16-backend-architecture.md](../rules/16-backend-architecture.md)
through [rules/21-dto-validation.md](../rules/21-dto-validation.md) and [rules/02](../rules/02-frontend-components-tsx.md)–[04](../rules/04-frontend-services-gateways.md).

## Backend (`apps/api/src`) — one-way layered dependencies

```
Controller (modules/*/api/*.controller.ts — thin, one delegation per method)
  → Application (modules/*/application/*.use-case.ts, *.service.ts)
    → Domain (modules/*/domain/ — pure policies; optional per module)
      → Persistence (modules/*/infrastructure/*.repository.ts — e.g. share-results cache driver)
        → Integration (modules/*/adapters/*.adapter.ts — every external library wrapped)
Cross-cutting: src/core (errors, logger, validation, rate-limit, openapi, http, streaming)
             · src/config (typed, zod-validated, fail-fast) · src/bootstrap (Fastify assembly)
             · packages/shared (cross-side contracts)
```

Observed layer usage per module is listed in [module-catalog.yaml](module-catalog.yaml)
(`layerAnatomy`); not every module has every layer (e.g. `privacy` and `result-aggregation`
have no controller or adapters — see [modules/](modules/api-privacy.md)).

Adapter exclusivity examples (each "the only file" for its vendor/protocol):
`apps/api/src/modules/ai/adapters/gemini.adapter.ts` (@google/genai),
`apps/api/src/modules/payments/adapters/paypal.adapter.ts` (PayPal REST),
`apps/api/src/modules/file-security/adapters/clamav.adapter.ts` (clamd wire protocol).
Platform vendor ownership (fastify plugins → `src/bootstrap`, pino → `core/logger`,
throttler → `core/rate-limit`, swagger → `core/openapi`, @nestjs/config → `src/config`) is
described in [runtime-topology.md](runtime-topology.md) and `docs/backend-architecture.md`.

### Backend enforcement

- `eslint/architecture.config.mjs` applies the custom plugin `eslint/architecture-plugin.mjs`
  with rules under `eslint/architecture-plugin/rules/`:
  `no-restricted-layer-imports`, `controller-no-logic`, `application-layer-boundaries`,
  `repository-persistence-only`, `no-direct-sdk-imports`, `no-raw-library-imports`,
  `no-restricted-vendor-imports`, `no-direct-env-access`, `no-inline-domain-definitions`,
  `no-react-in-pure-layers`, `tsx-pure-composition`.
- `eslint/package-boundaries.config.mjs` — module public-surface boundaries.
- Plugin self-tests: `eslint/architecture-plugin/tests/architecture-rules.test.mjs`
  (run in the `lint-rules` vitest project — see [command-catalog.yaml](command-catalog.yaml)).

## Frontend (`apps/web/src`) — Component → Hook → Service → Gateway

On the anatomy `app → modules/<feature> → shared → packages/<vendor>`:

```
Component (*.component.tsx — pure JSX composition; class lists in *.variants.ts)
  → Container (*.container.tsx — client orchestration/composition)
    → Hook (hooks/*.hook.ts — state, effects, view-model assembly)
      → Service (services/*.service.ts — React-free orchestration + validation)
        → Gateway (gateway/*.gateway.ts — HTTP only, responses zod-validated)
          → packages/<vendor> (axios wrapper, stream-request, paypal-sdk, ...)
```

Every user-facing string routes through i18n (`apps/web/src/packages/i18n`), en + ar with RTL
([rules/12-i18n.md](../rules/12-i18n.md)).

### Frontend enforcement

- `eslint/frontend/architecture.config.mjs` applies `eslint/frontend-architecture-plugin.mjs`
  with rules under `eslint/frontend-architecture-plugin/rules/`:
  `no-restricted-layer-imports`, `no-cross-module-deep-imports`, `no-hooks-in-components`,
  `no-inline-component-logic`, `no-inline-declarations`, `no-inline-classname-outside-design-system`,
  `no-inline-query-keys`, `no-raw-i18n-text`, `no-raw-package-imports`,
  `no-direct-browser-api-outside-packages`, `no-process-env-outside-config`,
  `no-server-only-import-in-client`, `require-client-component-reason`.
- `eslint/frontend/component-size.config.mjs` — `*.component.tsx`/`*.container.tsx` capped at
  `max-lines` 130 / `max-lines-per-function` 60 / `jsx-max-depth` (per [CLAUDE.md](../CLAUDE.md)).
- `eslint/frontend/package-boundaries.config.mjs` — vendor-wrapper exclusivity;
  `eslint/frontend/accessibility.config.mjs`, `eslint/frontend/tanstack-query.config.mjs`.
- Plugin self-tests: `eslint/frontend-architecture-plugin/tests/frontend-architecture-rules.test.mjs`.

## Two standing rules on both sides (mechanically enforced)

1. **No inline definitions** — types/enums/constants/schemas live in `types/`, `enums/`,
   `constants/`, `model/`, never inline in layer files (backend
   `eslint/architecture-plugin/rules/no-inline-domain-definitions.mjs`; frontend
   `eslint/frontend-architecture-plugin/rules/no-inline-declarations.mjs`).
2. **No inline ESLint suppression, ever** — `eslint/eslint-comments.config.mjs` sets
   `eslint-comments/no-use: error`; the ban is policy in [CLAUDE.md](../CLAUDE.md).

Also repo-wide: no TypeScript `enum` keyword — as-const objects + derived types
(see [modules/shared.md](modules/shared.md)).
