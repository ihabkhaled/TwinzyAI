---
id: contracts-integrations-paypal
title: PayPal REST Integration Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: The wire contract of the PaypalAdapter — endpoints used, zod-parsed responses, idempotency header, timeout, order-id pattern, and the 402-vs-502 failure mapping.
keywords: [paypal, rest, orders-v2, capture, refund, oauth, idempotency, timeout, 402, 502]
contextTier: 2
relatedCode: [apps/api/src/modules/payments/adapters/paypal.adapter.ts, apps/api/src/modules/payments/model/payment.constants.ts, apps/api/src/modules/payments/model/paypal.schemas.ts, apps/api/src/config/payment.constants.ts]
relatedTests: [apps/api/src/modules/payments/tests/paypal.adapter.test.ts, apps/api/src/tests/game-analyze-paywall.integration.test.ts]
relatedDocs: [contracts/api/payments.md, docs/env-vars.md]
readWhen: You are changing anything that talks to PayPal or diagnosing a payment failure.
---

# PayPal REST Integration Contract

`apps/api/src/modules/payments/adapters/paypal.adapter.ts` is **the only file that talks to
PayPal's REST API** (Orders v2 + Refunds). Endpoint semantics toward our own clients are
owned by [../api/payments.md](../api/payments.md).

## Base URL and credentials

`PAYPAL_ENV` (`sandbox`|`live`) selects the origin via `PAYPAL_BASE_URL_BY_ENV`
(`apps/api/src/config/payment.constants.ts`): sandbox `https://api-m.sandbox.paypal.com`,
live `https://api-m.paypal.com`. Credentials `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` must
match the env — the adapter logs an explicit mismatch hint on OAuth 401.

## Calls made (paths in `apps/api/src/modules/payments/model/payment.constants.ts`)

| Call | Method/path | Purpose |
| --- | --- | --- |
| OAuth token | `POST /v1/oauth2/token` (`grant_type=client_credentials`, Basic auth) | Bearer token, cached with a 60 s early-expiry margin (`PAYPAL_TOKEN_EXPIRY_MARGIN_SECONDS`) |
| Create order | `POST /v2/checkout/orders` | `intent: 'CAPTURE'`, one purchase unit with the server-config price and `custom_id = requestId` |
| Capture order | `POST /v2/checkout/orders/{id}/capture` | The moment money moves; verified field-by-field |
| Refund capture | `POST /v2/payments/captures/{id}/refund` | Best-effort refund of an undelivered run |

## Wire discipline

- **Zod-parsed responses**: every response body is parsed with the lenient views in
  `apps/api/src/modules/payments/model/paypal.schemas.ts`
  (`PaypalTokenResponseSchema`, `PaypalCreateOrderResponseSchema`,
  `PaypalCaptureOrderResponseSchema`, `PaypalErrorResponseSchema`). Only decision fields are
  validated; a parse failure is treated as a provider failure — never trusted partially.
- **Idempotency**: every POST carries `paypal-request-id` (the requestId/orderId/captureId as
  key), so PayPal replays the same result for a repeated key instead of acting twice.
- **Timeout**: every call is bounded by `PAYPAL_REQUEST_TIMEOUT_MS` = 15 s via an
  AbortController — a payment outage cannot hang an analysis run.
- **Order-id pattern**: client-supplied order ids must match
  `PAYPAL_ORDER_ID_PATTERN = /^[A-Z0-9-]{8,64}$/` before ever reaching the adapter
  (`apps/api/src/modules/payments/lib/payment-order.util.ts`).
- **Logging**: request/response bodies are never logged; failures log the HTTP status plus a
  PII-free diagnostics line (`name`, first `details[].issue`, `debug_id`, `description` —
  `buildPaypalDiagnostics`).

## Failure mapping (402 vs 502)

Owned by `mapPaypalFailure` in the adapter:

- **402 `PAYMENT_ORDER_INVALID`** — payment-side failures where no money moved: the issue
  code is in `PAYPAL_PAYMENT_FAILED_ISSUES`
  (`ORDER_NOT_APPROVED`, `ORDER_ALREADY_CAPTURED`, `INSTRUMENT_DECLINED`,
  `PAYER_ACTION_REQUIRED`, `TRANSACTION_REFUSED`, `PAYER_CANNOT_PAY`, `ORDER_NOT_CAPTURED`,
  `ORDER_EXPIRED`, `COMPLIANCE_VIOLATION`) **or** the HTTP status is 404 (unknown order id).
  The buyer can retry with the same or another method.
- **502 `PAYMENT_PROVIDER_UNAVAILABLE`** — everything else: OAuth failure, transport
  failure/timeout, unexpected response bodies, refund failures — a transient provider
  problem, not a payment decision.
- Capture verification failure (status/amount/currency/`custom_id` mismatch) is also **402
  `PAYMENT_ORDER_INVALID`** (`verifyCapture`).

## Replay and persistence posture

An order captures exactly once at PayPal's side (`ORDER_ALREADY_CAPTURED` on replay), so no
local ledger exists; `PaymentCaptureRecord` `{ orderId, captureId }` lives only for the run
and is never persisted (`apps/api/src/modules/payments/model/payment.types.ts`).
