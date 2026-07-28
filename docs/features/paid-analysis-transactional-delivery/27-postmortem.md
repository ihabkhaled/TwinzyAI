# 27 — Postmortem

## Summary

A paid streaming run captured PayPal before starting trait extraction. The expanded extraction
contract caused repeated model attempts until the stream watchdog ended the run. Refund was only a
best-effort call in the same request, so timeout/process failure could leave the payment captured.

## Why safeguards missed it

- Payment tests covered JSON refund-after-capture, not the paid SSE failure path.
- The architecture treated provider capture plus later refund as a transaction despite having no
  durable ledger.
- Optional advanced extraction fields were made mandatory in the prompt.
- Unsafe, oversized request logging hid the useful terminal diagnostic.

## Corrective actions

- Prove PayPal approval before AI; capture only when the final result exists.
- Fail closed on disconnect and compensate if result emission cannot proceed.
- Restore the bounded baseline extraction contract.
- Redact proxy credentials and client-address metadata.
- Require paid SSE no-capture tests for every pre-result failure.

## Follow-up

A durable reconciliation ledger/webhook/outbox and client acknowledgement would close the remaining
post-capture crash window, but require separate owner approval because they change the current
no-persistence privacy and payment architecture.
