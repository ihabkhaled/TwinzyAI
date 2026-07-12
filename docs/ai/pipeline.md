---
id: ai-pipeline-steps
title: AI Pipeline — Step by Step
type: doc
authority: canonical
status: current
owner: repository owner
summary: What enters and leaves each AI pipeline step, which service owns it, and exactly where the image dies.
keywords: [ai, pipeline, extraction, candidates, judge, translation, aggregation, sse, streaming]
contextTier: 2
relatedCode: [apps/api/src/modules/game/application/analyze-game-stream.use-case.ts, apps/api/src/modules/ai/application/trait-extraction.service.ts, apps/api/src/modules/game/application/style-match.service.ts, apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-pipeline.test.ts, apps/api/src/tests/game-analyze-stream.integration.test.ts]
relatedDocs: [docs/ai/system-overview.md, docs/ai/written-traits-only-boundary.md, docs/ai-safety.md]
readWhen: You are changing any pipeline step, its inputs/outputs, or the game use-cases that orchestrate them.
---

# AI Pipeline — Step by Step

Transport: `apps/api/src/modules/game/api/game.controller.ts` — `POST analyze`,
`analyze/stream`, `cancel`, `translate-result` (segments and per-route throttles in
`apps/api/src/modules/game/model/game.constants.ts`).

## 0. Admission and pre-AI gates (streaming path)

`apps/api/src/modules/game/api/game-stream.presenter.ts` hijacks the reply, opens SSE
(`apps/api/src/core/http/sse-writer.ts`), admits through the concurrency limiter, rejects
duplicate requests, registers the stream for cancellation, and starts the heartbeat + watchdog.
Then
[`analyze-game-stream.use-case.ts`](../../apps/api/src/modules/game/application/analyze-game-stream.use-case.ts)
runs, in order: consent check (`game/lib/consent.ts`) → file-security chain (owned by
[docs/file-upload-security.md](../file-upload-security.md)) → PayPal capture when the env-gated
paywall is configured (`analyze-game-stream.use-case.ts:110`; off by default — see
[docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../features/paypal-donations-and-paid-results/22-go-no-go.md))
→ trait extraction. Non-streaming twin: `application/analyze-game.use-case.ts`.

## 1. Trait extraction — the ONLY image step

- Service: [`trait-extraction.service.ts`](../../apps/api/src/modules/ai/application/trait-extraction.service.ts)
  — the only caller of `generateFromImageStream` on the provider port.
- **In**: validated upload buffer encoded by `lib/image-input.util.ts::buildAiImageInput`
  (base64 + mimeType) + Prompt 1 with `[LANGUAGE_CODE]` replaced.
- **Out**: `TraitExtractionResponseSchema`-valid JSON — 16-category/221-field written traits plus
  matching aggregates (compact summary, high-signal tokens, weighted evidence, archetype hints,
  image-quality caps, search hints), all-false `safetyCheck`.
- Post-checks: language echo guard (`lib/response-language.guard.ts`) and a safety sweep over
  every free-text leaf (`lib/trait-text.util.ts` + `AiSafetyService`).
- **The image dies here**: both use-cases wipe the upload buffer in `finally`
  (`analyze-game-stream.use-case.ts:118-120`, `analyze-game.use-case.ts:72-74`) — zero-fill via
  `apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts`. Nothing downstream can
  see it; see [written-traits-only-boundary.md](written-traits-only-boundary.md).

## 2. Candidate generation — text-only

- Service: `apps/api/src/modules/ai/application/candidate-generation.service.ts`
  (`generateFromTextStream`).
- **In**: `buildMatchingEvidence(extraction)` (`lib/matching-evidence.util.ts`, a Pick of traits +
  matching aggregates) + `[REGION_HINT]` (`model/region-hint.constants.ts`: en = global sweep,
  ar = Arabic industries first-class) + `[RESULT_COUNT]`.
- **Out**: `CandidateGenerationResponseSchema`-valid pool of 1..25 public-figure candidates,
  ranked by `styleVibeFitScore` desc; unsafe candidates dropped item-wise
  (`AiSafetyService.filterCandidates`). Empty pool ⇒ fallback result.

## 3. Judge — text-only

- Service: `apps/api/src/modules/ai/application/candidate-judge.service.ts`.
- **In**: evidence + candidate pool + language + count (`model/judge-input.types.ts`).
- **Out**: `CandidateJudgeResponseSchema`-valid, conservatively re-scored results (≤10) with
  `finalStyleVibeFitScore`, verdict bands (strong/medium/weak at 80/70), `removedCandidates`
  with reasons; unsafe judged results dropped (`filterJudgedResults`).

## 4. Aggregation — no AI call

`apps/api/src/modules/result-aggregation/`: displayable = `shouldDisplay && verdict !== weak &&
score >= MIN_DISPLAY_SCORE (70) && safetyCheck.meetsMinimumEvidence`, re-ranked and sliced to the
requested `resultCount` 1–10
([`result-aggregation.helpers.ts`](../../apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts),
`packages/shared/src/constants/trait.constants.ts`). The mapper injects the server-owned localized
disclaimer / no-match fallback and never forwards `removedCandidates`
(`lib/result-aggregation.mapper.ts`).

## 5. Translation — text-only, separate endpoint

`game/application/translate-result.use-case.ts` →
`ai/application/result-translation.service.ts`. Input is an existing `FinalGameResult` (the
request schema `packages/shared/src/schemas/translate-result.schema.ts` is a strictObject with no
image field). The service restores every canonical field from the original, rejects shape drift
(`lib/json-shape.util.ts::hasSameJsonShape`) and name changes, replaces disclaimer/fallback with
server constants, and safety-filters before and after.

## Streaming, cancellation, timeouts

- SSE contract: discriminated union `accepted/stage/traits/candidates/result/error/heartbeat`
  with a `tabId/requestId/streamId/status` envelope on every frame
  (`packages/shared/src/schemas/game-stream.schema.ts`). The wire keep-alive is an SSE comment
  every 10 s (`game-stream.presenter.ts:111-113`), not a `heartbeat` event.
- The `traits` frame carries only `traitCount` + `compactTraitSummary` (text); the `candidates`
  frame only safe names — the image never appears on the stream.
- Cancellation: `POST cancel` aborts only on exact `streamId+tabId+requestId` match
  (`apps/api/src/core/streaming/stream-registry.service.ts:79-89`); aborts propagate into
  in-flight provider calls via `apps/api/src/modules/ai/lib/abort-bridge.util.ts`.
- Timeout/watchdog policy: [retry-timeout-policy.md](retry-timeout-policy.md).
