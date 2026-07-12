---
id: product-non-goals
title: Product Non-Goals
type: product
authority: canonical
status: current
owner: repository owner
summary: "What Twinzy deliberately does not do: identity matching, sensitive inference, accounts, photo or data persistence, feeds/history, trackers, and payment-record storage."
keywords: [non-goals, identity, biometrics, accounts, persistence, database, trackers, feeds, scope]
contextTier: 2
relatedCode: [packages/shared/src/schemas/judge.schema.ts, apps/web/src/shared/security/content-security-policy.ts, apps/api/src/modules/payments/model/payment.types.ts]
relatedTests: [apps/web/src/tests/pwa.test.ts, apps/web/e2e/game-privacy.spec.ts]
relatedDocs: [product/constraints.md, docs/privacy-and-data-retention.md, support/README.md]
readWhen: Someone proposes a feature and you need the recorded list of things Twinzy refuses to become.
---

# Product Non-Goals

These are deliberate refusals, each grounded in a recorded decision or enforced boundary. A
request to add one of these is a product-constraint change, not a feature request
(see [constraints.md](constraints.md)).

## Never (product-defining)

- **Identity matching / recognition / lookalike claims.** The judge schema hard-fails
  face-recognition, biometric, identity, and exact-lookalike claims
  ([packages/shared/src/schemas/judge.schema.ts](../packages/shared/src/schemas/judge.schema.ts));
  the 2026-07-09 visual-similarity pivot that explored this was superseded on 2026-07-10
  ([docs/features/visual-similarity-pivot/00-intake.md](../docs/features/visual-similarity-pivot/00-intake.md)).
- **Sensitive inference** — ethnicity, religion, health, sexuality, personality,
  attractiveness, income ([constraints.md](constraints.md) #5,
  [packages/shared/src/constants/safety.constants.ts](../packages/shared/src/constants/safety.constants.ts)).
- **Photo persistence or downstream photo use** — memory-only, wiped in `finally`, extraction
  only ([constraints.md](constraints.md) #3,
  [docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md)).

## Not in this product (recorded posture)

- **Accounts, login, profiles.** "No accounts" is standing product posture
  ([docs/product-overview.md](../docs/product-overview.md),
  [support/README.md](../support/README.md)); players are anonymous.
- **A database or server-side result storage.** The API is stateless; there is nothing to
  delete for data-subject requests
  ([docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md),
  [runbooks/README.md](../runbooks/README.md) — "no database … rollback is always git revert").
  Consequently there is **no result history, no social feed, and no permanent share pages** —
  share links are temporary by definition (TTL max 1 hour,
  [packages/shared/src/constants/share-result.constants.ts](../packages/shared/src/constants/share-result.constants.ts)).
- **Third-party analytics, ads, or trackers.** No analytics/ads vendor wrapper exists under
  [apps/web/src/packages](../apps/web/src/packages) (every third-party dependency must have
  exactly one wrapper there — [docs/library-wrapping.md](../docs/library-wrapping.md)), and the
  CSP restricts `connect-src` to self + the API, with PayPal origins added only when the
  paywall is configured
  ([apps/web/src/shared/security/content-security-policy.ts](../apps/web/src/shared/security/content-security-policy.ts)).
- **Payment-record storage and payment webhooks.** The paywall is deliberately
  persistence-free: capture-at-consumption with PayPal as the ledger; capture records live only
  for the request lifetime
  ([apps/api/src/modules/payments/model/payment.types.ts](../apps/api/src/modules/payments/model/payment.types.ts));
  webhooks are recorded as optional hardening, not a goal
  ([docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)).
- **Gating results on the paypal.me donate link.** Permanently NO-GO — payment through
  paypal.me is unverifiable
  ([docs/features/paypal-donations-and-paid-results/06-technical-refinement.md](../docs/features/paypal-donations-and-paid-results/06-technical-refinement.md)).

## Out of scope until a recorded decision says otherwise

- **LIVE paid charging** — blocked on the four open conditions in
  [monetization-policy.md](monetization-policy.md).
- **Multi-photo or video analysis** — Not applicable today: every shipped contract accepts a
  single image (single-file rule in the upload chain,
  [docs/file-upload-security.md](../docs/file-upload-security.md)); no recorded intent exists.
