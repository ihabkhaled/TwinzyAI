# 00 - Request Intake and Classification

## Request Record

| Field | Value |
| --- | --- |
| Request ID | `TWZ-2026-STREAM-ISO` |
| Feature slug | `multi-tab-stream-isolation` |
| Request title | Multi-tab / multi-window stream isolation, backend per-request isolation, hard overload protection, and cancellation for the streaming analyze pipeline |
| Request type | enhancement (reliability / concurrency hardening) |
| Request source | client request (streaming SSE route "is an API which can timeout / must not cross tabs") |
| Technical owner | AI delivery agent (backend + shared + frontend) |
| Requested date | 2026-07-07 |
| Delivery track | standard (sliced: shared → backend primitives → backend wiring → frontend) |

## Affected Domains

- [x] Frontend (`apps/web`) — per-tab identity, per-run AbortController, frame filtering, overload copy
- [x] Backend (`apps/api`) — concurrency limiter, stream registry, cancel route, signal thread-through
- [x] Shared contracts (`packages/shared`) — correlation envelope, StreamStatus, cancel schema, headers
- [x] DevOps / platform — new env vars (`.env`/`.env.example`), vitest coverage include
- [x] Security / privacy — image-wipe on abort, cancel id-matching, no leaked detail
- [x] AI / model behavior — cancellation reaches the in-flight Gemini call (no prompt/behavior change)
- [x] Documentation — this feature folder

## Criticality and Delivery Track

| Item | Answer |
| --- | --- |
| Severity | High (resource exhaustion + cross-tab bleed are real production risks under load) |
| Player-facing | yes (busy message, cancel-on-navigate, correct per-tab progress) |
| Consent or upload-chain impact | no (upload validation + consent unchanged; image-wipe invariant preserved) |
| AI behavior or prompt impact | no (candidate/judge prompts unchanged; only an AbortSignal is threaded) |
| Privacy or regulated data impact | reviewed — no new persistence; correlation ids are random UUIDs, not identity |
| Production incident related | preventative |

## Initial Scope Summary

### Problem statement

The long-running streaming analyze endpoint (`POST /api/v1/game/analyze/stream`) had no
per-request isolation, no concurrency ceiling, and no cancellation. Concurrent tabs/windows
could interleave, a burst of connections could exhaust memory or the model quota, and a
navigated-away run kept burning a Gemini call to completion server-side. This request adds
per-request isolation (correlation ids + a server-minted stream id), hard concurrency/overload
protection, and cancellation — **without breaking** the existing no-timeout streaming, CORS,
camera, model-fallback, or rate-limit behavior.

### Product invariant check (must all hold)

- Game stays free — no payment logic touched. ✔
- No face recognition / identity / biometrics — cancellation threads an `AbortSignal` only; no
  new data flows. ✔
- No image persistence — the buffer is still wiped in `finally`, now proven to hold on the
  abort/cancel path too. ✔
- Only trait extraction sees the image — unchanged; the signal carries no image. ✔
- `GEMINI_MODEL` from `.env` — unchanged; new caps are also env-driven, never hardcoded. ✔
- Every AI response Zod-validated + safety-filtered — unchanged. ✔
- No `enum` keyword, no `eslint-disable`, no `any` — respected across the change. ✔

### Intake assumptions

- The correlation envelope on SSE frames is **optional** in the shared schema (server always
  populates it) so the concurrently-developed web workstream and existing tests keep compiling —
  see [06-technical-refinement.md](06-technical-refinement.md). Accepted as the isolation
  guarantee is enforced server-side regardless.
- Overload rejection is delivered **in-band** as an `error` SSE frame (status `rejected`,
  errorCode `SERVER_BUSY`) rather than a pre-hijack HTTP 503, to preserve the single streaming
  response contract.

## Exit Checklist

- [x] Request ID assigned · type classified · domains identified · track chosen
- [x] Product invariants reviewed at intake
- [x] Critical-risk areas (privacy, image handling, overload) flagged
