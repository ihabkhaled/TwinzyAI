---
id: structure-repository-map
title: Repository Map — the Twinzy Monorepo at a Glance
type: structure
authority: canonical
status: current
owner: repository owner
summary: Top-level map of the npm-workspaces monorepo — the two apps, the shared packages, the governance folders, and where every kind of file lives.
keywords: [monorepo, workspaces, repository, layout, folders, apps, packages, api, web, shared]
contextTier: 2
relatedCode: [package.json, apps/api/src, apps/web/src, packages/shared/src]
relatedTests: [vitest.config.mts, apps/web/playwright.config.ts]
relatedDocs: [structure/module-catalog.yaml, context/architecture-map.md, docs/architecture.md]
readWhen: You are new to the repo or need to locate where a kind of code, doc, or config lives.
---

# Repository Map — the Twinzy Monorepo at a Glance

Twinzy is a free-by-default, privacy-first AI style/vibe game, built as a private npm-workspaces
monorepo (`package.json`, name `twinzy`, Node `>=22.20 <23`).

## Workspaces (`package.json#workspaces`)

| Workspace | Package | Role |
| --- | --- | --- |
| `apps/api` | `twinzy-api` | NestJS + Fastify backend, stateless, no database ([runtime-topology.md](runtime-topology.md)) |
| `apps/web` | `@twinzy/web` | Next.js 16 App Router frontend, mobile-first PWA (`apps/web/src`) |
| `packages/shared` | `@twinzy/shared` | Cross-side contracts: constants, as-const enums, Zod schemas, types, utils (`packages/shared/src/index.ts`) |
| `packages/tsconfig` | `@twinzy/tsconfig` | Shared TS presets: `base/nextjs/nestjs/library.json` |
| `packages/eslint-config` | `@twinzy/eslint-config` | One-line re-export of the repo-root `eslint/index.mjs` |

## Backend anatomy (`apps/api/src`)

- `main.ts` → `bootstrap/` — Fastify app assembly chain ([entrypoint-catalog.yaml](entrypoint-catalog.yaml)).
- `modules/` — exactly 8 feature modules: `ai`, `file-security`, `game`, `health`, `payments`,
  `privacy`, `result-aggregation`, `share-results` (one page each under [modules/](modules/api-game.md)).
- `core/` — cross-cutting: `errors/`, `logger/`, `validation/`, `rate-limit/`, `openapi/`, `http/`, `streaming/`.
- `config/` — typed zod-validated env (`config/env.schema.ts`, `config/app-config.service.ts`).
- `benchmark/` — the `ai:benchmark` CLI (`benchmark/benchmark.main.ts`).
- `tests/` — integration suites + shared fixtures (`apps/api/src/tests/*.integration.test.ts`).

## Frontend anatomy (`apps/web/src`)

- `app/` — App Router routes: `/`, `/game`, `/share/[shareId]`, `/help`, `/privacy`, `/terms`; no `route.ts` handlers.
- `modules/game/`, `modules/ui-preferences/` — the two feature modules.
- `shared/` — cross-module components, constants, errors, helpers, hooks, security (CSP builder).
- `packages/` — 17 vendor wrappers, each the single owner of its library: `axios`, `browser`,
  `camera`, `env`, `i18n`, `icons`, `image`, `link`, `logger`, `navigation`, `paypal`, `query`,
  `storage`, `toast`, `ui-primitives`, `zod`, `zustand`.
- `proxy.ts` — the CSP/nonce request proxy (`apps/web/src/proxy.ts`).
- `apps/web/e2e/` — Playwright suites (outside `src/`).

## Governance and knowledge folders (repo root)

| Folder | Owns | Canonical entry |
| --- | --- | --- |
| `rules/` | Engineering rules per layer | [rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) |
| `skills/` | Task playbooks | `skills/README.md` |
| `context/` | Architecture map, task router, glossary | [context/architecture-map.md](../context/architecture-map.md) |
| `memory/` | Durable decisions + pitfalls | `memory/README.md` |
| `agents/` | Specialist reviewer roles | `agents/README.md` |
| `testing/` | Test strategy standards | `testing/README.md` |
| `eslint/` | Modular lint configs + custom architecture plugins | [layer-map.md](layer-map.md) |
| `knowledge/` | Knowledge-OS definitions (authored) | [knowledge/README.md](../knowledge/README.md) |
| `.ai/` | Generated acceleration plane — never hand-edited | `.ai/README.md` |
| `structure/` | This area | [README.md](README.md) |
| `docs/` | Long-form docs (architecture, env vars, AI safety, security) | `docs/README.md` |
| `docs/features/<slug>/` | Per-request SDLC artifacts (phases 00–27) | [CLAUDE.md](../CLAUDE.md) |
| `scripts/` | Automation (`scripts/knowledge/build.mjs`, `scripts/load-test.mjs`, `scripts/scan-secrets.mjs`, `scripts/calibrate.mjs`) | [command-catalog.yaml](command-catalog.yaml) |

## Root config files

- `tsconfig.base.json` + per-workspace tsconfigs; `vitest.config.mts` defines projects
  `api-unit`, `api-integration`, `web-unit`, `shared-unit`, `lint-rules` (script usage in `package.json`).
- `eslint.config.mjs` → `eslint/` modular configs; Husky hooks under `.husky/`.
- `docker-compose.yml` (production-shaped: `api`, `web`, optional `clamav`) and
  `docker-compose.dev.yml` (single hot-reload `dev` service) — see [runtime-topology.md](runtime-topology.md).
- `Dockerfile.api`, `Dockerfile.web` (referenced from `docker-compose.yml`).
- `.env.example` — template for env vars; the catalog is [docs/env-vars.md](../docs/env-vars.md).
