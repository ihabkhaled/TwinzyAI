# AI Safety Decisions

Rule: [/rules/14-ai-safety.md](../rules/14-ai-safety.md). Privacy invariants:
[privacy-decisions.md](./privacy-decisions.md).

- Three-prompt analysis pipeline: image -> traits (1st, image allowed), traits -> candidates
  (2nd, text only), traits+candidates -> judged results (3rd, text only). V2 adds a fourth
  TEXT-ONLY translation prompt behind POST /api/v1/game/translate-result (rate-limited, strict
  zod body with no file slot) — a language switch localizes the existing result JSON; the image
  is never re-uploaded or re-analyzed.
- **The safety boundary is structural**: the AI provider port (Symbol injection token) splits
  the image-capable method from the text-only methods. Only the trait-extraction call can
  accept image bytes; the candidate, judge, and translation prompts are text-only by interface
  shape. `@google/genai` is imported ONLY in `modules/ai/adapters/gemini.adapter.ts` behind that
  port ([library-boundaries.md](./library-boundaries.md)).
- Traits are advanced grouped **visible, non-identifying** attributes (style/vibe), extracted as
  text: 221 named fields across 16 nested categories + a structured uncertaintyNotes block (4
  bounded lists) — target 100+ traits when image quality allows; unclear fields stay honestly
  "unclear" (localized). No face recognition, no identity matching, no biometrics — ever.
- **Prompt/schema lock-step**: the trait taxonomy is defined ONCE in
  `packages/shared/src/constants/trait-category.constants.ts`; the Prompt 1 JSON template is
  generated from it and a unit test asserts every taxonomy field appears in use-1st-prompt.md —
  the prompt and the zod schema can never drift.
- Prompts stored as versioned .md files in apps/api/src/modules/ai/prompts (four templates:
  extraction, candidates, judge, translation), loaded by PromptTemplateRepository with
  placeholder validation ([TRAITS_JSON], [CANDIDATES_JSON], [RESULT_JSON], [LANGUAGE_CODE],
  [TARGET_LANGUAGE_CODE], [RESULT_COUNT], [REGION_HINT]).
- Provider/model routes come exclusively from validated environment configuration
  (`GEMINI_MODEL` remains the required default) — never hardcoded
  ([backend-stack.md](./backend-stack.md)).
- Responses failing schema or safety checks are rejected (AI_RESPONSE_INVALID/UNSAFE); we do not
  silently "fix" unsafe model output beyond dropping offending candidates. Response schemas are
  bounded zod 4 schemas, promptVersion is the literal `written-traits-v5`, and the
  forbidden-wording safety filter runs over every free-text
  leaf (all trait values, summary entries, and candidate/judge/translation text fields).
- **Language echo is asserted**: every prompt receives [LANGUAGE_CODE] (en|ar) and every response
  schema requires the languageCode echo; trait extraction additionally asserts the echoed
  language equals the requested one — a mismatch is rejected as AI_RESPONSE_INVALID, never
  silently re-localized.
- **Disclaimer and no-match fallback are SERVER-side localized constants**
  (RESULT_DISCLAIMER_BY_LANGUAGE / NO_MATCH_FALLBACK_BY_LANGUAGE in packages/shared): result
  aggregation and translation always overwrite them with the fixed copy for the response's
  languageCode — model text is never trusted for either.
- **Translation cannot tamper**: after the translation prompt, the server overwrites every
  canonical field (names, ranks, scores, verdicts, confidence, categories, traitCount,
  promptVersion) from the original result; a changed/reordered name or any shape drift rejects
  the whole response (AI_RESPONSE_INVALID) and the client keeps showing the previous result. The
  model's output only survives in localized text positions.
- **traitCount is backend-derived display metadata**: extraction recomputes populated taxonomy
  fields after parsing, and translation preserves the canonical count.
- More than 25 candidates is rejected by schema; final results are bounded by the user's shared
  1–10 request count and re-ranked/filtered before display.
- Results are playful public style matches — entertainment only; that framing is part of the
  product contract, not marketing copy.
