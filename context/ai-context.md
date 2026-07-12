# AI Context

Pipeline (backend only; the frontend never calls an AI provider):
1. `use-1st-prompt.md` + image → the shared 221-field visible-trait taxonomy, targeting 100+
   populated localized values when quality allows (`TraitExtractionResponseSchema`). This is the
   only image-facing step; the upload buffer is wiped immediately afterward.
2. `use-2nd-prompt.md` + `[TRAITS_JSON]` → a text-only candidate pool capped at 25
   (`CandidateGenerationResponseSchema`).
3. `use-3rd-prompt.md` + traits + candidates → text-only judged results bounded to the requested
   1–10 count (`CandidateJudgeResponseSchema`).
4. `translate-result-prompt.md` + existing result JSON → text-only localization; canonical
   names/ranks/scores are restored server-side.

Provider adapters are the only SDK/HTTP touchpoints. Routes/models come from validated env
configuration (`GEMINI_MODEL` is the default); timeouts apply; every response is Zod-validated and
safety-filtered (forbidden phrases + `safetyCheck` flags).

When `AI_PARALLEL_PIPELINE_ENABLED=true` (default `false`; Release A of ADR-004), step 2 fans out
through `CandidateRecallService` into `AI_GENERATION_LANES` text-only focus lanes bounded by a
process-global per-step gate (`AI_GENERATION_CONCURRENCY`) and a per-analysis call budget
(`AI_MAX_CALLS_PER_ANALYSIS`), with `AI_JUDGE_CONCURRENCY` and `AI_PARALLEL_QUEUE_TIMEOUT_MS` the
remaining knobs; failed/timed-out lanes are dropped and pools merged deterministically. The image
boundary and SSE contract are unchanged — see
[docs/ai/concurrency-policy.md](../docs/ai/concurrency-policy.md).
