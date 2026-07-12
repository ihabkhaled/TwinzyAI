---
id: operations-observability-map
title: Observability Map
type: operations
authority: canonical
status: current
owner: repository owner
summary: What runtime signals exist — structured pino logs with request-id correlation, the health endpoint, Docker healthchecks, SSE statuses — and what does not (metrics, traces, alerts).
keywords: [observability, logging, pino, correlation, request-id, metrics, traces, alerts, signals]
contextTier: 2
relatedCode: [apps/api/src/core/logger/logger.module.ts, apps/api/src/core/logger/http-logging.options.ts, apps/api/src/bootstrap/fastify-adapter.ts]
relatedTests: [apps/api/src/core/logger/tests/http-logging.options.test.ts]
relatedDocs: [operations/logging-catalog.md, operations/SLIs.md, runbooks/README.md, rules/22-observability-logging.md]
readWhen: You need to diagnose production behavior or decide where a new signal should be emitted.
---

# Observability Map

The logging standard is owned by [rules/22-observability-logging.md](../rules/22-observability-logging.md);
the line-by-line catalog is [logging-catalog.md](logging-catalog.md). This map says what exists.

## Signals that exist

1. **Structured JSON logs (pino)** — the only telemetry pipeline. `nestjs-pino` is global;
   every HTTP request is auto-logged, 4xx escalate to `warn` and 5xx to `error`; level set by
   `LOG_LEVEL` (default `info`); pretty transport in development only
   ([apps/api/src/core/logger/logger.module.ts](../apps/api/src/core/logger/logger.module.ts),
   [apps/api/src/core/logger/http-logging.options.ts](../apps/api/src/core/logger/http-logging.options.ts)).
2. **Request correlation** — a UUID request id is minted per request at the Fastify adapter
   (`genReqId`) and appears on the request's log lines
   ([apps/api/src/bootstrap/fastify-adapter.ts](../apps/api/src/bootstrap/fastify-adapter.ts));
   runbooks treat request-id log correlation as ground truth
   ([runbooks/README.md](../runbooks/README.md)).
3. **Stable error taxonomy** — every failure carries a machine-readable `errorCode` in the
   response envelope and in logs
   ([apps/api/src/core/errors/error-body.mapper.ts](../apps/api/src/core/errors/error-body.mapper.ts)).
4. **Liveness** — `GET /api/v1/health` + Docker healthchecks ([health-checks.md](health-checks.md)).
5. **Client-visible progress** — SSE frames stamp `{tabId, requestId, streamId, status}` and
   stage events (`Validating` … `Aggregating`), giving per-run traceability from the client side
   ([apps/api/src/modules/game/api/game-stream.presenter.ts](../apps/api/src/modules/game/api/game-stream.presenter.ts)).
6. **Offline AI quality/latency evidence** — the benchmark harness produces per-route p50/p95
   and schema/safety scores ([docs/ai-benchmarking.md](../docs/ai-benchmarking.md)).
7. **CI security signal** — Trivy SARIF uploaded to GitHub code scanning (category `trivy-fs`,
   [.github/workflows/gate-security-scan.yml](../.github/workflows/gate-security-scan.yml)).

## How to look

`npm run docker:logs` tails the compose stack ([package.json](../package.json)); logs are
stdout-only JSON — no log files, shippers, or aggregation services are configured in the repo.

## What does NOT exist (honest gaps)

- **Metrics** — no Prometheus/StatsD/OpenTelemetry metrics anywhere;
  [ADR-003](../architecture/adrs/adr-003-horizontal-scaling-plan.md) requires adding timing
  metrics before any scaling work.
- **Distributed tracing** — none; correlation is the per-request UUID only.
- **Dashboards and alerting** — none configured; healthcheck failures surface only in Docker
  status. Setting these up is a paywall-LIVE-adjacent readiness concern
  ([availability-expectations.md](availability-expectations.md)).
- **Log aggregation/retention** — nothing recorded; container stdout is the retention boundary.

## Privacy boundary (non-negotiable)

Logs must never contain image bytes, submitted values, or secrets; redaction is mechanical
(pino redact paths + `redactForLog`) — see [logging-catalog.md](logging-catalog.md) and
[docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md).
