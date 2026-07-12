---
id: support-product-behavior-guide
title: Product Behavior Guide — What Players Experience Per Flow
type: support
authority: canonical
status: current
owner: repository owner
summary: Support-facing walkthrough of every player-visible flow, including all loading, progress, error, and empty states with their i18n copy keys.
keywords: [support, player-flow, loading-states, error-states, game, share, payment, i18n, ux]
contextTier: 2
relatedCode:
  [
    apps/web/src/modules/game/containers/game.container.tsx,
    apps/web/src/modules/game/hooks/useGame.hook.ts,
    apps/web/src/modules/game/model/game.constants.ts,
    apps/web/src/packages/i18n/messages/en.json,
  ]
relatedTests: [apps/web/e2e/game-flow.spec.ts, apps/web/e2e/game-error-states.spec.ts]
relatedDocs: [support/user-visible-error-guide.md, support/feature-catalog.md, docs/frontend-architecture.md]
readWhen: A support question is about what a player should be seeing at any point in the game.
---

# Product Behavior Guide — What Players Experience Per Flow

All copy quoted below is the English catalog (`apps/web/src/packages/i18n/messages/en.json`); Arabic (`ar.json`) mirrors it with RTL layout. The game phase machine is `GamePhase` = `Setup | Payment | Processing | Success | Error` (`apps/web/src/modules/game/model/game.enums.ts`), orchestrated by `useGame` (`apps/web/src/modules/game/hooks/useGame.hook.ts`).

## 1. Landing (`/`)

Hero + "Start the game" (`home.startButton`), how-it-works steps, the privacy notice ("We do not store your photo…", `home.privacyNotice`), and a "Free to play" badge (`home.freeBadge`). Header shows Home, locale switcher, theme toggle, and — only when `NEXT_PUBLIC_PAYPAL_ME_USERNAME` is set — a Donate link (`apps/web/src/app/layout.tsx`, `apps/web/src/shared/helpers/donate-link.helper.ts`).

## 2. Game setup (`/game`, phase `Setup`)

- Upload one JPG/PNG/WebP photo, max 5 MB (`upload.hint`), or take one with the camera (`upload.cameraLabel`). Camera states: "Starting the camera…" (`game.cameraStarting`); failure shows `game.cameraError` and the player can upload instead.
- Consent checkbox is mandatory: "I agree that my photo is processed in memory only to extract visible traits…" (`upload.consentLabel`). Without it the analyze cannot proceed — see [consent-troubleshooting.md](./consent-troubleshooting.md).
- Result-count select, 1–10 with default 10 (`game.resultCountLabel` / `game.resultCountHint`; values from `@twinzy/shared` via `apps/web/src/modules/game/model/game.constants.ts`).
- "Analyze my vibe" (`game.analyzeButton`) starts the run.

## 3. Payment step (phase `Payment` — only when the paywall is enabled)

Only exists when `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is configured (`apps/web/src/modules/game/hooks/usePaymentFlow.hook.ts` — when `isPayPalConfigured()` is false the run goes straight to processing, free). When enabled:

- Loading state: "Loading secure payment options…" (`game.paymentLoading`) while the PayPal buttons render (`apps/web/src/modules/game/containers/payment-step.container.tsx`).
- Copy: "This analysis costs {price}. Pay securely with PayPal to reveal your results — you are charged only when the analysis runs, and refunded automatically if it fails." (`game.paymentDescription`). The price shown is display-only; the server price is authoritative (`apps/web/src/packages/env/public-env.ts`).
- "Cancel and go back" (`game.paymentCancel`) returns to setup.
- On approval the analyze run starts with the order id in the multipart body; the backend captures at consumption (`apps/api/src/modules/payments/application/payment-gate.service.ts`). Enablement/approval status: [feature-catalog.md](./feature-catalog.md).

## 4. Processing (phase `Processing`)

Streaming progress over SSE with live stage labels (`game.stage.*`, mapped in `STAGE_LABEL_KEYS`, `apps/web/src/modules/game/model/game.constants.ts`):

1. "Checking your photo..." (validating)
2. "Scanning file for safety..." (scanning)
3. "Reading visible traits..." (extractingTraits)
4. "Finding public style/vibe matches..." (generatingCandidates)
5. "Scoring and double-checking the matches..." (judging)
6. "Preparing your result..." (aggregating)

Also shown: live traits ("Traits we're reading", `game.liveTraitsTitle`), rough candidates (`game.liveCandidatesTitle`), the hint "This usually takes a few seconds. Please keep this tab open." (`game.processingHint`), and a Cancel button (`game.cancelProcessing`). Cancelling is **not** an error — the UI silently returns to setup (`isCancelledRunError`, `apps/web/src/modules/game/helpers/game-error.helper.ts`).

## 5. Success (phase `Success`)

Ranked matches with style/vibe fit scores, verdict bands ("Strong/Medium/Light vibe fit", `result.verdict.*`), trait accordion, image-quality/uncertainty sections, and the server-enforced disclaimer: "This is a playful style/vibe result based on written visible traits only. It is not face recognition, identity matching, or biometric comparison." (`result.disclaimer`; enforced server-side by `apps/api/src/modules/result-aggregation`). No confident match shows "No confident match this time" (`result.fallbackTitle`). Expectations detail: [AI-result-expectations.md](./AI-result-expectations.md).

- **Locale switch on a result** triggers a text-only re-translation: overlay "Translating your result…" (`game.translating`); on failure the previous language is kept and a "Retry translation" button appears (`errors.translationFailed`, `game.retryTranslation`).
- **Share** opens a modal (`share.modalTitle`) — "Creating your share link…" (`share.creating`), copy link, native share, platform links. See [sharing-troubleshooting.md](./sharing-troubleshooting.md).
- "Try another photo" (`result.retryButton`) restarts.

## 6. Error (phase `Error`)

A friendly localized message resolved from the backend `errorCode` (`toFriendlyErrorMessageKey`, `apps/web/src/modules/game/helpers/game-error.helper.ts`), optionally with "Step that failed: {stage}." (`errors.failedDuringStage`) — except payment errors, which are never stage-prefixed. Transient failures (rate limit, timeout, busy, network, provider blip) offer "Try again with the same photo" (`game.retrySamePhoto`, `TRANSIENT_ERROR_CODES`). Full mapping: [user-visible-error-guide.md](./user-visible-error-guide.md).

## 7. Share page (`/share/[shareId]`)

Three states (`apps/web/src/modules/game/containers/share-page.container.tsx`): loading ("Loading the shared result…", `share.loading`); active — read-only result with countdown "This page disappears in {time}" (`share.expiresIn`); expired/unavailable ("This shared result has expired" / "This shared result is unavailable", `share.expiredTitle` / `share.notFoundTitle`). Missing and expired links are indistinguishable by design (`apps/api/src/modules/share-results/application/get-share-result.use-case.ts`).

## 8. Other routes and global states

- `/help`, `/privacy`, `/terms` — static localized content pages (`apps/web/src/app/`).
- Route errors: localized error boundary (`apps/web/src/app/error.tsx`); a root-shell crash falls back to hardcoded English copy (`apps/web/src/app/global-error.tsx`, exception EXC-0003 in `docs/exceptions/README.md`).
- 404: "Page not found" (`notFound.*`); global loading: `app.loading`.
- Theme (light/dark) and language (en/ar, RTL for ar) toggles persist via cookies (`apps/web/src/modules/ui-preferences/`).
- The app is installable as a PWA (`apps/web/public/manifest.webmanifest`).
