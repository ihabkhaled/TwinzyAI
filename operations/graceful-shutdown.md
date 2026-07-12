---
id: operations-graceful-shutdown
title: Graceful Shutdown
type: operations
authority: canonical
status: current
owner: repository owner
summary: SIGTERM triggers Nest shutdown hooks that clear timers and in-memory registries; the only losses on restart are in-flight analyses and active share links.
keywords: [shutdown, sigterm, lifecycle, restart, hooks, timers, state-loss, boot]
contextTier: 2
relatedCode: [apps/api/src/bootstrap/configure-lifecycle.ts, apps/api/src/core/streaming/stream-registry.service.ts, apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts, apps/api/src/main.ts]
relatedTests: [apps/api/src/core/streaming/tests/stream-registry.service.test.ts, apps/api/src/modules/share-results/tests/in-memory-share-result-cache.repository.test.ts]
relatedDocs: [operations/deployment-model.md, operations/scaling-model.md, runbooks/api-outage.md]
readWhen: You are changing lifecycle wiring, adding a background timer, or reasoning about what a restart loses.
---

# Graceful Shutdown

## Shutdown path

1. `app.enableShutdownHooks()` is set at bootstrap so `OnModuleDestroy` hooks run on SIGTERM
   ([apps/api/src/bootstrap/configure-lifecycle.ts](../apps/api/src/bootstrap/configure-lifecycle.ts)).
2. `StreamRegistry.onModuleDestroy` clears its TTL sweep interval and the stream map
   ([apps/api/src/core/streaming/stream-registry.service.ts](../apps/api/src/core/streaming/stream-registry.service.ts)).
3. The share-result cache repository clears its periodic sweeper in `onModuleDestroy`
   ([apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts](../apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts)).
4. Background timers are `unref()`-ed at creation (stream sweep, share sweep — same files), so
   pending timers never hold the process open.

There is nothing to flush: no database, no queues, no files on disk
([deployment-model.md](deployment-model.md)). Docker then restarts the container
(`restart: unless-stopped`, [docker-compose.yml](../docker-compose.yml)).

## What a restart loses (and why that is acceptable)

| Lost on restart | Consequence |
| --- | --- |
| In-flight analyses / open SSE streams | Client sees the stream drop; disconnect handling is a silent terminal path ([apps/api/src/modules/game/lib/game-stream.ts](../apps/api/src/modules/game/lib/game-stream.ts)); the user retries |
| Active share links | Single-instance in-memory driver — "records gone on restart" (repository doc comment, file above); links were always advertised as temporary ([docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md)) |
| Rate-limit / concurrency counters | Reset to empty; fresh caps apply immediately |
| Cached PayPal OAuth token | Re-fetched on next call ([apps/api/src/modules/payments/adapters/paypal.adapter.ts](../apps/api/src/modules/payments/adapters/paypal.adapter.ts)) |

Payment safety across a crash: capture happens at consumption and any post-capture failure
triggers a best-effort refund; PayPal itself is the ledger, so no local payment state exists to
lose ([docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)).

## Startup counterpart (fail-fast)

- Invalid env crashes boot before listening (`validateEnv` throws —
  [apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts)).
- A rejected bootstrap writes `Fatal bootstrap error: …` to stderr and sets exit code 1
  ([apps/api/src/main.ts](../apps/api/src/main.ts)).
- Explicit `AI_ROUTE_<STEP>` config with zero usable entries throws at boot
  ([apps/api/src/modules/ai/adapters/provider-registry.service.ts](../apps/api/src/modules/ai/adapters/provider-registry.service.ts)).

## Rule for new background work

Any new interval/timer/watcher must be cleared in `OnModuleDestroy` and `unref()`-ed, matching
the two existing sweepers — otherwise SIGTERM shutdown regresses (CLAUDE.md async/long-running
workflow rules).
