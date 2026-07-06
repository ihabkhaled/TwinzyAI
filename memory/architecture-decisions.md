# Architecture Decisions

Standing shape lives in [project-architecture.md](./project-architecture.md); this file records
the individual decisions and their reasons.

## Engineering-OS adoption (ADR-001)

- The repo adopted the strict engineering OS: canonical layered module anatomy
  (`api/application/domain/infrastructure/adapters/model/lib`) across
  `apps/api/src/modules/{health, privacy, result-aggregation, file-security, ai, game}`,
  cross-cutting `core/` + `config/` + `bootstrap/`, machine-enforced boundaries via the custom
  ESLint architecture plugin. Recorded in
  [adr-001-strict-engineering-os.md](../architecture/adrs/adr-001-strict-engineering-os.md);
  validation-vendor decision in
  [adr-002-zod-validation-vendor.md](../architecture/adrs/adr-002-zod-validation-vendor.md).
- Existing modules map 1:1 onto the new anatomy — no domain redesign; no external contract
  changes. Feature record:
  [/docs/features/engineering-os-migration/](../docs/features/engineering-os-migration/00-intake.md).

## Manager → use case

- `controllers/` becomes `api/`; the `managers/` tier dissolves into `application/`
  (use cases + services). The game module's `GameManager` becomes
  `application/analyze-game.use-case.ts` — same orchestration role, canonical name/home.
- The health module's manager tier is dissolved outright: a trivial module no longer carries a
  pass-through layer. (This supersedes the earlier "health keeps the full chain for pattern
  consistency" decision — the canonical anatomy now demonstrates the pattern instead.)
- `common/` dissolves into `core/{errors, logger, rate-limit, openapi, http, ...}`.

## Error model: envelope stays compatible, messageKey is ADDITIVE

- Errors are a typed **AppError hierarchy** in `core/errors/`: Validation 400, Unauthorized
  401, Forbidden 403, NotFound 404, Conflict 409, PayloadTooLarge 413, Integration 502 — each
  with a `messageKey` of form `errors.<feature>.<key>`.
- **Decision:** the public envelope stays `ApiErrorResponse`-compatible. The legacy stable
  `ErrorCode` field is kept; `messageKey` is added **additively** so the existing frontend
  keeps working unchanged while new clients can key i18n off `messageKey`.

## Workspace & config

- npm workspaces (not pnpm/yarn): required stack default, zero extra tooling.
- `packages/shared` (`@twinzy/shared`) compiles to a CJS dist consumed by both apps; single
  source for zod schemas/contracts/constants. It resolves the BUILT dist — run `build:shared`
  first ([known-pitfalls.md](./known-pitfalls.md)).
- ESLint config lives in `/eslint` at the root; `packages/eslint-config` only re-exports it.
  Vendor ownership is config-driven via `eslint/package-boundaries.config.mjs`.
- No repository layer exists because nothing is persisted — privacy by design; any change to
  that requires an ADR + privacy review ([database-decisions.md](./database-decisions.md)).
- A parallel frontend workstream owns `apps/web`; root config changes must stay additive
  (standing coexistence rule).
