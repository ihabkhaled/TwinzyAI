# 14 — AI Safety

> Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rules 43–46) · [15-file-upload-security.md](./15-file-upload-security.md) · [17-manager-layer.md](./17-manager-layer.md) (the analyze pipeline) · [26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md) (IntegrationError mapping) · [25-configuration-and-environment.md](./25-configuration-and-environment.md) (GEMINI_MODEL) · [/memory/ai-safety-decisions.md](../memory/ai-safety-decisions.md)

Hard boundaries:
- Only trait extraction (use-1st-prompt) receives the image. Candidate (2nd) and judge (3rd)
  prompts receive text only — no image, no image URL, no hash, no crop, no embedding.
- No face recognition, identity matching, biometric comparison, or exact-lookalike claims.
- No sensitive inference: ethnicity, religion, health, attractiveness, income, nationality,
  personality, background.

Enforcement:
- Zod-validate every model response (exactly 15 traits; 1-5 candidates; max 4 final results).
- AiSafetyService + ForbiddenWordingGuard reject or sanitize unsafe output (shared phrase list).
- Model self-reported safetyCheck flags must all be false or the response is rejected.
- Disclaimer is enforced server-side and always shown in the UI.
- GEMINI_MODEL from env; prompts loaded from files with placeholder validation.
