# 19 - Threat Model: paid-analysis paywall (PayPal Orders v2)

Scope: the paid-analysis gate (create order → approve → capture-at-consumption →
refund-on-failure). The voluntary donate link has its own model in
`19-threat-model.md`.

## Assets

- Users' money and the trust that they are charged exactly once, only when the
  analysis runs, and refunded if it fails.
- PayPal REST credentials (server secrets).
- The integrity of the price (must be exactly the configured $0.50).

## Trust boundaries

- Browser ↔ our API (order creation, analyze with order id).
- Our API ↔ PayPal REST (OAuth, orders, captures, refunds) — the only place
  money moves.
- Buyer ↔ PayPal checkout UI (approval; we never see card data — PCI stays with
  PayPal).

## Threats and mitigations

| Threat | Mitigation |
| --- | --- |
| **Price tampering** — client tries to pay less | Amount + currency come only from validated server config; the client request carries just a uuid requestId. The capture response is re-checked field-by-field (exact value + currency) before a run is treated as paid. Unit-tested with a $0.01 body → `PAYMENT_ORDER_INVALID`. |
| **Free analysis without paying** — call analyze with no/forged order | Gate captures at consumption; a missing order id → 402 `PAYMENT_REQUIRED`; a malformed one is rejected before reaching PayPal; an unapproved order → PayPal 422 `ORDER_NOT_APPROVED` (verified live). No capture ⇒ no AI run. |
| **Replay** — reuse one paid order for many analyses | PayPal captures an order exactly once; a second attempt fails `ORDER_ALREADY_CAPTURED` → `PAYMENT_ORDER_INVALID`. The `paypal-request-id` idempotency key makes a retried capture return the same result, never double-charge. |
| **Cross-request order theft** — pay for run A, consume for run B | The order binds to the analyze requestId via PayPal `custom_id`; capture verification checks the binding. |
| **Paid but not delivered** — pipeline fails/timeouts/cancels after capture | The run refunds automatically on any post-capture failure (holder + refund-on-failure). A refund failure is logged loudly for reconciliation, never silently dropped. |
| **Credential leak** | `PAYPAL_CLIENT_SECRET` is server-only (never `NEXT_PUBLIC`), never logged; bodies are never logged; only the public client id reaches the browser (by PayPal's design). |
| **Order-id injection toward the provider** | Order ids are strictly pattern-validated before any PayPal call; `encodeURIComponent` on the path segment. |
| **Payment outage hangs a run** | Every PayPal call is timeout-bounded; failures map to typed 402/502, never an unbounded wait. |
| **SDK supply-chain / CSP** | The Buttons SDK is loaded only from the official origin, only when the paywall is configured, via scoped CSP additions (script/frame/connect for `*.paypal.com`); the free game's CSP is unchanged. |
| **Dark pattern / false "free" copy** | Product condition (see go/no-go): the "free/anonymous/no persistence" copy MUST be revised before live. The payment copy already says charged-only-when-it-runs + auto-refund. |

## Residual risk

- Live charging is gated on the go/no-go conditions (deployed HTTPS origin,
  Business account, copy revision, live smoke test). Until then the paywall
  runs sandbox-only.
- Webhook-based reconciliation is not implemented (not required for
  capture-at-consumption correctness); recommended before high volume.

Decision: no high/critical issue open for the sandbox scope. Live scope blocked
on the recorded go/no-go conditions.
