# 05 — Delivery Plan

1. Preserve Vercel incident evidence and identify the money-movement boundary.
2. Add failing tests for paid-stream extraction failure, approved-order verification, sequencing,
   compensation, and log redaction.
3. Implement the smallest owner-aligned change in payment model, PayPal adapter, gate service, and
   game use cases.
4. Improve trait-extraction failure observability without recording sensitive input/output.
5. Run focused tests, lint/typecheck, unit/coverage, build, and security scan.
6. Review the final diff and document any residual gate or release blocker.

Rollback: revert this feature slice. Emergency operational containment remains blanking PayPal
credentials, which restores the permanently required free default.
