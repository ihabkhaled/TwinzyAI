# 03 - Product Requirements

## Epic

Make the streaming analyze pipeline safe under real concurrency: each browser tab/window/run is
isolated, the server cannot be exhausted by a burst, and an abandoned run is cancelled instead
of running to completion.

## User stories & acceptance criteria

### US-1 — Concurrent tabs never cross-contaminate

- As a player with the game open in two tabs, each tab shows only its own run's progress.
- **AC-1.1** Every SSE frame carries a correlation envelope (`tabId`, `requestId`, `streamId`,
  `status`); the client drops any frame whose `tabId`/`requestId` does not match the current run.
- **AC-1.2** Each tab has a stable per-tab id (survives reload, not shared across tabs).

### US-2 — The server survives a burst

- As an operator, a flood of streaming requests degrades gracefully instead of exhausting memory
  or the model quota.
- **AC-2.1** Concurrency is capped globally, per client IP, and per tab (env-driven).
- **AC-2.2** Over-capacity runs queue up to a bounded size, then are rejected with a friendly
  in-band `SERVER_BUSY` (`status: rejected`) — not a crash, not a hang.
- **AC-2.3** A queued run that waits past the watchdog window is rejected, not left forever.
- **AC-2.4** A stuck run cannot hold a slot beyond the watchdog ceiling.

### US-3 — Abandoned / cancelled runs stop server-side

- As a player who navigates away or retries, the in-flight Gemini call stops and its slot frees.
- **AC-3.1** Aborting the client fetch (navigate away, retry, new run) closes the socket; the
  server detects the disconnect, aborts the pipeline, wipes the image, and frees the slot.
- **AC-3.2** `POST /api/v1/game/cancel` cancels a run only when `streamId` + `tabId` + `requestId`
  all match — never another tab's or user's run; a mismatch is a safe no-op.
- **AC-3.3** A cancelled run emits a terminal frame with `status: cancelled` (errorCode
  `ANALYSIS_CANCELLED`); a watchdog/TTL timeout emits `status: failed` (errorCode `AI_TIMEOUT`).

### US-4 — Nothing existing regresses

- **AC-4.1** The no-timeout streaming, hijacked-SSE CORS echo, camera capture, model-fallback
  chain, and per-route rate limits all keep working.
- **AC-4.2** A bare frame without the correlation envelope is still valid (backward compatible).

## Out of scope / non-goals

- Cross-tab shared-worker coordination (each tab is independently isolated).
- A distributed/shared concurrency store (the limiter + registry are per API instance; documented
  as a horizontal-scaling limitation).
- A user-facing "cancel" button (cancellation is driven by navigation/retry via fetch-abort; the
  cancel endpoint exists for completeness and non-browser clients).

## UX / states

- Overload → localized "The vibe engine is busy right now. Please try again in a moment." (en/ar).
- Cancelled/superseded runs must **not** surface an error to the user.

## Analytics / localization / permissions

- No new analytics. All new user-facing copy is localized (en + ar). No auth/permissions (the
  game has none); cancellation authority is the id-match, not identity.

## Product definition of done

All ACs above verified; existing streaming/camera/CORS/rate-limit tests green; new tests cover
the caps, queue/timeout, cancel id-matching, correlation stamping, and frame filtering.
