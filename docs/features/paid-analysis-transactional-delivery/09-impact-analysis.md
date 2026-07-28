# 09 — Impact Analysis

## Touched behavior

- Paid streaming and non-streaming analysis sequencing.
- PayPal Orders v2 read/capture calls.
- Paymob passthrough semantics at finalization.
- Backend HTTP request logging.

## Unchanged behavior

- Shared API request/response schemas, frontend checkout, price configuration, free mode, image
  lifetime/wiping, AI prompt image boundaries, and result payload.

## Failure modes

- Invalid/unapproved/mismatched PayPal order: typed payment error before AI.
- AI failure/timeout/disconnect: no PayPal capture.
- Capture failure: no result, no local proof of charge; PayPal idempotency supports safe retry.
- Emission failure after capture: idempotent refund attempt.
- Refund failure/process crash: manual reconciliation remains possible only through PayPal.
