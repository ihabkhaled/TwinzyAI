# 12 - Coverage Plan

## Touched modules & how they are gated

The coverage `include` globs already capture the logic-bearing new files:

| File | Gated by |
| --- | --- |
| `modules/ai/application/candidate-recall.service.ts` | `modules/**/application/**` |
| `modules/ai/application/ai-step-concurrency.gate.ts` | `modules/**/application/**` |
| `modules/ai/application/candidate-generation.service.ts` (modified) | `modules/**/application/**` |
| `modules/game/application/style-match.service.ts` (modified) | `modules/**/application/**` |
| `modules/ai/lib/candidate-lane-plan.util.ts` | `modules/**/lib/**` |
| `modules/ai/lib/candidate-merge.util.ts` | `modules/**/lib/**` |
| `core/concurrency/semaphore.ts` | **added explicitly** to the include list in [`vitest.config.mts`](../../../vitest.config.mts), mirroring how `concurrency-limiter.service.ts` is listed |

Types/constants/index files
([`candidate-lane.constants.ts`](../../../apps/api/src/modules/ai/model/candidate-lane.constants.ts),
`candidate-lane.types.ts`, `candidate-recall.types.ts`, `concurrency.types.ts`, `index.ts`) are
excluded per the standing [coverage policy](../../../testing/coverage-policy.md) (no branching logic
to cover).

## Thresholds

Global gate unchanged: **statements 95 / branches 90 / functions 95 / lines 95**. All met — measured
global result **97.01% stmts / 92.52% branches / 97.22% funcs / 97.12% lines** (see
[15-dev-validation-report.md](15-dev-validation-report.md)).

## Critical scenario coverage (not just line count)

- Privacy boundary: fan-out sends exactly N text calls and **zero** image calls.
- Budget clamp and empty-merge fallback branches both exercised.
- Semaphore FIFO grant, timeout rejection, and abort-before-start branches all exercised.
- Deterministic merge order (score desc, canonical-name asc, earlier-lane tie-break) asserted for
  reordered inputs.

## Waivers

None. `apps/web` is untouched by this change, so no web coverage is in scope.
