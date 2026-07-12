---
id: operations-slos
title: Service-Level Objectives (SLOs)
type: operations
authority: canonical
status: current
owner: repository owner
summary: No SLO targets are recorded anywhere in the repository; this doc holds the empty target table and the conditions under which targets must be set.
keywords: [slo, objectives, targets, error-budget, availability, latency, deferred]
contextTier: 2
relatedCode: [apps/api/src/config/env.schema.ts]
relatedTests: []
relatedDocs: [operations/SLIs.md, operations/availability-expectations.md, architecture/adrs/adr-003-horizontal-scaling-plan.md]
readWhen: You are asked what the service promises numerically, or you are about to record the first SLO targets.
---

# Service-Level Objectives (SLOs)

## Current state: no targets recorded

Deferred — needs an owner decision. No SLO target, uptime percentage, latency objective, or
error budget appears in [docs/](../docs/README.md), the SDLC baselines
([docs/sdlc/risk-baseline.md](../docs/sdlc/risk-baseline.md)), the ADRs, or any feature
go/no-go artifact. Inventing numbers here would violate the evidence rule, so the target table
is intentionally empty. The honest operating posture is described in
[availability-expectations.md](availability-expectations.md).

| SLO | SLI (from [SLIs.md](SLIs.md)) | Target | Window | Status |
| --- | --- | --- | --- | --- |
| HTTP availability | non-5xx share of requests | Deferred — no recorded target | — | not set |
| Analyze success rate | `StreamStatus.Completed` share of admitted runs | Deferred — no recorded target | — | not set |
| Analyze latency | request-log timings / stage events | Deferred — needs timing metrics per [ADR-003](../architecture/adrs/adr-003-horizontal-scaling-plan.md) | — | not set |

## Hard ceilings that already bound the user experience

These are engineering caps, not SLOs, but they define worst-case behavior today (all from
[apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts); full table in
[timeout-budget.md](timeout-budget.md)):

- An analysis can never run longer than `ANALYSIS_TIMEOUT_MS` (default 120 s) — the watchdog
  aborts it.
- A single AI call is bounded by `GEMINI_TIMEOUT_MS` (default 30 s).
- Overload returns an explicit `SERVER_BUSY` rejection instead of unbounded queueing
  ([apps/api/src/core/streaming/concurrency-limiter.service.ts](../apps/api/src/core/streaming/concurrency-limiter.service.ts)).

## When targets MUST be set

Per CLAUDE.md ("if the organization uses SLIs, SLOs, or error budgets, validate and document
the expected impact before release"), the first SLO targets must be recorded here — with an
owner and a measurement source — before either of these events:

1. Going live with real payments (the paywall LIVE gate,
   [docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)).
2. Executing the [ADR-003](../architecture/adrs/adr-003-horizontal-scaling-plan.md) scaling
   plan, which is explicitly gated on measuring first.
