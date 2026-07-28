# 02 — Business Development

- Pricing, currencies, gateways, and frontend checkout remain unchanged.
- No subscription, account, database, webhook, or new monetization mechanism is introduced.
- The PayPal order remains `CAPTURE` intent. Buyer approval is checked server-side before AI work;
  capture is deferred until the complete result is ready.
- Existing affected charges cannot be reconciled from Twinzy because the system intentionally keeps
  no payment ledger. They require the provider dashboard/capture records.
- LIVE-mode approval remains governed by
  `docs/features/paypal-donations-and-paid-results/22-go-no-go.md`; this incident does not waive it.
