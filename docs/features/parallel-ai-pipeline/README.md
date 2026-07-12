# Feature: Parallel AI pipeline — Release A (async candidate-generation lanes)

Request `TWZ-2026-PARALLEL-AI`. Lets the candidate-recall step of the analyze pipeline fan out from
a single Gemini text call into bounded, text-only **generation lanes** (each with a distinct recall
focus) to improve candidate diversity/recall and reduce latency — **flag-gated and off by default**,
with the privacy model, the SSE contract, and the flag-off single-call path all left byte-for-byte
unchanged. First slice of a phased plan (A generation lanes [this] · B bounded judge tournament ·
C CPU worker pool only if profiling proves event-loop blocking · D horizontal replicas); only
Release A ships here.

## Phase trail

| Phase | Artifact |
| --- | --- |
| 00 Intake | [00-intake.md](00-intake.md) |
| 03 Product requirements | [03-product-requirements.md](03-product-requirements.md) |
| 06 Technical refinement (decisions/ADR) | [06-technical-refinement.md](06-technical-refinement.md) |
| 08 Architecture review | [08-architecture-review.md](08-architecture-review.md) |
| 09 Impact analysis | [09-impact-analysis.md](09-impact-analysis.md) |
| 11 Test strategy | [11-test-strategy.md](11-test-strategy.md) |
| 12 Coverage plan | [12-coverage-plan.md](12-coverage-plan.md) |
| 13 Implementation readiness | [13-implementation-readiness.md](13-implementation-readiness.md) |
| 15 Dev validation report | [15-dev-validation-report.md](15-dev-validation-report.md) |
| 16 Dev bug log (adversarial self-review) | [16-dev-bug-log.md](16-dev-bug-log.md) |
| 19 Security & privacy review | [19-security-review.md](19-security-review.md) |
| 23 Documentation changelog | [23-documentation-changelog.md](23-documentation-changelog.md) |

Phases 01/02/04/05/07/10 are folded into the artifacts above (business/product framing → 03,
delivery/roadmap/standards → 06/08/13) at a depth proportionate to a flag-off-by-default performance
enhancement with no new external dependency; the standing baselines they inherit live in
[`docs/sdlc/`](../../sdlc/README.md). Phases 17–27 (independent QA, UAT, client approval, go/no-go,
release, hypercare, retrospective) are release-cycle gates: **not applicable to this code-complete,
flag-off-by-default delivery; owned by the operator** when the flag is turned on in a real
environment.

## Design authority

The architectural decision is recorded in
[ADR-004 — Parallel AI pipeline](../../../architecture/adrs/adr-004-parallel-ai-pipeline.md), which
sits under the horizontal-scaling plan in
[ADR-003](../../../architecture/adrs/adr-003-horizontal-scaling-plan.md). The written-traits-only
boundary this feature must never cross is
[`docs/ai/written-traits-only-boundary.md`](../../ai/written-traits-only-boundary.md); the bounding
rationale is [`docs/ai/concurrency-policy.md`](../../ai/concurrency-policy.md) and
[`docs/ai/cost-policy.md`](../../ai/cost-policy.md).

## Implementation (single gate-green slice on `main`)

- Core primitive: reusable abortable `Semaphore` under `apps/api/src/core/concurrency/`.
- AI module: `AiStepConcurrencyGate` (process-global per-step bound) + `CandidateRecallService`
  (single-vs-parallel strategy) + deterministic lane planning/merge helpers under
  `modules/ai/lib/`.
- Six new env-driven caps (all defaulted; flag `AI_PARALLEL_PIPELINE_ENABLED` off by default).
- No frontend change, no shared-contract change, no worker threads (deferred to Release C).
