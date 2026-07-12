---
id: contracts-api-readme
title: HTTP API Endpoint Index
type: contract
authority: canonical
status: current
owner: repository owner
summary: Every HTTP endpoint the Twinzy API exposes, with method, full path, throttle, body cap, and the doc that owns its detailed contract.
keywords: [api, endpoints, routes, http, versioning, prefix, throttle, body-limit, index]
contextTier: 2
relatedCode: [apps/api/src/bootstrap/configure-lifecycle.ts, apps/api/src/bootstrap/bootstrap.constants.ts, packages/shared/src/constants/app.constants.ts]
relatedTests: [apps/api/src/tests/health.integration.test.ts, apps/api/src/tests/game-analyze.integration.test.ts]
relatedDocs: [contracts/api/analyze.md, contracts/api/payments.md, contracts/api/share-results.md, contracts/api/error-envelope.md]
readWhen: You need the full list of API routes, their prefixes, throttles, or transport-level body caps.
---

# HTTP API Endpoint Index

## Prefix rule

Every controller route resolves under **`/api/v1`**: `apps/api/src/bootstrap/configure-lifecycle.ts`
applies `setGlobalPrefix(API_GLOBAL_PREFIX)` (`'api'`, from
`packages/shared/src/constants/app.constants.ts`) plus URI versioning with default version `1`
(`DEFAULT_API_VERSION` in `apps/api/src/bootstrap/bootstrap.constants.ts`). Client-side path
constants (`GAME_ANALYZE_PATH`, `PAYMENTS_ORDERS_PATH`, `SHARE_RESULTS_PATH`, `HEALTH_PATH`, …)
already include the prefix and live in `packages/shared/src/constants/app.constants.ts` and
`packages/shared/src/constants/share-result.constants.ts`.

## Endpoints

| Method | Path | Throttle (per client) | Body cap | Contract doc |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/game/analyze` | 10/min | multipart, 10 MB transport hard cap | [analyze.md](analyze.md) |
| POST | `/api/v1/game/analyze/stream` | 10/min | multipart, 10 MB transport hard cap | [analyze.md](analyze.md), [sse-events.md](sse-events.md) |
| POST | `/api/v1/game/cancel` | 60/min | 8,192 B | [analyze.md](analyze.md), [sse-events.md](sse-events.md) |
| POST | `/api/v1/game/translate-result` | 10/min | 262,144 B | [analyze.md](analyze.md) |
| POST | `/api/v1/payments/orders` | 10/min | 4,096 B | [payments.md](payments.md) |
| POST | `/api/v1/share-results` | 20/min | multipart-global limit; payload capped by `SHARE_RESULT_MAX_PAYLOAD_BYTES` | [share-results.md](share-results.md) |
| GET | `/api/v1/share-results/:shareId` | 120/min | n/a | [share-results.md](share-results.md) |
| DELETE | `/api/v1/share-results/:shareId` | 20/min | n/a | [share-results.md](share-results.md) |
| GET | `/api/v1/health` | global default (30/min) | n/a | this file, below |

Sources: game routes and throttles in `apps/api/src/modules/game/api/game.controller.ts` +
`apps/api/src/modules/game/model/game.constants.ts`; payments in
`apps/api/src/modules/payments/api/payments.controller.ts` +
`apps/api/src/modules/payments/model/payment.constants.ts`; share-results in
`apps/api/src/modules/share-results/api/share-results.controller.ts` +
`apps/api/src/modules/share-results/model/share-result.constants.ts`; per-route JSON body caps
in `apps/api/src/bootstrap/bootstrap.constants.ts` (`JSON_ROUTE_BODY_LIMITS`); the global
throttle default (`RATE_LIMIT_MAX` 30 per `RATE_LIMIT_TTL_MS` 60 s) in
`apps/api/src/config/env.schema.ts` applied by `apps/api/src/core/rate-limit/rate-limit.module.ts`.

## `GET /api/v1/health`

Liveness endpoint (`apps/api/src/modules/health/api/health.controller.ts`). Response is
`HealthResponseSchema` (`packages/shared/src/schemas/health.schema.ts`):
`{ status: 'ok', service, version, uptimeSeconds }` with `service: 'twinzy-api'` and
`version: '0.1.0'` from `apps/api/src/modules/health/model/health.constants.ts`. No auth, no
env, no body. Integration coverage: `apps/api/src/tests/health.integration.test.ts` (also pins
the 404 error envelope for unknown routes).

## Cross-cutting transport rules

- **No auth anywhere** — the game is anonymous; Swagger is mounted at `/docs` without an auth
  scheme when enabled (`apps/api/src/bootstrap/configure-swagger.ts`).
- **CORS is closed by default**: only origins in `CORS_ALLOWED_ORIGINS` are allowed; methods
  GET/POST/DELETE (`apps/api/src/bootstrap/configure-security.ts`).
- **Errors** on every route use the single envelope — see
  [error-envelope.md](error-envelope.md).
- **429** from any throttle maps to `ErrorCode.RateLimited` via
  `apps/api/src/core/errors/error-body.mapper.ts`.
