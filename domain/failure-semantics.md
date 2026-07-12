---
id: domain-failure-semantics
title: Failure Semantics — Typed Codes per Stage, User Copy, Refunds
type: domain
authority: canonical
status: current
owner: repository owner
summary: The typed error-code catalog mapped to pipeline stages, the safe envelope the user sees on HTTP and SSE, frontend friendly-copy mapping, and refund semantics for paid runs.
keywords: [errors, error-codes, envelope, failure, refund, sse-error, retry, transient, message-key]
contextTier: 2
relatedCode: [packages/shared/src/constants/error-code.constants.ts, apps/api/src/core/errors/error-body.mapper.ts, apps/api/src/modules/game/lib/game-stream.ts, apps/web/src/modules/game/helpers/game-error.helper.ts]
relatedTests: [apps/api/src/modules/game/tests/game-stream-lib.test.ts, apps/api/src/tests/game-analyze-paywall.integration.test.ts, apps/api/src/tests/share-results.integration.test.ts]
relatedDocs: [domain/state-machines.md, domain/policies.md, domain/sharing-lifecycle.md]
readWhen: You are adding or handling a failure path — new error code, SSE error frame, user copy, or a paid-run failure.
---

# Failure Semantics — Typed Codes per Stage, User Copy, Refunds

## The catalog

`ErrorCode` is a frozen as-const catalog of 24 machine-readable codes
(`packages/shared/src/constants/error-code.constants.ts`; API copy at
`apps/api/src/core/errors/error-code.constants.ts`). Codes may be **added but never renamed
or removed** — they are the public contract the frontend maps to friendly copy.

## Codes by pipeline stage

| Stage ([state-machines.md](state-machines.md)) | Codes | Enforcing code |
| --- | --- | --- |
| Admission / throttling | `SERVER_BUSY`, `RATE_LIMITED` | `apps/api/src/core/streaming/concurrency-limiter.service.ts`; throttles in `apps/api/src/modules/game/model/game.constants.ts` |
| Validation (consent + file) | `CONSENT_REQUIRED`, `FILE_MISSING`, `FILE_TOO_LARGE` (413), `FILE_TYPE_NOT_ALLOWED` (415), `FILE_INVALID` (422), `MULTIPLE_FILES_NOT_ALLOWED`, `VALIDATION_FAILED` | `apps/api/src/modules/file-security/model/file-security.errors.ts`; `apps/api/src/core/errors/` |
| Virus scan | `VIRUS_SCAN_FAILED` — 422 when infected, 503 when the scanner is unavailable (fail-closed) | `file-security.errors.ts` (`InfectedFileError`, `VirusScanUnavailableError`); `application/virus-scan.service.ts` |
| Paywall (only when env-enabled) | `PAYMENT_REQUIRED` (402), `PAYMENT_ORDER_INVALID` (402), `PAYMENT_PROVIDER_UNAVAILABLE` (502) | `apps/api/src/modules/payments/application/payment-gate.service.ts`; issue-code mapping in `adapters/paypal.adapter.ts` |
| AI steps (extraction/generation/judge/translation) | `AI_PROVIDER_UNAVAILABLE`, `AI_RATE_LIMITED`, `AI_TIMEOUT`, `AI_RESPONSE_INVALID`, `AI_RESPONSE_UNSAFE` | step services + `apps/api/src/modules/ai/adapters/ai-router.service.ts`; route-chain exhaustion is 429 if any hop rate-limited, else 502 (lines 130–133) |
| Stream lifecycle | `ANALYSIS_CANCELLED` (explicit cancel), `AI_TIMEOUT` (watchdog) | `apps/api/src/modules/game/lib/game-stream.ts` (`resolveStreamTermination`) |
| Sharing | `SHARE_NOT_FOUND` (404), `SHARE_PAYLOAD_TOO_LARGE` (413), `SHARE_RESULT_UNSAFE` (400), `SHARE_CAPACITY_REACHED` (429) | `apps/api/src/modules/share-results/lib/share-result-errors.ts` |
| Anything unknown | `INTERNAL_ERROR` (opaque 500) | `apps/api/src/core/errors/error-body.mapper.ts` |

## What the user sees

- **The safe envelope.** Every failure — HTTP or SSE — maps through `toErrorBody`
  (`apps/api/src/core/errors/error-body.mapper.ts`): typed `AppError`s keep status/code/
  messageKey; framework exceptions map to matching codes; anything unknown becomes an opaque
  500. Doc comment: "Never leaks stacks, provider errors, or file contents." Shape:
  `ApiErrorResponseSchema` — statusCode, errorCode, safe message, `messageKey` starting
  `errors.` (`packages/shared/src/types/api-error.schema.ts`).
- **SSE error frames reuse the same mapper** so streamed failures carry identical
  `errorCode`/`message` envelopes, plus the failing `stage` when known
  (`apps/api/src/modules/game/lib/game-stream.ts`, `toStreamErrorMessage`;
  `ErrorStreamMessageSchema` in `packages/shared/src/schemas/game-stream.schema.ts`).
- **Friendly copy on the frontend.** `toFriendlyErrorMessageKey` maps the backend
  `errorCode` through `GAME_ERROR_KEY_BY_CODE` to per-code i18n copy; nothing from the
  backend is surfaced verbatim
  (`apps/web/src/modules/game/helpers/game-error.helper.ts`, lines 85–99).
- **Retry ergonomics.** Transient codes (`TRANSIENT_ERROR_CODES` in
  `apps/web/src/modules/game/model/game.constants.ts`) offer a non-destructive retry with the
  same photo; cancelled runs are never shown as errors — the UI returns to setup
  (`game-error.helper.ts`, `isTransientGameError`, `isCancelledRunError`).
- **Stage attribution.** The UI names the failing stage from the error frame — except for
  payment failures, which happen *between* stages and are deliberately not stage-stamped
  (`game-error.helper.ts`, `extractFailedStage`, lines 29–34).

## Refund semantics (paid runs only)

- Any failure **after capture** — AI error, timeout, explicit cancel, client disconnect —
  triggers a best-effort refund of the undelivered run: both analyze use-cases wrap the whole
  pipeline in `refundOnFailure`
  (`apps/api/src/modules/game/application/analyze-game-stream.use-case.ts`, lines 48–66).
- A refund failure logs "REFUND FAILED … reconcile in the PayPal dashboard" and **never masks
  the original error** (`apps/api/src/modules/payments/application/payment-gate.service.ts`).
- Buyer-side capture failures (e.g. `INSTRUMENT_DECLINED`, `ORDER_ALREADY_CAPTURED`,
  `COMPLIANCE_VIOLATION` — `PAYPAL_PAYMENT_FAILED_ISSUES` in
  `apps/api/src/modules/payments/model/payment.constants.ts`) map to 402
  `PAYMENT_ORDER_INVALID`; PayPal infrastructure failures map to 502
  `PAYMENT_PROVIDER_UNAVAILABLE` (`adapters/paypal.adapter.ts`).
- With the paywall off (default), no payment codes can occur — the gate no-ops
  ([policies.md](policies.md#paywall-gate-policy)).

## Design rules

- Every failure path is **typed** — new failure modes get a new `ErrorCode` entry (add-only)
  plus a `messageKey` under `errors.` for i18n.
- Missing and expired shares are deliberately indistinguishable
  ([sharing-lifecycle.md](sharing-lifecycle.md)) — do not "improve" the 404 with detail.
- Cancel mismatches are silent no-ops, not errors
  ([policies.md](policies.md#cancellation-match-policy)).
