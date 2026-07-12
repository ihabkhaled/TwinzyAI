---
id: runbook-streaming-disconnects
title: Runbook — SSE Streaming Disconnects
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Diagnosing broken or stuck analyze streams — proxy buffering, heartbeats, watchdog timeouts, CORS, and the designed disconnect semantics.
keywords: [runbook, sse, streaming, disconnect, heartbeat, watchdog, proxy, buffering, cancel, cors]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/game/api/game-stream.presenter.ts,
    apps/api/src/core/http/sse-writer.ts,
    apps/web/src/packages/axios/stream-request.ts,
    apps/web/src/modules/game/gateway/game-stream.gateway.ts,
  ]
relatedTests:
  [
    apps/api/src/tests/game-analyze-stream.integration.test.ts,
    apps/api/src/tests/game-stream-isolation.integration.test.ts,
    apps/web/e2e/game-streaming.spec.ts,
  ]
relatedDocs: [docs/features/multi-tab-stream-isolation/README.md, runbooks/latency.md]
readWhen: Players report progress freezing, streams ending without a result, or cancellation misbehaving.
---

# Runbook — SSE Streaming Disconnects

## Design facts (what "healthy" looks like)

- `POST /api/v1/game/analyze/stream` is Server-Sent Events; every frame is stamped `{tabId, requestId, streamId, status}` and the client filters frames by its own ids (`apps/api/src/modules/game/api/game-stream.presenter.ts`, `apps/web/src/modules/game/gateway/game-stream.gateway.ts`).
- **Keep-alive comment every 10 s** (`STREAM_HEARTBEAT_INTERVAL_MS`, `apps/api/src/modules/game/model/game.constants.ts`); the client deliberately has **no timeout** — heartbeats keep the socket alive (`apps/web/src/packages/axios/stream-request.ts`).
- Server watchdog aborts a run at `ANALYSIS_TIMEOUT_MS` (default 120 s) → terminal frame as `AI_TIMEOUT` with "The analysis took too long and was stopped."; orphaned registry entries are swept at `STREAM_TTL_MS` (`apps/api/src/core/streaming/stream-registry.service.ts`).
- **Client disconnect is silent by design** (no terminal frame possible); user cancel produces `ANALYSIS_CANCELLED`/Cancelled (`resolveStreamTermination`, `apps/api/src/modules/game/lib/game-stream.ts`). Cancel requires streamId+tabId+requestId all to match — one tab can never abort another's run.
- Over-capacity and duplicate requests are rejected **in-band** (`SERVER_BUSY` / "This analysis is already running."), not with HTTP errors.
- The SSE response sets `Cache-Control: no-cache, no-transform` and `X-Accel-Buffering: no` to defeat proxy buffering, and carries its own CORS headers because hijacking bypasses the framework hook (`apps/api/src/core/http/sse-writer.ts`, `lib/stream-cors.ts`).

## Prerequisites

Symptom classified: stuck-then-nothing (buffering/timeout) vs immediate rejection (busy/duplicate) vs mid-run cut (disconnect/abort). Single-player reports → likely their network; broad reports → infrastructure or release.

## Steps

1. **Progress frozen for everyone, then bulk timeouts** → almost always a **buffering proxy** in front of the API. Verify any nginx/CDN in the path honors `X-Accel-Buffering: no` and doesn't buffer `text/event-stream`. Test bypassing the proxy against port 4000 directly.
2. **Streams die at a fixed duration** → compare against `ANALYSIS_TIMEOUT_MS` (watchdog, expected for stuck provider calls — then it's [provider-outage.md](./provider-outage.md)) and any proxy idle-timeout shorter than the 10 s heartbeat interval should never trigger; a proxy request-duration cap under ~2 min will kill healthy long runs.
3. **Immediate in-band rejections** → measure `SERVER_BUSY` and duplicate counts; go to [provider-rate-limiting.md](./provider-rate-limiting.md) §SERVER_BUSY.
4. **Streams work same-origin but fail from the web app** → `CORS_ALLOWED_ORIGINS` must include the web origin; the stream echoes only allowlisted origins (`buildStreamCorsHeaders`).
5. **Cancellation "not working"** → confirm all three ids match in the cancel request; the registry logs sweep/reap counts. Multi-tab semantics are specified in `docs/features/multi-tab-stream-isolation/`.
6. Cross-check with the non-streaming path: if `POST /api/v1/game/analyze` works while the stream route fails, the problem is transport (proxy/CORS), not the pipeline.

## Verify

- Integration suites green: `npm run test:integration` (covers stream protocol + isolation).
- One real streamed run end-to-end: Accepted → stages → Result, heartbeats visible as comment frames.
- No rising reap-count warnings from the registry sweep in logs.

## Rollback

Infra/proxy config changes roll back in the proxy layer; env values (`ANALYSIS_TIMEOUT_MS`, `STREAM_TTL_MS` — keep TTL ≥ timeout, schema-enforced) roll back per [rollback.md](./rollback.md). Note: upload buffers are wiped on every stream rejection path — disconnects never leak images (`game-stream.presenter.ts`).
