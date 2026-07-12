---
id: structure-flow-payment
title: Payment Flow — Env-Gated PayPal Paid Analysis, End to End
type: structure
authority: canonical
status: current
owner: repository owner
summary: The env-gated PayPal Orders v2 paywall — server-priced order creation, buttons approval, capture-at-consumption inside the analyze run, refund-on-failure — and the separate voluntary donate link.
keywords: [payment, paypal, paywall, orders, capture, refund, donate, flow, env-gated, money]
contextTier: 2
relatedCode: [apps/api/src/modules/payments/application/payment-gate.service.ts, apps/api/src/modules/payments/adapters/paypal.adapter.ts, apps/web/src/modules/game/hooks/usePaymentFlow.hook.ts, apps/web/src/packages/paypal/paypal-sdk.ts]
relatedTests: [apps/api/src/tests/game-analyze-paywall.integration.test.ts, apps/web/src/modules/game/test/use-payment-flow.hook.test.tsx, apps/web/e2e/paywall.spec.ts]
relatedDocs: [docs/features/paypal-donations-and-paid-results/22-go-no-go.md, structure/modules/api-payments.md, structure/flows/analyze-flow.md]
readWhen: You are touching anything money-adjacent — the paywall, PayPal integration, price config, or the donate link.
---

# Payment Flow — Env-Gated PayPal Paid Analysis, End to End

**Status of record:** the game is free BY DEFAULT. A recorded owner decision
([docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../../docs/features/paypal-donations-and-paid-results/22-go-no-go.md),
2026-07-12) permits an env-gated PayPal Orders v2 paywall: capture-at-consumption,
server-authoritative price, no persistence. Blank `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`
(the default) = paywall off = fully free. **LIVE mode is NOT approved** (open conditions
recorded in that gate, including en+ar copy revision). This is a critical-lane surface
([ownership-map.yaml](../ownership-map.yaml)).

## The switch (both sides)

- API: `isPaywallEnabled` requires BOTH `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
  non-empty (`apps/api/src/config/app-config.service.ts`); when off, `PaymentGateService`
  no-ops and analyze runs free (`apps/api/src/modules/payments/application/payment-gate.service.ts`).
- Web: `isPayPalConfigured()` keys on `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
  (`apps/web/src/packages/paypal/paypal-sdk.ts`); when false, `usePaymentFlow` skips the
  payment phase entirely. PayPal CSP origins are appended only when the client id is set
  (`apps/web/src/proxy.ts`, `apps/web/src/shared/security/content-security-policy.ts`).

## Paywall-on sequence

1. **Order creation (server-priced)** — the web enters `GamePhase.Payment`; `usePaymentFlow`
   (`apps/web/src/modules/game/hooks/usePaymentFlow.hook.ts`) posts
   `POST /api/v1/payments/orders` with `{requestId}` only
   (`apps/web/src/modules/game/gateway/payment.gateway.ts`; the price is **never** sent —
   `CreatePaymentOrderRequestSchema` in `packages/shared/src/schemas/payment.schema.ts`
   deliberately omits it). `PaymentsController` (throttle 10/min; JSON body capped at 4096 B by
   `apps/api/src/bootstrap/bootstrap.constants.ts`) delegates to
   `PaymentGateService.createOrderResponse` → `PaypalAdapter.createOrder`: CAPTURE intent,
   price from `config.paymentPrice` (`PAYMENT_PRICE_VALUE`/`_CURRENCY` env),
   `custom_id = requestId`. Returns `{orderId}`.
2. **Approval (browser)** — `usePayPalButtons` renders the SDK buttons via the single wrapper
   `apps/web/src/packages/paypal/paypal-sdk.ts` (lazy one-time script injection,
   StrictMode-safe abort-before-paint) into `payment-step.container.tsx`
   ("the result stays hidden until the backend captures"). The user approves in PayPal UI;
   env price vars on the web are display-only
   (`apps/web/src/modules/game/helpers/payment-price.helper.ts`).
3. **Analyze with the order id** — on approval the analyze run starts with `paypalOrderId` in
   the multipart body (`gateway/game-form-data.builder.ts`, field name
   `PAYMENT_ORDER_FIELD_NAME` from shared).
4. **Capture at consumption (server)** — inside the analyze use-cases, after the cheap local
   checks and before the AI call, `PaymentGateService.captureForAnalysis` runs
   (`apps/api/src/modules/game/application/analyze-game.use-case.ts`): paywall off →
   `undefined`; missing order field → 402 `PaymentRequired`; malformed id (vs
   `PaypalOrderIdSchema` `/^[A-Z0-9-]{8,64}$/`) → 402 `PaymentOrderInvalid`; otherwise
   `PaypalAdapter.captureOrder` verifies field-by-field: `status === 'COMPLETED'` on order AND
   capture, exact amount + currency, and `custom_id` binding to the requestId. OAuth token
   cached with a 60 s early-expiry margin; every call bounded by a 15 s timeout; idempotency
   via the `paypal-request-id` header; diagnostics are PII-free.
5. **Refund on failure** — if anything after capture fails, `refundOnFailure` best-effort
   refunds the capture; a refund failure logs "REFUND FAILED … reconcile in the PayPal
   dashboard" and never masks the original error. Nothing is persisted
   (`PaymentCaptureRecord` is in-memory only, `model/payment.types.ts`).
6. **Errors to copy** — 402/502 payment codes (`PaymentRequired`, `PaymentOrderInvalid`,
   `PaymentProviderUnavailable` — frozen in `packages/shared/src/constants/error-code.constants.ts`)
   map to friendly keys via `GAME_ERROR_KEY_BY_CODE`
   (`apps/web/src/modules/game/model/game.constants.ts`).

## The donate link (separate, always-permitted surface)

A voluntary outbound **paypal.me** link, unrelated to the paywall: built by
`apps/web/src/shared/helpers/donate-link.helper.ts` from the strictly-validated
`NEXT_PUBLIC_PAYPAL_ME_USERNAME` against the hardcoded `https://paypal.me` base
(`apps/web/src/shared/constants/donate.constants.ts`); hidden when unset
(`donate-link.container.tsx` and the header `donate-nav-link.component.tsx` render nothing).
It can never gate results — payment completion via paypal.me is unverifiable
(product constraint 1 in [CLAUDE.md](../../CLAUDE.md)).

## Test truths

- `apps/api/src/tests/game-analyze-paywall.integration.test.ts` — analyze with the gate on.
- Unit: `payment-gate.service.test.ts`, `paypal.adapter.test.ts` (api);
  `use-payment-flow.hook.test.tsx`, `payment-step.container.test.tsx`,
  `donate-and-payment-env.test.ts` (web).
- The whole e2e suite runs with the paywall pinned OFF
  (`NEXT_PUBLIC_PAYPAL_CLIENT_ID=''` in `apps/web/playwright.config.ts` webServer env);
  `paywall.spec.ts` and `donations.spec.ts` cover the off-state and donate surfaces.
