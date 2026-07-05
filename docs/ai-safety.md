# AI Safety

See rules/14-ai-safety.md for the normative rules. Implementation summary:

- Prompt files are the contract; PromptLoaderService validates placeholders before any call.
- The image is passed only to trait extraction; the adapter method for text-only calls does not
  accept image input, making leakage a type error.
- Every response is Zod-validated (exact shapes, exact 15 traits, candidate/result caps).
- AiSafetyService scans output against FORBIDDEN_RESULT_PHRASES and sensitive-topic terms; a
  failed check rejects the response (AI_RESPONSE_UNSAFE) or drops the offending candidate.
- The final response always carries the fixed disclaimer, enforced server-side in aggregation.
- Scores are labelled style/vibe fit — never accuracy, similarity, or biometric confidence.
