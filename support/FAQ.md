---
id: support-faq
title: Support FAQ — Grounded Answers Only
type: support
authority: canonical
status: current
owner: repository owner
summary: Verified answers to the questions players and stakeholders actually ask — pricing, photo handling, languages, share expiry, and payments.
keywords: [support, faq, free, privacy, photo, payments, paypal, languages, share, expiry]
contextTier: 2
relatedCode:
  [
    apps/web/src/packages/i18n/messages/en.json,
    apps/api/src/config/app-config.service.ts,
    apps/api/src/modules/payments/adapters/paypal.adapter.ts,
  ]
relatedTests: [apps/api/src/tests/game-analyze-paywall.integration.test.ts]
relatedDocs:
  [
    support/privacy-and-data-handling.md,
    support/feature-catalog.md,
    docs/privacy-and-data-retention.md,
    docs/features/paypal-donations-and-paid-results/22-go-no-go.md,
  ]
readWhen: Answering a direct player or stakeholder question — every answer here is grounded; do not improvise beyond it.
---

# Support FAQ — Grounded Answers Only

**Q: Is Twinzy free?**
Yes — free by default. With no PayPal credentials configured (the default), no payment code runs at all (`apps/api/src/config/app-config.service.ts` `isPaywallEnabled`). A recorded owner decision (`docs/features/paypal-donations-and-paid-results/22-go-no-go.md`, 2026-07-12) permits an env-gated PayPal paywall; it is approved for **sandbox only** — live charging of real users is not approved (four open conditions, including revised en+ar copy). If a deployment you support has the paywall on, see [feature-catalog.md](./feature-catalog.md).

**Q: What happens to my photo?**
It exists only in server request memory for the duration of one analysis, is used solely to extract written visible traits, and the buffer is zero-filled in a `finally` block whether the run succeeds, fails, or is aborted (`apps/api/src/modules/file-security/application/temporary-file-cleanup.service.ts`). It is never stored, logged, shared, or sent to any later pipeline step — candidate generation, judging, translation, sharing, and display are text-only. Details: [privacy-and-data-handling.md](./privacy-and-data-handling.md).

**Q: Is this face recognition / does it say who I am?**
No. Matching works only on written trait descriptions; the product never identifies anyone, and identity-sounding output is filtered server-side. See [AI-result-expectations.md](./AI-result-expectations.md). Any player report of identity/biometric-sounding wording is a SEV-1 escalation ([escalation-matrix.md](./escalation-matrix.md)).

**Q: Which languages are supported?**
English and Arabic (Arabic renders RTL), selected via the header switcher and remembered by cookie (`apps/web/src/packages/i18n/`). Switching language on a finished result re-translates the text only; the photo is never re-processed.

**Q: How long does a shared result link last?**
Default 10 minutes (`SHARE_RESULT_TTL_SECONDS=600` in `.env.example`; configurable 60–3600 s). Links are stored only in server memory — an API restart or redeploy also clears them. An expired link and a never-existing link show the same "unavailable" page on purpose (`apps/api/src/modules/share-results/application/get-share-result.use-case.ts`). The shared page never contains the photo.

**Q: Do I need an account? Can I request my data be deleted?**
No accounts exist, and there is no database — the API is stateless (`apps/api/src/modules/privacy/privacy.module.ts`: "Twinzy stores no user data by design"). There is nothing to delete (`docs/privacy-and-data-retention.md`).

**Q (paywall-enabled deployments): When am I charged, and what if the analysis fails?**
The price is set on the server (`PAYMENT_PRICE_VALUE`/`PAYMENT_PRICE_CURRENCY`) — the client can never change it. Money is captured only at the moment the analysis actually runs, and any failure after capture triggers an automatic best-effort refund (`apps/api/src/modules/payments/application/payment-gate.service.ts` `refundOnFailure`). Twinzy stores no order or card data; PayPal is the ledger of record. If a player reports being charged without receiving a result, escalate — see [escalation-matrix.md](./escalation-matrix.md).

**Q: What is the "Donate" link?**
A voluntary, clearly-labelled outbound `https://paypal.me/<handle>` link (label: "Support Twinzy on PayPal (voluntary)", `result.donate` in `en.json`). It never gates anything, and the app never processes the money. It is hidden entirely when `NEXT_PUBLIC_PAYPAL_ME_USERNAME` is unset.

**Q: Why did I get "No confident match this time"?**
The judge found no candidate above the display threshold — usually a generic or unclear photo. The in-app help suggests a clearer, well-lit photo (`help.a5`, `apps/web/src/packages/i18n/messages/en.json`). This is correct behavior, not a bug.

**Q: Why was my photo rejected?**
The upload chain enforces consent, one file, ≤5 MB, JPG/PNG/WebP with matching content, and an optional virus scan. Each rejection has specific friendly copy — see [upload-troubleshooting.md](./upload-troubleshooting.md). Support explains, never bypasses.
