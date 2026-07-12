# ADR-004 — Parallel AI Pipeline (Release A: async candidate-generation lanes)

## Status

Accepted — Release A implemented behind a flag (OFF by default). Releases B–D deferred.

## Context

TwinzyAI's analyze pipeline is a sequence of Gemini calls: one image-bearing trait
extraction, one text-only candidate generation, one text-only judge, and (on demand) one
text-only translation. Candidate generation is a **recall** step — sweep widely, then let the
judge narrow — and a single call under-samples the space of plausible public-figure matches.

We want to (a) improve candidate diversity/recall and (b) reduce end-to-end latency, without
changing the default behavior, without adding an external dependency, and without weakening the
[written-traits-only privacy boundary](../../docs/ai/written-traits-only-boundary.md): only trait
extraction may ever receive the photo; every downstream step is text-only.

The moving pieces are network-bound (Gemini HTTP calls), not CPU-bound. `worker_threads` would
duplicate V8 isolates and provider clients without improving network latency — the same reasoning
that deferred worker pools in [ADR-003](./adr-003-horizontal-scaling-plan.md).

## Decision

Adopt **bounded async concurrency** for the candidate-recall step, behind
`AI_PARALLEL_PIPELINE_ENABLED` (default `false`). This is **Release A** of a phased plan:

- **Release A (this ADR):** candidate generation fans out into `AI_GENERATION_LANES` text-only
  lanes, each with a distinct recall focus (strongest / diverse / wildcard). Lanes run under a
  process-global per-step concurrency gate, are clamped to a per-analysis call budget, and are
  deterministically merged/deduped. Judge and extraction remain single calls. No worker threads.
- **Release B (deferred):** bounded judge tournament for large candidate pools (the judge gate is
  already provisioned by `AI_JUDGE_CONCURRENCY`).
- **Release C (deferred):** a CPU `worker_threads` pool — **only** if profiling proves local CPU
  work (e.g. image decode) blocks the event loop. See ADR-003 Option C.
- **Release D (deferred):** horizontal replicas behind a load balancer (ADR-003 Option B).

### Release A mechanics

| Concern | Mechanism |
| --- | --- |
| Strategy selection | `CandidateRecallService.recall()` — single call when the flag is off (byte-identical to before), fan-out when on. `StyleMatchService` depends only on this one recall collaborator. |
| Lane focus | A small text-only "## Lane focus" section is **appended in code** (versioned focus-directive constants, like region hints) to the file-owned base prompt. The base prompt file is unchanged, so the flag-off path is byte-for-byte identical and no prompt-version bump is needed. |
| Global bound | `AiStepConcurrencyGate` — a NestJS singleton holding one `Semaphore` per gated step (`core/concurrency/semaphore.ts`). Because it is a singleton, its per-step permit pool bounds concurrent generation calls across **all** simultaneous analyses (`AI_GENERATION_CONCURRENCY`). |
| Per-analysis budget | Lane count is clamped so `extraction + lanes + judge ≤ AI_MAX_CALLS_PER_ANALYSIS` (reserved = 2). A clamp logs a warning — never a silent cap. |
| Lane wait | A lane that cannot get a permit within `AI_PARALLEL_QUEUE_TIMEOUT_MS` is dropped (not blocked). Fan-out uses `Promise.allSettled`. |
| Partial failure | One failed/timed-out lane never fails the analysis; survivors merge. An empty merge falls back exactly as the single-call path does. |
| Determinism | Pools merge/dedupe by canonical name (keep higher `styleVibeFitScore`), ordered score-desc then name-asc, so identical lane outputs aggregate identically regardless of finish order. |
| Cancellation | The analysis `AbortSignal` threads into every lane and its gate wait; a queued lane whose signal aborts never starts. |
| SSE contract | Unchanged — identical public stages. Optional per-lane counters are a documented forward option, not shipped. |

## Consequences

- **Positive:** better recall/diversity and lower latency when enabled; a reusable
  `Semaphore` + step gate for future stages; the privacy boundary and SSE contract are untouched;
  instantly reversible via one flag.
- **Cost:** parallelism trades provider **cost** for latency — bounded by the per-analysis call
  budget and the global gate (see [cost-policy.md](../../docs/ai/cost-policy.md)). Both latency and
  cost are acceptance criteria before the flag is turned on in any environment.
- **Known limitation:** the gate is single-process/in-memory, so cross-instance provider
  concurrency is bounded per-instance only — the same limitation as the admission
  [`ConcurrencyLimiter`](../../docs/ai/concurrency-policy.md) and ADR-003. Fleet-wide bounding is a
  horizontal-scaling concern (Release D).

## Alternatives considered

- **`worker_threads` / Piscina for generation lanes — Rejected for Release A.** The lanes are
  network-bound; workers add isolate/client duplication and pool management without latency benefit.
  Reserved for Release C, gated on profiling (ADR-003 Option C).
- **Unbounded `Promise.all` fan-out — Rejected.** A burst of simultaneous analyses would multiply
  concurrent provider calls without limit. The global gate + budget + `allSettled` are mandatory.
- **Reusing `ConcurrencyLimiter` — Rejected as the wrong tool.** It is whole-analysis admission
  control (global / per-IP / per-tab); bounding a fixed set of fan-out tasks is a distinct concern,
  so a small dedicated `Semaphore` primitive is the right reuse boundary.
- **Editing the shared base prompt to add a lane-focus placeholder — Rejected.** It would change
  the default (flag-off) prompt. Appending a focus section in code keeps the default path identical.
