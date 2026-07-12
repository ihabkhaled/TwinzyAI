# 08 - Architecture Review

## Fit with the layered engineering OS

The change respects the one-way dependency rule (Controller → Application → Domain → Persistence →
Integration; cross-cutting `core`), verified against the
[architecture map](../../../context/architecture-map.md). New pieces and their layer:

| New / changed | Layer | Notes |
| --- | --- | --- |
| `core/concurrency/` (`Semaphore`, types, errors, index) | `core` (cross-cutting, lowest) | Reusable abortable/timeout FIFO counting semaphore; depends on nothing app-side |
| `ai/application/ai-step-concurrency.gate.ts` | application | Process-global per-step `Semaphore` wrapper; injects `AppConfigService`/`AppLogger` only |
| `ai/application/candidate-recall.service.ts` | application | Owns the single-vs-parallel strategy; the one entry point the matching phase calls |
| `ai/lib/candidate-lane-plan.util.ts`, `candidate-merge.util.ts` | lib (pure) | Lane planning + deterministic dedupe/order; unit-tested, coverage-gated |
| `ai/model/candidate-lane.*.ts`, `candidate-recall.types.ts` | model (constants/types) | Focus directives + contracts; no inline domain definitions in logic files |
| `ai/application/candidate-generation.service.ts` | application | Optional trailing `lane` param appends the focus section; default path unchanged |
| `game/application/style-match.service.ts` | application | Injects `CandidateRecallService` instead of the generation service + config (4 constructor params) |
| `config/*` | config | Six typed, zod-validated, bounded, fail-fast caps with getters |

Dependency direction check: `modules/game → modules/ai → core/concurrency` (downward, allowed).
`core/concurrency` imports nothing app-side; `AiStepConcurrencyGate` injects only `config` +
`core/logger`. No new circular dependencies — mechanically confirmed by `npm run lint` (architecture
plugin), `npm run typecheck`, and `npm run quality:circular` (madge: no circular dependency).

## Contract / data-flow changes

- **SSE frame contract**: unchanged — no new fields; identical public stages. The frontend is
  untouched and backward compatibility is trivially satisfied.
- **Shared package** (`packages/shared`): unchanged.
- **Data flow**: when the flag is on, an `AbortSignal` (the shared analysis signal) threads into every
  lane and its gate wait; the merged, deduped `Candidate[]` returns to `StyleMatchService`. **No image
  or user data flows into any lane, the gate, or the merge** — recall receives only written traits
  (the provider generation method has no image slot). Extraction remains the sole image call and its
  buffer is still zero-filled in `finally`
  ([`analyze-game.use-case.ts`](../../../apps/api/src/modules/game/application/analyze-game.use-case.ts)).

## ADR-worthy decisions

Recorded in [ADR-004 — Parallel AI pipeline](../../../architecture/adrs/adr-004-parallel-ai-pipeline.md)
(and summarized in [06-technical-refinement.md](06-technical-refinement.md)): the phased A–D plan,
async concurrency over worker threads for Release A, the per-step gate, the clamp-with-warn budget,
and the deterministic merge. ADR-004 sits under the horizontal-scaling plan in
[ADR-003](../../../architecture/adrs/adr-003-horizontal-scaling-plan.md); no new external dependency
and no change to the domain model is introduced.

## Architecture risks

- **Single-instance state** — the per-step gate's `Semaphore` bounds one API process. The gate is a
  NestJS singleton so its permit set is process-global (it bounds across simultaneous requests), but
  in a multi-instance deployment the bound applies per instance. Acceptable for the current
  single-process deployment; fleet-wide bounding remains a horizontal-scaling concern
  ([ADR-003](../../../architecture/adrs/adr-003-horizontal-scaling-plan.md)). Documented in the gate
  doc-comments and [09-impact-analysis.md](09-impact-analysis.md).
- **Determinism discipline** — merge order must not depend on lane completion order. Enforced by the
  score-desc / canonical-name-asc ordering with earlier-lane tie-break; covered by
  `candidate-merge.util.test.ts`.
- **Provider-cost bounding** — fan-out must never amplify cost. Enforced by three independent bounds
  (global per-step gate + per-analysis budget clamp + lane queue-timeout); covered by the recall and
  gate tests. See [19-security-review.md](19-security-review.md).
