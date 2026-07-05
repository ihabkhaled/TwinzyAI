# AI Safety Decisions

- Three-prompt pipeline: image -> traits (1st, image allowed), traits -> candidates (2nd, text
  only), traits+candidates -> judged results (3rd, text only).
- Prompts stored as versioned .md files in apps/api/src/modules/ai/prompts, loaded by
  PromptLoaderService with placeholder validation ([TRAITS_JSON], [CANDIDATES_JSON], [APP_NAME],
  [MODEL_PROVIDER]).
- Gemini model id comes exclusively from GEMINI_MODEL env.
- Responses failing schema or safety checks are rejected (AI_RESPONSE_INVALID/UNSAFE); we do not
  silently "fix" unsafe model output beyond dropping offending candidates.
- More than 5 candidates from the model: response rejected by schema (documented choice: strict
  contract over silent capping at the generation step; the judge caps display results at 4).
