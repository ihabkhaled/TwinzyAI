---
id: summary-architecture
title: Architecture Summary — Both Sides, Enforcement, Where Things Live
type: summary
authority: canonical
status: current
owner: repository owner
generated: false
summary: Routing digest of monorepo anatomy — backend and frontend layer chains, module lists, mechanical enforcement, and the canonical ownership maps.
keywords: [architecture, monorepo, layers, modules, eslint enforcement, vendor wrapping, boundaries, nestjs, nextjs, shared package]
contextTier: 1
relatedCode: [apps/api/src/app.module.ts, apps/web/src/modules/game/index.ts, packages/shared/src/index.ts, eslint/architecture-plugin.mjs]
relatedTests: [apps/api/src/tests/health.integration.test.ts]
relatedDocs: [context/architecture-map.md, context/frontend/architecture-map.md, rules/00-non-negotiable-rules.md, rules/01-architecture.md]
readWhen: You need to know which layer or module owns a piece of code, or what mechanically enforces the boundaries.
---

# Architecture Summary — Both Sides, Enforcement, Where Things Live

npm-workspace monorepo: `apps/api` (NestJS 11 on Fastify 5), `apps/web` (Next.js 16 App Router, React 19), `packages/shared` (cross-side contracts), `packages/tsconfig`, `packages/eslint-config`. Engineering canon: `context/architecture-map.md` + `rules/00-non-negotiable-rules.md` win over every other engineering doc.

## Backend (`apps/api/src`) — one-way layers

`Controller (api/) → Application (use-cases + ≤20-line services) → Domain → Persistence (infrastructure/) → Integration (adapters/)`, plus cross-cutting `core/` (logger, errors+filter, validation, rate-limit, openapi, http, streaming), `config/` (typed zod fail-fast), `bootstrap/` (Fastify assembly — the only home of platform vendor imports).

**8 modules** (`apps/api/src/modules/`, map: `knowledge/summaries/backend.md`): `ai`, `file-security`, `game`, `health`, `payments`, `privacy`, `result-aggregation`, `share-results`. Import graph: `game → {core/streaming, ai, file-security, payments, result-aggregation, privacy}`; `ai → privacy`; everything else standalone (`apps/api/src/app.module.ts` registers Health, Privacy, Game, Payments, ShareResults; the rest arrive transitively).

Persistence reality: **no database by design**; the only `infrastructure/` files are the read-only prompt-template repository (`modules/ai/infrastructure/prompt-template.repository.ts`) and the in-memory share TTL cache (`modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts`).

## Frontend (`apps/web/src`) — one-way anatomy

`app (routes only) → modules/<feature> → shared → packages/<vendor>`; inside a module: `Component (pure JSX) → Hook → Service (React-free) → Gateway (HTTP only)`. **2 feature modules**: `modules/game` (the product) and `modules/ui-preferences` (theme/locale). Cross-module access only via `index.ts` public surfaces (deep imports forbidden). Every vendor has exactly one wrapper under `src/packages/` — full list in `knowledge/summaries/frontend.md`. `src/proxy.ts` owns the per-request CSP nonce.

## Shared package (`packages/shared`, `@twinzy/shared`)

Star-exported barrels: `constants/` (10 files: app/error-code/language/safety/share/stream/trait/trait-category/upload/response-bounds), `enums/` (6 as-const), `schemas/` (11 Zod files — all AI/API contracts), `types/` (API error envelope), `utils/` (isRecord, countPopulatedTraitFields). Sole runtime dep: zod. Builds to `dist/`; **`npm run build:shared` is a lint/test prerequisite** (stale dist floods lint errors — `memory/known-pitfalls.md` K4).

## Mechanical enforcement (the boundaries are lint errors, not conventions)

| Mechanism | Location | Enforces |
| --- | --- | --- |
| Backend `architecture/*` plugin (10 rules) | `eslint/architecture-plugin.mjs` via `eslint/architecture.config.mjs` | controller-no-logic, layer imports, no-inline-domain-definitions (incl. module-level value consts), no-raw-library/SDK/env access, repository-persistence-only, application-layer-boundaries (image calls only from `trait-extraction.service.ts`) |
| Frontend `frontend-architecture` plugin (13 rules) | same plugin family; per-rule docs in `docs/eslint/` | no-hooks-in-components, no-inline-declarations, layer policy, no-raw-package-imports, no-raw-i18n-text, require-client-component-reason, … |
| Vendor boundary map | `eslint/package-boundaries.config.mjs` | one owner per library (twin of `memory/library-boundaries.md`) |
| Component size caps | `eslint/frontend/component-size.config.mjs` | `*.component.tsx`/`*.container.tsx`: max-lines 130 / 60 per function / jsx-max-depth |
| Suppression ban | `eslint/eslint-comments.config.mjs` + `ban-ts-comment` | inline eslint-disable/@ts-ignore absolutely forbidden |
| Frozen strict TS | `tsconfig.base.json` (+ presets in `packages/tsconfig/`) | apps/api type-checks with tsgo |
| No TS `enum` | `eslint/typescript.config.mjs` (no-restricted-syntax TSEnumDeclaration) | as-const objects + derived types only |

## Where things live (pointers, not restatements)

- Declaration ownership answer sheet: `context/declaration-ownership-map.md`.
- Task → files/rule/skill router: `context/codebase-navigation.md` (frontend paths there are stale; trust `context/frontend/architecture-map.md` for apps/web).
- ADRs: `architecture/adrs/` — ADR-001 engineering OS, ADR-002 Zod-only validation, ADR-003 scaling deferred, ADR-FE-0001 strict Next architecture, ADR-FE-0002 workbench over Storybook.
- Reference code shapes: `context/reference-patterns.md` (backend), `context/frontend/reference-patterns.md`.
- Standing decisions + pitfalls: `memory/architecture-decisions.md`, `memory/known-pitfalls.md`.
