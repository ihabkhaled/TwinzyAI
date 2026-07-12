---
id: operations-performance-budgets
title: Performance Budgets
type: operations
authority: canonical
status: current
owner: repository owner
summary: The payload-size, response-size, rate-limit, and admission budgets that bound every request, all env-driven from env.schema.ts or single-sourced constants.
keywords: [performance, budgets, payload, rate-limit, throttle, body-limit, upload, caps]
contextTier: 2
relatedCode: [apps/api/src/config/env.schema.ts, apps/api/src/bootstrap/bootstrap.constants.ts, apps/api/src/modules/game/model/game.constants.ts, apps/api/src/core/rate-limit/rate-limit.module.ts]
relatedTests: [apps/api/src/tests/game-cancel-body-limit.integration.test.ts, apps/api/src/tests/share-results.integration.test.ts]
relatedDocs: [operations/timeout-budget.md, operations/retry-budget.md, operations/scaling-model.md]
readWhen: You are tuning limits, debugging a 413/429, or adding an endpoint that needs its own budget.
---

# Performance Budgets

Configuration truth is [apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts)
(env-driven values) and the cited constants files (fixed values). Timeouts live in
[timeout-budget.md](timeout-budget.md); concurrency caps in [scaling-model.md](scaling-model.md).

## Payload budgets

| Budget | Value (default) | Source |
| --- | --- | --- |
| Business image-size limit | `MAX_IMAGE_SIZE_BYTES` (5 MiB default; user copy says "under 5 MB") | [apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts), [apps/api/src/core/errors/error.constants.ts](../apps/api/src/core/errors/error.constants.ts) |
| Transport upload hard cap | shared `UPLOAD_TRANSPORT_HARD_CAP_BYTES` (10 MB backstop), max 1 file | [apps/api/src/modules/game/model/game.constants.ts](../apps/api/src/modules/game/model/game.constants.ts) |
| Global Fastify body limit | upload hard cap + 1 MiB multipart framing margin | [apps/api/src/bootstrap/bootstrap.constants.ts](../apps/api/src/bootstrap/bootstrap.constants.ts) |
| `POST /game/cancel` JSON body | 8 192 B (native per-route cap) | [apps/api/src/bootstrap/bootstrap.constants.ts](../apps/api/src/bootstrap/bootstrap.constants.ts) |
| `POST /game/translate-result` JSON body | 262 144 B | same |
| `POST /payments/orders` JSON body | 4 096 B | same |
| AI response size | `AI_MAX_RESPONSE_BYTES` (500 000) | [apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts) |
| Share payload | `SHARE_RESULT_MAX_PAYLOAD_BYTES`; active shares capped by `SHARE_RESULT_MAX_ACTIVE_ITEMS` | same |

## Rate budgets

| Scope | Budget | Source |
| --- | --- | --- |
| Global (all routes) | `RATE_LIMIT_MAX` 30 per `RATE_LIMIT_TTL_MS` 60 000 ms | [apps/api/src/core/rate-limit/rate-limit.module.ts](../apps/api/src/core/rate-limit/rate-limit.module.ts), [apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts) |
| `POST /game/analyze`, `/game/analyze/stream` | 10/min | `ANALYZE_THROTTLE`, [apps/api/src/modules/game/model/game.constants.ts](../apps/api/src/modules/game/model/game.constants.ts) |
| `POST /game/translate-result` | 10/min | `TRANSLATE_THROTTLE`, same |
| `POST /game/cancel` | 60/min | `CANCEL_THROTTLE`, same |
| `POST /payments/orders` | 10/min | `CREATE_ORDER_THROTTLE`, [apps/api/src/modules/payments/model/payment.constants.ts](../apps/api/src/modules/payments/model/payment.constants.ts) |
| Share create / read / delete | 20 / 120 / 20 per min | [apps/api/src/modules/share-results/model/share-result.constants.ts](../apps/api/src/modules/share-results/model/share-result.constants.ts) |

## Runtime resource budgets

Compose limits: api 1 GiB / 1.0 CPU, web 512 MiB / 0.5 CPU
([docker-compose.yml](../docker-compose.yml)). Uploads are bounded in memory and never touch
disk ([apps/api/src/core/http/multipart-upload.parser.ts](../apps/api/src/core/http/multipart-upload.parser.ts)).

## Frontend performance

Owned by the frontend standards: all five routes static-prerendered, object-URL revocation, no
unbounded `Promise.all` ([docs/performance-review-report.md](../docs/performance-review-report.md));
rendering budgets in [rules/07-performance-scalability.md](../rules/07-performance-scalability.md).
No numeric page-weight or Core-Web-Vitals budget is recorded — Deferred — needs an owner target.
