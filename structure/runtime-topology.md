---
id: structure-runtime-topology
title: Runtime Topology — Processes, Ports, Compose Services, SSE, No Database
type: structure
authority: canonical
status: current
owner: repository owner
summary: What runs where — the two processes and their ports, docker-compose services, the SSE streaming path, and the statement that the API is stateless with no database.
keywords: [runtime, topology, processes, ports, docker, compose, sse, streaming, stateless, no-database]
contextTier: 2
relatedCode: [docker-compose.yml, docker-compose.dev.yml, apps/api/src/bootstrap/bootstrap.ts, apps/web/src/proxy.ts]
relatedTests: [apps/api/src/tests/game-analyze-stream.integration.test.ts, apps/api/src/tests/game-stream-isolation.integration.test.ts]
relatedDocs: [docs/docker-local-dev.md, structure/entrypoint-catalog.yaml, structure/flows/analyze-flow.md]
readWhen: You are running, deploying, debugging connectivity, or reasoning about state and scaling.
---

# Runtime Topology — Processes, Ports, Compose Services, SSE, No Database

## Processes and ports

Two long-running processes; no database, no message broker, no background workers.

| Process | Port | Entry | Notes |
| --- | --- | --- | --- |
| `twinzy-api` (NestJS on Fastify) | `4000` (env `API_PORT`, default per `apps/api/src/config/env.schema.ts`) | `apps/api/src/main.ts` → `bootstrap/bootstrap.ts`, listens on `0.0.0.0` | Routes under `/api/v1` (`bootstrap/configure-lifecycle.ts`); Swagger at `/docs` when enabled (off in production by default) |
| `@twinzy/web` (Next.js 16) | `3000` (compose `WEB_PORT`) | Next App Router, `apps/web/src/app/layout.tsx`; CSP proxy `apps/web/src/proxy.ts` | Talks to the API via `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000`, `apps/web/src/packages/env/public-env.ts`) |

CORS on the API is **closed by default** — open only for origins listed in
`CORS_ALLOWED_ORIGINS` (`apps/api/src/bootstrap/configure-security.ts`).

## docker-compose services

`docker-compose.yml` (production-shaped local stack, `npm run docker:up`):

| Service | Image | Ports | Hardening |
| --- | --- | --- | --- |
| `api` | `twinzy-api:local` (Dockerfile.api) | `${API_PORT:-4000}:4000` | `read_only`, tmpfs `/tmp`, `no-new-privileges`, `cap_drop: ALL`, 1 GB/1 CPU; **no volumes on purpose: uploads must never persist** (comment in the file) |
| `web` | `twinzy-web:local` (Dockerfile.web) | `${WEB_PORT:-3000}:3000` | same hardening, 512 MB/0.5 CPU; `depends_on: api` |
| `clamav` | `clamav/clamav:stable` | `expose: 3310` only — internal network, never published | opt-in via compose profile `clamav`; used when `ENABLE_CLAMAV=true` |

`docker-compose.dev.yml` runs a single `node:24-alpine` `dev` service executing
`npm ci && npm run dev` with ports `3000` and `4000` and a `dev_node_modules` volume.
Details: [docs/docker-local-dev.md](../docs/docker-local-dev.md).

## SSE streaming flow (runtime view)

Full step-by-step walkthrough: [flows/analyze-flow.md](flows/analyze-flow.md).

1. Web opens the app's only streaming fetch (`apps/web/src/packages/axios/stream-request.ts`) —
   multipart POST to `/api/v1/game/analyze/stream`, no client timeout, abort closes the socket.
2. `GameStreamPresenter` (`apps/api/src/modules/game/api/game-stream.presenter.ts`) hijacks the
   reply, admits through `ConcurrencyLimiter`, registers with `StreamRegistry`, and stamps every
   frame with `tabId/requestId/streamId` + `StreamStatus`.
3. Heartbeat comment every 10 s (`STREAM_HEARTBEAT_INTERVAL_MS`); watchdog abort at
   `ANALYSIS_TIMEOUT_MS`; `SseWriter` sets `X-Accel-Buffering: no` to defeat proxy buffering
   (`apps/api/src/core/http/sse-writer.ts`).
4. Client cancel: `POST /api/v1/game/cancel` — the registry aborts only when
   streamId AND tabId AND requestId all match (`apps/api/src/core/streaming/stream-registry.service.ts`).

## State model: stateless API, no database

- **There is no database.** The privacy module doc records: "Twinzy stores no user data by
  design — there is deliberately no repository anywhere in this API"
  (`apps/api/src/modules/privacy/privacy.module.ts`). Uploaded images live in request memory
  only and are zero-filled in `finally` ([flows/analyze-flow.md](flows/analyze-flow.md)).
- The only server-side state is in-memory and single-process:
  - `ConcurrencyLimiter` + `StreamRegistry` (`apps/api/src/core/streaming/`) — admission
    counters and abort controllers; explicitly documented as a horizontal-scaling limitation.
  - Share results: in-memory TTL cache behind the `SHARE_RESULT_CACHE` port
    (`apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts`);
    records vanish on restart; Redis/Valkey is the documented production extension of the port.
  - Payment captures are never persisted (`apps/api/src/modules/payments/model/payment.types.ts`).
- Consequence: the API scales vertically as a single instance today; multi-instance deployment
  requires an externalized share cache and stream/limit coordination first.

## External integrations (outbound only)

| Peer | Client (the only file) | When |
| --- | --- | --- |
| Google Gemini | `apps/api/src/modules/ai/adapters/gemini.adapter.ts` | always (vision + text steps) |
| OpenAI-compatible providers (openai/deepseek/qwen/kimi/glm) | `apps/api/src/modules/ai/adapters/openai-compat.adapter.ts` | per-provider API key present |
| PayPal REST (Orders v2 + Refunds) | `apps/api/src/modules/payments/adapters/paypal.adapter.ts` | paywall env-enabled only |
| clamd (TCP INSTREAM) | `apps/api/src/modules/file-security/adapters/clamav.adapter.ts` | `ENABLE_CLAMAV=true` |
| PayPal JS SDK + paypal.me (browser) | `apps/web/src/packages/paypal/paypal-sdk.ts`; donate link `apps/web/src/shared/helpers/donate-link.helper.ts` | env-configured only |
