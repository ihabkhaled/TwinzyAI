# 03 — Product Requirements

## Acceptance criteria

1. A PayPal order is validated as approved, correctly priced, correctly denominated, and bound to
   the request before analysis begins.
2. PayPal capture occurs only after trait extraction, candidate generation, judging, and final
   result assembly succeed.
3. Abort/disconnect is checked immediately before capture.
4. If capture succeeds and result emission throws, refund is attempted before the error escapes.
5. A paid-stream extraction failure results in zero PayPal capture calls.
6. Free mode and Paymob behavior do not regress.
7. HTTP logs contain no request headers, Vercel OIDC/proxy tokens, cookies, authorization values,
   forwarded IPs, raw images, or payer data.
8. User-facing failures remain stable, localized error contracts with no provider detail.

## Residual boundary

No HTTP/SSE system can prove that a human rendered the last byte. Without a durable payment ledger
and client acknowledgement, a process crash in the narrow interval after provider capture and
before the result frame reaches the client cannot be made atomic. This hotfix minimizes that window
and retains idempotent compensation; durable reconciliation is a separately owner-gated program.
