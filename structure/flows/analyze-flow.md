---
id: structure-flow-analyze
title: Analyze Flow — Upload to Result, End to End
type: structure
authority: canonical
status: current
owner: repository owner
summary: The full analyze pipeline — upload, consent, file security, optional payment gate, image-only trait extraction, buffer wipe, text-only candidates/judge/aggregation, and SSE or JSON response.
keywords: [analyze, flow, upload, consent, extraction, candidates, judge, aggregation, sse, wipe, pipeline]
contextTier: 2
relatedCode: [apps/api/src/modules/game/application/analyze-game.use-case.ts, apps/api/src/modules/game/application/analyze-game-stream.use-case.ts, apps/api/src/modules/game/api/game-stream.presenter.ts, apps/web/src/modules/game/hooks/useGame.hook.ts]
relatedTests: [apps/api/src/tests/game-analyze.integration.test.ts, apps/api/src/tests/game-analyze-stream.integration.test.ts, apps/api/src/tests/game-stream-isolation.integration.test.ts]
relatedDocs: [structure/flows/payment-flow.md, docs/ai-safety.md, docs/privacy-and-data-retention.md]
readWhen: You are changing anything on the analyze path — upload, consent, pipeline steps, streaming, or errors.
---

# Analyze Flow — Upload to Result, End to End

Endpoints: `POST /api/v1/game/analyze` (JSON) and `POST /api/v1/game/analyze/stream` (SSE),
both throttled 10/min (`apps/api/src/modules/game/model/game.constants.ts`). Paths are shared
constants (`packages/shared/src/constants/app.constants.ts`).

## Client side (web)

1. **Setup** — `GameContainer` (`apps/web/src/modules/game/containers/game.container.tsx`)
   drives `useGame` (`hooks/useGame.hook.ts`), which composes upload/camera/consent/result-count
   sub-hooks. The image is an in-memory `File` + object URL, never written to browser storage
   (`hooks/useImageUpload.hook.ts`).
2. **Payment gate (client)** — `usePaymentFlow` runs the free path when `isPayPalConfigured()`
   is false; otherwise it enters the payment phase first — see [payment-flow.md](payment-flow.md).
3. **Request** — `game.service.ts` validates the file client-side, then
   `game-stream.gateway.ts` posts multipart (consent, file, `languageCode`, `resultCount`,
   optional `paypalOrderId` — built by `gateway/game-form-data.builder.ts`) through the app's
   only streaming fetch (`apps/web/src/packages/axios/stream-request.ts`). Correlation:
   per-tab sessionStorage uuid `twinzy.tabId` + per-run `requestId` sent via the shared
   `STREAM_ID_HEADERS` (`packages/shared/src/constants/stream.constants.ts`).

## Server side (api)

4. **Transport** — multipart is parsed in wire order by
   `apps/api/src/core/http/multipart-upload.parser.ts`: the consent field must arrive **before**
   the file is buffered; exactly one file; buffers zeroed on any parse failure; never disk.
5. **Stream admission (SSE variant)** — `game-stream.presenter.ts` hijacks the reply, builds
   allowlisted CORS headers, admits through `ConcurrencyLimiter` (busy → in-band `ServerBusy`),
   rejects duplicate in-flight requestIds, registers with `StreamRegistry`, stamps every frame
   with `{tabId, requestId, streamId, status}`, heartbeats every 10 s, watchdog-aborts at
   `ANALYSIS_TIMEOUT_MS`, and wipes the upload buffer on every rejection path.
6. **File security** — `AnalyzeGameUseCase` / `AnalyzeGameStreamUseCase`
   (`apps/api/src/modules/game/application/`) call `FileSecurityService.assertSafeImage`
   (`apps/api/src/modules/file-security/application/file-security.service.ts`): consent →
   presence → size → MIME/extension allowlist + consistency → magic bytes → structural decode
   (dimension bounds) → optional ClamAV scan **failing closed** when enabled.
7. **Payment gate (server)** — after the cheap local checks and **before** the AI call,
   `PaymentGateService.captureForAnalysis` captures the PayPal order (no-op when the paywall is
   off); any later failure triggers `refundOnFailure` — details in [payment-flow.md](payment-flow.md).
8. **Trait extraction (the only image step)** — `TraitExtractionService.extractTraits`
   (`apps/api/src/modules/ai/application/trait-extraction.service.ts`), documented as "The ONLY
   pipeline step allowed to send the image to the AI provider". Enforced fail-closed by
   `AI_IMAGE_STEPS = [Extraction]` (`apps/api/src/config/gemini-step.constants.ts`) and the
   router's vision-capable dispatch (`apps/api/src/modules/ai/adapters/ai-router.service.ts`).
   The response is zod-validated (`TraitExtractionResponseSchema`), language-checked, and every
   free-text leaf safety-scanned (`AiSafetyService`).
9. **Buffer wipe** — the upload buffer is zero-filled in `finally` via
   `TemporaryFileCleanupService` / `wipeUploadedImageBuffer`
   (`apps/api/src/modules/file-security/application/temporary-file-cleanup.service.ts`,
   `lib/upload-buffer-cleanup.util.ts`) in **both** analyze use-cases — success, failure, or abort.
10. **Text-only matching** — `StyleMatchService.matchFromTraits`
    (`apps/api/src/modules/game/application/style-match.service.ts`):
    `CandidateGenerationService` (region hint by language; unsafe candidates dropped) →
    empty-pool fallback → `CandidateJudgeService` (strict judge, `z.literal(false)` safety
    flags) — all with no image slot by construction.
11. **Aggregation** — `ResultAggregationService.aggregate`
    (`apps/api/src/modules/result-aggregation/application/result-aggregation.service.ts`):
    displayability filter (non-weak verdict, `MIN_DISPLAY_SCORE`, safety evidence), re-rank,
    cap to `resultCount`, server-owned localized disclaimer; judge's `removedCandidates`
    dropped from the public payload.
12. **Response** — JSON `FinalGameResult` (strict `FinalGameResultSchema`,
    `packages/shared/src/schemas/game-result.schema.ts`) or SSE events
    `Accepted → Stage(×6) → Traits → Candidates → Result` / terminal `Error`
    (`packages/shared/src/schemas/game-stream.schema.ts`). Errors surface as the single
    sanitized envelope via `toErrorBody` (`apps/api/src/core/errors/error-body.mapper.ts`).

## Cancel and recovery

- `POST /api/v1/game/cancel` — `CancelAnalysisUseCase` delegates to `StreamRegistry.cancel`;
  abort requires streamId + tabId + requestId all matching.
- Web: `useAnalyzeRunControl` aborts per run (closes the socket → backend treats as
  disconnect); `useRunRecovery` distinguishes cancel from error and allows same-photo retry
  for `TRANSIENT_ERROR_CODES` (`apps/web/src/modules/game/model/game.constants.ts`).
- Locale switch on an existing result calls the text-only
  `POST /api/v1/game/translate-result` (no file slot by construction —
  `packages/shared/src/schemas/translate-result.schema.ts`).

Proof the image never reaches text-only steps: `FakeAiAdapter` records per-step calls and
`apps/api/src/tests/game-analyze.integration.test.ts` asserts exactly one image call on step
`extraction` and text-only `generation`/`judge` calls.
