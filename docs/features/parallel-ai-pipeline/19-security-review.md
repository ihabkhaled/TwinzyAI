# 19 - Security & Privacy Review

## Scope

The change adds bounded, flag-gated parallelism to the **text-only** candidate-recall step. It adds
**no new external dependency, no new network surface, and no new user input**. The attack surface is
therefore unchanged from the previous release.

## Privacy / image-boundary review (Twinzy non-negotiable)

| Check | Result |
| --- | --- |
| Only trait extraction receives the photo | Preserved — extraction is still the sole image call; lanes and judging are text-only **by construction** (the provider generation method has no image slot) |
| Parallelism touches the image path | No — fan-out only multiplies the already-text-only recall step; no lane, gate, or merge receives an image URL, hash, crop, embedding, or metadata |
| Image buffer wiped after use | Preserved — zero-filled in `finally` on success/failure/abort in [`analyze-game.use-case.ts`](../../../apps/api/src/modules/game/application/analyze-game.use-case.ts) |
| No image data in logs | Confirmed — lane-failure logging records the error **type (name) only**, never provider detail, secrets, or image bytes |
| Asserted by tests, not assumed | Yes — `candidate-recall.service.test.ts` asserts fan-out issues exactly N text calls and **zero** image calls; `style-match.service.test.ts` asserts extraction stays one image call |

This upholds [`docs/ai/written-traits-only-boundary.md`](../../ai/written-traits-only-boundary.md).

## Abuse / resource review

- **Provider-cost amplification** — fan-out cannot be used to amplify cost or exhaust memory beyond
  existing admission caps. Three independent bounds apply: the **process-global per-step gate**
  (`AI_GENERATION_CONCURRENCY`), the **per-analysis budget** clamp
  (`AI_MAX_CALLS_PER_ANALYSIS`, generation calls ≤ budget − 2, unit-tested), and the **lane
  queue-timeout** (`AI_PARALLEL_QUEUE_TIMEOUT_MS`). Rationale: [`docs/ai/cost-policy.md`](../../ai/cost-policy.md),
  [`docs/ai/concurrency-policy.md`](../../ai/concurrency-policy.md).
- **Abort / cancel propagation** — the shared analysis `AbortSignal` threads into every lane and its
  gate wait; a queued lane whose signal aborts never starts. No orphaned in-flight lane after an
  aborted analysis.
- **Failure containment** — one failed/timed-out lane never fails the analysis (`Promise.allSettled`);
  an empty merged pool falls back exactly as the single-call path does — no new error surface.
- **Determinism** — the deterministic merge removes finish-order as an input to the result, so
  parallelism cannot be used to induce nondeterministic or manipulable output.

## Secrets / logging

No secrets handled. New logs are counts and error type names only; no provider payload, prompt
content, or image data is logged.

## Reversibility

Feature is **off by default** and instantly reversible via `AI_PARALLEL_PIPELINE_ENABLED=false` — no
redeploy of contracts required.

## Residual risk

Cross-instance (fleet-wide) provider-concurrency bounding is **per instance only** — the same known
single-process limitation documented in
[ADR-003](../../../architecture/adrs/adr-003-horizontal-scaling-plan.md) and
[ADR-004](../../../architecture/adrs/adr-004-parallel-ai-pipeline.md). Acceptable for the current
single-process deployment; a shared store is the horizontal-scaling mitigation (out of scope here).

## Decision

No unresolved critical or high-risk finding. The privacy boundary is preserved and test-asserted;
fan-out is bounded on three independent axes; the feature is off by default and reversible.
Cleared for a flag-off-by-default merge; operator owns turn-on-time monitoring.
