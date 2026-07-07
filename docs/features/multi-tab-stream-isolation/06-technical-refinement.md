# 06 - Technical Refinement

## Chosen approach

Layered, additive, gate-green per slice:

1. **Shared contract** (`packages/shared`): a `StreamStatus` as-const enum; an **optional**
   correlation envelope (`tabId`/`requestId`/`streamId`/`status`) on every SSE frame variant;
   `STREAM_ID_HEADERS`; `CancelAnalysisRequest/Response` schemas; `GAME_CANCEL_PATH`.
2. **Backend primitives** (`apps/api/src/core/streaming`): `ConcurrencyLimiter` (global/per-IP/
   per-tab caps + bounded FIFO queue + watchdog) and `StreamRegistry` (streamId → AbortController,
   strict-id cancel, TTL sweep). Six env-driven caps + `SERVER_BUSY`/`ANALYSIS_CANCELLED` codes.
3. **Backend wiring**: thread an `AbortSignal` through the port → Gemini adapter → trait/candidate/
   judge services → style-match → stream use-case. The presenter resolves ids, admits via the
   limiter, mints the streamId, registers it, stamps every frame, wires disconnect + watchdog
   aborts, classifies terminal status, and releases the slot + entry in `finally`. New
   `POST /game/cancel` + `@StreamMeta` param decorator.
4. **Frontend**: per-tab id (sessionStorage) + per-run requestId, sent as headers; a per-run
   `AbortController` owned by `useAnalyzeRunControl` (abort on new-run/retry/unmount); frame
   filtering; localized `SERVER_BUSY` copy.

## Key decisions & trade-offs

| Decision | Why | Rejected alternative |
| --- | --- | --- |
| Correlation envelope **optional** in the schema | Backward compatible; keeps the concurrently-developed web workstream + existing SSE tests compiling; the server always populates it so filtering still works | Required fields — would force churn across in-flight web tests/e2e and risk a merge collision, for a guarantee already enforced server-side |
| Overload rejection **in-band** (`error` frame, `status: rejected`) | Preserves the single streaming (HTTP 200 + SSE) response contract the client already handles | A pre-hijack HTTP 503 — fragile with `@Res()` passthrough and a second response shape for the client |
| Cancellation primarily via **fetch-abort → server disconnect** | Simplest; aborting the socket already triggers `reply.raw.on('close')` → pipeline abort → slot free. The explicit `/cancel` endpoint remains for completeness | Always POST `/cancel` from the client — redundant with disconnect, needs the streamId round-tripped first |
| Abort **reason markers** (`cancel`/`disconnect`/`timeout`) on `AbortController.abort(reason)` | Lets the presenter classify the terminal SSE `status` without threading extra state across the cancel endpoint (a different request) | A shared mutable "why" flag — cannot be set by the cancel request, which runs in another handler |
| Caps are **env-driven config** (not shared constants) | Backend-only concern; matches the repo's validated-config rule (no magic numbers) | Hardcoded shared constants — violates the config-layer rule and leaks backend tuning into the shared package |
| `ConcurrencyLimiter`/`StreamRegistry` **in-memory, per instance** | The API is single-instance; simplest correct design; no new infra | A shared store (Redis) — unjustified infra for the current single-instance deployment; documented as a scaling limitation |
| `@StreamMeta` custom param decorator | Bundles origin/ip/correlation-ids into one object so the handler stays one delegation within the `max-params: 5` budget; mirrors the existing `@UploadedImage`/`@MultipartBody` pattern | 7 positional `@Headers`/`@Ip`/`@Res` params — exceeds the param budget and leaks the vendor request type |

## Open technical questions

- None blocking. Horizontal scaling would require moving the limiter/registry to a shared store —
  tracked as a known limitation in the service doc-comments, not needed for the current deploy.
