---
id: runbook-latency
title: Runbook — Latency Investigation
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Investigating slow analyses with the tools that actually exist — pino timings, the load-test script, provider timeout budgets — under ADR-003's measure-first policy.
keywords: [runbook, latency, performance, slow, timings, load-test, provider, queueing, adr-003]
contextTier: 2
relatedCode: [scripts/load-test.mjs, apps/api/src/core/logger/http-logging.options.ts, .env.example]
relatedTests: []
relatedDocs:
  [
    architecture/adrs/adr-003-horizontal-scaling-plan.md,
    docs/performance-review-report.md,
    runbooks/provider-outage.md,
  ]
readWhen: Analyses are noticeably slow for many players, or before making any capacity/scaling decision.
---

# Runbook — Latency Investigation

**Policy first:** ADR-003 (`architecture/adrs/adr-003-horizontal-scaling-plan.md`) keeps the API single-process and defers all scaling work (cluster/PM2/workers) until profiling proves a bottleneck — measure before changing anything. There is no APM; the observability surface is structured pino logs and Docker stats.

## Where the time actually goes (budget map)

| Segment | Budget / bound |
| --- | --- |
| AI provider calls (the dominant cost; sequential by contract, `docs/performance-review-report.md`) | `GEMINI_TIMEOUT_MS` per non-streaming call; `GEMINI_STREAM_IDLE_TIMEOUT_MS` inter-chunk (`.env.example`) |
| Whole analysis (watchdog) | `ANALYSIS_TIMEOUT_MS` (default 120 s) |
| Queueing before the run starts | ConcurrencyLimiter FIFO when over caps — queued waiters also die at the watchdog ([provider-rate-limiting.md](./provider-rate-limiting.md)) |
| Translation requests | Real translations run 13–25 s; the client allows 60 s (`AI_TRANSLATE_REQUEST_TIMEOUT_MS`, `apps/web/src/modules/game/model/game.constants.ts`) — "slow" here can be normal |
| PayPal calls (paywall only) | 15 s per call (`PAYPAL_REQUEST_TIMEOUT_MS`) |

## Prerequisites

- Baseline sense of normal: pino-http logs each completed request with its response time (`apps/api/src/core/logger/http-logging.options.ts`); pull a sample window before declaring a regression.

## Steps

1. **Confirm and localize**: are non-AI routes (`/api/v1/health`, share reads) also slow?
   - Health slow too → process-level problem: [event-loop-lag.md](./event-loop-lag.md) / [memory-growth.md](./memory-growth.md).
   - Only analyze/translate slow → provider latency or queueing; continue.
2. **Provider latency**: rising `AI_TIMEOUT` counts mean the provider is the bottleneck → [provider-outage.md](./provider-outage.md). Model choice dominates step latency — the benchmark harness measures p50/p95 per model with a speed component in its score (`docs/ai-benchmarking.md`); per-step chains let slow steps move to faster models via change control.
3. **Queueing**: count `SERVER_BUSY` rejections; if runs are admitted but slow to start, load is above the caps — a capacity question, not a defect.
4. **Reproduce under load**: `npm run load-test` (`scripts/load-test.mjs`, root `package.json`) against a non-production target.
5. **Resource ceiling check**: `docker stats` — the api container is capped at 1 CPU / 1 GB (`docker-compose.yml`); sustained 100% CPU at modest load feeds the ADR-003 revisit trigger.
6. If a release correlates with the regression, revert first, profile later ([rollback.md](./rollback.md)).

## Verify

Response times in logs back to the pre-incident sample; no elevated `AI_TIMEOUT`/`SERVER_BUSY`; smoke test green ([release-smoke-test.md](./release-smoke-test.md)).

## Rollback

Timeout/cap tuning is env-only rollback. Do not "fix" latency by dramatically lengthening timeouts (holds slots longer and worsens queueing — `ai-provider-outage.md` §3) or by adding processes/instances (breaks the in-memory limiter/registry/share cache — ADR-003, [`../support/known-issues.md`](../support/known-issues.md) KI-5).
