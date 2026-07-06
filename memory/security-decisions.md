# Security Decisions

Rule: [/rules/06-security.md](../rules/06-security.md) ·
[/rules/15-file-upload-security.md](../rules/15-file-upload-security.md). Threat model:
[/docs/security-threat-model.md](../docs/security-threat-model.md).

## Transport hardening (Fastify)

- `@fastify/helmet` defaults + explicit CORS allowlist from `CORS_ALLOWED_ORIGINS` env via
  `@fastify/cors`; cookies via `@fastify/cookie`. All registered in bootstrap — never imported
  in business code (Express `helmet`/`cookie-parser` idioms are gone with the platform swap).
- Rate limiting via `@nestjs/throttler` in `core/rate-limit/`: **global 30 req/min; the
  analyze route 10 req/min** — the expensive AI route gets the stricter budget.

## Upload pipeline

- `@fastify/multipart` with in-memory parsing (replaces multer) — no temp files on disk ever;
  cleanup equals zero-filling one buffer in `finally`. Size cap 5 MB default.
- **ClamAV** optional via `ENABLE_CLAMAV`: a hand-rolled clamd **INSTREAM TCP client**
  (`node:net`) in `modules/file-security/adapters/`. Enabled + unreachable = **fail CLOSED**
  (reject the upload); never fail open when scanning is on.

## Validation & config

- **zod 4 strict schemas** validate every input surface (DTOs, env, AI responses); strict
  object schemas reject unknown keys instead of silently stripping them. class-validator is
  forbidden ([adr-002](../architecture/adrs/adr-002-zod-validation-vendor.md)).
- Env is validated fail-fast at boot by the zod schema in `src/config/`; **AppConfigService is
  the only config surface** — no `process.env` in business code; secrets never logged
  ([observability-decisions.md](./observability-decisions.md)).

## Error surface

- Public errors use the sanitized envelope: legacy stable **ErrorCode** kept, **messageKey
  additive** (`errors.<feature>.<key>`), from the `AppError` hierarchy in `core/errors/`.
  Clients get safe shapes; stacks/vendor detail stay server-side
  ([architecture-decisions.md](./architecture-decisions.md)).

## Supply chain & scanning

- **Trivy gate** (`security:scan`): zero HIGH/CRITICAL findings before "done".
- Dependencies kept latest with caret ranges via npm-check-updates; every new vendor goes
  behind a wrapper + the ESLint package-boundaries config
  ([library-boundaries.md](./library-boundaries.md)).

## What is out of scope by product invariant

No auth/accounts today (no identity to protect beyond the request), no payment surface ever
(free game), no stored data to breach ([database-decisions.md](./database-decisions.md)) — the
image-privacy invariants in [privacy-decisions.md](./privacy-decisions.md) are the crown jewels.
