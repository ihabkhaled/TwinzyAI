# ADR-001 - Adopt the Strict Layered Engineering OS for the Backend

## Status

Accepted — 2026-07-05

## Context

Twinzy's backend (`apps/api`, NestJS) grew feature-first: modules work and are well tested, but structural conventions (where adapters live, how errors map to responses, how logging is wired, which platform adapter runs under Nest) were per-module judgment calls rather than an enforced system. The project also adopted a full SDLC governance layer (phases `00`–`27`, artifacts in `docs/features/`, baselines in `docs/sdlc/`) that needs a matching engineering substrate: rules that a linter can enforce, gates that a hook can run, and an anatomy that any engineer or agent can navigate without tribal knowledge.

Constraints that frame the decision:

- Product invariants are strict: privacy-safe, no persistence of images, no payments, no auth, no database — the architecture must make violations structurally hard, not just discouraged.
- The frontend contract must not break: response shapes, routes, status codes, and validation order stay byte-compatible.
- Quality is gate-driven: lint 0/0, typecheck, tests, coverage, build, and security scan must all stay green through the migration (delivered as reviewable slices).

## Decision

Adopt a strict, uniformly enforced engineering operating system for the backend:

1. **Canonical module anatomy.** Every feature module follows the same internal layout: `api/` (controllers, DTOs — transport only), `application/` (managers/use-cases orchestrating exactly one flow per entry point), `domain/` (pure business logic and domain types), `infrastructure/` (technical services), `adapters/` (the only place a vendor SDK may be touched), `model/` (module-owned types/constants/schemas), and `lib/` (module-local helpers). Cross-cutting concerns live in `core/` (errors, validation, logging, interceptors), `config/` (the only home of `process.env`), and `bootstrap/` (app assembly).
2. **Fastify platform.** The Nest HTTP layer runs on `@nestjs/platform-fastify`. Fastify is faster and lighter for this workload (one hot multipart endpoint), and its stricter plugin model suits the wrapped-vendor policy. Express-isms (raw `Response` typing, multer-specific error handling) are replaced by platform-neutral core code.
3. **nestjs-pino request logging.** All request logging goes through `nestjs-pino`: structured JSON, one logger, automatic request-id correlation (honoring inbound `x-request-id`), redaction configured centrally. 4xx outcomes log at `warn`, 5xx at `error`. `console.*` and ad-hoc loggers remain banned.
4. **AppError + messageKey error contract.** A single `AppError` hierarchy (Validation 400, Unauthorized 401, Forbidden 403, NotFound 404, Conflict 409, PayloadTooLarge 413, Integration 502) is the only way business code signals failure. The global filter maps every thrown error to the existing `ApiErrorResponse` envelope and **additively** appends a stable `messageKey` (`errors.<feature>.<key>`) for i18n and log analytics. Existing envelope fields, status codes, and messages are unchanged — the web client is unaffected.
5. **Vendor swap surfaces, ESLint-enforced.** Every third-party dependency (AI provider SDK, virus scanner client, HTTP, platform) is reachable only through one owning adapter/lib module. The custom ESLint architecture plugin enforces this mechanically: raw SDK imports outside the owning module, cross-layer imports, inline domain declarations, and `process.env` outside `config/`/`bootstrap/` are lint errors, not review comments.
6. **Coverage gate 95/90/95/95.** `npm run test:coverage` enforces statements ≥ 95%, branches ≥ 90%, functions ≥ 95%, lines ≥ 95% as a hard workspace floor; touched modules aim higher (policy: `testing/coverage-policy.md`).
7. **SDLC artifact system.** Every request travels the phase system (`00`–`27`) with artifacts in `docs/features/<feature-slug>/`, inheriting the baselines in `docs/sdlc/`. This migration itself is the first worked example: `docs/features/engineering-os-migration/`.

## Consequences

### Positive

- Uniform anatomy: any module can be navigated, reviewed, and extended without archaeology; agents and humans share one mental model.
- Violations become mechanical failures (lint/typecheck/coverage) instead of judgment calls — the review burden drops to the judgment that actually needs humans.
- The error contract gives the frontend and log tooling a stable machine-readable key per failure mode while remaining fully backward compatible.
- Structured, correlated logs make the runbooks executable as written (`runbooks/api-outage.md`, `runbooks/ai-provider-outage.md`).
- Vendor swaps (e.g., a different AI provider or scanner) are localized to one module by construction.

### Negative

- Migration cost: existing modules must be re-homed into the anatomy in slices, with gates green at every slice.
- More ceremony for tiny changes: even a small endpoint touches api/application/domain layering and its tests.
- Fastify's ecosystem differs from Express; middleware assumptions (multipart handling, raw body access) had to be re-validated rather than assumed.
- The 95/90/95/95 floor makes some refactors slower — tests move with the code, not after it.

## Alternatives Considered

- **Keep the current per-module conventions and document harder.** Rejected: documentation without mechanical enforcement decays; the SDLC layer above it would be governance on sand.
- **Stay on Express.** Rejected: workable, but Fastify's performance profile and stricter composition model fit the single-hot-endpoint workload and the wrapped-vendor policy better; the platform is an adapter surface either way, which is what makes the swap safe.
- **Introduce a breaking v2 error contract.** Rejected: no product need justifies breaking the web client; an additive `messageKey` delivers the machine-readable benefit at zero compatibility cost.
- **Adopt a heavyweight external framework/monorepo generator to impose structure.** Rejected: the repository already has the tooling spine (npm workspaces, flat ESLint config with a custom plugin, Vitest, Husky); adding a generator would add a vendor, not remove risk.
