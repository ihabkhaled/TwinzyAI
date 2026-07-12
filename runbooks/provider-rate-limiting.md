---
id: runbook-provider-rate-limiting
title: Runbook — Rate Limiting (Provider Quotas and Our Own Throttles)
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Distinguishing provider quota exhaustion (AI_RATE_LIMITED) from our own throttles (RATE_LIMITED) and concurrency rejections (SERVER_BUSY), with safe mitigations for each.
keywords: [runbook, rate-limit, throttle, quota, 429, server-busy, concurrency, ai-rate-limited]
contextTier: 2
relatedCode:
  [
    apps/api/src/core/rate-limit/rate-limit.module.ts,
    apps/api/src/core/streaming/concurrency-limiter.service.ts,
    apps/api/src/modules/game/model/game.constants.ts,
  ]
relatedTests: [apps/api/src/core/streaming/tests/concurrency-limiter.service.test.ts]
relatedDocs: [runbooks/provider-outage.md, support/provider-outage-messaging.md, docs/env-vars.md]
readWhen: Players report "too many tries" / "busy" errors, or 429 rates spike in logs.
---

# Runbook — Rate Limiting

Three different mechanisms produce "slow down" answers. Identify which one fired before changing anything — the fix differs per mechanism. Player-facing copy for each: [`../support/provider-outage-messaging.md`](../support/provider-outage-messaging.md).

## The three mechanisms

| Signal in logs/envelope | Mechanism | Config |
| --- | --- | --- |
| `RATE_LIMITED` 429, messageKey `errors.common.rateLimited` | **Our HTTP throttle** — global guard `RATE_LIMIT_MAX` per `RATE_LIMIT_TTL_MS` (defaults 30/60 s; `apps/api/src/core/rate-limit/rate-limit.module.ts`) plus per-route caps: analyze 10/min, translate 10/min, cancel 60/min (`apps/api/src/modules/game/model/game.constants.ts`), payments orders 10/min, share create/read/delete 20/120/20 per min | `RATE_LIMIT_TTL_MS`, `RATE_LIMIT_MAX` env; route caps are code constants |
| `AI_RATE_LIMITED` (429 on chain exhaustion), messageKey `errors.ai.rateLimited` | **Provider quota** — the AI provider returned rate-limit errors; the router hops to the next chain entry first (`ai-router.service.ts`) | Provider dashboard/quota; chain composition (`AI_ROUTE_<STEP>`, fallbacks) |
| `SERVER_BUSY` in-band SSE rejection, messageKey `errors.server.busy` | **Concurrency admission** — global/per-IP/per-tab caps with a bounded FIFO queue (`MAX_GLOBAL_ACTIVE_ANALYSES` 50, `MAX_ACTIVE_ANALYSES_PER_IP` 3, `MAX_ACTIVE_ANALYSES_PER_TAB` 1, `MAX_ANALYSIS_QUEUE_SIZE` 100 — `.env.example`; `apps/api/src/core/streaming/concurrency-limiter.service.ts`) | The `MAX_*` env caps |

## Steps

1. Classify from logs:
   ```bash
   docker compose logs --since 15m api | grep -c '"RATE_LIMITED"'
   docker compose logs --since 15m api | grep -c '"AI_RATE_LIMITED"'
   docker compose logs --since 15m api | grep -c '"SERVER_BUSY"'
   ```
2. **Our throttle firing**: from one/few IPs → abuse or a scripted client; the throttle is doing its job (30/min global is deliberate DoS protection, `docs/security-review-report.md`). From many organic users → consider a measured raise of `RATE_LIMIT_MAX` via [config-change.md](./config-change.md); never remove the throttle.
3. **Provider quota**: check the provider's quota dashboard/billing; mitigate by chain composition (spread steps across models/providers per [provider-outage.md](./provider-outage.md)) or wait for the quota window. Do not build server-side retry storms.
4. **SERVER_BUSY**: genuine load — the caps protect memory and model quota by design (multi-tab stream isolation stream, `docs/features/multi-tab-stream-isolation/`). If load is legitimate and sustained, raising the `MAX_*` caps is a capacity decision bounded by ADR-003's single-process reality (`architecture/adrs/adr-003-horizontal-scaling-plan.md`) — profile first ([latency.md](./latency.md)).

## Verify

429/SERVER_BUSY counts trending back to baseline (re-run the greps), analyze happy path green, and no memory/latency regression after any cap raise (`docker stats`).

## Rollback

All mitigations here are env-only — restore previous values and restart ([rollback.md](./rollback.md) lever table).
