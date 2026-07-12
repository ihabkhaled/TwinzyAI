---
id: operations-slis
title: Service-Level Indicators (SLIs)
type: operations
authority: canonical
status: current
owner: repository owner
summary: Candidate SLIs derivable from signals that already exist — pino request logs, the health endpoint, Docker healthchecks, and SSE terminal statuses.
keywords: [sli, indicators, latency, error-rate, availability, logs, health, sse, measurement]
contextTier: 2
relatedCode: [apps/api/src/core/logger/http-logging.options.ts, apps/api/src/modules/health/application/health.service.ts, apps/api/src/modules/game/lib/game-stream.ts]
relatedTests: [apps/api/src/core/logger/tests/http-logging.options.test.ts, apps/api/src/tests/game-analyze-stream.integration.test.ts]
relatedDocs: [operations/SLOs.md, operations/observability-map.md, operations/logging-catalog.md]
readWhen: You want to measure service health, or you are picking indicators before setting SLO targets.
---

# Service-Level Indicators (SLIs)

There is no metrics pipeline today ([observability-map.md](observability-map.md)); every
indicator below is derivable from signals that already exist. Nothing here invents new
instrumentation.

## Candidate SLIs and their existing sources

| Candidate SLI | Existing signal | Source |
| --- | --- | --- |
| HTTP availability (share of non-5xx responses) | pino-http logs every request; 5xx are escalated to `error`, 4xx to `warn` | [apps/api/src/core/logger/http-logging.options.ts](../apps/api/src/core/logger/http-logging.options.ts) |
| HTTP error-class breakdown | Sanitized error envelope with stable `errorCode` on every failure | [apps/api/src/core/errors/error-body.mapper.ts](../apps/api/src/core/errors/error-body.mapper.ts) |
| Liveness / process uptime | `GET /api/v1/health` returns `uptimeSeconds` | [apps/api/src/modules/health/application/health.service.ts](../apps/api/src/modules/health/application/health.service.ts) |
| Container health flapping | Docker `HEALTHCHECK` status (30s cadence) | [Dockerfile.api](../Dockerfile.api), [Dockerfile.web](../Dockerfile.web) |
| Analysis outcome mix (completed / cancelled / failed / rejected) | Every SSE run terminates with a `StreamStatus` (`Completed`/`Cancelled`/`Failed`/`Rejected`) stamped on frames | [apps/api/src/modules/game/lib/game-stream.ts](../apps/api/src/modules/game/lib/game-stream.ts) |
| Saturation (admission pressure) | `ServerBusy` rejections from the admission limiter appear in logs via the error envelope | [apps/api/src/core/streaming/concurrency-limiter.service.ts](../apps/api/src/core/streaming/concurrency-limiter.service.ts) |
| Orphaned-stream reaping | `StreamRegistry` warn-logs "Reaped N stale stream(s) past TTL" | [apps/api/src/core/streaming/stream-registry.service.ts](../apps/api/src/core/streaming/stream-registry.service.ts) |
| AI provider latency (offline, per model/route) | `ai:benchmark` computes p50/p95 latency and schema/safety scores per route entry | [apps/api/src/benchmark/lib/benchmark-metrics.util.ts](../apps/api/src/benchmark/lib/benchmark-metrics.util.ts), [docs/ai-benchmarking.md](../docs/ai-benchmarking.md) |

Correlation across a request's log lines uses the per-request UUID minted at the transport
edge ([apps/api/src/bootstrap/fastify-adapter.ts](../apps/api/src/bootstrap/fastify-adapter.ts)).

## Deferred

- **In-request latency percentiles as a live SLI** — Deferred — needs the timing metrics that
  [ADR-003](../architecture/adrs/adr-003-horizontal-scaling-plan.md) prescribes adding before
  any scaling decision; today latency exists only in raw request logs and offline benchmark runs.
- **AI pipeline stage-duration SLI** — Deferred — SSE `Stage` events mark stage transitions
  ([apps/api/src/modules/game/api/game-stream.presenter.ts](../apps/api/src/modules/game/api/game-stream.presenter.ts))
  but no recorded aggregation of stage timings exists.
