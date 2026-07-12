---
id: domain-ubiquitous-language
title: Ubiquitous Language — Twinzy Domain Terms
type: domain
authority: canonical
status: current
owner: repository owner
summary: The canonical domain vocabulary — trait, extraction, candidate, judge, verdict, aggregation, share, request id, paywall gate, wipe — each anchored to its owning code.
keywords: [glossary, language, trait, candidate, judge, verdict, aggregation, share, paywall, wipe, request-id]
contextTier: 2
relatedCode: [packages/shared/src/enums, packages/shared/src/schemas, apps/api/src/modules]
relatedTests: [packages/shared/tests/stream-contract.test.ts]
relatedDocs: [domain/glossary.yaml, context/glossary.md, context/ai-context.md]
readWhen: You meet a domain word in code, a doc, or a prompt and need its exact Twinzy meaning.
---

# Ubiquitous Language — Twinzy Domain Terms

One line per term, anchored to the code that owns it. Architecture-layer vocabulary
(controller, use case, adapter, port, …) is owned by
[context/glossary.md](../context/glossary.md) — not restated here.
[glossary.yaml](glossary.yaml) is the machine-readable twin of this file.

## Core pipeline terms

| Term | Meaning | Owner in code |
| --- | --- | --- |
| **Trait** | One field of the 221-field visible, non-identifying taxonomy, as localized free text; unclear values stay honest markers. | `packages/shared/src/constants/trait-category.constants.ts` — see [trait-taxonomy.md](trait-taxonomy.md) |
| **Extraction** | Pipeline step 1 and the ONLY image-facing step: photo + Prompt 1 → Zod-validated written traits; the photo is wiped immediately after. | `apps/api/src/modules/ai/application/trait-extraction.service.ts` |
| **Matching evidence** | The distilled text payload (traits + aggregates) that the generation and judge prompts receive — never the image. | `apps/api/src/modules/ai/lib/matching-evidence.util.ts`, `apps/api/src/modules/ai/model/matching-evidence.types.ts` |
| **Candidate** | A playful public style/vibe match proposed in step 2 from written traits only; pool bounded 1–25. | `packages/shared/src/schemas/candidates.schema.ts` |
| **Judge** | Step 3: a strict text-only referee that verifies each candidate's claims against the evidence, re-scores conservatively, and removes weak/unsafe entries. | `apps/api/src/modules/ai/application/candidate-judge.service.ts`, prompt `apps/api/src/modules/ai/prompts/use-3rd-prompt.md` |
| **Verdict** | The judged strength of one match: `strong` / `medium` / `weak`, derived from the final score (80+ / 70–79 / <70). | `packages/shared/src/enums/verdict.enum.ts`; banding in `apps/api/src/modules/ai/prompts/use-3rd-prompt.md` (line 79) |
| **Aggregation** | The final server-side shaping step: keep only displayable judged results, re-rank, cap to the requested count, enforce the server disclaimer, drop `removedCandidates`. | `apps/api/src/modules/result-aggregation/` — see [result-ranking.md](result-ranking.md) |
| **Fallback result** | The safe, disclaimer-carrying response returned when no candidate survives judging/filtering; its text is a server constant, never model output. | `NO_MATCH_FALLBACK_BY_LANGUAGE` in `packages/shared/src/constants/app.constants.ts` |
| **Disclaimer** | The mandatory "style/vibe fit, not identity" text on every result — always the server-owned localized constant. | `RESULT_DISCLAIMER_BY_LANGUAGE` in `packages/shared/src/constants/app.constants.ts` |
| **Prompt version** | `written-traits-v5` — the contract version every AI response must echo as a `z.literal`, locking prompts and schemas together. | `GAME_PROMPT_VERSION` in `packages/shared/src/constants/app.constants.ts` |
| **Safety check** | The literal-`false` self-report booleans every AI response must carry (identity/biometric/lookalike/sensitive claims); any `true` fails validation. | `packages/shared/src/schemas/{traits,candidates,judge}.schema.ts` — see [safety-boundaries.md](safety-boundaries.md) |
| **Translation (result)** | The text-only 5th step that localizes an existing result while the server re-imposes every canonical field. | `apps/api/src/modules/ai/application/result-translation.service.ts` — see [language-lifecycle.md](language-lifecycle.md) |

## Request, stream, and money terms

| Term | Meaning | Owner in code |
| --- | --- | --- |
| **Request id** | The client-minted UUID identifying one analyze run; stamped on every SSE frame, bound to the PayPal order (`custom_id`), and required (with tabId + streamId) for cancel. | `CorrelationIdSchema` in `packages/shared/src/schemas/game-stream.schema.ts`; headers in `packages/shared/src/constants/stream.constants.ts` |
| **Tab id / stream id** | The other two correlation UUIDs: tabId isolates browser tabs; streamId is server-minted per SSE stream. Cancel aborts only on an exact three-id match. | `apps/api/src/core/streaming/stream-registry.service.ts` |
| **Stage** | A pipeline milestone reported over SSE: `validating`, `scanning`, `extracting-traits`, `generating-candidates`, `judging`, `aggregating`. | `GameStreamStage` in `packages/shared/src/enums/game-stream.enum.ts` |
| **Stream status** | The per-frame lifecycle value: `queued`/`active` non-terminal; `completed`/`failed`/`cancelled`/`rejected` terminal. | `packages/shared/src/enums/stream-status.enum.ts` |
| **Paywall gate** | The env-gated payment check between file security and extraction: OFF (default, blank PayPal credentials) = no-op and the game is free; ON = a verified PayPal Orders v2 capture is required before the AI runs. Never persisted; LIVE mode not approved. | `apps/api/src/modules/payments/application/payment-gate.service.ts`; decision record `docs/features/paypal-donations-and-paid-results/22-go-no-go.md` |
| **Capture-at-consumption** | The paywall design: the order is captured only when the analysis actually starts, so PayPal itself is the ledger and no order store exists. | `apps/api/src/modules/payments/adapters/paypal.adapter.ts` |
| **Refund-on-failure** | Any failure after capture (AI error, timeout, cancel, disconnect) best-effort refunds the undelivered run. | `PaymentGateService.refundOnFailure`; wired in `apps/api/src/modules/game/application/analyze-game-stream.use-case.ts` (lines 61–66) |
| **Wipe** | Zero-filling the uploaded image buffer (`file.buffer.fill(0)`) in a `finally` block on every path — success, failure, abort. | `apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts` — see [image-lifecycle.md](image-lifecycle.md) |
| **Share** | A temporary, image-free copy of one final result stored in an in-memory TTL cache under an unguessable UUID; expired and missing ids are indistinguishable. | `apps/api/src/modules/share-results/` — see [sharing-lifecycle.md](sharing-lifecycle.md) |
| **Consent flag** | The multipart field that must be the literal `"true"` (or boolean `true` from JSON) before anything else runs. | `apps/api/src/modules/game/lib/consent.ts` — see [consent-model.md](consent-model.md) |
| **Region hint** | A coverage-only prompt hint derived from the chosen UI language (en = global sweep, ar = Arabic industries first-class); it must never constrain who may appear. | `apps/api/src/modules/ai/model/region-hint.constants.ts` |
