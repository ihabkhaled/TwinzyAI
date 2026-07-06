# Library Boundaries — Vendor Ownership Map

> Every external library that touches product behavior is reached only through an app-owned
> port/wrapper; the vendor package is importable **only** inside its owning folder. Business
> code depends on our interface, never the SDK. Rule:
> [/rules/10-library-modularization.md](../rules/10-library-modularization.md).
> Changing a library = touching one folder.

## Vendor ownership table (apps/api)

| Concern | Vendor(s) | Sole owning location | Port / surface | Notes |
| --- | --- | --- | --- | --- |
| AI provider | `@google/genai` | `apps/api/src/modules/ai/adapters/gemini.adapter.ts` | AI provider port, **Symbol injection token** | Image-capable method (trait extraction only) split from text-only methods (candidates/judge) — a type-level safety boundary. `GEMINI_MODEL` from env only. |
| Logging | `nestjs-pino`, `pino`, `pino-http` (`pino-pretty` dev) | `apps/api/src/core/logger/` | **AppLogger** port | Only sanctioned sink; `console.*` banned. See [observability-decisions.md](./observability-decisions.md). |
| Config / env | `@nestjs/config` + zod env schema | `apps/api/src/config/` | **AppConfigService** (only surface) | Fail-fast validation at boot; `process.env` illegal elsewhere. |
| Validation | **zod 4** — the single validation vendor | schemas in `packages/shared` + module `model/`/DTO folders | zod schemas | **class-validator FORBIDDEN** ([adr-002](../architecture/adrs/adr-002-zod-validation-vendor.md)). |
| Virus scanning | ClamAV clamd (hand-rolled INSTREAM TCP client, `node:net`) | `apps/api/src/modules/file-security/adapters/` | content-scan port | Fail-closed when enabled. No third-party clamd SDK. |
| Rate limiting | `@nestjs/throttler` | `apps/api/src/core/rate-limit/` | guard wiring | Global 30/min; analyze 10/min. |
| OpenAPI | `@nestjs/swagger` | `apps/api/src/core/openapi/` + bootstrap | flag-gated setup | Not imported in business code. |
| HTTP platform | `@nestjs/platform-fastify`, `fastify`, `@fastify/{helmet,cors,cookie,multipart}` | bootstrap (registration) + `core/http/` (structural reply/multipart types) | `HttpReplyLike`, multipart types | Platform, not business dependency. Single deduped fastify via root override. |

## Vendor ownership table (apps/web — owned by the frontend workstream)

| Concern | Sole owning location |
| --- | --- |
| Env access | `apps/web/src/lib/config/` |
| HTTP client | `apps/web/src/lib/http/` |
| Browser storage | `apps/web/src/lib/storage/` |
| Share/clipboard APIs | `apps/web/src/lib/share/` |

## Enforcement (mechanical, not by review)

The custom ESLint architecture plugin enforces vendor boundaries **config-driven** via
`eslint/package-boundaries.config.mjs`: each wrapped package is listed with its owning
directory, and any import outside it is a lint error. Adding a new vendor means: wrap it,
add the boundary row to that config, and add its row to this table — in the same change.

## Intentionally NOT wrapped

- `@nestjs/*` — the platform itself, not a vendor to abstract.
- `@fastify/*` plugins — bootstrap wiring only; no business-code call sites.
- Pure, dependency-light utilities consumed via shared helpers.

## What does NOT exist (by design)

No ORM/DB client, no cache client, no queue/broker client, no payment SDK, no email/SMS
vendor — see [database-decisions.md](./database-decisions.md) and
[event-notification-decisions.md](./event-notification-decisions.md). Adding any of these
requires an ADR first.
