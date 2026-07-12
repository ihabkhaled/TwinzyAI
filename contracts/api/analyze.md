---
id: contracts-api-analyze
title: Game Analyze Endpoints Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: Request/response contract for POST /api/v1/game/analyze, /analyze/stream, /cancel, and /translate-result — multipart fields, consent, resultCount bounds, optional paypalOrderId, response shape, errors, and rate limits.
keywords: [analyze, multipart, consent, resultcount, paypalorderid, translate, cancel, game, upload, contract]
contextTier: 2
relatedCode: [apps/api/src/modules/game/api/game.controller.ts, apps/api/src/modules/game/api/dto/analyze-request.dto.ts, apps/api/src/core/http/multipart-upload.parser.ts, packages/shared/src/schemas/game-result.schema.ts]
relatedTests: [apps/api/src/tests/game-analyze.integration.test.ts, apps/api/src/tests/game-translate-result.integration.test.ts, apps/api/src/tests/game-cancel-body-limit.integration.test.ts]
relatedDocs: [contracts/api/sse-events.md, contracts/api/error-envelope.md, contracts/api/payments.md, docs/file-upload-security.md]
readWhen: You are building or changing a client or handler for any /api/v1/game endpoint.
---

# Game Analyze Endpoints Contract

Controller: `apps/api/src/modules/game/api/game.controller.ts` (`@Controller('game')` →
`/api/v1/game/…`; route segments single-sourced in
`apps/api/src/modules/game/model/game.constants.ts`).

## POST /api/v1/game/analyze — multipart

Throttle 10/min (`ANALYZE_THROTTLE`). Body is `multipart/form-data` parsed **in wire order**
by `apps/api/src/core/http/multipart-upload.parser.ts`:

| Field | Required | Rules (owner file) |
| --- | --- | --- |
| `consent` | yes | Must be literal string `"true"` (boolean `true` for JSON clients) and **must arrive before the file part** (`packages/shared/src/constants/upload.constants.ts`, `apps/api/src/modules/game/lib/consent.ts`). Anything else → 400 `CONSENT_REQUIRED`. |
| `image` | yes | Exactly one file on field `image` (`UPLOAD_FIELD_NAME`); JPEG/PNG/WebP; ≤ `MAX_IMAGE_SIZE_BYTES` (default 5 MiB) business limit, 10 MB transport hard cap. Full validation chain: `apps/api/src/modules/file-security/application/file-security.service.ts` and [docs/file-upload-security.md](../../docs/file-upload-security.md). |
| `languageCode` | no | Free-form ≤ 35 chars; **normalized** to a supported code (default `en`) — never rejected (`apps/api/src/modules/game/api/dto/analyze-request.dto.ts`, `packages/shared/src/constants/language.constants.ts`). |
| `resultCount` | no | Coerced integer, min 1, max 10, default 10 (`MIN/MAX/DEFAULT_RESULT_COUNT` in `packages/shared/src/constants/trait.constants.ts`). |
| `paypalOrderId` | only when the paywall is on | Field name `PAYMENT_ORDER_FIELD_NAME` (`packages/shared/src/schemas/payment.schema.ts`). Ignored when the paywall is off; when on: absent → 402 `PAYMENT_REQUIRED`, malformed (fails `/^[A-Z0-9-]{8,64}$/`) → 402 `PAYMENT_ORDER_INVALID` (`apps/api/src/modules/payments/lib/payment-order.util.ts`). Capture semantics: [payments.md](payments.md). |

The web client builds exactly this body in
`apps/web/src/modules/game/gateway/game-form-data.builder.ts`.

**Response 200** — `FinalGameResultSchema` (`packages/shared/src/schemas/game-result.schema.ts`),
a strict object: `promptVersion` (literal `written-traits-v5`), `languageCode`, `resultCount`
(1–10), `traitCount` (0–221), `traits`, `compactTraitSummary`, `results` (≤ resultCount, each
with name/rank/score/verdict/safetyCheck), `fallbackMessage` (required when `results` is
empty), `disclaimer` (server-owned, see `RESULT_DISCLAIMER_BY_LANGUAGE` in
`packages/shared/src/constants/app.constants.ts`).

**Errors** (all use the [error envelope](error-envelope.md)): 400
`CONSENT_REQUIRED`/`FILE_MISSING`/`VALIDATION_FAILED`, 402 payment codes, 413
`FILE_TOO_LARGE`, 415 `FILE_TYPE_NOT_ALLOWED`, 422 `FILE_INVALID`/`VIRUS_SCAN_FAILED`, 429
`RATE_LIMITED`/`SERVER_BUSY`, 502/503/504-class AI and scanner failures — codes catalogued in
`packages/shared/src/constants/error-code.constants.ts`, statuses fixed by the error classes
in `apps/api/src/core/errors/`.

## POST /api/v1/game/analyze/stream — multipart → SSE

Same throttle, same multipart body and validation as `/analyze`, plus optional correlation
headers `x-twinzy-tab-id` / `x-twinzy-request-id` (`STREAM_ID_HEADERS` in
`packages/shared/src/constants/stream.constants.ts`, read by
`apps/api/src/core/http/stream-meta.decorator.ts`). The response is a Server-Sent-Events
stream — full event contract in [sse-events.md](sse-events.md).

## POST /api/v1/game/cancel — JSON

Throttle 60/min; native body cap 8,192 B (`apps/api/src/bootstrap/bootstrap.constants.ts`).
Request: `CancelAnalysisRequestSchema` (`packages/shared/src/schemas/game-stream.schema.ts`) —
strict `{ tabId, requestId, streamId }`, all three RFC UUIDs, all required. Cancellation only
happens when **all three ids match** an active stream; a mismatch is a silent no-op
(`apps/api/src/core/streaming/stream-registry.service.ts`). Response:
`CancelAnalysisResponseSchema` `{ cancelled: boolean }`.

## POST /api/v1/game/translate-result — JSON

Throttle 10/min; native body cap 262,144 B. Request: `TranslateResultRequestSchema`
(`packages/shared/src/schemas/translate-result.schema.ts`) — strict
`{ targetLanguageCode, result }` where `targetLanguageCode` is **strictly** `en`|`ar`
(unsupported codes are rejected, unlike the analyze normalization) and `result` is a full
`FinalGameResult`. No file/image slot exists on this path by construction. Response 200:
`TranslateResultResponseSchema` = `FinalGameResultSchema`. Canonical fields (names, ranks,
scores, verdicts, disclaimer) are restored server-side after translation —
`apps/api/src/modules/ai/application/result-translation.service.ts`.

## Rate-limit summary

Analyze and analyze/stream 10/min, translate-result 10/min, cancel 60/min
(`apps/api/src/modules/game/model/game.constants.ts`), on top of the global 30/min default
(`apps/api/src/config/env.schema.ts`). Concurrency admission for streams (global 50 / per-IP 3
/ per-tab 1, queue 100) is a separate in-band mechanism — see
[sse-events.md](sse-events.md).
