---
id: contracts-api-error-envelope
title: API Error Envelope Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: The single sanitized error response shape of every API failure — statusCode, errorCode, message, messageKey — and where the frozen ErrorCode catalog lives.
keywords: [error, envelope, errorcode, messagekey, exception, filter, 4xx, 5xx, catalog, contract]
contextTier: 2
relatedCode: [packages/shared/src/types/api-error.schema.ts, packages/shared/src/constants/error-code.constants.ts, apps/api/src/core/errors/error-body.mapper.ts, apps/api/src/core/errors/app-exception.filter.ts]
relatedTests: [apps/api/src/core/errors/tests/error-body.mapper.test.ts, apps/api/src/core/errors/tests/app-exception.filter.test.ts]
relatedDocs: [contracts/api/README.md, contracts/api/sse-events.md]
readWhen: You are handling, producing, or mapping API errors on either side of the wire.
---

# API Error Envelope Contract

Every error response from the API — every route, every status — is the single envelope:

```json
{ "statusCode": 402, "errorCode": "PAYMENT_REQUIRED", "message": "…", "messageKey": "errors.…" }
```

## Shape owner

`ApiErrorResponseSchema` in `packages/shared/src/types/api-error.schema.ts` (a zod strict
object, despite living under `types/`): `statusCode` int 100–599, `errorCode` ≤ 80 chars,
`message` ≤ 500 chars, `messageKey` must start with `errors.` and be ≤ 120 chars. Bounds come
from `packages/shared/src/constants/response-bounds.constants.ts`. `messageKey` is an additive
extension of the legacy `{statusCode, errorCode, message}` triple
(`apps/api/src/core/errors/error.types.ts`).

## ErrorCode catalog

`packages/shared/src/constants/error-code.constants.ts` — the frozen as-const `ErrorCode`
object with 24 machine-readable codes (internal, validation, rate-limit, consent, 6 upload
codes, 5 AI codes, server-busy, analysis-cancelled, 3 payment codes, 4 share codes).
**Add-only: codes are never renamed or removed.** The backend re-exports it via
`apps/api/src/core/errors/error-code.constants.ts`; the frontend maps codes to friendly i18n
copy in `apps/web/src/modules/game/helpers/game-error.helper.ts` +
`apps/web/src/modules/game/model/game.constants.ts` (`GAME_ERROR_KEY_BY_CODE`, plus
`TRANSIENT_ERROR_CODES` for retryable failures and `PAYMENT_ERROR_CODES`).

## How the envelope is produced

- `toErrorBody` (`apps/api/src/core/errors/error-body.mapper.ts`) is the only producer:
  typed `AppError`s map to their own body; framework `HttpException`s map 429 →
  `RATE_LIMITED`, 413 → `FILE_TOO_LARGE`, multipart markers → `MULTIPLE_FILES_NOT_ALLOWED`,
  else `VALIDATION_FAILED`; transport-level `FST_REQ_FILE_TOO_LARGE` rejections →
  `FILE_TOO_LARGE`; anything unknown becomes an opaque 500. Stacks, provider errors, and
  file contents are never leaked.
- The global `AppExceptionFilter` (`apps/api/src/core/errors/app-exception.filter.ts`,
  installed via `APP_FILTER` in `apps/api/src/core/core.module.ts`) applies it to every
  throw; 5xx are logged as errors with the original exception, 4xx as warnings.
- `messageKey` is always derived from the `errorCode` via `ERROR_MESSAGE_KEY_BY_CODE`
  (`apps/api/src/core/errors/error.constants.ts`), and the error factories in
  `apps/api/src/core/errors/error-factory.ts` are the only constructors of the
  (message, messageKey, errorCode) triple — a mismatched pair is impossible by construction.

## Errors on the SSE stream

Streamed failures reuse the same codes/messages in the terminal `error` frame
(`toStreamErrorMessage` in `apps/api/src/modules/game/lib/game-stream.ts` delegates to
`toErrorBody`), so a client can share one code→copy mapping across HTTP and SSE. See
[sse-events.md](sse-events.md).
