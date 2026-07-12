---
id: product-terminology
title: Product Terminology
type: product
authority: canonical
status: current
owner: repository owner
summary: "Canonical meanings of trait, candidate, judge, verdict, style/vibe match, share link, request id, and the other words the product and code share."
keywords: [terminology, glossary, trait, candidate, judge, verdict, share, request-id, disclaimer, vocabulary]
contextTier: 2
relatedCode: [packages/shared/src/schemas/judge.schema.ts, packages/shared/src/constants/trait.constants.ts, packages/shared/src/constants/stream.constants.ts]
relatedTests: [apps/web/e2e/game-mock-validity.spec.ts]
relatedDocs: [product/game-rules.md, knowledge/vocabulary.yaml, docs/ai-safety.md]
readWhen: You meet a domain word in code, copy, or a ticket and need its exact product meaning.
---

# Product Terminology

Each term names its code owner. Machine-readable synonyms for the task classifier live in
[knowledge/vocabulary.yaml](../knowledge/vocabulary.yaml).

| Term | Meaning | Owner |
| --- | --- | --- |
| **Trait** | One written, visible, non-identifying observation read from the photo (e.g. hair texture). Values may honestly be "unclear" ([`UNCLEAR_TRAIT_VALUE_MARKERS`](../packages/shared/src/constants/trait.constants.ts)). | [packages/shared/src/schemas/traits.schema.ts](../packages/shared/src/schemas/traits.schema.ts) |
| **Trait taxonomy** | The full 221-field, 16-category grouped structure the extraction step must fill ([docs/ai-safety.md](../docs/ai-safety.md)). | [packages/shared/src/constants/trait-category.constants.ts](../packages/shared/src/constants/trait-category.constants.ts) |
| **Trait extraction** | The ONLY pipeline step that receives the image; produces the traits + compact trait summary, then the image is wiped. | [apps/api/src/modules/ai/application/trait-extraction.service.ts](../apps/api/src/modules/ai/application/trait-extraction.service.ts) |
| **Candidate** | A public figure proposed (text-only, from the written traits) as a possible style/vibe match; internal pool of 1–25, always ≥ the requested result count. | [packages/shared/src/schemas/candidates.schema.ts](../packages/shared/src/schemas/candidates.schema.ts), [trait.constants.ts](../packages/shared/src/constants/trait.constants.ts) |
| **Judge** | The strict third AI step that rescopes candidates, decides display, and self-certifies safety flags; its response is zod-validated and safety-filtered. | [apps/api/src/modules/ai/prompts/use-3rd-prompt.md](../apps/api/src/modules/ai/prompts/use-3rd-prompt.md), [packages/shared/src/schemas/judge.schema.ts](../packages/shared/src/schemas/judge.schema.ts) |
| **Verdict** | The banded strength of a match: `strong` / `medium` / `weak`. | [packages/shared/src/enums/verdict.enum.ts](../packages/shared/src/enums/verdict.enum.ts) |
| **Style/vibe match** | A displayed result: a public figure + 0–100 `finalStyleVibeFitScore`, verdict, confidence, reasons, evidence traits, mismatch warnings. Never an identity claim ([game-rules.md](game-rules.md)). | [packages/shared/src/schemas/judge.schema.ts](../packages/shared/src/schemas/judge.schema.ts) |
| **Confidence level** | The judge's certainty label attached to each match, separate from the score. | [packages/shared/src/enums/confidence.enum.ts](../packages/shared/src/enums/confidence.enum.ts) |
| **Result count** | The user-selected number of displayed matches, 1–10, default 10; the backend slices authoritatively. | [packages/shared/src/constants/trait.constants.ts](../packages/shared/src/constants/trait.constants.ts), [result-count.schema.ts](../packages/shared/src/schemas/result-count.schema.ts) |
| **Disclaimer** | The fixed, localized, server-enforced text on every result and fallback; model disclaimers are never trusted. | [apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts](../apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts), [app.constants.ts](../packages/shared/src/constants/app.constants.ts) |
| **Fallback message** | The server's localized "no match" text, required whenever results are empty. | same owners as Disclaimer |
| **Share link / shareId** | A temporary, unguessable UUID link to a stored-in-memory copy of one result; TTL 60–3600s (default 600); public page at `/share/<uuid>`; missing and expired are the same safe 404. | [packages/shared/src/constants/share-result.constants.ts](../packages/shared/src/constants/share-result.constants.ts), [docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md) |
| **Request id** | The per-run correlation id: sent as the `x-twinzy-request-id` header on the stream, carried in payment order creation, and bound to the PayPal capture via `custom_id`. | [packages/shared/src/constants/stream.constants.ts](../packages/shared/src/constants/stream.constants.ts), [packages/shared/src/schemas/payment.schema.ts](../packages/shared/src/schemas/payment.schema.ts) |
| **Tab id** | The per-browser-tab uuid (sessionStorage key `twinzy.tabId`) that isolates concurrent tabs' SSE frames. | [apps/web/src/shared/constants/storage-keys.constants.ts](../apps/web/src/shared/constants/storage-keys.constants.ts), [game-stream.schema.ts](../packages/shared/src/schemas/game-stream.schema.ts) |
| **languageCode** | The `en`/`ar` code that rides along every AI step and must be echoed back by the model. | [packages/shared/src/schemas/language.schema.ts](../packages/shared/src/schemas/language.schema.ts) |
| **Paywall** | The env-gated PayPal Orders v2 gate on analysis; off by default; sandbox-approved only. | [monetization-policy.md](monetization-policy.md) |
| **Donate link** | The voluntary, env-gated outbound paypal.me link; never gates anything. | [monetization-policy.md](monetization-policy.md), [apps/web/src/shared/helpers/donate-link.helper.ts](../apps/web/src/shared/helpers/donate-link.helper.ts) |
