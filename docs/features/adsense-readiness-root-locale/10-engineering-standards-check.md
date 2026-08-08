# 10 — Engineering Standards Check

- Existing owners and native Next.js metadata/routing APIs are reused.
- No inline reusable declarations, lint suppressions, direct environment reads, or dependency changes.
- User-facing loading text comes from i18n; Spinner provides the accessible status.
- Public AdSense ID is not a secret; CSP nonce and route eligibility remain enforced.
