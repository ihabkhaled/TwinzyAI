---
id: summary-operations
title: Operations Summary — Docker Topology, Health, Logging, Shutdown, No-DB
type: summary
authority: canonical
status: current
owner: repository owner
generated: false
summary: Routing digest of operations — the compose topology, health checking, the logging/metrics reality, graceful shutdown, and the operational consequences of having no database.
keywords: [operations, docker, compose, health check, logging, metrics, shutdown, rollback, runbooks, clamav, single process]
contextTier: 1
relatedCode: [apps/api/src/modules/health/api/health.controller.ts, apps/api/src/bootstrap/configure-lifecycle.ts, apps/api/src/core/logger/http-logging.options.ts]
relatedTests: [apps/api/src/tests/health.integration.test.ts]
relatedDocs: [runbooks/README.md, docs/docker-local-dev.md, rules/24-release-gate.md, architecture/adrs/adr-003-horizontal-scaling-plan.md]
readWhen: You are deploying, debugging production behavior, running the compose stack, or writing/using a runbook.
---

# Operations Summary — Docker Topology, Health, Logging, Shutdown, No-DB

## Topology

Compose stack (`runbooks/README.md`, `docs/docker-local-dev.md`): **api:4000**, **web:3000**, optional **clamav:3310** (profile-gated). Production images are multi-stage, non-root, with healthchecks and **no upload volumes** (nothing to mount — uploads never touch disk). Local dev: `cp .env.example .env` (fill `GEMINI_API_KEY`), `npm run dev` (web:3000 / api:4000); a dev compose watch mode exists. Release gate includes a mandatory Docker smoke: `docker:rebuild` → `docker:up` → containers healthy → `/health` answering → one full mocked analyze flow → `docker:down` (`rules/24-release-gate.md`).

## Health

`GET /api/v1/health` returns `{status:'ok', service:'twinzy-api', version:'0.1.0', uptimeSeconds}` (`apps/api/src/modules/health/`). By rule it performs **no dependency I/O** (`rules/08-reliability-durability.md`), so it proves liveness, not provider reachability. Swagger at `/docs` only when `swaggerEnabled` (off in production by default).

## Logging / metrics reality

- Structured pino logs with per-request UUID correlation (`genReqId` in `apps/api/src/bootstrap/fastify-adapter.ts`); every request auto-logged; 4xx escalated to warn, 5xx to error with the original exception attached (`core/logger/http-logging.options.ts`, `core/errors/app-exception.filter.ts`). Redaction rules: `knowledge/summaries/privacy.md`.
- pino-pretty transport in development only; `LOG_LEVEL` env-driven.
- **No metrics/APM/tracing vendor exists today** — recorded standing decision; adoption requires a port + ADR (`memory/observability-decisions.md`). Diagnosis ground truth is request-id log correlation + the `ApiErrorResponse` envelope (`runbooks/README.md`).
- Frontend: `packages/logger` facade; error boundaries log the Next.js digest (`rules/frontend/16-observability-analytics.md`).

## Shutdown and process model

`app.enableShutdownHooks()` is wired in `bootstrap/configure-lifecycle.ts` (OnModuleDestroy on SIGTERM); the share cache sweeper and stream-registry sweep intervals are `unref`'d and cleared in `onModuleDestroy`. All platform state (ConcurrencyLimiter, StreamRegistry, share cache) is **single-process in-memory** — restart drops active streams and share records by design; horizontal scaling is deliberately deferred until profiling proves need (ADR-003, `architecture/adrs/adr-003-horizontal-scaling-plan.md`).

## No database — operational consequences

There is no DB, no migrations, no backups, no data-restore procedure; the API is stateless (`memory/database-decisions.md`; `modules/privacy` module doc). **Rollback is always `git revert` + redeploy** (`runbooks/README.md`). Share links do not survive restarts (in-memory driver; Redis/Valkey is the documented — not built — extension of the `SHARE_RESULT_CACHE` port).

## Runbooks (`runbooks/`)

Concrete: `api-outage.md`, `ai-provider-outage.md` (Gemini timeouts/5xx → analyze 502), `release-smoke-test.md`, `secret-rotation.md`. Templates: incident-response, rollback, release-smoke-test. Support escalation table: `support/README.md` (`knowledge/summaries/support.md`).

## CI gates (all on PR, push to main, dispatch — `.github/workflows/`)

`gate-lint` (lint + format:check + dead-code + circular), `gate-typecheck`, `gate-unit-tests`, `gate-coverage`, `gate-e2e` (Playwright + report artifact), `gate-build`, `gate-security-scan` (npm audit + Trivy vuln/secret/misconfig + SARIF upload). Local Husky hooks mirror the authoritative commands; `--no-verify` is banned (`rules/23-review-checklist.md`).
