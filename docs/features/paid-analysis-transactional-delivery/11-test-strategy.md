# 11 — Test Strategy

## Required red tests

- Paid stream + extraction rejection: approved order may be verified, but PayPal capture is never
  called and the stream returns the existing safe error.
- Paid successful stream: order verification precedes AI and capture follows full result assembly.
- Disconnect/abort before finalization: no PayPal capture.
- Failure after finalized capture: refund is called exactly once.
- PayPal order verification rejects wrong status, intent, amount, currency, or request binding.
- HTTP logger redacts the whole request-header object and emits no supplied token/IP value.

## Regression tests

- Existing non-stream paid failure expectation is updated from refund-after-capture to no capture.
- Paymob failure still refunds an already-paid transaction.
- Free mode remains a no-op payment flow.

## Gates

Focused Vitest, `lint`, `typecheck`, `test:unit`, `test:coverage`, `build`, and `security:scan`.
