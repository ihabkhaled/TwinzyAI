# 07 — Technical Roadmap

## Hotfix slice

- `PaypalAdapter.verifyApprovedOrder`
- `PaymentGateService.prepareForAnalysis` and `finalizeForDelivery`
- deferred finalization in streaming and non-streaming game use cases
- whole-header redaction in Pino HTTP options
- focused unit/integration tests

## Follow-up requiring owner approval

- Durable refund/reconciliation ledger with encrypted minimal identifiers, webhook verification,
  retry policy, alerts, retention/deletion policy, and operator tooling.
- Client result acknowledgement protocol if the business requires proof beyond successful server
  emission.
- Longer Vercel log retention or external privacy-safe telemetry for production root-cause history.
