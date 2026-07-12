---
id: structure-module-api-payments
title: Module — api payments (PayPal Orders v2 Paid-Analysis Gate)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The env-gated paid-analysis module — server-priced PayPal order creation, capture-at-consumption with field-by-field verification, best-effort refunds, and no persistence.
keywords: [payments, paypal, orders, capture, refund, paywall, money, gate, adapter]
contextTier: 2
relatedCode: [apps/api/src/modules/payments, apps/api/src/config/payment.constants.ts]
relatedTests: [apps/api/src/modules/payments/tests, apps/api/src/tests/game-analyze-paywall.integration.test.ts]
relatedDocs: [structure/flows/payment-flow.md, docs/features/paypal-donations-and-paid-results/22-go-no-go.md]
readWhen: You are touching order creation, capture, refunds, prices, or PayPal connectivity.
---

# Module — `apps/api/src/modules/payments`

**Responsibility.** The config-gated paid-analysis gate over PayPal Orders v2. The module doc
(`payments.module.ts`) records: enabled purely by configuration; without PayPal credentials
the gate no-ops and the game stays free. **Critical lane**; LIVE mode is NOT approved — see
[flows/payment-flow.md](../flows/payment-flow.md) for the full flow and status of record.

## Public surface (`index.ts`)

`PaymentGateService`, `type PaymentHolder`, `PaymentsModule`.

## Endpoint (`api/payments.controller.ts`)

`POST /api/v1/payments/orders` — throttle 10/min, zod pipe
`CreatePaymentOrderRequestSchema` (shared; `{requestId: uuid}` only, price deliberately
absent), JSON body natively capped at 4096 B (`apps/api/src/bootstrap/bootstrap.constants.ts`).
Delegates to `PaymentGateService.createOrderResponse` → `{orderId}`.

## Key files

| File | Role |
| --- | --- |
| `application/payment-gate.service.ts` | `createOrderForRequest` (402 when paywall off), `captureForAnalysis(body, expectedRequestId?)` (off → `undefined`; missing field → 402 `PaymentRequired`; malformed → 402 `PaymentOrderInvalid`), `refundOnFailure` (best-effort; failure logs "REFUND FAILED … reconcile in the PayPal dashboard", never masks the original error) |
| `adapters/paypal.adapter.ts` | "The ONLY file that talks to PayPal's REST API (Orders v2 + Refunds)": `createOrder` (CAPTURE intent, server-priced, `custom_id = requestId`), `captureOrder` (verifies `COMPLETED` on order AND capture, exact amount + currency, `custom_id` binding), `refundCapture`; OAuth token cache (60 s early-expiry margin), 15 s per-call timeout, `paypal-request-id` idempotency header, PII-free diagnostics |
| `lib/payment-order.util.ts` | `resolvePaymentOrderId(body)` — `undefined` absent / `null` malformed / string valid, against `PAYPAL_ORDER_ID_PATTERN` |
| `model/payment.constants.ts` | Routes, throttle, PayPal REST paths, status/issue constants, user-facing copy |
| `model/paypal.schemas.ts` | Lenient zod views of PayPal responses (token/create/capture/error) |
| `model/payment.types.ts` | `PaymentCaptureRecord` (**never persisted**), `PaymentHolder` (mutable per-run slot) |

## Configuration

`PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` (both non-empty ⇒ `isPaywallEnabled` —
`apps/api/src/config/app-config.service.ts`), `PAYPAL_ENV` (sandbox/live base URLs in
`apps/api/src/config/payment.constants.ts`), `PAYMENT_PRICE_VALUE`, `PAYMENT_PRICE_CURRENCY`.
Catalog: [docs/env-vars.md](../../docs/env-vars.md).

## Invariants

- The price is server-authoritative; no client-sent amount is ever trusted (the shared
  schemas omit it by design — `packages/shared/src/schemas/payment.schema.ts`).
- Capture verification is field-by-field; PayPal "payment failed" issue codes (or HTTP 404)
  map to 402 `PaymentOrderInvalid`, everything else to 502 `PaymentProviderUnavailable`.
- Nothing is persisted; refund failures are surfaced for manual dashboard reconciliation.
- Error triple construction only via `buildPaymentError`/`buildIntegrationError`
  (`apps/api/src/core/errors/error-factory.ts`).

## Tests

Unit: `tests/payment-gate.service.test.ts`, `tests/paypal.adapter.test.ts`.
Integration: `apps/api/src/tests/game-analyze-paywall.integration.test.ts`. The default
config stub pins the paywall off (`apps/api/src/tests/fixtures/stubs.ts`).

## Common changes and risks

- **Price/currency**: env-only change; web display mirrors are separate
  ([flows/payment-flow.md](../flows/payment-flow.md)).
- **Risk**: money flow — any change here needs the deeper review that
  [CLAUDE.md](../../CLAUDE.md) requires for money-touching changes, and the go/no-go record's
  open conditions gate LIVE enablement.
