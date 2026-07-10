# AI Safety

See rules/14-ai-safety.md for the normative rules. Implementation summary:

- Prompt files are the contract; PromptTemplateRepository verifies required placeholders exist,
  replaces them safely, and rejects any unreplaced placeholder before a call is made.
- The image is passed only to trait extraction; the adapter method for text-only calls does not
  accept image input, making leakage a type error. Candidate, judge, and translation prompts
  receive text only (traits / candidates / result JSON).
- Every response is Zod-validated with bounded shapes: the 221-field advanced grouped visible
  trait taxonomy (built from `trait-category.constants.ts`), bounded arrays and strings, a
  candidate pool capped at 25, requested final results bounded to 1–10, and the
  `promptVersion` literal `written-traits-v5`.
- A schema/prompt lock-step unit test asserts every taxonomy field appears in the Prompt 1
  template, so the prompt and the Zod schema can never drift apart.
- Every response must echo the requested `languageCode` (en/ar) — a schema field plus an
  explicit assertion; a language drift rejects the response. All dynamic output is localized,
  and a language switch translates the existing result without re-analysis.
- Trait and candidate responses carry `safetyCheck` self-attestation flags (for example
  `containsIdentityClaim`, `containsFaceRecognitionClaim`, `containsBiometricClaim`) typed as
  literal `false`; any `true` value fails validation.
- AiSafetyService sweeps every free-text leaf — all 221 trait values, the uncertainty notes,
  the compact trait summary, and every candidate/judge/translation text field — against
  FORBIDDEN_RESULT_PHRASES and sensitive-topic terms; a hit rejects the response
  (AI_RESPONSE_UNSAFE) or drops the offending candidate/result.
- The disclaimer and no-match fallback are server-side localized constants
  (RESULT_DISCLAIMER_BY_LANGUAGE / NO_MATCH_FALLBACK_BY_LANGUAGE), enforced in aggregation;
  model text is never trusted for them.
- Language switching calls the text-only translate-result endpoint (strict body, no file slot;
  the image is never re-uploaded or re-analyzed). After translation the server overwrites every
  canonical field — names, ranks, scores, verdicts, confidence, categories, traitCount,
  promptVersion — from the original result, rejects renames or shape drift
  (AI_RESPONSE_INVALID), re-imposes the localized disclaimer/fallback, and safety-filters all
  translated text.
- Scores are labelled style/vibe fit — never accuracy, similarity, or biometric confidence.
