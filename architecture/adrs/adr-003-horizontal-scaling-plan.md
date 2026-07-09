# ADR-003 — Horizontal Scaling Plan for Twinzy API

## Status

Accepted — implementation deferred until profiling proves it is needed.

## Context

TwinzyAI's analyze pipeline is long-running and SSE-based. A single Node.js/Fastify process currently handles:

- Upload validation and ClamAV scanning.
- Trait extraction via Google Gemini (one image-bearing call).
- Candidate generation via Gemini (text-only).
- Judge/finalization via Gemini (text-only).
- Result translation via Gemini (text-only).
- Streaming progress frames and cancellation.

Concurrency is bounded by `MAX_GLOBAL_ACTIVE_ANALYSES`, `MAX_ACTIVE_ANALYSES_PER_IP`, and `MAX_ACTIVE_ANALYSES_PER_TAB`. The current design is single-process. As usage grows, the API may need horizontal scaling.

## Decision

Do **not** implement Node.js cluster mode, PM2 cluster mode, or worker pools now. Instead:

1. Keep the single-process API.
2. Add per-stage timing metrics and request-id correlation first.
3. Document the scaling options and their implications.
4. Revisit the decision only after profiling shows a concrete bottleneck (CPU, memory, or SSE connection count).

## Scaling options evaluated

### Option A: Node.js cluster / PM2 cluster
- **Pros:** Uses all CPU cores; minimal code changes for CPU-bound work.
- **Cons:** SSE/cancellation registry is in-memory per process. A cancel request could land on a different worker than the stream it targets, so a shared cancellation store (Redis) or sticky sessions would be required. Also, ClamAV daemon is a single external process; scaling the API increases contention on it.
- **Verdict:** Not implemented now. Add when CPU becomes the bottleneck.

### Option B: Docker horizontal scaling behind a load balancer
- **Pros:** Stateless containers, easy to scale with demand.
- **Cons:** Same SSE/cancellation problem as cluster mode. Requires sticky sessions or a shared SSE registry. Also, `MAX_ACTIVE_ANALYSES_PER_IP` must be tracked across instances (shared rate-limit store).
- **Verdict:** Preferred long-term shape, but needs shared-state infrastructure first.

### Option C: worker_threads / Piscina for image decode/metadata
- **Pros:** Offloads CPU-heavy work from the event loop without full cluster complexity.
- **Cons:** Image processing is already bounded by memory and buffer size; no evidence that decode is blocking the event loop. Adds worker pool management.
- **Verdict:** Implement only if profiling proves image decode is a bottleneck.

### Option D: Queue-based async processing
- **Pros:** Decouples upload from result, can scale workers independently.
- **Cons:** Requires async UX (user returns later for results), which contradicts the current real-time streaming experience.
- **Verdict:** Rejected. The product is real-time and streaming-first.

## Consequences

- The codebase stays simpler and easier to reason about in the short term.
- Observability must be strong enough to identify the real bottleneck before scaling.
- When scaling is needed, the first work will be: (1) a shared SSE/cancellation store (Redis), (2) a shared per-IP rate-limit store, and (3) horizontal pod/container scaling.
- ClamAV should not become a bottleneck before it is addressed; if it does, scale ClamAV independently or use a managed scanning service.

## Implementation notes

- Add per-stage timing logs: `requestId`, `stage`, `durationMs`, `resultCount`.
- Add metrics: active stream count, model call duration by stage, cancellation rate, timeout rate, score distribution, result-count distribution.
- Keep the current in-memory `StreamRegistry` and `ConcurrencyLimiter` as the single-process implementation. If shared state is added later, introduce an adapter/port pattern so the in-memory and Redis implementations can coexist behind the same interface.
