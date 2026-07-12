---
id: operations-readme
title: operations/ — Operational Knowledge Area
type: operations
authority: canonical
status: current
owner: repository owner
summary: Index of the canonical operations docs — deployment, scaling, availability, budgets, observability, health, shutdown, and readiness for the Twinzy stack.
keywords: [operations, deployment, scaling, slo, sli, observability, logging, health, shutdown, readiness, budgets]
contextTier: 2
relatedCode: [docker-compose.yml, Dockerfile.api, Dockerfile.web, apps/api/src/bootstrap/bootstrap.ts]
relatedTests: [apps/api/src/tests/health.integration.test.ts]
relatedDocs: [runbooks/README.md, docs/docker-local-dev.md, knowledge/manifest.yaml]
readWhen: You need to deploy, operate, size, monitor, or assess the runtime behavior of the Twinzy stack.
---

# operations/ — Operational Knowledge Area

Canonical operational truth for the Twinzy stack (api + web + optional clamav, per
[docker-compose.yml](../docker-compose.yml)). Procedures for *responding* to problems live in
[runbooks/](../runbooks/README.md); records of actual problems live in
[incidents/](../incidents/README.md). This area describes how the system runs.

## Contents

| Doc | Owns |
| --- | --- |
| [service-catalog.yaml](service-catalog.yaml) | The deployable units, ports, images, and limits |
| [deployment-model.md](deployment-model.md) | How the stack is built and deployed (Compose, images, healthchecks) |
| [scaling-model.md](scaling-model.md) | Stateless single-process model and what bounds concurrency |
| [availability-expectations.md](availability-expectations.md) | Honest availability posture (best-effort, no SLA) |
| [SLOs.md](SLOs.md) | Service-level objectives (targets currently deferred) |
| [SLIs.md](SLIs.md) | Candidate indicators derivable from existing signals |
| [performance-budgets.md](performance-budgets.md) | Payload, response-size, and rate budgets |
| [timeout-budget.md](timeout-budget.md) | Every timeout in the request path, with sources |
| [retry-budget.md](retry-budget.md) | Every retry/fallback mechanism and its bound |
| [AI-cost-budget.md](AI-cost-budget.md) | Spend-limiting caps for AI provider calls |
| [observability-map.md](observability-map.md) | What signals exist (and what does not) |
| [logging-catalog.md](logging-catalog.md) | What is logged, at what level, and what is redacted |
| [health-checks.md](health-checks.md) | The /health endpoint and Docker healthchecks |
| [graceful-shutdown.md](graceful-shutdown.md) | SIGTERM behavior and what is lost on restart |
| [readiness-checklist.md](readiness-checklist.md) | Pre-run operational checklist |

## Ground rules

- Configuration truth is [apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts)
  (documented in [docs/env-vars.md](../docs/env-vars.md)); these docs cite it, never fork it.
- There is no database: the API is stateless by design
  ([apps/api/src/modules/privacy/privacy.module.ts](../apps/api/src/modules/privacy/privacy.module.ts)),
  so rollback is always `git revert` + redeploy ([runbooks/README.md](../runbooks/README.md)).
- When `docker-compose.yml`, the Dockerfiles, or `env.schema.ts` change, this area must be
  reviewed in the same delivery stream (CLAUDE.md Mandatory Change Checklist).
