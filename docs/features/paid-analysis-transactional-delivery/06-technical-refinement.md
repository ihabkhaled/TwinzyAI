# 06 — Technical Refinement

## Chosen design

- Add a provider-neutral prepared-payment record.
- PayPal preparation calls Orders v2 “show order details” and validates `APPROVED`, `CAPTURE`
  intent, exact configured amount/currency, and `custom_id` request binding.
- Paymob preparation keeps its current provider-side paid-transaction verification and returns its
  existing capture record.
- Run the AI pipeline.
- Check abort, then finalize payment: PayPal captures; Paymob reuses its already-paid record.
- Store only the finalized capture in the request-local holder so the existing catch path refunds
  only money that moved.

## Rejected alternatives

- Capture-first plus more retries: still loses compensation when the process dies.
- A new database/outbox/webhook ledger: strongest reconciliation, but conflicts with current
  no-persistence scope and requires a separately approved critical architecture program.
- Skip preflight verification: avoids provider work but permits unpaid callers to consume AI.

PayPal request IDs remain idempotency keys. All external calls remain timeout-bounded and Zod
validated.
