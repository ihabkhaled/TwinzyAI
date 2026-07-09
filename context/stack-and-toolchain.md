# Stack & Toolchain

> The exact runtime, build, lint, and test toolchain this monorepo ships. Everything here is real and lives at the repo root or in the workspace `package.json` files. The stack is opinionated and locked: zod everywhere, every vendor wrapped, no database by design.

## Monorepo layout (npm workspaces)

- **`apps/api`** — `@twinzy/api`, NestJS 11 backend.
- **`apps/web`** — Next.js frontend (summary below).
- **`packages/shared`** — `@twinzy/shared`: zod schemas, constants, as-const enums, types, utils. Consumed as **built dist** via a workspace dependency (`main`/`types` → `dist/`), **no TS path alias** — which is why every root script that compiles or tests runs `npm run build:shared` first.
- **`packages/tsconfig`**, **`packages/eslint-config`** — shared config workspaces.

## Runtime & language

- **Node.js >= 22** (`engines.node >= 22`; developed on Node 24).
- **TypeScript ~6.0.3**, maximally strict via [`tsconfig.base.json`](../tsconfig.base.json): `strict` plus `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noUnusedLocals`, `noUnusedParameters`, `useUnknownInCatchVariables`, `noFallthroughCasesInSwitch`, `allowUnreachableCode: false`, `noEmitOnError`, `noUncheckedSideEffectImports`, `isolatedModules`. These flags are why "no `any`", "no `!`", and "handle every nullable" are mechanically true here.
- **Typecheck** is per-workspace behind `npm run typecheck` (root builds shared first): every workspace type-checks with the native `tsc` from **TypeScript 7** (installed via the `tsc7` npm alias; the `typescript` package name resolves to the official 6.0 API shim `@typescript/typescript6` for API consumers: nest CLI, Next, typescript-eslint, sonarjs).

## Backend libraries (apps/api)

- **NestJS 11** (`@nestjs/common`, `@nestjs/core`) on **Fastify 5** — `@nestjs/platform-fastify` with `@fastify/helmet`, `@fastify/cors`, `@fastify/cookie`, `@fastify/multipart`. A **root `overrides` entry dedupes fastify to a single version** across the tree so plugin/adapter version skew cannot occur. Platform assembly (bounded body limit, `trustProxy`, UUID `genReqId`) is owned by `src/bootstrap`.
- **nestjs-pino + pino + pino-http** (+ `pino-pretty` in dev) — structured request logging behind the `AppLogger` port in `src/core/logger`; redaction built in.
- **@nestjs/config** — typed configuration, validated fail-fast by the zod `EnvSchema` in `src/config`.
- **@nestjs/swagger** — OpenAPI, **flag-gated** via `src/core/openapi` + bootstrap (off unless enabled by config).
- **@nestjs/throttler** — rate limiting, owned by `src/core/rate-limit` (analyze route: 10/min).
- **zod 4** — the only validation vendor, everywhere (DTOs, env, AI responses). class-validator is banned.
- **@google/genai** — the Gemini SDK, importable **only** inside `modules/ai/adapters/gemini.adapter.ts`; model name always from `GEMINI_MODEL` env.

> **Vendor ownership is ESLint-enforced**: each library is importable only inside its owning folder (`architecture/no-direct-sdk-imports`, `architecture/no-raw-library-imports`, `architecture/no-restricted-vendor-imports` + `eslint/package-boundaries.config.mjs`), so swapping any vendor touches exactly one place.

## Frontend (apps/web) — summary

Next.js (App Router) + React with Tailwind CSS, TanStack Query, React Hook Form, and zod, following the Component → Hook → Service → Gateway layering ([rules/02](../rules/02-frontend-components-tsx.md)–[04](../rules/04-frontend-services-gateways.md)); all HTTP/storage/share/theme access goes through wrappers in `apps/web/src/lib`, contracts come from `@twinzy/shared`, unit tests run in the `web-unit` vitest project (jsdom), and e2e tests use Playwright. Details live in the frontend rules and `docs/frontend-architecture.md`.

## Lint & format

