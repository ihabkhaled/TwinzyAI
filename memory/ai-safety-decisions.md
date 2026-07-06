# AI Safety Decisions

Rule: [/rules/14-ai-safety.md](../rules/14-ai-safety.md). Privacy invariants:
[privacy-decisions.md](./privacy-decisions.md).

- Three-prompt pipeline: image -> traits (1st, image allowed), traits -> candidates (2nd, text
  only), traits+candidates -> judged results (3rd, text only).
- **The safety boundary is structural**: the AI provider port (Symbol injection token) splits
  the image-capable method from the text-only methods. Only the trait-extraction call can
  accept image bytes; the candidate and judge prompts are text-only by interface shape.
  `@google/genai` is imported ONLY in `modules/ai/adapters/gemini.adapter.ts` behind that port
  ([library-boundaries.md](./library-boundaries.md)).
- Traits are 15 **visible, non-identifying** attributes (style/vibe), extracted as text. No
  face recognition, no identity matching, no biometrics — ever.
- Prompts stored as versioned .md files in apps/api/src/modules/ai/prompts, loaded by
  PromptLoaderService with placeholder validation ([TRAITS_JSON], [CANDIDATES_JSON], [APP_NAME],
  [MODEL_PROVIDER]).
- Gemini model id comes exclusively from `GEMINI_MODEL` env — never hardcoded
  ([backend-stack.md](./backend-stack.md)).
- Responses failing schema or safety checks are rejected (AI_RESPONSE_INVALID/UNSAFE); we do not
  silently "fix" unsafe model output beyond dropping offending candidates. Response schemas are
  zod 4 strict schemas — unknown keys reject.
- More than 5 candidates from the model: response rejected by schema (documented choice: strict
  contract over silent capping at the generation step; the judge caps display results at 4).
- Results are playful public style matches — entertainment only; that framing is part of the
  product contract, not marketing copy.
