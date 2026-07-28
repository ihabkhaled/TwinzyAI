# 12 — Coverage Plan

- `payment-gate.service.ts`: free, PayPal, Paymob, invalid input, finalize, and refund branches.
- `paypal.adapter.ts`: approved-order success plus every validation mismatch and transport/schema
  failure introduced by the GET path.
- `analyze-game-stream.use-case.ts`: extraction failure, success ordering, abort before capture,
  result emission failure, and compensation.
- `analyze-game.use-case.ts`: parity with streaming sequencing and compensation.
- `http-logging.options.ts` / logger constants: behavioral secret-redaction assertion.

Coverage is measured on touched files, not repository averages. Any untestable provider/vendor
branch must be redesigned rather than excluded.
