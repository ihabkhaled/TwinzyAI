---
id: operations-scaling-model
title: Scaling Model
type: operations
authority: canonical
status: current
owner: repository owner
summary: The API is a stateless single-process service whose concurrency is bounded by env-driven admission caps; horizontal scaling is deliberately deferred per ADR-003.
keywords: [scaling, concurrency, stateless, single-process, admission, caps, queue, adr-003]
contextTier: 2
relatedCode: [apps/api/src/core/streaming/concurrency-limiter.service.ts, apps/api/src/core/streaming/stream-registry.service.ts, apps/api/src/config/env.schema.ts, apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts]
relatedTests: [apps/api/src/core/streaming/tests/concurrency-limiter.service.test.ts, apps/api/src/tests/game-stream-isolation.integration.test.ts]
relatedDocs: [architecture/adrs/adr-003-horizontal-scaling-plan.md, operations/performance-budgets.md]
readWhen: You are sizing the deployment, tuning concurrency caps, or considering running more than one API instance.
---

# Scaling Model

## Stateless by design

The API has no database and persists nothing: images live in request memory only and are
zero-filled in `finally`; results are returned, never stored
([apps/api/src/modules/privacy/privacy.module.ts](../apps/api/src/modules/privacy/privacy.module.ts),
[docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md)). All durable-looking
state is in-memory and instance-local:

- **Rate limiting** — global `ThrottlerGuard`
  ([apps/api/src/core/rate-limit/rate-limit.module.ts](../apps/api/src/core/rate-limit/rate-limit.module.ts)).
- **Analysis admission** — `ConcurrencyLimiter`
  ([apps/api/src/core/streaming/concurrency-limiter.service.ts](../apps/api/src/core/streaming/concurrency-limiter.service.ts)),
  explicitly documented as single-process.
- **Stream cancellation** — `StreamRegistry`
  ([apps/api/src/core/streaming/stream-registry.service.ts](../apps/api/src/core/streaming/stream-registry.service.ts)),
  "Single-process/in-memory: it governs one API instance (documented limitation for horizontal scaling)".
- **Share links** — in-memory TTL cache; "records gone on restart"
  ([apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts](../apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts)).

## What bounds concurrency

All caps are env-driven and validated in
[apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts) (bounds in
[apps/api/src/config/env-bounds.constants.ts](../apps/api/src/config/env-bounds.constants.ts)):

| Cap | Env var | Default |
| --- | --- | --- |
| Global concurrent analyses | `MAX_GLOBAL_ACTIVE_ANALYSES` | 50 |
| Concurrent analyses per IP | `MAX_ACTIVE_ANALYSES_PER_IP` | 3 |
| Concurrent analyses per tab | `MAX_ACTIVE_ANALYSES_PER_TAB` | 1 |
| Waiting-queue size (FIFO) | `MAX_ANALYSIS_QUEUE_SIZE` | 100 |
| Per-run watchdog | `ANALYSIS_TIMEOUT_MS` | 120 000 ms |
| Stream registration TTL (≥ watchdog, enforced by superRefine) | `STREAM_TTL_MS` | 180 000 ms |

Over-capacity requests wait in the bounded FIFO queue; a full queue, watchdog expiry, or abort
returns `SERVER_BUSY` ([apps/api/src/core/streaming/concurrency-limiter.service.ts](../apps/api/src/core/streaming/concurrency-limiter.service.ts)).
Request-rate ceilings (global 30/min plus per-route throttles) are in
[performance-budgets.md](performance-budgets.md). Container resources are capped at 1 GiB / 1.0
CPU (api) and 512 MiB / 0.5 CPU (web) in [docker-compose.yml](../docker-compose.yml).

Per-IP caps assume real client IPs: behind a reverse proxy, `TRUST_PROXY=true` must be set —
default is `false` precisely so a directly exposed container cannot be spoofed
([apps/api/src/bootstrap/fastify-adapter.ts](../apps/api/src/bootstrap/fastify-adapter.ts)).

## Horizontal scaling: deliberately deferred

[ADR-003](../architecture/adrs/adr-003-horizontal-scaling-plan.md) (Accepted — implementation
deferred): keep a single process, add timing metrics first, and revisit only after profiling
proves a bottleneck. Running multiple API replicas today would silently break per-IP/per-tab
caps, cross-instance cancel, and share-link retrieval, because all of that state is
instance-local (sources above). Do not scale out without executing the ADR-003 plan (e.g.
externalizing the share cache behind its existing port —
[apps/api/src/modules/share-results/model/share-result.port.ts](../apps/api/src/modules/share-results/model/share-result.port.ts)).
