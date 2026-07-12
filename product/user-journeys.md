---
id: product-user-journeys
title: User Journeys — The Real Flows
type: product
authority: canonical
status: current
owner: repository owner
summary: "The end-to-end user flows as shipped: play (upload→consent→count→analyze→results), cancel, translate, share, donate, env-gated paid analysis, and PWA install."
keywords: [journeys, flows, play, analyze, streaming, cancel, translate, share, donate, paywall, pwa]
contextTier: 2
relatedCode: [apps/web/src/modules/game/hooks/useGame.hook.ts, apps/web/src/modules/game/containers/game.container.tsx, apps/api/src/modules/game/application/analyze-game-stream.use-case.ts]
relatedTests: [apps/web/e2e/game-flow.spec.ts, apps/web/e2e/game-streaming.spec.ts, apps/web/e2e/share-flow.spec.ts, apps/web/e2e/paywall.spec.ts]
relatedDocs: [product/game-rules.md, product/monetization-policy.md, docs/frontend-architecture.md]
readWhen: You need the shipped step-by-step behavior of any user flow before changing it.
---

# User Journeys — The Real Flows

Routes: `/` (landing), `/game`, `/share/[shareId]`, `/help`, `/privacy`, `/terms`
(pages under [apps/web/src/app](../apps/web/src/app)). The game UI is a phase machine —
`Setup | Payment | Processing | Success | Error`
([apps/web/src/modules/game/model/game.enums.ts](../apps/web/src/modules/game/model/game.enums.ts))
orchestrated by [apps/web/src/modules/game/hooks/useGame.hook.ts](../apps/web/src/modules/game/hooks/useGame.hook.ts).

## 1. Play (the core journey)

1. **Land** on `/`, tap through to `/game`.
2. **Provide a photo** — gallery upload or live camera capture
   (`useImageUpload`, `useCameraCapture` in
   [apps/web/src/modules/game/hooks](../apps/web/src/modules/game/hooks)); the image stays an
   in-memory `File` + object URL, never written to browser storage.
3. **Consent** — the checkbox ([apps/web/src/modules/game/components/upload-consent.component.tsx](../apps/web/src/modules/game/components/upload-consent.component.tsx))
   gates the analyze button; the backend independently requires the literal consent flag first
   ([apps/api/src/modules/file-security/application/file-security.service.ts](../apps/api/src/modules/file-security/application/file-security.service.ts)).
4. **Pick a result count** — 1–10, default 10 (`useResultCount`; bounds in
   [packages/shared/src/constants/trait.constants.ts](../packages/shared/src/constants/trait.constants.ts)).
5. **Analyze** — multipart POST streamed over SSE with live stage/traits/candidates progress
   ([apps/web/src/modules/game/gateway/game-stream.gateway.ts](../apps/web/src/modules/game/gateway/game-stream.gateway.ts));
   server pipeline: upload security chain → trait extraction (only step that sees the image;
   image wiped in `finally`) → text-only candidates → text-only judge
   ([apps/api/src/modules/game/application/analyze-game-stream.use-case.ts](../apps/api/src/modules/game/application/analyze-game-stream.use-case.ts)).
6. **Results** — traits + ranked matches + the server-enforced disclaimer
   ([game-rules.md](game-rules.md)); friendly localized errors otherwise, with same-photo retry
   for transient codes (`useRunRecovery`).

**Cancel** at any time: a per-run `AbortController` closes the SSE socket and the backend
stops the pipeline (`useAnalyzeRunControl`; e2e
[apps/web/e2e/game-cancel.spec.ts](../apps/web/e2e/game-cancel.spec.ts)). Cancel is not an error.

## 2. Paid analysis (env-gated; off by default)

Only when PayPal is configured, an extra **Payment** phase appears between setup and
processing: mint a request id, create a server-priced order, approve via the PayPal Buttons
SDK, then start the run with `paypalOrderId` in the multipart body; the backend captures at
consumption and auto-refunds if delivery fails
([apps/web/src/modules/game/hooks/usePaymentFlow.hook.ts](../apps/web/src/modules/game/hooks/usePaymentFlow.hook.ts),
[apps/api/src/modules/payments/application/payment-gate.service.ts](../apps/api/src/modules/payments/application/payment-gate.service.ts)).
Status, conditions, and defaults: [monetization-policy.md](monetization-policy.md).

## 3. Translate (locale switch on an existing result)

Switching locale on a finished result calls the **text-only** translate endpoint — the photo is
never re-sent (`useResultTranslation`;
[apps/web/src/modules/game/gateway/game-translate.gateway.ts](../apps/web/src/modules/game/gateway/game-translate.gateway.ts);
e2e [apps/web/e2e/game-translate.spec.ts](../apps/web/e2e/game-translate.spec.ts)).

## 4. Share (temporary link)

"Share result" creates an unguessable UUID link with a TTL (default 10 minutes, max 1 hour —
[packages/shared/src/constants/share-result.constants.ts](../packages/shared/src/constants/share-result.constants.ts)),
shown in a modal with copy/native/platform options; the recipient's `/share/[shareId]` page
shows the result, a live countdown, the disclaimer, and a create-your-own invite
([apps/web/src/modules/game/containers/share-page.container.tsx](../apps/web/src/modules/game/containers/share-page.container.tsx)).
Missing and expired links return an identical safe 404
([docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md)).

## 5. Donate (voluntary, env-gated)

When `NEXT_PUBLIC_PAYPAL_ME_USERNAME` is set, a heart nav link and a result-page link open the
owner's paypal.me page in a new tab; unset hides them entirely
([apps/web/src/shared/helpers/donate-link.helper.ts](../apps/web/src/shared/helpers/donate-link.helper.ts);
e2e [apps/web/e2e/donations.spec.ts](../apps/web/e2e/donations.spec.ts)). Donations never gate
anything ([monetization-policy.md](monetization-policy.md)).

## 6. Install the PWA

The app is installable via
[apps/web/public/manifest.webmanifest](../apps/web/public/manifest.webmanifest) (standalone,
portrait); installability is verified by
[apps/web/src/tests/pwa.test.ts](../apps/web/src/tests/pwa.test.ts) and
[apps/web/e2e/pwa-a11y.spec.ts](../apps/web/e2e/pwa-a11y.spec.ts).
