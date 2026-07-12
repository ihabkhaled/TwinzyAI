---
id: operations-logging-catalog
title: Logging Catalog
type: operations
authority: canonical
status: current
owner: repository owner
summary: What each layer logs, at what level, and the mechanical redaction that keeps images, submitted values, and secrets out of the logs.
keywords: [logging, pino, redaction, levels, catalog, privacy, warn, error, log-level]
contextTier: 2
relatedCode: [apps/api/src/core/logger/logger.constants.ts, apps/api/src/core/logger/http-logging.options.ts, apps/api/src/modules/privacy/lib/log-redaction.helpers.ts, apps/api/src/core/errors/app-exception.filter.ts]
relatedTests: [apps/api/src/core/logger/tests/http-logging.options.test.ts, apps/api/src/modules/privacy/tests/log-redaction.helpers.test.ts]
relatedDocs: [operations/observability-map.md, rules/22-observability-logging.md, docs/privacy-and-data-retention.md]
readWhen: You are adding a log line, debugging from logs, or verifying nothing sensitive can be logged.
---

# Logging Catalog

Logger: `nestjs-pino`/`pino`, wrapped by the transient `AppLogger` port — app code never
imports the vendor ([apps/api/src/core/logger/app-logger.service.ts](../apps/api/src/core/logger/app-logger.service.ts)).
Level comes from `LOG_LEVEL` (fatal…trace, default `info`,
[apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts)).

## What is logged, per source

| Source | What / level |
| --- | --- |
| HTTP layer (pino-http, all routes) | Every request auto-logged; 2xx/3xx `info`, 4xx `warn`, 5xx `error` ([apps/api/src/core/logger/http-logging.options.ts](../apps/api/src/core/logger/http-logging.options.ts)) |
| Global exception filter | 5xx as `error` WITH the original exception attached; 4xx as `warn` without it ([apps/api/src/core/errors/app-exception.filter.ts](../apps/api/src/core/errors/app-exception.filter.ts)) |
| Request validation | Flattened zod issues — field paths + constraints only, **never submitted values** ([apps/api/src/core/validation/validation-exception.factory.ts](../apps/api/src/core/validation/validation-exception.factory.ts)) |
| Bootstrap | `API listening on port <port> (<env>)`; validation-wired message ([apps/api/src/bootstrap/bootstrap.ts](../apps/api/src/bootstrap/bootstrap.ts), [apps/api/src/bootstrap/configure-validation.ts](../apps/api/src/bootstrap/configure-validation.ts)); fatal bootstrap errors go to stderr with exit code 1 ([apps/api/src/main.ts](../apps/api/src/main.ts)) |
| Stream registry | `warn`: `Reaped N stale stream(s) past TTL` ([apps/api/src/core/streaming/stream-registry.service.ts](../apps/api/src/core/streaming/stream-registry.service.ts)) |
| AI adapters | Provider error text passed through `redactForLog` before logging ([apps/api/src/modules/ai/adapters/gemini.adapter.ts](../apps/api/src/modules/ai/adapters/gemini.adapter.ts)); debug prompt logging gated off in production (`isProduction`) |
| AI shadow runs | Failures swallowed to a single `warn` line — never affect the user path ([apps/api/src/modules/ai/adapters/ai-shadow.service.ts](../apps/api/src/modules/ai/adapters/ai-shadow.service.ts)) |
| Parallel candidate recall (flag on) | `info`: `Parallel recall: N lane(s), M succeeded, K merged candidate(s)`; `warn` on lane clamp (`Generation lanes clamped …`) or a failed lane (`Generation lane <id> failed: <ErrorType>` — error TYPE only, never provider detail or image data) ([apps/api/src/modules/ai/application/candidate-recall.service.ts](../apps/api/src/modules/ai/application/candidate-recall.service.ts)) |
| Payments | PII-free PayPal diagnostics only (name/issue/debug_id/description); refund failure logs `REFUND FAILED … reconcile in the PayPal dashboard` ([apps/api/src/modules/payments/adapters/paypal.adapter.ts](../apps/api/src/modules/payments/adapters/paypal.adapter.ts)) |

## Redaction (mechanical, two layers)

1. **pino redact paths** ([apps/api/src/core/logger/logger.constants.ts](../apps/api/src/core/logger/logger.constants.ts)),
   censor `[Redacted]`: `req.headers.authorization`, `req.headers.cookie`, `req.url` (may carry
   bearer-like temporary share ids), `req.body.password|token|secret`,
   `res.headers["set-cookie"]`.
2. **`redactForLog`** ([apps/api/src/modules/privacy/lib/log-redaction.helpers.ts](../apps/api/src/modules/privacy/lib/log-redaction.helpers.ts)):
   caps any logged value at 500 chars, replaces base64 runs of 64+ chars (the signature of
   leaked image bytes) and `key|token|authorization` secrets with `[REDACTED]`.

## Never logged, by construction

Image bytes (buffers are zero-filled, never serialized —
[apps/api/src/modules/file-security/application/temporary-file-cleanup.service.ts](../apps/api/src/modules/file-security/application/temporary-file-cleanup.service.ts)),
submitted request values, stack traces or raw provider errors in responses
([apps/api/src/core/errors/error-body.mapper.ts](../apps/api/src/core/errors/error-body.mapper.ts)),
and secrets (CLAUDE.md Universal Code Rules #5). The full privacy posture is owned by
[docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md).
