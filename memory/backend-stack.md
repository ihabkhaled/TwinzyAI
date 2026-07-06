# Backend Stack — Locked Toolchain

> The locked runtime, framework, lint, and test toolchain for `apps/api`. Mirrors
> [/context/stack-and-toolchain.md](../context/stack-and-toolchain.md); adoption recorded in
> [adr-001-strict-engineering-os.md](../architecture/adrs/adr-001-strict-engineering-os.md) and
> [adr-002-zod-validation-vendor.md](../architecture/adrs/adr-002-zod-validation-vendor.md).

## Runtime & platform

- **NestJS 11**, migrating **Express → Fastify 5** via `@nestjs/platform-fastify`.
- Fastify plugins registered in bootstrap: `@fastify/helmet`, `@fastify/cors`,
  `@fastify/cookie`, `@fastify/multipart` (replacing helmet/cors/cookie-parser/multer).
- **Single deduped fastify**: root `fastify` dependency + a root npm override force one copy.
  `@nestjs/platform-fastify` pins its own fastify, and dual copies break plugin typings —
  verify `npm ls fastify` shows ONE deduped version after every install
  ([known-pitfalls.md](./known-pitfalls.md)).
- CJS build via `nest build` (tsc); dev watch via `nest start --watch`.

## Framework libraries (locked)

- **nestjs-pino + pino + pino-http** (pino-pretty in dev) behind the **AppLogger port** in
  `core/logger/` — the only sanctioned log sink ([observability-decisions.md](./observability-decisions.md)).
- **@nestjs/config + zod** fail-fast env validation in `src/config/`; **AppConfigService is the
  only config surface**; `process.env` is illegal outside the config module. `GEMINI_MODEL`
  comes from `.env` — never hardcoded.
- **@nestjs/swagger** flag-gated, wired in `core/openapi/` + bootstrap.
- **@nestjs/throttler** in `core/rate-limit/` — global 30 req/min, analyze route 10 req/min.
- **zod 4 is the single validation vendor** repo-wide (env, DTOs, AI response schemas, shared
  contracts). **class-validator is FORBIDDEN** — see ADR-002.
- **@google/genai** imported ONLY in `modules/ai/adapters/gemini.adapter.ts` behind the AI
  provider port (Symbol injection token; image-capable vs text-only method split as a safety
  boundary — [ai-safety-decisions.md](./ai-safety-decisions.md)).
- **ClamAV** via a hand-rolled clamd INSTREAM TCP client (`node:net`) in
  `modules/file-security/adapters/`, fail-closed when enabled.
- **No ORM / DB / cache / queue — by design** ([database-decisions.md](./database-decisions.md)):
  nothing is persisted; the image lives in memory only and is zero-filled in `finally`.

## Lint & type toolchain (locked)

- **ESLint 9 flat config**, modular files under `/eslint`, plus the **custom architecture
  plugin** (10 rules) with **config-driven vendor boundaries** via
  `eslint/package-boundaries.config.mjs`. Target: 0 errors, 0 warnings.
- **No TypeScript `enum` keyword** — `as const` objects + derived types + `*_VALUES` arrays
  ([/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md)).
- **Typecheck via tsgo** (`@typescript/native-preview`) for the api workspace. (This reverses
  the earlier "rejected for now" note: tsgo only type-checks; decorator metadata for tests is
  handled by the Vitest SWC plugin, and `nest build` handles emit. tsgo removed `baseUrl` —
  use tsconfig-relative paths only.)
- Prettier runs through ESLint so formatting failures are lint errors.

## Test & gate toolchain (locked)

- **Vitest 4 multi-project**: `api-unit` / `api-integration` / `shared-unit` / `web-unit` /
  `lint-rules`; SWC plugin for Nest decorator metadata; `build:shared` is a prerequisite
  ([testing-strategy.md](./testing-strategy.md)).
- **Coverage gate 95 stmts / 90 branches / 95 funcs / 95 lines** on the gated scope (apps/api
  logic-bearing files + packages/shared; apps/web excluded until that workstream adopts —
  recorded waiver). The branch floor is 90 solely for the synthetic decorator-downlevel branch.
- **husky + commitlint**: pre-commit = lint-staged + typecheck; commit-msg = conventional
  commits; pre-push = test:coverage + build. Never bypass hooks.
- **Trivy gate** (`security:scan`): zero HIGH/CRITICAL findings.
- Dependencies kept latest with caret ranges via npm-check-updates.

## Coexistence rule (standing)

A parallel frontend workstream owns `apps/web` — root config changes (eslint, vitest, tsconfig,
package.json scripts/overrides) **must stay additive** so neither workstream breaks the other.

## Quality gates before "done"

```bash
npm run lint && npm run typecheck && npm run test:unit && npm run build
```

Full release gate: [/rules/24-release-gate.md](../rules/24-release-gate.md) ·
[release-checklist.md](./release-checklist.md).

**Related:** [project-architecture.md](./project-architecture.md) ·
[library-boundaries.md](./library-boundaries.md) · [known-pitfalls.md](./known-pitfalls.md)
