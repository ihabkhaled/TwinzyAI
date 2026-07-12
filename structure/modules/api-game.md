---
id: structure-module-api-game
title: Module — api game (Analyze Feature and SSE Transport)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The analyze-game feature module — the four /api/v1/game endpoints, the two analyze use-cases, the text-only style-match orchestration, and the SSE presenter with admission, correlation, heartbeats, and cancel.
keywords: [game, analyze, sse, stream, cancel, translate, use-case, presenter, orchestration, throttle]
contextTier: 2
relatedCode: [apps/api/src/modules/game]
relatedTests: [apps/api/src/modules/game/tests, apps/api/src/tests/game-analyze.integration.test.ts, apps/api/src/tests/game-analyze-stream.integration.test.ts]
relatedDocs: [structure/flows/analyze-flow.md, structure/flows/payment-flow.md, docs/backend-architecture.md]
readWhen: You are changing analyze endpoints, streaming behavior, cancellation, or pipeline orchestration.
---

# Module — `apps/api/src/modules/game`

**Responsibility.** The analyze-game feature and the only multi-endpoint transport in the API.
Imports `ai`, `file-security`, `payments`, `result-aggregation`, `privacy`, and
`core/streaming` (`game.module.ts`). Public surface (`index.ts`): `GameModule` only.

## Endpoints (`api/game.controller.ts`, prefix `/api/v1/game`)

| Route | Throttle | Delegation |
| --- | --- | --- |
| `POST /analyze` | 10/min | `AnalyzeGameUseCase.analyze` → `FinalGameResult` |
| `POST /analyze/stream` (SSE) | 10/min | `GameStreamPresenter.stream` |
| `POST /cancel` | 60/min | `CancelAnalysisUseCase.cancel` (zod pipe `CancelAnalysisRequestSchema`) |
| `POST /translate-result` | 10/min | `TranslateResultUseCase.translate` (zod pipe) |

Route segments and throttles are single-sourced in `model/game.constants.ts` (also used by
the bootstrap per-route body caps — `apps/api/src/bootstrap/bootstrap.constants.ts`).

## Key files

| File | Role |
| --- | --- |
| `application/analyze-game.use-case.ts` | Consent + file-security → payment capture (before the AI call) → image-only extraction → buffer wipe in `finally` → text-only match; `refundOnFailure` after capture |
| `application/analyze-game-stream.use-case.ts` | Streaming counterpart; SSE milestones; abort-aware between steps; threads `StreamAnalysisContext` incl. the mutable `PaymentHolder` |
| `application/style-match.service.ts` | Text-only phase: generation → fallback → judge → aggregation with progress callbacks |
| `application/cancel-analysis.use-case.ts` | Delegates to core `StreamRegistry.cancel` (streamId+tabId+requestId must all match) |
| `api/game-stream.presenter.ts` | SSE lifecycle: reply hijack, allowlisted CORS, `ConcurrencyLimiter` admission, duplicate-requestId rejection, frame stamping, 10 s heartbeats, watchdog at `ANALYSIS_TIMEOUT_MS`, buffer wipe on every rejection path |
| `lib/game-stream.ts` | Frame stamping, busy/duplicate messages, `resolveStreamTermination` (disconnect silent / cancel / timeout / mapped error) |
| `lib/consent.ts`, `lib/request-language.ts`, `lib/request-result-count.ts` | Input normalization helpers |
| `api/dto/analyze-request.dto.ts` | `AnalyzeRequestBodySchema` (zod) for the multipart text fields |

## SSE protocol

Events `Accepted / Stage / Traits / Candidates / Result / Error` with stages
`Validating → Scanning → ExtractingTraits → GeneratingCandidates → Judging → Aggregating`
and statuses `Active/Completed/Cancelled/Failed/Rejected` — all shared enums/schemas
(`packages/shared/src/schemas/game-stream.schema.ts`). Full walkthrough:
[flows/analyze-flow.md](../flows/analyze-flow.md).

## Invariants

- Payment capture happens after cheap local checks and **before** the AI call; every failure
  after capture must refund ([flows/payment-flow.md](../flows/payment-flow.md)).
- The image never travels past `TraitExtractionService`; the buffer is wiped in `finally` on
  every path.
- Every SSE frame is stamped with `{tabId, requestId, streamId, status}`; one tab can never
  cancel another's run.
- Consent must be the literal `"true"`/`true` (`lib/consent.ts`).

## Tests

Unit: `apps/api/src/modules/game/tests/` (+ colocated `lib/request-result-count.test.ts`).
Integration: `apps/api/src/tests/game-analyze`, `game-analyze-stream`,
`game-stream-isolation`, `game-cancel-body-limit`, `game-translate-result`,
`game-analyze-paywall` `.integration.test.ts`. Scoped run: `npm run test:ai`.

## Common changes and risks

- **New SSE event/stage**: shared enum + schema first, then presenter + web gateway together.
- **Throttle/body-cap changes**: `model/game.constants.ts` and
  `bootstrap.constants.ts` move together.
- **Risk**: streaming state (`ConcurrencyLimiter`, `StreamRegistry`) is single-process
  in-memory — see the scaling note in [runtime-topology.md](../runtime-topology.md).
