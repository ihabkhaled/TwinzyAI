---
id: summary-backend
title: Backend Summary — Modules, Endpoints, Core, Config
type: summary
authority: canonical
status: current
owner: repository owner
generated: false
summary: Routing digest of apps/api — the 8 modules with responsibilities, all 9 HTTP endpoints, core/ cross-cutting concerns, and the typed config approach.
keywords: [backend, nestjs, api, modules, endpoints, routes, core, config, fastify, errors, streaming]
contextTier: 1
relatedCode: [apps/api/src/app.module.ts, apps/api/src/bootstrap/bootstrap.ts, apps/api/src/config/env.schema.ts, apps/api/src/core/errors/app-exception.filter.ts]
relatedTests: [apps/api/src/tests/game-analyze.integration.test.ts, apps/api/src/tests/share-results.integration.test.ts]
relatedDocs: [context/architecture-map.md, rules/16-backend-architecture.md, docs/backend-architecture.md]
readWhen: You are changing apps/api and need the module map, an endpoint, a core concern, or the config surface.
---

# Backend Summary — Modules, Endpoints, Core, Config

Bootstrap order is fixed (`apps/api/src/bootstrap/bootstrap.ts`): createApp → configureSecurity (helmet, cookie, bounded multipart 1 file, per-route JSON body caps, **CORS closed by default**) → configureValidation (zod-only per-route pipes, **no global pipe**) → configureLifecycle (`/api` prefix + URI v1 + shutdown hooks) → optional Swagger (`/docs`, off in prod by default) → listen on `0.0.0.0:API_PORT`.

## The 9 endpoints (all `/api/v1/...`; throttles in module `model/*.constants.ts`)

| Endpoint | Throttle | Owner |
| --- | --- | --- |
| `GET /health` | global (30/min) | `modules/health` — `{status:'ok', service:'twinzy-api', version, uptimeSeconds}` |
| `POST /game/analyze` | 10/min | `modules/game` — multipart consent+image → `FinalGameResult` |
| `POST /game/analyze/stream` | 10/min | `modules/game` — SSE variant; admission via ConcurrencyLimiter |
| `POST /game/cancel` | 60/min | `modules/game` — aborts only on exact streamId+tabId+requestId match; 8 KiB body cap |
| `POST /game/translate-result` | 10/min | `modules/game` — text-only re-localization; 256 KiB body cap |
| `POST /payments/orders` | 10/min | `modules/payments` — `{requestId}` → server-priced PayPal order; 4 KiB body cap |
| `POST /share-results` | 20/min | `modules/share-results` — mint temp share (CSPRNG UUID) |
| `GET /share-results/:shareId` | 120/min | `modules/share-results` — missing and expired return identical 404 |
| `DELETE /share-results/:shareId` | 20/min | `modules/share-results` — idempotent 204 |

## Modules (`apps/api/src/modules/` — detail in the map each cites)

- **ai** — 4 step services behind the `AI_PROVIDER_ADAPTER` port served by `AiRouterService`; GeminiAdapter (sole `@google/genai` importer) + one OpenAiCompatAdapter for openai/deepseek/qwen/kimi/glm; prompts as markdown; AiSafetyService. See `knowledge/summaries/ai-pipeline.md`.
- **file-security** — the rules/15 upload chain + `TemporaryFileCleanupService` buffer zero-fill; typed 415/422/503 errors; ClamAV fail-closed. See `knowledge/summaries/security.md`.
- **game** — the only multi-endpoint transport; use-cases orchestrate consent → file security → payment capture → extraction (image wiped in `finally`) → text-only matching; `GameStreamPresenter` owns the SSE lifecycle (heartbeat comment every 10 s, watchdog at `ANALYSIS_TIMEOUT_MS`).
- **health** — liveness only, no dependency I/O.
- **payments** — config-gated PayPal Orders v2 gate; `PaymentGateService` no-ops when paywall off; `PaypalAdapter` is the only PayPal REST caller (OAuth cache, 15 s timeouts, idempotency header, field-by-field capture verification, best-effort refund).
- **privacy** — `redactForLog`: caps values at 500 chars, replaces base64 runs and key/token/authorization secrets; "no repository anywhere by design".
- **result-aggregation** — pure final-response shaping; server-side disclaimer/fallback.
- **share-results** — TTL cache behind the `SHARE_RESULT_CACHE` port (in-memory driver; Redis is the documented extension); create re-validates payload as untrusted (byte budget, forbidden wording, embedded-image rejection).

## core/ cross-cutting

- **errors** — `AppError` hierarchy (400/402/404/413/429/502); `error-factory.ts` is the only constructor of the (message, messageKey, errorCode) triple; global `AppExceptionFilter` maps every throw via `toErrorBody` into `{statusCode, errorCode, message, messageKey}`; 4xx warn, 5xx error, unknown → opaque 500. `ErrorCode` (24 frozen codes) is re-exported from `@twinzy/shared`.
- **logger** — nestjs-pino behind the `AppLoggerPort`; transient `AppLogger` (use `app.resolve()`); redaction paths in `core/logger/logger.constants.ts`.
- **validation** — `createZodValidationPipe(schema)` per route; logs flattened field/constraint issues, never values.
- **rate-limit** — global ThrottlerGuard from `RATE_LIMIT_TTL_MS`/`RATE_LIMIT_MAX`; `Throttle` re-exported via `rate-limit.vendor.ts`.
- **http** — multipart wire-order parser (consent must precede the file; buffers zeroed on failure), `@UploadedImage()`/`@MultipartBody()`/`@StreamMeta()` decorators, `SseWriter` (anti-buffering headers).
- **streaming** — `ConcurrencyLimiter` (global/per-IP/per-tab caps 50/3/1, bounded FIFO queue, SERVER_BUSY) and `StreamRegistry` (streamId→AbortController, TTL sweep). **Both explicitly single-process in-memory** (ADR-003 defers scaling).

## Config approach

Every env var is defined once in `apps/api/src/config/env.schema.ts` (zod; `validateEnv` crashes startup on invalid config; superRefine `STREAM_TTL_MS >= ANALYSIS_TIMEOUT_MS`). `AppConfigService` is the only injectable surface; `process.env` is readable only in `src/config` and `src/bootstrap/fastify-adapter.ts` (TRUST_PROXY, pre-DI) — lint-enforced. Key derived getters: `isPaywallEnabled` (both PayPal creds non-empty), `isProviderEnabled` (API-key presence), `aiRouteFor(step)`, `swaggerEnabled` (`!isProduction` default). Full env groups: `knowledge/summaries/configuration.md`.

Known drift: the env.schema.ts comment about "vision capability declarations" (lines ~153–158) is stale — no such var exists; the image fail-closed policy is `AI_IMAGE_STEPS = [extraction]` + the registry's Gemini-only vision filter.
