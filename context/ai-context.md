# AI Context

Pipeline (backend only; frontend never talks to Gemini):
1. use-1st-prompt.md + image -> exactly 15 visible traits JSON (TraitExtractionResponseSchema).
2. use-2nd-prompt.md + [TRAITS_JSON] -> 1-5 candidates (CandidateGenerationResponseSchema). TEXT ONLY.
3. use-3rd-prompt.md + [TRAITS_JSON] + [CANDIDATES_JSON] -> judged results, max 4 displayed
   (CandidateJudgeResponseSchema). TEXT ONLY.
GeminiAdapter is the single SDK touchpoint; model from GEMINI_MODEL env; timeout enforced;
responses Zod-validated then safety-filtered (forbidden phrases + safetyCheck flags).
