---
id: ai-output-validation
title: AI Output Validation
type: doc
authority: canonical
status: current
owner: repository owner
summary: How raw model text becomes trusted data — sanitizer, parseAiJsonResponse, per-model validators, byte caps, shape checks, and the language guard.
keywords: [ai, validation, parsing, json, sanitizer, zod, language, byte-cap, shape]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/lib/json-response.util.ts, apps/api/src/modules/ai/lib/ai-response-sanitizer.ts, apps/api/src/modules/ai/lib/response-language.guard.ts, apps/api/src/modules/ai/lib/json-shape.util.ts]
relatedTests: [apps/api/src/modules/ai/tests/json-response.util.test.ts, apps/api/src/modules/ai/tests/ai-response-sanitizer.test.ts, apps/api/src/modules/ai/tests/json-shape.util.test.ts]
relatedDocs: [docs/ai/schema-contracts.md, docs/ai/fallback-routing.md, docs/ai-safety.md]
readWhen: You are changing response parsing, validators, or debugging AI_RESPONSE_INVALID errors.
---

# AI Output Validation

The path from raw model text to trusted data, in order:

## 1. Byte cap (during assembly)

Streamed responses are assembled under `AI_MAX_RESPONSE_BYTES` (default 500 000, max 2 000 000 —
`apps/api/src/config/env-bounds.constants.ts:31-33`); overflow aborts the call mid-flight with
`AI_RESPONSE_INVALID` (Gemini adapter). The OpenAI-compat adapter caps both content-length and
body size the same way ([provider-catalog.md](provider-catalog.md)).

## 2. Per-model content validator (inside the adapters)

`buildSchemaValidator(schema)`
([`lib/json-response.util.ts`](../../apps/api/src/modules/ai/lib/json-response.util.ts)) is passed
as `AiCallOptions.validate`; each adapter runs it before accepting a model's text, so a
schema-failing model **burns a fallback hop** (`AI_RESPONSE_INVALID` is hoppable —
[fallback-routing.md](fallback-routing.md)) instead of failing the request.

## 3. Sanitizer + parse (in the step services)

`parseAiJsonResponse(text, schema)`:

1. Fence-strip via
   [`lib/ai-response-sanitizer.ts`](../../apps/api/src/modules/ai/lib/ai-response-sanitizer.ts)
   (strips markdown fences; extracts first-`{` to last-`}` as a fallback; **never repairs**
   malformed JSON);
2. `schema.safeParse` against the step's shared Zod schema
   ([schema-contracts.md](schema-contracts.md));
3. failure ⇒ typed `AI_RESPONSE_INVALID`.

**Privacy-safe diagnostics:** validation issue summaries contain field paths + issue codes only,
capped at 8 — raw model text never enters error messages or logs.

## 4. Language guard

[`lib/response-language.guard.ts`](../../apps/api/src/modules/ai/lib/response-language.guard.ts)
— `assertResponseLanguage`: the response's `languageCode` must equal the requested code, else
`AI_RESPONSE_INVALID`. Applied by the step services after parsing.

## 5. Shape checks (translation only)

[`lib/json-shape.util.ts`](../../apps/api/src/modules/ai/lib/json-shape.util.ts) —
`hasSameJsonShape` structurally compares the translated JSON against the original;
`result-translation.service.ts:85-139` additionally restores every canonical field (names,
ranks, scores, verdicts, confidence, categories, traitCount, promptVersion) from the original, so
translation can only change display text.

## 6. Safety filtering

After structural validation, every response passes the safety layers —
[safety-filters.md](safety-filters.md) (owner: [docs/ai-safety.md](../ai-safety.md)).

## Failure semantics

| Failure | Typed code | Route-hoppable? |
| --- | --- | --- |
| Byte cap overflow, unparseable/mis-shaped JSON, wrong language | `AI_RESPONSE_INVALID` | Yes |
| Forbidden wording in trait/translation text | `AI_RESPONSE_UNSAFE` | No — fails the request |
| Translation shape drift / canonical-field tampering | rejected by the translation service | No |
