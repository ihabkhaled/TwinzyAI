---
id: domain-entities
title: Domain Entities — Transient Shapes and Their Owning Schemas
type: domain
authority: canonical
status: current
owner: repository owner
summary: The transient domain shapes of the stateless API — extraction, candidate, judged result, final result, share record, payment capture — each with its owning schema or type file.
keywords: [entities, schemas, zod, extraction, candidate, judged-result, final-result, share-record, payment-capture, transient]
contextTier: 2
relatedCode: [packages/shared/src/schemas, apps/api/src/modules/share-results/model/share-result.types.ts, apps/api/src/modules/payments/model/payment.types.ts]
relatedTests: [packages/shared/tests/schemas.test.ts, packages/shared/tests/share-result.schema.test.ts]
relatedDocs: [domain/invariants.md, domain/trait-taxonomy.md, context/ai-context.md]
readWhen: You need to know which file owns a domain shape, or what fields a pipeline stage produces.
---

# Domain Entities — Transient Shapes and Their Owning Schemas

There is **no database**; every entity below is transient — request-scoped, stream-scoped, or
TTL-cache-scoped (`apps/api/src/modules/privacy/privacy.module.ts` records the
no-persistence design). Cross-side contracts live in `packages/shared/src/schemas/` as Zod
schemas; API-internal shapes live in the owning module's `model/`.

## Pipeline entities (one analyze run)

| Entity | Owning file | Lifetime | Key fields |
| --- | --- | --- | --- |
| **Uploaded image** (`UploadedImageFile`) | `apps/api/src/modules/file-security/model/upload-file.types.ts` | Validation + extraction only; buffer zero-filled in `finally` ([image-lifecycle.md](image-lifecycle.md)) | in-memory buffer, MIME, size |
| **Trait extraction** (`TraitExtractionResponse`) | `packages/shared/src/schemas/traits.schema.ts` | Until the run's result is delivered | `promptVersion` literal, `languageCode`, 16 trait categories + `uncertaintyNotes`, `compactTraitSummary` (≤35), `highSignalTraitTokens`, `weightedTraitEvidence`, `visualArchetypeHints`, `imageQualityCaps`, `candidateSearchHints`, literal-false `safetyCheck`; `traitCount` DERIVED by transform, never trusted |
| **Matching evidence** (`MatchingEvidence`) | `apps/api/src/modules/ai/model/matching-evidence.types.ts` (built by `apps/api/src/modules/ai/lib/matching-evidence.util.ts`) | Generation + judge prompts | Pick of traits + matching aggregates — text only, no image field |
| **Candidate** (`Candidate`) / **generation response** (`CandidateGenerationResponse`) | `packages/shared/src/schemas/candidates.schema.ts` | Until judging completes | name, `publicCategory`, `countryOrRegion`, `globalPopularityLevel`, `styleVibeFitScore` (0–100), `confidenceLevel`, reason + trait arrays (≤15), literal-false `safetyCheck`; pool bounded 1–25; `candidateCount` derived |
| **Judged result** (`JudgedResult`) / **judge response** (`CandidateJudgeResponse`) | `packages/shared/src/schemas/judge.schema.ts` | Until aggregation completes | `rank` (preprocessed), `finalStyleVibeFitScore`, `verdict`, `shouldDisplay`, `safetyCheck` (5 literal-false + `meetsMinimumEvidence: boolean`), `removedCandidates` (≤25, never sent to clients), fallback required when results empty |
| **Final game result** (`FinalGameResult` / `FinalResultItem`) | `packages/shared/src/schemas/game-result.schema.ts` | The API response body; also the translation and share unit | strictObject, no `.catch` softening at the edge; refines: results ≤ `resultCount`, `fallbackMessage` required when results empty; server-owned `disclaimer` |
| **Stream frame** (`GameStreamMessage` union) | `packages/shared/src/schemas/game-stream.schema.ts` | One SSE frame | discriminated on `event` (accepted/stage/traits/candidates/result/error/heartbeat); every frame carries the tabId/requestId/streamId/status envelope |

## Feature entities

| Entity | Owning file | Lifetime | Key fields |
| --- | --- | --- | --- |
| **Share record** (`StoredShareRecord`) | `apps/api/src/modules/share-results/model/share-result.types.ts` | TTL window in the in-memory cache (default 600 s); gone on restart | `shareId` (CSPRNG UUID), `languageCode`, safe `result` JSON, `createdAtMs`/`expiresAtMs` — never an image ([sharing-lifecycle.md](sharing-lifecycle.md)) |
| **Share responses** (`CreateShareResultResponse`, `ShareResultResponse`) | `packages/shared/src/schemas/share-result.schema.ts` | One response | shareUrl, ISO timestamps, `ttlSeconds` / `remainingSeconds` (server clock) |
| **Payment capture record** (`PaymentCaptureRecord`) | `apps/api/src/modules/payments/model/payment.types.ts` | The lifetime of one request only — the doc comment states "never persisted" | `orderId` + `captureId`; exists solely so refund-on-failure can act |
| **Payment holder** (`PaymentHolder`) | `apps/api/src/modules/payments/model/payment.types.ts` | One analyze run | mutable slot threaded through the pipeline; `capture: undefined` = paywall off or capture not reached |
| **Payment order contracts** | `packages/shared/src/schemas/payment.schema.ts` | One request | `CreatePaymentOrderRequestSchema` `{requestId: uuid}` — the price is deliberately absent (server-owned); `PaypalOrderIdSchema` `/^[A-Z0-9-]{8,64}$/`; `PAYMENT_ORDER_FIELD_NAME = 'paypalOrderId'` |
| **Error envelope** (`ApiErrorResponse`) | `packages/shared/src/types/api-error.schema.ts` | One error response | statusCode, stable `errorCode`, safe message, `messageKey` starting `errors.` ([failure-semantics.md](failure-semantics.md)) |

## Enumerated value objects

All are as-const objects (the TS `enum` keyword is banned repo-wide,
`eslint/typescript.config.mjs`): `Verdict`, `ConfidenceLevel`, `PopularityLevel`,
`PublicCategory`, `GameStreamEvent`/`GameStreamStage`, `StreamStatus` — all under
`packages/shared/src/enums/`.

## What is deliberately NOT an entity

- **The user.** No identity, account, session, or profile shape exists anywhere.
- **The image downstream.** No schema after extraction has an image, URL, hash, or embedding
  field — `translate-result.schema.ts` and `share-result.schema.ts` are strictObjects with no
  image slot by construction.
- **A payment ledger.** PayPal is the ledger; the API keeps nothing
  (`apps/api/src/modules/payments/model/payment.types.ts`).
