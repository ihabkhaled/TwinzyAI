# 08 — Architecture Review

- Layering: provider HTTP remains in `payments/adapters`; orchestration remains in application
  services/use cases; reusable payment types remain in `payments/model`.
- Dependency direction: unchanged.
- Privacy: no image/payment persistence and no new identifier logging.
- Availability: deferring capture removes AI failures from the charged interval.
- Consistency: PayPal is preflight-verified then captured; Paymob remains compensation-based because
  payment precedes the analyze call.
- Concurrency/replay: PayPal capture is single-use and idempotent. Concurrent duplicate requests are
  still rejected by the stream registry within the deployed process; a distributed lock is outside
  the no-persistence architecture.
- Decision: approved for test-first implementation, subject to phase 13 gates and owner release
  approval.
