---
id: contracts-readme
title: contracts/ — Canonical Contract Surfaces
type: contract
authority: canonical
status: current
owner: repository owner
summary: Index of every machine contract in the monorepo — HTTP endpoints, SSE events, AI provider port, shared zod schemas, env contract, and third-party integrations — with the compatibility policy that governs changing them.
keywords: [contracts, api, schema, zod, sse, endpoints, compatibility, versioning, error-codes, shared]
contextTier: 2
relatedCode: [packages/shared/src/index.ts, apps/api/src/bootstrap/configure-lifecycle.ts]
relatedTests: [packages/shared/tests/schemas.test.ts, packages/shared/tests/stream-contract.test.ts]
relatedDocs: [contracts/catalog.yaml, contracts/api/README.md, docs/env-vars.md]
readWhen: You are changing any request/response shape, event, schema, error code, env var, or third-party call surface.
---

# contracts/ — Canonical Contract Surfaces

This area documents every contract boundary in TwinzyAI. A "contract" is any shape that two
sides must agree on: HTTP request/response bodies, SSE event frames, the AI provider port,
env configuration, and the wire surfaces of third-party integrations. The machine-readable
inventory is [`catalog.yaml`](catalog.yaml).

## Contract areas

| Area | Docs | What it covers |
| --- | --- | --- |
| HTTP API | [`api/`](api/README.md) | All endpoints under `/api/v1`, multipart/JSON bodies, throttles, error envelope |
| SSE stream | [`api/sse-events.md`](api/sse-events.md) | Event names, stages, correlation envelope, terminal frames, cancellation |
| AI pipeline | [`ai/`](ai/README.md) | The `AiProviderAdapter` port, per-step schemas, routing env, prompt I/O |
| Frontend ↔ backend | [`frontend-backend/shared-schemas.md`](frontend-backend/shared-schemas.md) | The `@twinzy/shared` zod schema catalog and its consumers |
| Configuration | [`configuration/env-contract.md`](configuration/env-contract.md) | Env-var contract pointer (detail owned by `docs/env-vars.md`) |
| Integrations | [`integrations/`](integrations/paypal.md) | PayPal REST, ClamAV TCP, Gemini SDK, OpenAI-compatible HTTP |

## Where the schemas live

- **Cross-side contracts** (validated on both the API and the web app) live in
  `packages/shared/src/schemas/` (11 files) plus the error envelope in
  `packages/shared/src/types/api-error.schema.ts`. Everything is exported through the
  `packages/shared/src/index.ts` barrel. See
  [`frontend-backend/shared-schemas.md`](frontend-backend/shared-schemas.md).
- **Backend-internal contracts** (never crossing to the web) live next to their owner: the
  analyze multipart body in `apps/api/src/modules/game/api/dto/analyze-request.dto.ts` and the
  lenient PayPal response views in `apps/api/src/modules/payments/model/paypal.schemas.ts`.
- **Env contract**: every variable is defined once in `apps/api/src/config/env.schema.ts`
  (zod, fail-fast) — see [`configuration/env-contract.md`](configuration/env-contract.md).

## Compatibility policy

Grounded in doc comments and tests inside the owning files:

1. **Error codes are add-only.** The `ErrorCode` catalog
   (`packages/shared/src/constants/error-code.constants.ts`) may gain codes but existing
   codes are never renamed or removed — the frontend maps them to friendly copy
   (`apps/web/src/modules/game/helpers/game-error.helper.ts`).
2. **The error envelope grows additively.** `messageKey` was added on top of the legacy
   `{statusCode, errorCode, message}` triple without breaking existing clients
   (`apps/api/src/core/errors/error.types.ts`). See
   [`api/error-envelope.md`](api/error-envelope.md).
3. **AI responses are version-pinned.** `GAME_PROMPT_VERSION = 'written-traits-v5'`
   (`packages/shared/src/constants/app.constants.ts`) is a `z.literal` in every AI response
   schema, so a stale model/template pairing fails validation instead of drifting silently.
4. **Route paths are single-sourced.** Path constants live in
   `packages/shared/src/constants/app.constants.ts` (client side) and per-module
   `*.constants.ts` route segments (server side, composed with the global `/api` prefix +
   URI version `v1` from `apps/api/src/bootstrap/configure-lifecycle.ts`), so transport
   protections such as per-route body caps can never drift from the decorators
   (`apps/api/src/modules/game/model/game.constants.ts`).
5. **SSE envelope fields are optional in the schema only for backward compatibility** — the
   server always stamps them (`packages/shared/src/schemas/game-stream.schema.ts`).
6. **Changing a shared schema is a cross-side change**: both `apps/api` and `apps/web`
   validate against the same file, and `packages/shared/tests/` pins the shapes. Follow the
   governance policy in [`CLAUDE.md`](../CLAUDE.md) for any breaking change.

## Contract truth vs. this documentation

The zod schemas and route constants in code are the executable truth. If any statement in
this folder disagrees with the owning source file, the source file wins — fix the doc.
