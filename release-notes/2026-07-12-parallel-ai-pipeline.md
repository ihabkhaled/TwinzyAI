# Release Notes — Parallel AI Pipeline, Release A (2026-07-12)

**Audience:** operators, contributors, and AI coding agents. **Player-visible changes:** none by
default — the feature is flag-gated and OFF (`AI_PARALLEL_PIPELINE_ENABLED=false`). Request
`TWZ-2026-PARALLEL-AI`; see [`docs/features/parallel-ai-pipeline/`](../docs/features/parallel-ai-pipeline/README.md)
and [ADR-004](../architecture/adrs/adr-004-parallel-ai-pipeline.md).

## What shipped

- **Parallel candidate-recall fan-out (Release A).** When enabled, the text-only candidate
  generation step fans out into `AI_GENERATION_LANES` lanes (default 2), each with a distinct recall
  focus (strongest / diverse / wildcard), then deterministically merges and dedupes the pools.
  Extraction (image) and judging still run exactly once — the
  [written-traits-only boundary](../docs/ai/written-traits-only-boundary.md) is unchanged.
- **Global per-step concurrency gate.** `AiStepConcurrencyGate` (a reusable `core/concurrency`
  `Semaphore`) bounds concurrent generation calls across ALL simultaneous analyses
  (`AI_GENERATION_CONCURRENCY`), so parallelism can never burst the provider quota.
- **Per-analysis call budget.** Lane count is clamped so `extraction + lanes + judge ≤
  AI_MAX_CALLS_PER_ANALYSIS` (default 5); a clamp logs a warning, never a silent cap.
- **Graceful partial failure + cancellation.** Lanes use `Promise.allSettled`; a failed or
  permit-timed-out lane is dropped, survivors merge, an empty merge falls back exactly as the
  single-call path does, and the analysis `AbortSignal` reaches every lane.
- **Six new env vars** (all defaulted, validated, off by default): `AI_PARALLEL_PIPELINE_ENABLED`,
  `AI_GENERATION_LANES`, `AI_GENERATION_CONCURRENCY`, `AI_JUDGE_CONCURRENCY`,
  `AI_MAX_CALLS_PER_ANALYSIS`, `AI_PARALLEL_QUEUE_TIMEOUT_MS` — see
  [env-vars.md](../docs/env-vars.md) and [concurrency-policy.md](../docs/ai/concurrency-policy.md).

## Operator notes

- **Off by default and instantly reversible** — set `AI_PARALLEL_PIPELINE_ENABLED=false` (or unset)
  to return to the single unchanged generation call.
- **Latency vs cost:** enabling parallelism trades provider **cost** for latency. Treat both as
  acceptance criteria before turning it on — see [cost-policy.md](../docs/ai/cost-policy.md). The
  global gate + per-analysis budget bound the worst case.
- The SSE event contract is unchanged (identical public stages), so no frontend change is required.

## Known limitations / follow-ups

- **Single-process bound only.** The gate is in-memory per instance; fleet-wide provider-concurrency
  bounding needs shared state (Release D / [ADR-003](../architecture/adrs/adr-003-horizontal-scaling-plan.md)).
- **Deferred releases:** B (bounded judge tournament — the judge gate is already provisioned by
  `AI_JUDGE_CONCURRENCY`), C (CPU `worker_threads` pool, only if profiling proves event-loop
  blocking), D (horizontal replicas).
- **Optional SSE per-lane counters** are a documented forward option, not shipped in Release A.
