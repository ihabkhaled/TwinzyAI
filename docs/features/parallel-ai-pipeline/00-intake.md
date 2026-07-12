# 00 - Request Intake and Classification

## Request Record

| Field | Value |
| --- | --- |
| Request ID | `TWZ-2026-PARALLEL-AI` |
| Feature slug | `parallel-ai-pipeline` |
| Request title | Parallel AI pipeline — Release A: async candidate-generation lanes (flag-gated, off by default) |
| Request type | enhancement (performance + reliability) |
| Request source | internal delivery (phased AI-pipeline scaling plan, Release A of A–D) |
| Technical owner | AI delivery agent (backend) |
| Requested date | 2026-07-12 |
| Delivery track | standard (single gate-green slice on `main`) |

## Affected Domains

- [x] Backend (`apps/api`) — new `core/concurrency` primitive, AI-step gate, candidate-recall
  service, lane planning/merge helpers, six env-driven caps
- [x] Config / env — 6 new vars in `env.schema.ts` + `env-bounds.constants.ts` + getters in
  `app-config.service.ts`; `.env`/`.env.example`
- [x] AI / model behavior — candidate generation may fan out into text-only focus lanes (flag on);
  extraction and judging call counts unchanged
- [x] Security / privacy — image boundary preserved and re-asserted; fan-out bounded so it cannot
  amplify provider cost
- [x] Documentation — this feature folder + ADR-004
- [ ] Frontend (`apps/web`) — **not touched** (SSE contract byte-stable)
- [ ] Shared contracts (`packages/shared`) — **not touched** (no new frame fields)

## Criticality and Delivery Track

| Item | Answer |
| --- | --- |
| Severity | Medium (latency/quality improvement; disabled by default; no external dependency added) |
| Player-facing | no by default (flag off → identical single-call behavior); when on, richer candidate pool only |
| Consent or upload-chain impact | no (upload validation + consent unchanged; image-wipe invariant preserved) |
| AI behavior or prompt impact | additive when flag on (a text-only focus section appended per lane); base prompt FILE unchanged |
| Privacy or regulated data impact | reviewed — no new data flows; lanes and judging remain text-only by construction |
| Production incident related | preventative / proactive scaling |

## Initial Scope Summary

### Problem statement

Candidate recall was a single Gemini text call, which caps candidate diversity/recall and puts the
whole recall step on one round-trip. Release A lets that step fan out into parallel text-only
**lanes** — each sweeping the same written evidence with a different recall focus — to improve
diversity/recall and reduce latency, **without** changing default behavior (the flag is off) and
**without** weakening the privacy model. It is the first of a phased plan: **A** async generation
lanes (this) · **B** bounded judge tournament · **C** CPU worker pool only if profiling proves
event-loop blocking · **D** horizontal replicas. Only Release A is implemented here.

### Product invariant check (must all hold)

- Game stays free — no payment logic touched. ✔
- Consent-first / only trait extraction sees the image — unchanged; lanes and judging are text-only
  by construction (the provider method has no image slot). ✔
- No image persistence — the buffer is still zero-filled in `finally` right after extraction;
  parallelism never touches the image path, only the already-text-only recall step. ✔
- No identity / sensitive inference — prompts unchanged in kind; lane focus is a recall *bias* that
  reaffirms every safety rule; every response still Zod-validated + safety-filtered. ✔
- `GEMINI_MODEL` from `.env` — unchanged; all new caps are env-driven, never hardcoded. ✔
- No `enum` keyword, no `eslint-disable`, no `any` — respected across the change. ✔

### Intake assumptions

- The flag-off single-call path must be **byte-for-byte identical** to today. Achieved by leaving the
  base prompt file unchanged and applying lane focus only by appending a text-only section in code —
  see [06-technical-refinement.md](06-technical-refinement.md).
- The SSE contract stays byte-stable (no new frame fields) so the frontend is untouched; optional
  per-lane counters are a documented forward option, not shipped.
- Concurrency bounding is per API instance (process-global gate). Fleet-wide bounding is a
  horizontal-scaling concern, consistent with
  [ADR-003](../../../architecture/adrs/adr-003-horizontal-scaling-plan.md). Accepted for the current
  single-process deployment.

## Exit Checklist

- [x] Request ID assigned · type classified · domains identified · track chosen
- [x] Product invariants reviewed at intake
- [x] Critical-risk areas (privacy image boundary, provider-cost amplification) flagged
