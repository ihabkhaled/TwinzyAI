# 08 - Architecture Review

## Fit with the layered engineering OS

The change respects the one-way dependency rule (Controller → Application → Domain → Persistence →
Integration; cross-cutting `core`). New pieces and their layer:

| New / changed | Layer | Notes |
| --- | --- | --- |
| `core/streaming/` (`ConcurrencyLimiter`, `StreamRegistry`, `StreamingModule`, abort constants, types) | `core` (cross-cutting) | New in-memory infra; imported by `GameModule`. Injects only `AppConfigService`/`AppLogger`. |
| `core/http/stream-meta.decorator.ts` + `.types.ts` | `core/http` | Structural request-like type; no vendor request type leaks into the handler. |
| `game/api/game-stream.presenter.ts` | transport/api | Owns the SSE lifecycle + isolation orchestration; controller stays one delegation per route. |
| `game/application/cancel-analysis.use-case.ts` | application | One delegation to `StreamRegistry.cancel`. |
| `game/lib/game-stream.ts`, `stream-correlation.ts` | lib (pure) | Status/stamp/termination helpers + id validation; unit-tested, coverage-gated. |
| `ai/adapters/gemini.adapter.ts` | integration | External `AbortSignal` linked onto the internal idle-timeout controller; still the only file importing the SDK. |
| `packages/shared` schema/enum/constants | shared contract | Single source of truth for both sides. |

Dependency direction check: `modules/game → core/streaming` (downward, allowed). `core/streaming`
depends only on `config` + `core/logger` (no upward/module imports). `packages/shared` depends on
nothing app-side. No new circular dependencies. Mechanically confirmed by `npm run lint`
(architecture plugin) + `npm run typecheck`.

## Contract / data-flow changes

- **SSE frame contract**: additive optional envelope — a drift-safe, backward-compatible change
  validated on both sides by `GameStreamMessageSchema`.
- **New route**: `POST /api/v1/game/cancel` (JSON, Zod-validated, strict body).
- **New request headers**: `X-Twinzy-Tab-Id`, `X-Twinzy-Request-Id` on the stream route.
- **Data flow**: an `AbortSignal` now flows presenter → use-case → services → adapter. No image or
  user data flows into the registry/limiter (ids + an AbortController only).

## ADR-worthy decisions

Recorded in [06-technical-refinement.md](06-technical-refinement.md): optional-envelope,
in-band overload rejection, fetch-abort-as-cancel, in-memory single-instance limiter/registry.
None change the domain model or introduce a new external dependency, so a standalone ADR file is
not warranted; the technical-refinement table is the decision record.

## Architecture risks

- **Single-instance state** — the limiter/registry govern one API process. Acceptable for the
  current single-instance deployment; horizontal scaling needs a shared store (documented in the
  service doc-comments and [09-impact-analysis.md](09-impact-analysis.md)).
- **Timer discipline** — heartbeat, watchdog, idle, and queue timers must each be cleared on
  every exit path. Enforced by `finally` blocks + `unref()`; covered by the presenter and
  registry/limiter tests.
