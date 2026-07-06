# 09 — Impact Analysis

- **Affected systems:** apps/api entirely (internal layout + platform); root tooling (shared); knowledge layers; local gates.
- **Not affected:** apps/web sources (parallel workstream); packages/shared public surface (additive only); public HTTP contract.
- **Backward compatibility:** response envelopes byte-compatible + additive messageKey; same routes/status codes/validation order.
- **Monitoring impact:** logging becomes structured pino JSON with request-id correlation; log format changes (documented in runbooks + observability memory).
- **Support/training:** new skills/ + context/ docs are the training path.
- **Compliance/privacy:** unchanged guarantees (no image persistence; redaction preserved and strengthened via pino redact paths).
