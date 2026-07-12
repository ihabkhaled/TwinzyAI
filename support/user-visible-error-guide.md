---
id: support-user-visible-error-guide
title: User-Visible Error Guide — How Each Error Surfaces in the UI
type: support
authority: canonical
status: current
owner: repository owner
summary: Maps every backend error code to the exact i18n key and English copy the player sees, plus the retry/cancel behavior the UI attaches to it.
keywords: [support, errors, ui, i18n, copy, retry, transient, cancelled, payment, stage]
contextTier: 2
relatedCode:
  [
    apps/web/src/modules/game/helpers/game-error.helper.ts,
    apps/web/src/modules/game/model/game.constants.ts,
    apps/web/src/packages/i18n/messages/en.json,
    apps/web/src/shared/errors/error-keys.constants.ts,
  ]
relatedTests: [apps/web/e2e/game-error-states.spec.ts, apps/web/src/modules/game/test/game-fixtures.ts]
relatedDocs: [support/error-code-catalog.md, support/product-behavior-guide.md]
readWhen: A player screenshot shows an error message and you need to identify which failure produced it and what the UI offered next.
---

# User-Visible Error Guide

Resolution chain (`toFriendlyErrorMessageKey`, `apps/web/src/modules/game/helpers/game-error.helper.ts`): client-side `AppError` carries its own key → a backend `errorCode` maps through `GAME_ERROR_KEY_BY_CODE` (`apps/web/src/modules/game/model/game.constants.ts`) → anything else falls back to the generic HTTP-status mapper. Backend copy is never shown verbatim; the UI always renders its own i18n copy from `apps/web/src/packages/i18n/messages/{en,ar}.json`.

## Backend code → i18n key → English copy

| errorCode | i18n key | English copy the player sees |
| --- | --- | --- |
| `CONSENT_REQUIRED` | `errors.consentRequired` | "Please tick the consent box before playing." |
| `FILE_MISSING` | `errors.fileMissing` | "Please choose a photo first." |
| `FILE_TOO_LARGE` | `errors.fileTooLarge` | "That photo is too big. Please pick one under 5 MB." |
| `FILE_TYPE_NOT_ALLOWED`, `FILE_INVALID` | `errors.fileTypeNotAllowed` | "Please use a JPG, PNG, or WebP photo." |
| `MULTIPLE_FILES_NOT_ALLOWED` | `errors.multipleFiles` | "Please choose just one photo." |
| `RATE_LIMITED`, `AI_RATE_LIMITED` | `errors.rateLimited` | "Too many tries in a short time. Please wait a moment." |
| `SERVER_BUSY` | `errors.serverBusy` | "The vibe engine is busy right now. Please try again in a moment." |
| `AI_PROVIDER_UNAVAILABLE`, `AI_TIMEOUT`, `AI_RESPONSE_INVALID`, `AI_RESPONSE_UNSAFE` | `errors.aiUnavailable` | "The vibe engine is unavailable right now. Please try again in a moment." |
| `NETWORK_ERROR` (client-only) | `errors.network` | "We could not reach the game server. Check your connection and try again." |
| `PAYMENT_REQUIRED` | `errors.paymentRequired` | "This analysis requires a small payment before it can run." |
| `PAYMENT_ORDER_INVALID`, `PAYMENT_PROVIDER_UNAVAILABLE` | `errors.payment` | "Payment could not be completed. You have not been charged; please try again." |
| (unmapped / generic) | `errors.generic` | "Something went wrong. Please try again." |

## Behavior attached to the error

- **Stage attribution**: streamed failures may append "Step that failed: {stage}." (`errors.failedDuringStage`) using the stage from the terminal SSE frame. Payment errors are deliberately **never** stage-prefixed — capture happens between stages, so the last-emitted stage would misattribute the failure (`extractFailedStage`).
- **Transient errors** (`TRANSIENT_ERROR_CODES`: `RATE_LIMITED`, `AI_RATE_LIMITED`, `SERVER_BUSY`, `AI_TIMEOUT`, `AI_PROVIDER_UNAVAILABLE`, `NETWORK_ERROR`): the UI offers "Try again with the same photo" (`game.retrySamePhoto`) — no re-pick needed.
- **Cancelled runs** are not errors: the UI silently returns to setup (`isCancelledRunError`; abort kind `aborted`).
- **Translation failure**: the result stays in the previous language with "We could not translate the result. Still showing the previous language." (`errors.translationFailed`) and a manual "Retry translation" button — never auto-retried (`useResultTranslation`).
- **Share failures**: modal shows "We could not create a share link. Please try again." (`share.createFailed`); clipboard failure shows "Could not copy the link. Please copy it manually." (`share.copyFailed`).
- **Camera failure**: "We could not open your camera. Check permissions or upload a photo instead." (`game.cameraError`) — upload remains available.
- **Route crash**: localized error page "Something went wrong / An unexpected error interrupted the game." (`errorPage.*`); a root-shell crash uses hardcoded English fallback copy (`apps/web/src/shared/constants/fallback-copy.constants.ts`, exception EXC-0003 in `docs/exceptions/README.md`).

Backend-side meaning of each code: [error-code-catalog.md](./error-code-catalog.md).
