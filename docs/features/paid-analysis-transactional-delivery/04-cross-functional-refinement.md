# 04 — Cross-Functional Refinement

- Product: “paid” means the final result has been assembled, not merely that AI work started.
- Backend: split payment proof/preparation from money movement; keep provider access in adapters.
- Frontend: no contract change is required.
- Security/privacy: validate order ownership and price before AI; redact all inbound HTTP headers.
- Operations: structured payment-stage logs may contain gateway, operation, status, and request
  correlation only—never tokens, payer data, order IDs, capture IDs, or IP addresses.
- Support: historical refunds remain a provider-dashboard operation because no local ledger exists.
- Accessibility/i18n: no visual or user-facing copy change.
