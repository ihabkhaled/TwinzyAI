---
id: operations-availability-expectations
title: Availability Expectations
type: operations
authority: canonical
status: current
owner: repository owner
summary: Twinzy runs best-effort at hobby scale — single instance per service, container auto-restart, no recorded SLA, no on-call rota.
keywords: [availability, sla, best-effort, restart, single-instance, downtime, expectations]
contextTier: 2
relatedCode: [docker-compose.yml]
relatedTests: [apps/api/src/tests/health.integration.test.ts]
relatedDocs: [operations/SLOs.md, operations/scaling-model.md, runbooks/api-outage.md]
readWhen: You need to know what uptime the product promises, or whether an availability mechanism exists before assuming it.
---

# Availability Expectations

## Honest posture: best-effort, hobby-scale

No SLA, uptime target, or error budget is recorded anywhere in the repository (see
[SLOs.md](SLOs.md) — targets deferred). The product is a free, anonymous game with no
contractual consumers ([README.md](../README.md)); nothing in
[docs/](../docs/README.md) or the SDLC baselines commits to an availability number.
Treat availability as **best-effort** until an owner records otherwise.

## What actually keeps it up

- **Container auto-restart** — every service uses `restart: unless-stopped`
  ([docker-compose.yml](../docker-compose.yml)).
- **Docker healthchecks** — both app images self-report health every 30s
  ([health-checks.md](health-checks.md)).
- **Fail-fast startup** — invalid configuration crashes boot instead of running degraded
  ([apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts)).
- **Graceful degradation of the AI dependency** — provider failures surface as typed 429/502
  responses, with model-chain and route fallbacks first
  ([retry-budget.md](retry-budget.md), [runbooks/ai-provider-outage.md](../runbooks/ai-provider-outage.md)).

## What does NOT exist (do not assume it)

- No redundancy: one instance per service; a crash means downtime until restart
  ([scaling-model.md](scaling-model.md)).
- No load balancer, failover, or multi-region anything (no such configuration exists in the repo).
- No alerting or paging: healthcheck failures are visible to `docker ps`/`docker:logs` only
  ([observability-map.md](observability-map.md)).
- No persistence to protect: restarts lose only in-flight analyses and active share links
  ([graceful-shutdown.md](graceful-shutdown.md)); there is no data-loss risk beyond that.

## Known planned exception

Charging real money raises the availability bar: the paywall LIVE gate requires a deployed
public HTTPS origin and a recorded live smoke test before `PAYPAL_ENV=live`
([docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)).
Any future paid operation should revisit this posture; that decision belongs to the repository
owner and would update this doc and [SLOs.md](SLOs.md).
