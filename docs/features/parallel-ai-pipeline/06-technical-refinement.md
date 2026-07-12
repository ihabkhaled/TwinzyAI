# 06 - Technical Refinement

## Chosen approach

Additive, layered, gate-green in a single slice. Flow when `AI_PARALLEL_PIPELINE_ENABLED=true`:

```
game/StyleMatchService
  → ai/CandidateRecallService (application; owns single-vs-parallel strategy)
      → ai/CandidateGenerationService (per lane, TEXT-ONLY, focus section appended)
          via ai/AiStepConcurrencyGate (process-global per-step Semaphore)
      → ai/lib/candidate-merge.util (deterministic dedupe + order)
```

1. **Core primitive** (`apps/api/src/core/concurrency/`): a reusable counting
   [`Semaphore`](../../../apps/api/src/core/concurrency/semaphore.ts) — abortable, timeout-bounded,
   FIFO; single-process / in-memory by design — with its
   [types](../../../apps/api/src/core/concurrency/concurrency.types.ts),
   [errors](../../../apps/api/src/core/concurrency/concurrency.errors.ts) (`ConcurrencyTimeoutError`,
   `ConcurrencyAbortError`), and an [index](../../../apps/api/src/core/concurrency/index.ts) barrel.
2. **Per-step gate** (`modules/ai/application/`):
   [`AiStepConcurrencyGate`](../../../apps/api/src/modules/ai/application/ai-step-concurrency.gate.ts)
   — a NestJS singleton holding one `Semaphore` per pipeline **step**; generation is gated now,
   judge is provisioned for Release B, extraction/translation pass straight through.
3. **Recall strategy** (`modules/ai/application/`):
   [`CandidateRecallService`](../../../apps/api/src/modules/ai/application/candidate-recall.service.ts)
   — the single entry point the matching phase calls. Flag off → the one unchanged generation call;
   flag on → fan out, clamp to budget, `Promise.allSettled`, merge.
4. **Pure helpers** (`modules/ai/lib/`):
   [`candidate-lane-plan.util.ts`](../../../apps/api/src/modules/ai/lib/candidate-lane-plan.util.ts)
   (`buildCandidateGenerationLanes`, `buildLaneFocusSection`) and
   [`candidate-merge.util.ts`](../../../apps/api/src/modules/ai/lib/candidate-merge.util.ts)
   (`canonicalCandidateName`, `mergeCandidatePools`). Constants/types live in
   [`model/candidate-lane.constants.ts`](../../../apps/api/src/modules/ai/model/candidate-lane.constants.ts)
   (`CandidateGenerationFocus`, `LANE_FOCUS_DIRECTIVE`, `CANDIDATE_GENERATION_LANE_ORDER`,
   `RESERVED_NON_GENERATION_CALLS`),
   [`candidate-lane.types.ts`](../../../apps/api/src/modules/ai/model/candidate-lane.types.ts), and
   [`candidate-recall.types.ts`](../../../apps/api/src/modules/ai/model/candidate-recall.types.ts).
5. **Config** (`config/`): six env-driven caps added to
   [`env.schema.ts`](../../../apps/api/src/config/env.schema.ts),
   [`env-bounds.constants.ts`](../../../apps/api/src/config/env-bounds.constants.ts), and
   [`app-config.service.ts`](../../../apps/api/src/config/app-config.service.ts) getters.
6. **Wiring**:
   [`candidate-generation.service.ts`](../../../apps/api/src/modules/ai/application/candidate-generation.service.ts)
   gains an optional `lane` param (appends the focus section; default path unchanged);
   [`ai.module.ts`](../../../apps/api/src/modules/ai/ai.module.ts) registers/exports the gate + recall
   service; [`style-match.service.ts`](../../../apps/api/src/modules/game/application/style-match.service.ts)
   now injects `CandidateRecallService` instead of the generation service + config.

## New environment variables

| Var | Type / bounds | Default | Purpose |
| --- | --- | --- | --- |
| `AI_PARALLEL_PIPELINE_ENABLED` | bool | `false` | Master flag; off → single unchanged call |
| `AI_GENERATION_LANES` | int 1..6 | `2` | Fan-out lane count (clamped to budget) |
| `AI_GENERATION_CONCURRENCY` | int 1..16 | `2` | Process-global permits for the generation step |
| `AI_JUDGE_CONCURRENCY` | int 1..16 | `1` | Provisions the judge gate for Release B (no extra calls now) |
| `AI_MAX_CALLS_PER_ANALYSIS` | int 3..20 | `5` | Per-analysis provider-call budget (extraction + lanes + judge) |
| `AI_PARALLEL_QUEUE_TIMEOUT_MS` | int 1000..120000 | `30000` | Max wait for a lane permit before the lane is dropped |

## Key decisions & trade-offs

| Decision | Why | Rejected alternative |
| --- | --- | --- |
| **No worker threads** for Release A | Gemini calls are network-bound; `worker_threads` would duplicate V8 isolates and provider clients without improving network latency. Chose bounded async concurrency | Worker pool now — deferred to Release C ([ADR-003](../../../architecture/adrs/adr-003-horizontal-scaling-plan.md) Option C: workers only if profiling proves event-loop blocking) |
| New small `Semaphore` + per-step gate rather than reuse `ConcurrencyLimiter` | The streaming `ConcurrencyLimiter` is whole-analysis **admission** control (global/per-IP/per-tab) — a distinct concern from bounding a fixed set of fan-out tasks. Not duplication | Overload `ConcurrencyLimiter` for fan-out — conflates admission with task bounding |
| Gate keyed by pipeline **step** (generation now, judge provisioned) | Keying by step bounds each stage independently; simplest correct bound for the current provider | Key by `provider:model` — documented as a future refinement |
| Budget as a runtime **clamp-with-warn** | Friendlier for operators than a startup crash coupling two env vars; the invariant `generation calls ≤ AI_MAX_CALLS_PER_ANALYSIS − 2` is guaranteed and unit-tested | Fail-fast startup coupling of the two vars — brittle for operators |
| **Deterministic** merge (score desc, canonical-name asc; ties keep earlier lane) | Equal lane outputs must always aggregate identically regardless of finish order — required for stable, reproducible results | Insertion-order or first-writer-wins merge — output would depend on which lane returned first |
| Lane focus applied by **appending** a text-only section in code | Focus directives are versioned constants (like the existing region-hint constants); leaving the shared base prompt file untouched makes the flag-off single-call path byte-for-byte identical — no prompt-version bump, no schema change | Edit the shared base prompt — would change the flag-off path and force a prompt-version bump |
| **SSE contract kept byte-stable** (no new fields) | The frontend is untouched and "SSE contracts remain backward compatible" is trivially satisfied | Add per-lane progress counters now — a forward option, unnecessary coupling for Release A |

## Open technical questions

- None blocking. Fleet-wide (cross-instance) provider-concurrency bounding needs a shared store and
  is out of scope, consistent with [ADR-003](../../../architecture/adrs/adr-003-horizontal-scaling-plan.md);
  recorded as the known limitation in [09-impact-analysis.md](09-impact-analysis.md) and
  [19-security-review.md](19-security-review.md).
