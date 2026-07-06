# 01 — Architecture & Module Boundaries

> The monorepo layout, the one-way layering rule, and the module boundary rule that everything else builds on. This file implements [`/context/architecture-map.md`](../context/architecture-map.md) and rules 16–23 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md). If anything here contradicts the architecture map or the non-negotiables, those win.

---

## The monorepo

npm workspaces:

| Workspace | Role |
| --- | --- |
| `apps/api` | NestJS 11 backend (Fastify via `src/bootstrap`) — the game pipeline |
| `apps/web` | Next.js frontend (mobile-first PWA) |
| `packages/shared` | Cross-side shared layer: zod schemas, as-const enums, constants, types — consumed as built dist (`npm run build:shared`) |
| `packages/tsconfig` | Shared TS config presets extending the frozen `tsconfig.base.json` |
| `packages/eslint-config` | Shared lint presets composed by root `/eslint` |

Shared code both sides need (schemas, constants, enums, types) lives in `packages/shared` **only** — never duplicated per app. The web app imports contracts from shared; the api validates against the same schemas. One source of truth per shape.

---

## The one-way dependency rule

Dependencies point **inward and downward only**. A layer may depend on the layers below it; **never** on the layers above it.

```
Backend (apps/api/src):
HTTP →  Controller    api/<feature>.controller.ts          thin transport, one delegation/method
        Application   application/<action>.use-case.ts      multi-step orchestration + cleanup
                      application/<feature>.service.ts      focused capabilities (≤20 lines/method)
        Domain        domain/                               pure policies + invariants
        Persistence   infrastructure/<feature>.repository.ts (none today — binds if introduced)
        Integration   adapters/<vendor>.adapter.ts           wrap every external library
        ─────────────────────────────────────────────────────────────────────────────
        Cross-cutting: src/core/{logger,errors,validation,rate-limit,openapi,http},
        src/config (typed env), src/bootstrap (Fastify wiring — the only home of
        fastify/@fastify/*/@nestjs/platform-*). packages/shared = shared kernel.

Frontend (apps/web/src):
UI  →   Component (TSX, pure composition)
        Hook       state/effects/handlers; calls services
        Service    frontend business flow (mapping, sequencing)
        Gateway    HTTP only, via lib/http; zod-validates responses
```

Full backend anatomy: [16-backend-architecture.md](./16-backend-architecture.md). Frontend layers: [02](./02-frontend-components-tsx.md) / [03](./03-frontend-hooks.md) / [04](./04-frontend-services-gateways.md).

---

## The module boundary rule (ESLint-enforced)

Each backend feature module (`modules/<feature>/`) and each frontend feature (`features/<name>/`) is a bounded unit:

- A module imports `packages/shared`, `core/`, `config/`, and its **own** internals — never another module's internal files.
- Cross-module use goes **only** through the target module's `index.ts` public surface (or events, if ever introduced). `architecture/no-restricted-layer-imports` makes this mechanical.
- The `index.ts` barrel is a deliberate public API: export the module class, public use cases/services, public types — keep repositories, DTO schemas, mappers, and adapters internal.
- Barrels re-export; they never compute. No giant barrels, no import cycles (`import-x/no-cycle` is on). Prefer `export type { ... }` for type-only re-exports.
- `packages/shared` imports nothing app-level — it is the dependency-light kernel both apps sit on.

```ts
// Don't — deep cross-module internal import (ESLint error)
import { GeminiAdapter } from '@modules/ai/adapters/gemini.adapter';

// Do — the module's public surface, or the shared kernel
import { AiModule } from '@modules/ai';
import { Verdict } from '@twinzy/shared';
```

Per-layer import bans (details in [11-eslint-typescript.md](./11-eslint-typescript.md)):

- controllers may not import repositories/infrastructure or SDKs;
- use cases may not import controllers or API DTOs;
- services may not import controllers;
- repositories may not import controllers, services, use cases, or API DTOs;
- vendor packages are importable only inside their owning adapter/module ([10-library-modularization.md](./10-library-modularization.md));
- `process.env` is readable only in `config/` and `bootstrap/`.

---

## DI and wiring (backend)

- Every provider is registered in its `<feature>.module.ts`; `app.module.ts` imports config, core, and feature modules.
- Constructor DI with `private readonly`; no `new`, no service locator, no field injection.
- Cross-cutting providers (AppLogger, exception filter, throttler, validation) come from `core/` and are wired once — never re-instantiated per module.

---

## Checklist

- [ ] Dependencies point downward only — no layer imports a layer above it
- [ ] Cross-module access only via `index.ts` (or events); no deep internal imports; no cycles
- [ ] Shared shapes live in `packages/shared` once; never duplicated per app
- [ ] New module scaffolds the canonical anatomy ([16-backend-architecture.md](./16-backend-architecture.md))
- [ ] Providers wired in the module; constructor DI with `private readonly`
- [ ] `npm run lint` / `typecheck` / `test:unit` / `build` green
