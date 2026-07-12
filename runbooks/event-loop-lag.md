---
id: runbook-event-loop-lag
title: Runbook — Event-Loop Lag
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Recognizing and mitigating a blocked Node event loop in the single-process API — symptoms, likely blockers, and the ADR-003 boundary on fixes.
keywords: [runbook, event-loop, lag, blocking, cpu, node, single-process, health, heartbeat]
contextTier: 2
relatedCode: [apps/api/src/main.ts, docker-compose.yml, .env.example]
relatedTests: []
relatedDocs: [architecture/adrs/adr-003-horizontal-scaling-plan.md, runbooks/latency.md, runbooks/memory-growth.md]
readWhen: Everything — including the trivial health endpoint — is slow or timing out while the process is still alive.
---

# Runbook — Event-Loop Lag

The API is one Node process by explicit decision (ADR-003, `architecture/adrs/adr-003-horizontal-scaling-plan.md`); anything that blocks the event loop stalls **all** requests, heartbeats, and timers at once. No event-loop metrics are exported today — diagnosis is behavioral.

## Symptoms (the signature)

- `GET /api/v1/health` — which does no I/O (`apps/api/src/modules/health/`) — is slow or timing out while the container is `Up`.
- SSE heartbeats (every 10 s) arrive late in a raw `curl` stream; watchdog timeouts fire in bursts.
- `docker stats` shows the api container pinned at its 1-CPU cap (`docker-compose.yml`) while request throughput drops.
- Distinguish from [memory-growth.md](./memory-growth.md): near-limit memory causes GC thrash that *presents* as loop lag — check memory first.

## Likely blockers (bounded by design, but check in this order)

1. **A recent release adding synchronous work** — heavy parsing, regex on large strings, crypto, sync fs. The codebase deliberately bounds its big inputs (`AI_MAX_RESPONSE_BYTES` 500 KB, upload caps, share payload caps), so a new unbounded code path is the prime suspect. Revert first ([rollback.md](./rollback.md)).
2. **Pathological load shape** — very high concurrency amplifying per-request sync costs; check `SERVER_BUSY`/queue behavior ([provider-rate-limiting.md](./provider-rate-limiting.md)) and consider temporarily lowering `MAX_GLOBAL_ACTIVE_ANALYSES` (env-only) to shed load.
3. **GC pressure from memory growth** — hand off to [memory-growth.md](./memory-growth.md).

## Steps

1. Snapshot evidence: `docker stats --no-stream`, `docker compose logs --tail=300 api`, timed health probe (`time curl -s http://localhost:4000/api/v1/health`).
2. Restart to restore service: `docker compose restart api` (state loss is acceptable by design).
3. If lag returns under normal load with no release to blame, reproduce locally under `npm run load-test` and profile (`node --cpu-prof` on a local run) — profiling artifacts follow [safe-diagnostics.md](./safe-diagnostics.md) handling rules.
4. Feed findings into ADR-003's revisit trigger: per that ADR, the sanctioned evolution path is timing metrics first, then scaling work only when profiling proves the bottleneck — not ad-hoc clustering, which the in-memory limiter/registry/share cache do not support ([`../support/known-issues.md`](../support/known-issues.md) KI-5).

## Verify

- Health probe returns instantly under load; heartbeats regular; watchdog timeout bursts stop.
- CPU per `docker stats` proportional to traffic.

## Rollback

Load-shedding cap changes are env-only rollbacks; code causes revert per [rollback.md](./rollback.md). Do not raise the container CPU limit as a "fix" without recording it as a capacity decision.
