---
id: domain-invariants
title: Domain Invariants — Enforced, With Code Citations
type: domain
authority: canonical
status: current
owner: repository owner
summary: The mechanically enforced domain invariants — bounded result counts, server-set disclaimer, literal-false safety flags, share TTL, payment-capture verification — each cited to its enforcing code.
keywords: [invariants, bounds, disclaimer, safety-flags, ttl, capture-verification, prompt-version, result-count, enforcement]
contextTier: 2
relatedCode: [packages/shared/src/schemas/game-result.schema.ts, apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts, apps/api/src/modules/payments/adapters/paypal.adapter.ts]
relatedTests: [packages/shared/tests/schemas.test.ts, apps/api/src/modules/result-aggregation/tests/result-aggregation.helpers.test.ts, apps/api/src/modules/payments/tests/paypal.adapter.test.ts]
relatedDocs: [domain/safety-boundaries.md, domain/image-lifecycle.md, docs/ai-safety.md]
readWhen: You are changing schemas, aggregation, sharing, or payments and must not break an enforced invariant.
---

# Domain Invariants — Enforced, With Code Citations

Every invariant below is **enforced by code**, not by convention. If a change would relax one,
it needs a recorded owner decision first (see `CLAUDE.md`, Twinzy Product Constraints).

## 1. Result counts are bounded

- Requested `resultCount` is an integer 1–10, default 10 — `MIN/MAX/DEFAULT_RESULT_COUNT` in
  `packages/shared/src/constants/trait.constants.ts`, enforced by
  `packages/shared/src/schemas/result-count.schema.ts` and coerced at the transport edge in
  `apps/api/src/modules/game/api/dto/analyze-request.dto.ts` (lines 21–26).
- The final payload can never exceed it: a `.refine` on `FinalGameResultSchema` requires
  `results ≤ resultCount` (`packages/shared/src/schemas/game-result.schema.ts`), and
  aggregation slices to `resultCount`
  (`apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts`, line 26).
- Candidate pool is bounded 1–25 (`MAX_CANDIDATE_POOL`,
  `packages/shared/src/constants/trait.constants.ts`; array bound in
  `packages/shared/src/schemas/candidates.schema.ts`).

## 2. The disclaimer is server-set, never model-trusted

- Every result carries `RESULT_DISCLAIMER_BY_LANGUAGE[languageCode]`
  (`packages/shared/src/constants/app.constants.ts`), imposed in
  `apps/api/src/modules/result-aggregation/lib/result-aggregation.mapper.ts` and re-imposed by
  translation (`apps/api/src/modules/ai/application/result-translation.service.ts`, line 99).
- The no-match fallback message is likewise the server constant
  `NO_MATCH_FALLBACK_BY_LANGUAGE` (same owners).
- Share creation re-checks it: a shared payload whose disclaimer differs from the server
  constant is rejected
  (`apps/api/src/modules/share-results/application/share-result-safety.service.ts`).

## 3. Safety flags are `z.literal(false)`

- Extraction: 5 literal-false flags (`TraitSafetyCheckSchema`,
  `packages/shared/src/schemas/traits.schema.ts`). Candidates: 4
  (`CandidateSafetyCheckSchema`, `candidates.schema.ts`). Judge/final: 5 literal-false +
  `meetsMinimumEvidence: z.boolean()` (`JudgeSafetyCheckSchema`,
  `packages/shared/src/schemas/judge.schema.ts`, lines 34–40;
  `FinalResultSafetyCheckSchema` is derived from the judge shape in
  `game-result.schema.ts` so the two can never drift).
- A model asserting any claim flag `true` fails Zod validation outright — the response never
  reaches filtering, let alone a user. Full safety chain: [safety-boundaries.md](safety-boundaries.md).

## 4. Prompt/contract version is a literal

- `GAME_PROMPT_VERSION = 'written-traits-v5'`
  (`packages/shared/src/constants/app.constants.ts`) is a `z.literal` in the extraction,
  generation, judge, and final-result schemas — a stale prompt/schema pairing fails
  validation instead of shipping drifted output.

## 5. Derived counts are never trusted

- `traitCount` is overwritten by a schema transform using `countPopulatedTraitFields`
  (`packages/shared/src/schemas/traits.schema.ts`,
  `packages/shared/src/utils/trait-count.util.ts`); `candidateCount` is likewise derived
  (`candidates.schema.ts`).

## 6. Share records expire and never leak existence

- TTL default 600 s, bounds 60–3600 (`SHARE_RESULT_DEFAULT_TTL_SECONDS` et al.,
  `packages/shared/src/constants/share-result.constants.ts`; runtime value from
  `SHARE_RESULT_TTL_SECONDS`).
- Expiry is computed from the server clock
  (`apps/api/src/modules/share-results/lib/share-result-expiry.util.ts`); the cache port never
  returns an expired record, and missing vs expired ids produce the **identical 404**
  (`apps/api/src/modules/share-results/application/get-share-result.use-case.ts`).
- Details: [sharing-lifecycle.md](sharing-lifecycle.md).

## 7. A payment counts only after field-by-field verification

- `apps/api/src/modules/payments/adapters/paypal.adapter.ts` (`captureOrder` verification,
  lines 133–153) accepts a capture only when: order **and** capture status are `COMPLETED`,
  the amount **and** currency exactly match the server-configured price
  (`PAYMENT_PRICE_VALUE`/`PAYMENT_PRICE_CURRENCY` — the client never sends a price,
  `packages/shared/src/schemas/payment.schema.ts`), and `custom_id` equals the run's
  `requestId`.
- Order ids are pattern-checked (`PAYPAL_ORDER_ID_PATTERN /^[A-Z0-9-]{8,64}$/`,
  `apps/api/src/modules/payments/model/payment.constants.ts`) before ever reaching a URL.
- The capture record is request-scoped and never persisted
  (`apps/api/src/modules/payments/model/payment.types.ts`).

## 8. The image reaches exactly one step, then dies

Owned by [image-lifecycle.md](image-lifecycle.md) — the canonical statement. In one line:
memory-only, extraction-only (typed port + hardcoded Gemini-only vision routing), zero-filled
in `finally` on every path.

## 9. Language echo is asserted

Every AI response's `languageCode` must equal the requested code or the response is rejected
as `AI_RESPONSE_INVALID` (`apps/api/src/modules/ai/lib/response-language.guard.ts`) — see
[language-lifecycle.md](language-lifecycle.md).
