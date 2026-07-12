# 03 - Product Requirements

## Epic

Improve candidate diversity/recall and latency of the analyze pipeline by letting candidate
generation fan out into bounded, text-only recall lanes — behind a flag that is off by default, with
zero change to default behavior, the privacy model, or the SSE contract.

## User stories & acceptance criteria

### US-1 — Off by default is exactly today's behavior

- As the operator, turning nothing on changes nothing.
- **AC-1.1** With `AI_PARALLEL_PIPELINE_ENABLED=false` (default), `CandidateRecallService.recall()`
  makes exactly **one** un-focused generation call — the same call, with the same prompt, as before.
- **AC-1.2** The base generation prompt file is unchanged; no prompt-version bump, no schema change,
  no new SSE frame fields.

### US-2 — Flag on fans out into bounded, text-only lanes

- As the operator, enabling the flag makes recall sweep the written evidence from several angles.
- **AC-2.1** With the flag on, recall fans out into `AI_GENERATION_LANES` (default 2) text-only
  lanes, each carrying a distinct focus (strongest / diverse / wildcard) applied by appending a
  text-only `## Lane focus` section to the generation prompt.
- **AC-2.2** Every lane is a **text-only** provider call — no lane receives an image URL, hash, crop,
  embedding, or metadata (the provider generation method has no image slot).
- **AC-2.3** Lanes run under a process-global per-step concurrency gate (`AiStepConcurrencyGate`, a
  `Semaphore` sized by `AI_GENERATION_CONCURRENCY`, default 2) so many simultaneous analyses can
  never burst the provider quota.
- **AC-2.4** Lane count is clamped to a per-analysis call budget (`AI_MAX_CALLS_PER_ANALYSIS`,
  default 5 = extraction + lanes + judge; `RESERVED_NON_GENERATION_CALLS = 2`), logging a **warning**
  when clamped — never a silent cap.

### US-3 — One slow/failed lane never breaks the analysis

- As a player, a lane that stalls or fails is invisible; I still get a result.
- **AC-3.1** A lane that cannot acquire a permit within `AI_PARALLEL_QUEUE_TIMEOUT_MS` (default
  30000) is **dropped, not blocked** (`Promise.allSettled`).
- **AC-3.2** One failed/timed-out lane never fails the analysis; surviving lane pools are still used.
- **AC-3.3** If the merged pool is empty, the caller falls back **exactly** as the single-call path
  does (server localized fallback).

### US-4 — Merged results are deterministic

- As the operator, identical lane outputs always aggregate identically regardless of finish order.
- **AC-4.1** Lane pools merge and dedupe by **canonical name** (trim / lowercase / collapse
  whitespace), keeping the higher `styleVibeFitScore`.
- **AC-4.2** The merged list is ordered deterministically (score desc, then canonical name asc); on a
  score tie the earlier lane wins — so completion order cannot change the output.

### US-5 — Nothing else in the pipeline changes

- **AC-5.1** Trait extraction still runs exactly **one** image call; judging still runs exactly
  **one** call in Release A (`AI_JUDGE_CONCURRENCY` provisions the gate for the future Release B
  tournament but does not add calls now).
- **AC-5.2** The SSE contract is unchanged — identical public stages (`validating`, `scanning`,
  `extracting-traits`, `generating-candidates`, `judging`, `aggregating`). No worker threads
  (Release C).

## Out of scope / non-goals

- The bounded judge tournament (Release B), a CPU worker pool (Release C), and horizontal replicas
  (Release D) — planned, not implemented here.
- Per-lane SSE progress counters — a documented forward option, not shipped in Release A.
- Any change to extraction, translation, sharing, or display.

## UX / states

- No new user-facing copy. Flag off → identical experience. Flag on → a potentially richer/faster
  candidate set; the empty-merge path reuses the existing localized fallback copy.

## Analytics / localization / permissions

- No new analytics events. No new user-facing strings (lane focus text is an internal server prompt
  fragment, never surfaced). No auth/permissions (the game has none).

## Product definition of done

All ACs verified by deterministic fake-adapter unit tests (no live provider); the flag-off path
proven to make exactly one un-focused call; the privacy boundary (zero image calls on lanes/judge)
asserted; existing pipeline tests green. See [11-test-strategy.md](11-test-strategy.md) and
[15-dev-validation-report.md](15-dev-validation-report.md).
