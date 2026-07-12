---
id: product-monetization-policy
title: Monetization Policy — Paywall and Donation Status
type: product
authority: canonical
status: current
owner: repository owner
summary: "THE canonical statement of monetization status: free by default; env-gated PayPal Orders v2 paywall is SANDBOX-GO with LIVE not approved (4 open conditions); voluntary paypal.me donate link is GO; older 'free forever' phrasing is superseded."
keywords: [monetization, paywall, paypal, donation, pricing, sandbox, live, go-no-go, env-gated, free]
contextTier: 2
relatedCode: [apps/api/src/modules/payments/application/payment-gate.service.ts, apps/api/src/modules/payments/adapters/paypal.adapter.ts, apps/web/src/modules/game/hooks/usePaymentFlow.hook.ts, apps/web/src/shared/helpers/donate-link.helper.ts]
relatedTests: [apps/web/e2e/paywall.spec.ts, apps/web/e2e/donations.spec.ts]
relatedDocs: [docs/features/paypal-donations-and-paid-results/22-go-no-go.md, docs/features/paypal-donations-and-paid-results/25-sandbox-verification.md, docs/env-vars.md]
readWhen: Any question about payments, pricing, donations, "is the game free", or paywall enablement.
---

# Monetization Policy — Paywall and Donation Status

This is the canonical product statement of monetization truth. The decision of record is
[docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)
(owner-approved, 2026-07-12). Where any older text says "the game is free forever / no payment
code", this document and that record govern (see "Superseded phrasing" below).

## Current status at a glance

| Surface | Status | Default |
| --- | --- | --- |
| Base game | Free | Free — no env needed |
| Donate link (paypal.me) | **GO** (2026-07-10), shipped, env-gated | Hidden (`NEXT_PUBLIC_PAYPAL_ME_USERNAME` unset) |
| Paid analysis (PayPal Orders v2 paywall) | **SANDBOX-GO, LIVE-conditional** (2026-07-12) | Off (`PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` blank ⇒ fully free, no payment code runs) |
| LIVE charging of real users | **NOT approved** | — |

## The paywall (Workstream B)

Mechanism (all shipped and sandbox-verified;
[25-sandbox-verification.md](../docs/features/paypal-donations-and-paid-results/25-sandbox-verification.md)):

- **Server-authoritative price** (`PAYMENT_PRICE_VALUE`/`PAYMENT_PRICE_CURRENCY` env; the
  client never sends a price —
  [packages/shared/src/schemas/payment.schema.ts](../packages/shared/src/schemas/payment.schema.ts)).
- **Capture-at-consumption**: the order is captured only when the analysis is delivered,
  verified field-by-field (status, amount, currency, `custom_id` = request id), with
  idempotency and **auto-refund on any post-capture failure**
  ([apps/api/src/modules/payments/adapters/paypal.adapter.ts](../apps/api/src/modules/payments/adapters/paypal.adapter.ts),
  [payment-gate.service.ts](../apps/api/src/modules/payments/application/payment-gate.service.ts)).
- **No persistence**: PayPal is the ledger; capture records live only for the request lifetime
  ([payment.types.ts](../apps/api/src/modules/payments/model/payment.types.ts)). **Webhooks are
  optional reconciliation hardening, not required for correctness** (decision of record).
- **Enablement is env-only**: credentials present ⇒ gate ON (402 `PaymentRequired` without a
  valid order); absent ⇒ every payment method no-ops
  ([payment-gate.service.ts](../apps/api/src/modules/payments/application/payment-gate.service.ts)).
  The e2e suite pins the paywall OFF and proves the free flow
  ([apps/web/e2e/paywall.spec.ts](../apps/web/e2e/paywall.spec.ts)). Env surface:
  [docs/env-vars.md](../docs/env-vars.md).

### The four open LIVE conditions (verbatim intent from the go/no-go)

1. A deployed public **HTTPS** origin.
2. A PayPal **Business** account for live credentials; `PAYPAL_ENV=live` only after sandbox
   sign-off.
3. Owner sign-off on the **consent + privacy + disclaimer copy revision in both languages** —
   the app still states "free / anonymous / no persistence"
   (see [user-facing-copy-principles.md](user-facing-copy-principles.md)).
4. A recorded live smoke test: one real $0.50 order end-to-end, then refund.

A premature live capture attempt on 2026-07-12 failed with PayPal `COMPLIANCE_VIOLATION`
(recorded in commit `5cd43f6`), confirming LIVE is not operational and the conditions stand.
Decision owner: repository owner.

## The donate link (Workstream A)

A voluntary, clearly-labeled outbound paypal.me link — GO since 2026-07-10. Handle strictly
validated (`^[A-Za-z0-9]{1,50}$`) at module load, hidden when unset, hardcoded
`https://paypal.me` base, outbound-safe anchor; env-only rollback
([apps/web/src/shared/helpers/donate-link.helper.ts](../apps/web/src/shared/helpers/donate-link.helper.ts),
[apps/web/src/packages/env/public-env.ts](../apps/web/src/packages/env/public-env.ts);
threat model [19-threat-model.md](../docs/features/paypal-donations-and-paid-results/19-threat-model.md)).
**It never gates anything**: paypal.me payment is unverifiable, so gating on it is permanently
NO-GO ([06-technical-refinement.md](../docs/features/paypal-donations-and-paid-results/06-technical-refinement.md)).

## Superseded phrasing (do not restate)

The following texts predate the recorded decisions and must not be quoted as current truth:
[CLAUDE.md](../CLAUDE.md) constraint #1's gate list ("webhooks, durable order store"),
[rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) rule 42 ("not even
scaffolding"), the agent mirror files' "no payment capture" lines,
[docs/product-overview.md](../docs/product-overview.md) ("there are no payments"),
[docs/release-checklist.md](../docs/release-checklist.md) item 9 ("no payment code"), the
"completely free" i18n strings (truthful only while the paywall is off — the default), and the
"paid gating remains forbidden" comment in [.env.example](../.env.example). Until those files
are updated, this document plus
[22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md) are the
owners of monetization truth.
