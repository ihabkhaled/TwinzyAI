---
id: contracts-api-payments
title: Payments Endpoint Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: Contract for POST /api/v1/payments/orders and the capture-at-consumption binding between a PayPal order and one analyze request — server-authoritative price, 402 semantics, refund-on-failure.
keywords: [payments, paypal, orders, 402, paywall, capture, custom-id, requestid, price, refund]
contextTier: 2
relatedCode: [apps/api/src/modules/payments/api/payments.controller.ts, apps/api/src/modules/payments/application/payment-gate.service.ts, packages/shared/src/schemas/payment.schema.ts]
relatedTests: [apps/api/src/tests/game-analyze-paywall.integration.test.ts, apps/api/src/modules/payments/tests/payment-gate.service.test.ts]
relatedDocs: [contracts/integrations/paypal.md, contracts/api/analyze.md, docs/features/paypal-donations-and-paid-results/22-go-no-go.md]
readWhen: You are touching the paywall, the payments endpoint, or the payment binding on analyze requests.
---

# Payments Endpoint Contract

The paywall is **off by default and env-gated**: it is ON iff both `PAYPAL_CLIENT_ID` and
`PAYPAL_CLIENT_SECRET` are non-empty (`isPaywallEnabled`,
`apps/api/src/config/app-config.service.ts`). With it off, every gate method no-ops and the
game is fully free (`apps/api/src/modules/payments/application/payment-gate.service.ts`).
LIVE mode is not yet approved — conditions recorded in
[docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../../docs/features/paypal-donations-and-paid-results/22-go-no-go.md).

## POST /api/v1/payments/orders

Controller: `apps/api/src/modules/payments/api/payments.controller.ts`. Throttle 10/min
(`CREATE_ORDER_THROTTLE`); native JSON body cap 4,096 B
(`apps/api/src/bootstrap/bootstrap.constants.ts`).

**Request** — `CreatePaymentOrderRequestSchema` (`packages/shared/src/schemas/payment.schema.ts`):
strict `{ requestId }`, a client-minted UUID identifying the analyze run to pay for. **The
price deliberately never appears in any request** — it is server-authoritative from
`PAYMENT_PRICE_VALUE`/`PAYMENT_PRICE_CURRENCY` config, and the created PayPal order is bound
to the request via `custom_id = requestId`
(`apps/api/src/modules/payments/adapters/paypal.adapter.ts` `createOrder`).

**Response 200** — `CreatePaymentOrderResponseSchema`: `{ orderId }` (a PayPal order id).

**Errors**: paywall off → **402** `PAYMENT_ORDER_INVALID` (`assertEnabled` in
`payment-gate.service.ts`); PayPal payment-side failures → **402** `PAYMENT_ORDER_INVALID`;
provider outages → **502** `PAYMENT_PROVIDER_UNAVAILABLE`. Status 402 is fixed by
`apps/api/src/core/errors/payment.error.ts`.

## Capture-at-consumption on analyze

Payment is **captured when the analysis is consumed**, not when the order is created. Both
analyze use-cases (`apps/api/src/modules/game/application/analyze-game.use-case.ts`,
`analyze-game-stream.use-case.ts`) call
`PaymentGateService.captureForAnalysis(body, expectedRequestId)` after the cheap local checks
(consent + file security) and before the AI call:

| Condition | Outcome |
| --- | --- |
| Paywall off | `undefined` — free run, `paypalOrderId` ignored |
| `paypalOrderId` multipart field absent | **402** `PAYMENT_REQUIRED` |
| Field present but fails `/^[A-Z0-9-]{8,64}$/` | **402** `PAYMENT_ORDER_INVALID` (`apps/api/src/modules/payments/lib/payment-order.util.ts`) |
| Capture verification fails | **402** `PAYMENT_ORDER_INVALID` |
| PayPal unreachable/unexpected | **502** `PAYMENT_PROVIDER_UNAVAILABLE` |

Capture verification is field-by-field: order **and** capture status must be `COMPLETED`,
amount and currency must exactly equal the configured price, and
**`custom_id === requestId`** must bind the payment to this exact analyze request
(`verifyCapture` in `paypal.adapter.ts`). A capture is single-use at PayPal's side, so a
replayed order id fails with `ORDER_ALREADY_CAPTURED` → 402; no local ledger exists and
nothing is persisted (`PaymentCaptureRecord` in
`apps/api/src/modules/payments/model/payment.types.ts` lives only for the run).

## Refund on failure

Any failure after capture (pipeline error, timeout, cancel, disconnect) triggers a
best-effort refund of the undelivered run (`refundOnFailure`); a refund failure is logged
loudly for operator reconciliation and never masks the original error
(`payment-gate.service.ts`).

## Consumers

Web gateway `apps/web/src/modules/game/gateway/payment.gateway.ts` (validates the response
against the shared schema); the analyze form appends `paypalOrderId` via
`apps/web/src/modules/game/gateway/game-form-data.builder.ts`. PayPal wire detail is owned by
[../integrations/paypal.md](../integrations/paypal.md).
