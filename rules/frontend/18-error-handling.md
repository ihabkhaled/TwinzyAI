# 18 — Error Handling

One doctrine: vendor errors are normalized at the boundary, carried as typed app errors, and reach the
user only as translated copy. Raw error text never crosses a layer it does not belong to.

## The normalization chain

```
axios failure
  → HttpError            (apps/web/src/packages/axios/http-error.ts — thrown by the wrapper)
  → mapErrorToMessageKey (apps/web/src/shared/errors/http-error-to-message-key.mapper.ts)
  → ErrorMessageKey      (apps/web/src/shared/errors/error-keys.constants.ts)
  → t(messageKey)        (translated in a hook or server component)
```

- The axios wrapper converts every failure via `normalizeToHttpError`; services and hooks only ever see
  `HttpError` (`apps/web/src/packages/axios/http-error.ts`) with a `kind` (`'http' | 'network' |
  'timeout' | 'aborted' | 'unknown'`), a nullable `status`, and the `responseBody`. Never `catch` an
  `AxiosError` outside `apps/web/src/packages/axios` — the import is banned by
  [no-raw-package-imports](../../docs/eslint/no-raw-package-imports.md).
- `mapErrorToMessageKey` is the ONLY path from transport failures to user-visible copy: network →
  `errors.network`, timeout → `errors.timeout`, 401/403/404/5xx → their keys, everything else →
  `errors.generic`. Add new mappings there, never inline at a call site.
- Hooks translate the key and put copy into the view model; the reference is the game-round flow rendered
  by its container in `apps/web/src/modules/game`.

## Typed app errors

- `AppError` (`apps/web/src/shared/errors/app-error.ts`) carries an `ErrorMessageKey` instead of raw
  text. Use `toAppError(value)` to coerce any thrown value; it preserves the original as `cause` for
  logging while guaranteeing a translatable surface.
- `SchemaParseError` (`apps/web/src/packages/zod/parse-schema.ts`) is thrown by `parseSchema` when wire
  data or env fails validation, with normalized `{ path, message }` issues — never a raw `ZodError`.
  Non-throwing paths use `safeParseSchema` and its discriminated union.

## Error boundaries

- Every route segment relies on `apps/web/src/app/error.tsx`: a client component (with its documented
  `client-boundary-reason`) that logs via `appLogger` with the error `digest` and renders `ErrorState`
  with translated copy and a retry wired to `reset`.
- `apps/web/src/app/global-error.tsx` is the last resort when providers themselves crashed; it is the
  single sanctioned user of `FALLBACK_ERROR_COPY` (untranslated, because i18n may be down).
- Boundaries MUST render `t(key)` copy — never `error.message`, which may contain stack fragments or
  upstream internals.

## Gateway error responses

The BFF gateway (`gateway-handler.ts` under `apps/web/src/app/api/gateway`) returns sanitized JSON error
codes only: `{ error: 'invalid_request' }` (400), `{ error: 'invalid_credentials' }` (401),
`{ error: 'not_found' }` (404), and `{ error: 'bad_gateway' }` (502) when the upstream call fails — the
upstream failure is logged server-side via `appLogger`, never forwarded to the browser. New gateway
branches MUST follow this shape: stable machine-readable `error` code, correct status, no upstream text.

## Hard rules

- Never show `error.message`, `responseBody`, or stack traces to users.
- Never swallow an error silently: either recover meaningfully, or log via `appLogger` and surface
  translated copy.
- Empty states are not errors — a 200 with zero items renders the empty branch, not `ErrorState`.
- Form validation errors flow through `mapSchemaIssuesToFieldErrors` (`apps/web/src/shared/mappers`) into
  `FormField` error slots ([13-accessibility.md](13-accessibility.md)).

Related: [11-security.md](11-security.md) (sanitization rationale),
[16-observability-analytics.md](16-observability-analytics.md) (logging),
[04-services-api-gateway.md](04-services-api-gateway.md) (layer ownership).
