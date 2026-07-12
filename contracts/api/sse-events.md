---
id: contracts-api-sse-events
title: SSE Game Stream Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: The Server-Sent-Events contract of POST /api/v1/game/analyze/stream — event names, pipeline stages, correlation envelope, keep-alive, terminal frames, and cancellation semantics.
keywords: [sse, stream, events, stages, heartbeat, cancellation, correlation, tabid, requestid, streamid, terminal]
contextTier: 2
relatedCode: [packages/shared/src/schemas/game-stream.schema.ts, packages/shared/src/enums/game-stream.enum.ts, apps/api/src/modules/game/api/game-stream.presenter.ts, apps/api/src/modules/game/lib/game-stream.ts, apps/api/src/core/http/sse-writer.ts]
relatedTests: [apps/api/src/tests/game-analyze-stream.integration.test.ts, apps/api/src/tests/game-stream-isolation.integration.test.ts, packages/shared/tests/stream-contract.test.ts]
relatedDocs: [contracts/api/analyze.md, contracts/api/error-envelope.md]
readWhen: You are producing, consuming, or testing the analyze SSE stream or its cancellation flow.
---

# SSE Game Stream Contract

Schema owner: `packages/shared/src/schemas/game-stream.schema.ts` — a
`z.discriminatedUnion('event', …)`. Enums: `GameStreamEvent` and `GameStreamStage` in
`packages/shared/src/enums/game-stream.enum.ts`. The web client validates every frame against
the same schema (`apps/web/src/modules/game/gateway/game-stream.gateway.ts`).

## Wire format

`event: <name>\ndata: <json>\n\n`, written by `apps/api/src/core/http/sse-writer.ts` with
headers `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, and
`X-Accel-Buffering: no` (anti-proxy-buffering), plus CORS headers echoed only for allowlisted
origins (`apps/api/src/modules/game/lib/stream-cors.ts`).

## Correlation envelope (every frame)

Every `data` payload carries `tabId`, `requestId`, `streamId` (RFC UUIDs;
`CorrelationIdSchema = z.uuid()`) and `status` (`StreamStatus`:
queued/active/completed/failed/cancelled/rejected — terminal values are
completed/failed/cancelled/rejected, `packages/shared/src/enums/stream-status.enum.ts`).
Stamping happens in `apps/api/src/modules/game/lib/game-stream.ts` (`stampStreamFrame`); the
schema marks the fields optional only for backward compatibility — the server always stamps
them. Clients send `tabId`/`requestId` as request headers `x-twinzy-tab-id` /
`x-twinzy-request-id` (`packages/shared/src/constants/stream.constants.ts`); the server mints
`streamId`.

## Events, in emission order

| Event | Payload (beyond the envelope) | Meaning |
| --- | --- | --- |
| `accepted` | — | Slot granted; the run started. |
| `stage` | `stage`: one of `validating`, `scanning`, `extracting-traits`, `generating-candidates`, `judging`, `aggregating` | Pipeline milestone (`GameStreamStage`). |
| `traits` | `traitCount`, `compactTraitSummary` | Extraction done — text only, never the image. |
| `candidates` | `resultCount`, candidate names (≤ 25) | Safe candidate names only. |
| `result` | full `FinalGameResult` (see [analyze.md](analyze.md)) | Terminal success (`status: completed`). |
| `error` | `errorCode`, `message`, optional failing `stage` | Terminal failure; reuses the error-envelope codes (`apps/api/src/modules/game/lib/game-stream.ts` `toStreamErrorMessage`). |
| `heartbeat` | — | Defined in the schema but **currently unexercised on the wire**: the presenter emits SSE *comment* lines (`: keep-alive`) every 10 s instead (`STREAM_HEARTBEAT_INTERVAL_MS` in `apps/api/src/modules/game/model/game.constants.ts`, `apps/api/src/modules/game/api/game-stream.presenter.ts`). Clients must tolerate comment lines. |

## Admission and in-band rejection

Before `accepted`, the presenter admits through the concurrency limiter (global 50 / per-IP 3
/ per-tab 1 caps, bounded FIFO queue of 100 — env-driven,
`apps/api/src/core/streaming/concurrency-limiter.service.ts`). Over capacity or a duplicate
in-flight `requestId` is rejected **in-band** with an `error` frame (`SERVER_BUSY`, or the
duplicate message from `apps/api/src/modules/game/model/game.messages.ts`) carrying
`status: rejected`, then the stream closes.

## Terminal semantics

Classified by `resolveStreamTermination` (`apps/api/src/modules/game/lib/game-stream.ts`) from
the abort reason (`apps/api/src/core/streaming/stream-abort.constants.ts`):

| Cause | Frame | Status |
| --- | --- | --- |
| Pipeline success | `result` | `completed` |
| Explicit cancel | `error` `ANALYSIS_CANCELLED` | `cancelled` |
| Watchdog timeout (`ANALYSIS_TIMEOUT_MS`, default 120 s) | `error` `AI_TIMEOUT` | `failed` |
| Client disconnect | no terminal frame (socket gone) | — |
| Any other error | `error` with the mapped code | `failed` |

Orphaned streams are reaped by a TTL sweep (`STREAM_TTL_MS`, ≥ `ANALYSIS_TIMEOUT_MS`,
`apps/api/src/core/streaming/stream-registry.service.ts`).

## Cancellation

`POST /api/v1/game/cancel` with strict `{ tabId, requestId, streamId }` — all three must match
the registered stream; mismatch is a silent no-op so one tab can never cancel another's run.
Request/response schemas live beside the stream schema
(`CancelAnalysisRequestSchema`/`CancelAnalysisResponseSchema`). Aborts propagate through the
use-case into in-flight provider calls — see
[../ai/README.md](../ai/README.md).

Note: the current web client cancels by aborting the open stream request (the server
classifies it as a disconnect — `apps/web/src/modules/game/hooks/useAnalyzeRunControl.hook.ts`);
the cancel endpoint remains the contract for cross-request cancellation and is exercised by
`apps/api/src/tests/game-stream-isolation.integration.test.ts`.
