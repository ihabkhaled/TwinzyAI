# 23 - Documentation & Knowledge Changelog

## Documents created

| Document | Why |
| --- | --- |
| `docs/features/multi-tab-stream-isolation/00–16, 23` | This feature's SDLC phase trail |

## Documents / code-docs updated in the same delivery stream

| Location | Change |
| --- | --- |
| `.env.example` + local `.env` | New `# --- Streaming concurrency / overload protection ---` section (6 vars, documented) |
| `apps/api/src/config/env.schema.ts` | Inline doc-comments for each new cap + the watchdog/TTL relationship |
| `apps/api/src/core/streaming/*.ts` | Doc-comments state the in-memory / single-instance limitation and the abort-reason contract |
| `packages/shared/src/enums/stream-status.enum.ts`, `schemas/game-stream.schema.ts`, `constants/stream.constants.ts` | Doc-comments describe the terminal statuses, the optional envelope + backward-compat rationale, and the header contract |
| `apps/web/src/modules/game/hooks/useAnalyzeRunControl.hook.ts` + helpers | Doc-comments describe fetch-abort → server-disconnect cancellation |

## Contract reference (for API/support docs)

- **New route** `POST /api/v1/game/cancel` — body `{ tabId, requestId, streamId }` (all uuid,
  strict); response `{ cancelled: boolean }`. A mismatch is `cancelled: false` (safe no-op).
- **New request headers** on `POST /api/v1/game/analyze/stream`: `X-Twinzy-Tab-Id`,
  `X-Twinzy-Request-Id` (uuid; server mints fallbacks if absent/malformed).
- **SSE frames** now optionally carry `tabId`, `requestId`, `streamId`, and `status`
  (`queued|active|completed|failed|cancelled|rejected`). Terminal: `completed|failed|cancelled|rejected`.
- **New error codes**: `SERVER_BUSY` (overload/duplicate rejection), `ANALYSIS_CANCELLED` (cancel).

## Remaining documentation gaps

- None blocking. If the deployment moves to multiple API instances, add a runbook note on the
  shared-store requirement for the limiter/registry (out of scope for this single-instance change).