- **ESLint 9 flat config** ([`eslint.config.mjs`](../eslint.config.mjs)) composed from modular files under [`/eslint`](../eslint/index.mjs): base → typescript → imports → promise/security/sonarjs/unicorn/regexp → react/react-hooks/next → **architecture** → test overrides → prettier last. Target: **0 errors AND 0 warnings**.
  - typescript-eslint strict type-checked presets; plugins: import-x, simple-import-sort, unused-imports, promise, regexp, security, sonarjs, unicorn, jsx-a11y, react, react-hooks, @next/next, testing-library, playwright, vitest.
  - **Custom architecture plugin** ([`eslint/architecture-plugin`](../eslint/architecture-plugin/rules/controller-no-logic.mjs), config [`eslint/architecture.config.mjs`](../eslint/architecture.config.mjs)) — the mechanical enforcement of [architecture-map.md](./architecture-map.md) §6, with its own vitest project (`lint-rules`).
- **Prettier 3** ([`.prettierrc.json`](../.prettierrc.json)) — single quotes, trailing commas, `printWidth: 100`, `arrowParens: always`, LF line endings.

## Test toolchain

- **Vitest 4 multi-project** ([`vitest.config.ts`](../vitest.config.ts)): `api-unit` and `api-integration` (node env, SWC transform for Nest decorator metadata), `web-unit` (jsdom), `shared-unit`, and `lint-rules` (the architecture plugin's own tests). Naming: `*.test.ts` (unit) / `*.integration.test.ts` (api integration).
- **@nestjs/testing + supertest** — module-level unit tests and HTTP integration tests against the real Fastify app (`await app.getHttpAdapter().getInstance().ready()` before requests).
- **Playwright** — web e2e (`npm run test:e2e`).
- **Coverage: @vitest/coverage-v8** with thresholds **95 statements / 90 branches / 95 functions / 95 lines** on a **gated scope** — an explicit `include`/`exclude` set that measures logic-bearing source and excludes composition roots (e.g. `main.ts`, `apps/web/src/app`), test scaffolding, and declaration files.

## Commit & git-hook toolchain

- **Husky 9** ([`.husky/`](../.husky/pre-commit)):
  - **pre-commit** → `lint-staged` (eslint --fix on staged) + `typecheck` (workspace-wide).
  - **commit-msg** → `commitlint` (Conventional Commits, `@commitlint/config-conventional`).
  - **pre-push** → `test:coverage` + `build`.
- Never bypass hooks (`--no-verify`).

## Security & dependency hygiene

- **Trivy** — `npm run security:scan` (gate: HIGH/CRITICAL vulns, secrets, misconfig — includes dev deps, exits non-zero) and `npm run security:scan:full` (full report, every severity).
- **npm-check-updates** — `npm run deps:check` reports drift, `npm run deps:upgrade` bumps + reinstalls (then run every gate).
- `npm run audit` — production-dependency audit.

## Docker

- `Dockerfile.api` + `Dockerfile.web`, orchestrated by `docker-compose.yml` (plus `docker-compose.dev.yml`); ClamAV runs as a compose service. Scripts: `docker:up`, `docker:down`, `docker:logs`, `docker:rebuild`. See [docs/docker-local-dev.md](../docs/docker-local-dev.md).

## npm scripts (root)

| Script | Purpose |
| --- | --- |
| `dev` / `dev:api` / `dev:web` | Run both apps (concurrently) or one |
| `build` | `build:shared` → `build:api` → `build:web` |
| `lint` / `lint:fix` | ESLint flat config, whole repo (0/0 target) |
| `typecheck` | Build shared, then per-workspace typecheck (native tsc from TypeScript 7) |
| `test` / `test:watch` | All vitest projects |
| `test:unit` | `api-unit` + `web-unit` + `shared-unit` + `lint-rules` |
| `test:integration` | `api-integration` |
| `test:e2e` | Playwright (web) |
| `test:coverage` | Coverage with thresholds on the gated scope |
| `test:security` / `test:file-security` / `test:ai` / `test:pwa` | Focused suites |
| `validate` | lint + typecheck + test:coverage + build |
| `security:scan` / `security:scan:full` | Trivy |
| `deps:check` / `deps:upgrade` | npm-check-updates |
| `docker:*` | Compose lifecycle |

## Quality gates (all green before "done")

```bash
npm run lint            # 0 errors AND 0 warnings
npm run typecheck       # shared build + per-workspace check
npm run test:unit       # unit projects
npm run test:coverage   # thresholds 95/90/95/95 on the gated scope
npm run build           # shared → api → web compiles clean
```

A green build is **not** proof of correctness — walk [rules/23](../rules/23-review-checklist.md) and prove behavior with tests before [rules/24](../rules/24-release-gate.md).
