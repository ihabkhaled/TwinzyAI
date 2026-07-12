---
id: support-error-code-catalog
title: Error Code Catalog — Every User-Visible Error Code and Message
type: support
authority: canonical
status: current
owner: repository owner
summary: The complete catalog of stable API error codes, their HTTP statuses, backend message copy, and i18n messageKeys, with owning source files.
keywords: [support, errors, error-codes, messagekey, envelope, upload, ai, payment, share, http-status]
contextTier: 2
relatedCode:
  [
    packages/shared/src/constants/error-code.constants.ts,
    apps/api/src/core/errors/error.constants.ts,
    apps/api/src/modules/file-security/model/file-security.constants.ts,
    apps/api/src/modules/ai/model/gemini.constants.ts,
    apps/api/src/modules/payments/model/payment.constants.ts,
    apps/api/src/modules/game/model/game.messages.ts,
  ]
relatedTests: [apps/api/src/core/errors/tests/error-body.mapper.test.ts]
relatedDocs: [support/user-visible-error-guide.md, support/troubleshooting-index.md]
readWhen: You have an errorCode or messageKey from a log/screenshot and need to know what it means and where it comes from.
---

# Error Code Catalog

Every API failure is the sanitized envelope `{ statusCode, errorCode, message, messageKey }` produced by `apps/api/src/core/errors/error-body.mapper.ts` behind the global exception filter. Codes are the shared cross-side contract (`packages/shared/src/constants/error-code.constants.ts`); every code's `messageKey` is derived from `ERROR_MESSAGE_KEY_BY_CODE` (`apps/api/src/core/errors/error.constants.ts`). How each surfaces in the web UI: [user-visible-error-guide.md](./user-visible-error-guide.md).

## Platform / validation

| errorCode | HTTP | Backend message (English) | messageKey |
| --- | --- | --- | --- |
| `INTERNAL_ERROR` | 500 | "Something went wrong. Please try again." | `errors.common.internalError` |
| `VALIDATION_FAILED` | 400 | "Request validation failed" | `errors.validation.failed` |
| `RATE_LIMITED` | 429 | "Too many requests. Please wait a moment and try again." | `errors.common.rateLimited` |

Source: `apps/api/src/core/errors/error.constants.ts`. Unknown throws become an opaque 500; stacks and provider payloads never leak.

## Upload / file security

| errorCode | HTTP | Backend message (English) | messageKey |
| --- | --- | --- | --- |
| `CONSENT_REQUIRED` | 400 | "Please confirm the consent checkbox before playing." | `errors.upload.consentRequired` |
| `FILE_MISSING` | 400 | "Please choose a photo first." | `errors.upload.fileMissing` |
| `FILE_TOO_LARGE` | 413 | "That photo is too big. Please pick one under 5 MB." | `errors.upload.fileTooLarge` |
| `FILE_TYPE_NOT_ALLOWED` | 415 | "Please use a JPG, PNG, or WebP photo." | `errors.upload.fileTypeNotAllowed` |
| `FILE_INVALID` | 422 | "That file does not look like a valid photo. Please try another one." | `errors.upload.fileInvalid` |
| `MULTIPLE_FILES_NOT_ALLOWED` | 400 | "Please upload just one photo." | `errors.upload.multipleFilesNotAllowed` |
| `VIRUS_SCAN_FAILED` | 422 (infected) / 503 (scanner unavailable, fail-closed) | "We could not safely check that file. Please try again later." | `errors.upload.virusScanFailed` |

Sources: `FILE_ERROR_MESSAGES` in `apps/api/src/modules/file-security/model/file-security.constants.ts`; statuses fixed by `apps/api/src/modules/file-security/model/file-security.errors.ts`. Playbook: [upload-troubleshooting.md](./upload-troubleshooting.md).

## AI pipeline

| errorCode | HTTP | Backend message (English) | messageKey |
| --- | --- | --- | --- |
| `AI_PROVIDER_UNAVAILABLE` | 502 | "The vibe engine is unavailable right now. Please try again in a moment." | `errors.ai.providerUnavailable` |
| `AI_RATE_LIMITED` | 429 | "The vibe engine is busy right now (usage limit reached). Please try again in a minute." | `errors.ai.rateLimited` |
| `AI_TIMEOUT` | 502 | "The vibe engine took too long. Please try again." | `errors.ai.timeout` |
| `AI_RESPONSE_INVALID` | 502 | "The vibe engine returned something we could not read. Please try again." | `errors.ai.responseInvalid` |
| `AI_RESPONSE_UNSAFE` | 502 | "The vibe engine returned a result we could not show. Please try another photo." | `errors.ai.responseUnsafe` |

Source copy: `apps/api/src/modules/ai/model/gemini.constants.ts`. Runbooks: [../runbooks/provider-outage.md](../runbooks/provider-outage.md), [../runbooks/ai-schema-failures.md](../runbooks/ai-schema-failures.md).

## Streaming / lifecycle

| errorCode | HTTP/frame | Message (English) | messageKey |
| --- | --- | --- | --- |
| `SERVER_BUSY` | in-band SSE rejection | "The vibe engine is busy right now. Please try again in a moment." | `errors.server.busy` |
| `ANALYSIS_CANCELLED` | terminal SSE frame | "Analysis cancelled." | `errors.analysis.cancelled` |
| (duplicate run) | in-band SSE rejection | "This analysis is already running." | — |
| (watchdog timeout) | terminal SSE frame as `AI_TIMEOUT` | "The analysis took too long and was stopped. Please try again." | `errors.ai.timeout` |

Source: `apps/api/src/modules/game/model/game.messages.ts`; termination mapping in `apps/api/src/modules/game/lib/game-stream.ts`.

## Payments (only when the paywall is enabled)

| errorCode | HTTP | Backend message (English) | messageKey |
| --- | --- | --- | --- |
| `PAYMENT_REQUIRED` | 402 | "This analysis requires payment before it can run." | `errors.payment.required` |
| `PAYMENT_ORDER_INVALID` | 402 | "The payment could not be verified for this request. Please approve the payment and try again." | `errors.payment.orderInvalid` |
| `PAYMENT_PROVIDER_UNAVAILABLE` | 502 | "The payment service is temporarily unavailable. Please try again shortly." | `errors.payment.providerUnavailable` |

Source: `apps/api/src/modules/payments/model/payment.constants.ts`. Declined/unapproved/expired PayPal issues map to 402 (no money moved); infrastructure trouble maps to 502.

## Share links

| errorCode | HTTP | messageKey |
| --- | --- | --- |
| `SHARE_NOT_FOUND` | 404 (also returned for expired — no existence oracle) | `errors.share.notFound` |
| `SHARE_PAYLOAD_TOO_LARGE` | 413 | `errors.share.payloadTooLarge` |
| `SHARE_RESULT_UNSAFE` | 400 | `errors.share.unsafe` |
| `SHARE_CAPACITY_REACHED` | 429 | `errors.share.capacity` |

Source: `apps/api/src/modules/share-results/lib/share-result-errors.ts` with message keys in `apps/api/src/modules/share-results/model/share-result.messages.ts`.

## Client-only

`NETWORK_ERROR` is a web-client classification for transport failures that carried no backend code (connection drop); the backend never emits it (`apps/web/src/modules/game/model/game.constants.ts`).
