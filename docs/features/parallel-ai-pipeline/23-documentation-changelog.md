# 23 - Documentation & Knowledge Changelog

## Documents created

| Document | Why |
| --- | --- |
| `docs/features/parallel-ai-pipeline/00, 03, 06, 08, 09, 11, 12, 13, 15, 16, 19, 23` | This feature's SDLC phase trail |
| [`architecture/adrs/adr-004-parallel-ai-pipeline.md`](../../../architecture/adrs/adr-004-parallel-ai-pipeline.md) | The architectural decision record for the phased A–D plan and Release A |

## Documents / code-docs updated in the same delivery stream

| Location | Change |
| --- | --- |
| [`.env.example`](../../../.env.example) + local `.env` | New parallel-AI section: the 6 caps (`AI_PARALLEL_PIPELINE_ENABLED`, `AI_GENERATION_LANES`, `AI_GENERATION_CONCURRENCY`, `AI_JUDGE_CONCURRENCY`, `AI_MAX_CALLS_PER_ANALYSIS`, `AI_PARALLEL_QUEUE_TIMEOUT_MS`), documented, flag off by default |
| [`apps/api/src/config/env.schema.ts`](../../../apps/api/src/config/env.schema.ts) + [`env-bounds.constants.ts`](../../../apps/api/src/config/env-bounds.constants.ts) + [`app-config.service.ts`](../../../apps/api/src/config/app-config.service.ts) | Typed, bounded, fail-fast validation + getters for the 6 caps |
| [`apps/api/src/core/concurrency/*.ts`](../../../apps/api/src/core/concurrency/semaphore.ts) | Doc-comments describe the reusable abortable/timeout FIFO `Semaphore` and its single-process / in-memory design |
| [`apps/api/src/modules/ai/application/ai-step-concurrency.gate.ts`](../../../apps/api/src/modules/ai/application/ai-step-concurrency.gate.ts) + [`candidate-recall.service.ts`](../../../apps/api/src/modules/ai/application/candidate-recall.service.ts) | Doc-comments state the process-global per-step bound, the single-vs-parallel strategy, the text-only boundary, and the fleet-per-instance limitation |
| [`apps/api/src/modules/ai/model/candidate-lane.constants.ts`](../../../apps/api/src/modules/ai/model/candidate-lane.constants.ts) | Doc-comments describe each focus directive as a recall bias that reaffirms the base prompt's safety rules |
| [`vitest.config.mts`](../../../vitest.config.mts) | Coverage `include` adds `core/concurrency/semaphore.ts` |
| [`apps/api/src/tests/fixtures/stubs.ts`](../../../apps/api/src/tests/fixtures/stubs.ts) | New config defaults for the 6 caps |

## Configuration reference (for ops docs)

| Var | Default | Meaning |
| --- | --- | --- |
| `AI_PARALLEL_PIPELINE_ENABLED` | `false` | Master flag; off → single unchanged generation call |
| `AI_GENERATION_LANES` | `2` | Text-only fan-out lane count (clamped to budget) |
| `AI_GENERATION_CONCURRENCY` | `2` | Process-global permits for the generation step |
| `AI_JUDGE_CONCURRENCY` | `1` | Provisions the judge gate for Release B (no extra calls now) |
| `AI_MAX_CALLS_PER_ANALYSIS` | `5` | Per-analysis provider-call budget (extraction + lanes + judge) |
| `AI_PARALLEL_QUEUE_TIMEOUT_MS` | `30000` | Max wait for a lane permit before the lane is dropped |

## Canonical + knowledge docs threaded (same delivery stream)

| Area | Documents |
| --- | --- |
| AI docs | [`docs/ai/concurrency-policy.md`](../../ai/concurrency-policy.md) (new fan-out section + owner), `pipeline.md`, `retry-timeout-policy.md`, `cost-policy.md`, `written-traits-only-boundary.md`, `latency-budget.md`, `system-overview.md`, `prompt-catalog.md` |
| Env / config | [`docs/env-vars.md`](../../env-vars.md), [`contracts/configuration/env-contract.md`](../../../contracts/configuration/env-contract.md), [`structure/configuration-map.md`](../../../structure/configuration-map.md) |
| Structure / flows | [`structure/flows/analyze-flow.md`](../../../structure/flows/analyze-flow.md), `structure/modules/api-ai.md`, `structure/modules/api-game.md`, `structure/layer-map.md` |
| Operations | [`operations/AI-cost-budget.md`](../../../operations/AI-cost-budget.md), `performance-budgets.md`, `scaling-model.md`, `timeout-budget.md`, `logging-catalog.md` |
| Context / domain | [`context/architecture-map.md`](../../../context/architecture-map.md), `context/ai-context.md`, `domain/failure-semantics.md`, `domain/result-ranking.md` |
| Memory (decisions) | [`memory/performance-decisions.md`](../../../memory/performance-decisions.md), `memory/reliability-patterns.md`, `memory/architecture-decisions.md` |
| Rules | [`rules/07-performance-scalability.md`](../../../rules/07-performance-scalability.md), `rules/08-reliability-durability.md`, `rules/25-configuration-and-environment.md` |
| Support | [`support/product-behavior-guide.md`](../../../support/product-behavior-guide.md) (no player-visible change) |
| Knowledge OS (authored → recompiled to `.ai/`) | `knowledge/summaries/{ai-pipeline,configuration,current-risks,architecture}.md` + `npm run knowledge:build` |
| Top-level | [`README.md`](../../../README.md), [`architecture/adrs/README.md`](../../../architecture/adrs/README.md) index, [`release-notes/2026-07-12-parallel-ai-pipeline.md`](../../../release-notes/2026-07-12-parallel-ai-pipeline.md) |

## Governance (`CLAUDE.md`) determination

`CLAUDE.md` was reviewed; **no new governance rule was required**. The parallel pipeline is already
bound by existing Twinzy constraints #3 (no downstream image use ⇒ lanes and judge are text-only)
and #6 (every operational cap is env-driven). The concrete, permanent engineering rules were added
where `CLAUDE.md` delegates them — `rules/07` (AI fan-out must be globally bounded + per-analysis
budgeted) and `rules/08` (`allSettled` fan-out + abort propagation + deterministic merge). The 12
compact agent mirrors carry only the Simple Code Ladder + never-weaken list and needed no change.

## Not changed (intentionally)

- **SSE contract** and `packages/shared` — untouched (no new frame fields); the frontend needs no
  change. Per-lane SSE counters are a documented forward option, not shipped.
- The base generation prompt file — unchanged, so the flag-off single-call path is byte-for-byte
  identical.

## Remaining documentation gaps

- None blocking. When the deployment moves to multiple API instances, add a runbook note on the
  shared-store requirement for fleet-wide per-step bounding (out of scope for this single-process,
  flag-off-by-default change; tracked in
  [ADR-004](../../../architecture/adrs/adr-004-parallel-ai-pipeline.md)).
