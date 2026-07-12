# 09 - Impact Analysis

## Affected systems

| System | Impact | Backward compatible? |
| --- | --- | --- |
| Candidate recall step | Optionally fans out into text-only focus lanes behind a flag; single-call path preserved | Yes — flag off is byte-for-byte today's single call |
| Candidate generation service | Gained an optional trailing `lane` param (appends a focus section) | Yes — default (no `lane`) path unchanged |
| `StyleMatchService` (game) | Now injects `CandidateRecallService` instead of the generation service + config (4 constructor params) | Internal only — one collaborator swap, all call sites updated in the same change |
| Config / env | 6 new env vars with safe defaults | Yes — all defaulted; `.env`/`.env.example` updated together |
| SSE analyze stream | **Untouched** — identical public stages, no new frame fields | Yes — frontend needs no change |
| Shared contract (`@twinzy/shared`) | **Untouched** | Yes |
| Trait extraction / judging / translation | Call counts unchanged (extraction = 1 image call, judge = 1 call in Release A) | Yes |
| AI provider adapter | **Untouched** — generation method still text-only (no image slot) | Yes |

## Migration / compatibility

- **No schema/data migration** — the game has no database; nothing persisted.
- **Config drift**: the 6 new caps are defaulted in
  [`env.schema.ts`](../../../apps/api/src/config/env.schema.ts), so an un-updated `.env` still boots
  with the feature off; [`.env.example`](../../../.env.example) documents them and fail-fast zod
  validation (with bounds in
  [`env-bounds.constants.ts`](../../../apps/api/src/config/env-bounds.constants.ts)) covers bad
  overrides.
- **Behavior skew**: flag off is indistinguishable from the previous release. Flag on only enriches
  the candidate pool and (potentially) reduces recall latency; the empty-merge path falls back to the
  same localized fallback as the single-call path, so there is no new terminal state.

## Team / ops impact

- **Operations**: 6 env vars to (optionally) tune in non-local environments; safe defaults exist and
  the feature is off by default. No new services, ports, queues, or infra. Instantly reversible by
  setting `AI_PARALLEL_PIPELINE_ENABLED=false`.
- **Observability**: new `info` log per parallel recall (`N lane(s), K succeeded, M merged`), a
  `warn` when the lane count is clamped by the call budget, and a `warn` per failed/timed-out lane
  recording the **error type only**. No new dashboards required for this flag-off delivery.
- **Cost**: when on, provider calls per analysis rise from 1 generation call to up to
  `AI_GENERATION_LANES` (default 2), hard-bounded by `AI_MAX_CALLS_PER_ANALYSIS`. Bounding rationale
  in [`docs/ai/cost-policy.md`](../../ai/cost-policy.md) and
  [`docs/ai/concurrency-policy.md`](../../ai/concurrency-policy.md).

## Known limitation (explicit)

The `AiStepConcurrencyGate` and its `Semaphore` are **in-memory, per API instance**. The gate is a
NestJS singleton, so the bound is process-global (across simultaneous requests) but not fleet-wide.
In a multi-instance deployment the per-step concurrency cap applies per instance. Mitigation for
horizontal scale (out of scope here): a shared store, per
[ADR-003](../../../architecture/adrs/adr-003-horizontal-scaling-plan.md) and
[ADR-004](../../../architecture/adrs/adr-004-parallel-ai-pipeline.md). Recorded in the gate
doc-comments and [08-architecture-review.md](08-architecture-review.md).

## Compliance / privacy

No new data collected or persisted. Parallelism does not touch the image path — it only fans out the
already-text-only recall step; every lane and the judge remain text-only by construction (the
provider method has no image slot). The image-wipe-in-`finally` invariant is preserved. Lane-failure
logging records the error **type (name) only** — never provider detail, secrets, or image data. No
change to consent, upload validation, or the safety filter. See
[`docs/ai/written-traits-only-boundary.md`](../../ai/written-traits-only-boundary.md) and
[19-security-review.md](19-security-review.md).
