---
id: ai-prompt-injection-threat-model
title: Prompt Injection Threat Model
type: doc
authority: canonical
status: current
owner: repository owner
summary: The injection surfaces (image-as-input, model-JSON re-interpolation) and the concrete mitigations — placeholder validation, strict parsing, byte caps, safety filters, bounded error summaries.
keywords: [ai, security, prompt-injection, threat-model, sanitizer, placeholders, validation, mitigations]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/infrastructure/prompt-template.repository.ts, apps/api/src/modules/ai/lib/ai-response-sanitizer.ts, apps/api/src/modules/ai/lib/json-response.util.ts]
relatedTests: [apps/api/src/modules/ai/tests/prompt-template.repository.test.ts, apps/api/src/modules/ai/tests/ai-response-sanitizer.test.ts]
relatedDocs: [docs/security-threat-model.md, docs/ai-safety.md, docs/ai/output-validation.md]
readWhen: You are reviewing AI security, changing prompt building/parsing, or assessing a new injection vector.
---

# Prompt Injection Threat Model

**Owner of the repo-wide threat model:** [docs/security-threat-model.md](../security-threat-model.md)
(which already records "Provider error/response injection: Zod schema validation +
forbidden-wording filter"). This page details the AI-specific injection surfaces and mitigations.

## Surfaces

1. **Image-as-input injection.** The photo is the only user-controlled model input. An image can
   embed adversarial text ("ignore your instructions…") that a vision model may read and obey.
2. **Model-output re-interpolation.** Extraction output is interpolated into Prompt 2/3 as
   `[TRAITS_JSON]`; the candidate pool into Prompt 3 as `[CANDIDATES_JSON]`; an existing result
   into Prompt 4 as `[RESULT_JSON]`. A compromised step-1 output is attacker-influenced input to
   later prompts.
3. **Provider response/error injection.** Malicious or malformed provider output/error text
   could try to smuggle content into responses or logs.

## Mitigations, by mechanism

### Prompt construction

- Template loading verifies every required placeholder exists; replacement is **split/join —
  no regex**, so `$`-patterns or regex metacharacters in interpolated JSON cannot corrupt the
  template; and any built prompt still containing ANY known placeholder is rejected before it can
  reach a provider
  ([`prompt-template.repository.ts`](../../apps/api/src/modules/ai/infrastructure/prompt-template.repository.ts)).
- What gets interpolated is already schema-constrained: `[TRAITS_JSON]` /
  `[CANDIDATES_JSON]` / `[RESULT_JSON]` are serializations of **Zod-validated, safety-filtered,
  bounded** objects from the previous step ([schema-contracts.md](schema-contracts.md)) — not raw
  model text.

### Response handling

- Sanitizer strips markdown fences and extracts first-`{`-to-last-`}`; it **never repairs**
  malformed JSON (`lib/ai-response-sanitizer.ts`).
- Strict Zod parse with bounded strings/arrays; final response is a `strictObject` — unknown
  keys cannot ride along ([output-validation.md](output-validation.md)).
- Response size is capped at `AI_MAX_RESPONSE_BYTES` (default 500 000) with mid-stream abort on
  overflow — an injected "flood" cannot exhaust memory
  ([retry-timeout-policy.md](retry-timeout-policy.md)).
- Language echo guard rejects responses that switched language
  (`lib/response-language.guard.ts`).
- Forbidden-wording scan + literal-false safety flags catch instruction-following that produces
  identity/sensitive content ([safety-filters.md](safety-filters.md)); disclaimer and fallback
  copy are always server-owned, so injected "official-looking" text can't replace them.

### Diagnostics and logs

- Zod issue summaries are privacy-safe: **field paths + issue codes only, max 8** — raw model
  text never enters error envelopes (`lib/json-response.util.ts`).
- Provider error text is redacted before logging (Gemini adapter uses the privacy module's
  `redactForLog`); image bytes are never logged.

## Residual risk (accepted, recorded)

A vision model could still be socially engineered by in-image text into producing *schema-valid,
wording-clean but wrong* traits. The blast radius is bounded by design: outputs are playful
style/vibe matches, hard-capped by schemas, safety filters, honesty caps, and the aggregation
display gate — no identity claims can pass ([docs/ai-safety.md](../ai-safety.md)). No mechanism
in this repo grants model output any authority (no tool calls, no code execution, no persistence).
