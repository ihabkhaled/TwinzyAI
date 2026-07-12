---
id: product-principles
title: Product Principles
type: product
authority: canonical
status: current
owner: repository owner
summary: "The six standing product principles — consent-first, privacy-over-features, playful-not-identifying, free-by-default, mobile-first, bilingual — each with its enforcement owner."
keywords: [principles, consent, privacy, playful, free, mobile, bilingual, rtl, safety]
contextTier: 2
relatedCode: [apps/api/src/modules/file-security/application/file-security.service.ts, apps/api/src/modules/game/application/analyze-game.use-case.ts, apps/web/src/packages/i18n/messages/en.json]
relatedTests: [apps/web/e2e/game-privacy.spec.ts, apps/web/e2e/paywall.spec.ts]
relatedDocs: [product/constraints.md, docs/ai-safety.md, docs/privacy-and-data-retention.md]
readWhen: You are weighing a product trade-off and need the ordered principles that decide it.
---

# Product Principles

Each principle is a standing decision. The hard, testable versions live in
[constraints.md](constraints.md); this file states the intent.

## 1. Consent-first

The photo is processed only after the explicit consent checkbox, and consent is the very first
backend check — before file presence, size, or type
([apps/api/src/modules/file-security/application/file-security.service.ts](../apps/api/src/modules/file-security/application/file-security.service.ts)).
The checkbox copy is a contract that must accurately describe the pipeline
(see [user-facing-copy-principles.md](user-facing-copy-principles.md)).

## 2. Privacy over features

When a feature would require storing the photo, identifying the user, or persisting personal
data, the feature loses. Concrete consequences: the image is memory-only and wiped in
`finally`; matching, judging, translation, and sharing are text-only; there is no database and
nothing to delete for data-subject requests
([docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md),
[privacy-promises.md](privacy-promises.md)). Even the paywall was designed persistence-free
(capture-at-consumption, PayPal as the ledger —
[monetization-policy.md](monetization-policy.md)).

## 3. Playful, not identifying

Twinzy suggests style/vibe matches from written visible traits; it never determines who the
user is, never compares biometrics, and never infers sensitive attributes. Enforced by the
shared forbidden-wording lists, the AI safety filter, and the judge schema's literal-false
safety flags ([docs/ai-safety.md](../docs/ai-safety.md),
[packages/shared/src/schemas/judge.schema.ts](../packages/shared/src/schemas/judge.schema.ts)).
See [non-goals.md](non-goals.md).

## 4. Free by default

With blank PayPal credentials — the shipped default — the game is fully free and no payment
code runs ([apps/api/src/modules/payments/application/payment-gate.service.ts](../apps/api/src/modules/payments/application/payment-gate.service.ts),
proven by [apps/web/e2e/paywall.spec.ts](../apps/web/e2e/paywall.spec.ts)). The env-gated
paywall and the voluntary donate link are governed by
[monetization-policy.md](monetization-policy.md); LIVE charging is not approved.

## 5. Mobile-first

Designed from 320px up, ≥44px touch targets, no horizontal scroll, installable PWA, camera
capture on device ([docs/mobile-pwa-standards.md](../docs/mobile-pwa-standards.md),
[docs/manual-qa-checklist.md](../docs/manual-qa-checklist.md)). Playwright runs dedicated
mobile projects (Pixel 5, iPhone 13 — [apps/web/e2e](../apps/web/e2e)).

## 6. Bilingual (en + ar, RTL)

Every user-facing string routes through i18n; Arabic is a first-class RTL locale, including
the AI-generated result content, which is produced in the active language server-side and
re-translated text-only on locale switch
([localization-expectations.md](localization-expectations.md)). The safety word-lists are
bilingual ([packages/shared/src/constants/safety.constants.ts](../packages/shared/src/constants/safety.constants.ts)).
