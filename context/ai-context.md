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
