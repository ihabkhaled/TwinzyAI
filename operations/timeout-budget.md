---
id: operations-timeout-budget
title: Timeout Budget
type: operations
authority: canonical
status: current
owner: repository owner
summary: Every timeout in the request path — AI calls, the analysis watchdog, stream TTL, PayPal, ClamAV — with its env var or constant and default.
keywords: [timeout, budget, watchdog, ai, paypal, clamav, stream, ttl, deadline]
contextTier: 2
relatedCode: [apps/api/src/config/env.schema.ts, apps/api/src/modules/payments/model/payment.constants.ts, apps/api/src/modules/file-security/model/file-security.constants.ts]
relatedTests: [apps/api/src/core/streaming/tests/stream-registry.service.test.ts, apps/api/src/tests/game-stream-isolation.integration.test.ts]
relatedDocs: [operations/retry-budget.md, operations/performance-budgets.md, docs/env-vars.md]
readWhen: You are debugging a hang or a timeout error, or changing any deadline in the pipeline.
---

# Timeout Budget

Env-driven values (with validated bounds) come from
[apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts); fixed values from the
cited constants files. Remote dependencies must always have deadlines (CLAUDE.md Error Handling
Rules); this table is the complete recorded set.

## AI provider calls

| Timeout | Env var / constant | Default | Meaning |
| --- | --- | --- | --- |
| Per-call total deadline | `GEMINI_TIMEOUT_MS` (1 s–120 s) | 30 000 ms | Whole-call abort for a provider call |
| Streaming idle deadline | `GEMINI_STREAM_IDLE_TIMEOUT_MS` (1 s–300 s) | 60 000 ms | Inter-chunk idle abort, not a total deadline |
| Shadow-run deadline | `AI_SHADOW_TIMEOUT_MS` (1 s–120 s) | 30 000 ms | `AbortSignal.timeout` around the metrics-only shadow call ([apps/api/src/modules/ai/adapters/ai-shadow.service.ts](../apps/api/src/modules/ai/adapters/ai-shadow.service.ts)) |
| Lane permit wait (parallel recall, flag-gated) | `AI_PARALLEL_QUEUE_TIMEOUT_MS` (1 s–120 s) | 30 000 ms | Max wait for a generation-concurrency permit before a parallel lane is dropped ([apps/api/src/modules/ai/application/ai-step-concurrency.gate.ts](../apps/api/src/modules/ai/application/ai-step-concurrency.gate.ts); [docs/ai/concurrency-policy.md](../docs/ai/concurrency-policy.md)) |

## Analysis lifecycle

| Timeout | Env var | Default | Meaning |
| --- | --- | --- | --- |
| End-to-end watchdog | `ANALYSIS_TIMEOUT_MS` (1 s–600 s) | 120 000 ms | Aborts a whole analysis run; also the queue-wait watchdog in the admission limiter ([apps/api/src/core/streaming/concurrency-limiter.service.ts](../apps/api/src/core/streaming/concurrency-limiter.service.ts)) |
| Stream registration TTL | `STREAM_TTL_MS` (1 s–1 800 s) | 180 000 ms | Background sweep aborts + reaps orphaned streams; schema enforces `STREAM_TTL_MS >= ANALYSIS_TIMEOUT_MS` ([apps/api/src/core/streaming/stream-registry.service.ts](../apps/api/src/core/streaming/stream-registry.service.ts)) |
| SSE keep-alive cadence | `STREAM_HEARTBEAT_INTERVAL_MS` (constant) | 10 000 ms | Comment frame so proxies do not drop idle streams ([apps/api/src/modules/game/model/game.constants.ts](../apps/api/src/modules/game/model/game.constants.ts)) |

Terminal guarantee: every stream ends in a terminal status (completed / cancelled / failed /
rejected) — timeout maps to `AiTimeout`/Failed
([apps/api/src/modules/game/lib/game-stream.ts](../apps/api/src/modules/game/lib/game-stream.ts)).
Clients never wait forever.

## External integrations

| Timeout | Constant | Value | Source |
| --- | --- | --- | --- |
| PayPal REST call (OAuth, create order, capture, refund) | `PAYPAL_REQUEST_TIMEOUT_MS` | 15 000 ms | [apps/api/src/modules/payments/model/payment.constants.ts](../apps/api/src/modules/payments/model/payment.constants.ts) |
| PayPal OAuth token early-expiry margin | `PAYPAL_TOKEN_EXPIRY_MARGIN_SECONDS` | 60 s | same |
| ClamAV INSTREAM scan | `CLAMAV_TIMEOUT_MS` | 10 000 ms | [apps/api/src/modules/file-security/model/file-security.constants.ts](../apps/api/src/modules/file-security/model/file-security.constants.ts) |

ClamAV timeouts fail **closed** when `ENABLE_CLAMAV=true` (503 `VirusScanUnavailableError`,
[apps/api/src/modules/file-security/application/virus-scan.service.ts](../apps/api/src/modules/file-security/application/virus-scan.service.ts)).

## Container level

Docker healthcheck: 30 s interval / 5 s timeout / 15 s start period / 3 retries on both images
([Dockerfile.api](../Dockerfile.api), [Dockerfile.web](../Dockerfile.web)).
