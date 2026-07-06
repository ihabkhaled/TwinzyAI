# 26 — Error Handling & Exceptions

> Every failure is a **typed `AppError`** carrying a `messageKey`, raised in the layer that detects it and translated **once** at the edge by the global exception filter into the sanitized envelope. Full detail is logged server-side; clients never see stacks, provider errors, secrets, or internals. Implements rules 25 and 32 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

**The model in one line: throw typed → catch once → log full → return sanitized.**

---

## The `AppError` hierarchy

Defined once in `core/errors`. Every subclass is a real domain concept with a fixed HTTP status and a `messageKey` (`errors.<feature>.<key>` — [12-i18n.md](./12-i18n.md)). Never `throw new Error('…')` for a user-facing failure.

| Class | HTTP | Throw when |
| --- | --- | --- |
| `ValidationError` | 400 | Input/precondition fails beyond the schema (incl. missing consent) |
| `UnauthorizedError` | 401 | Reserved — no identity exists today; binds if auth ever arrives ([06-security.md](./06-security.md)) |
| `ForbiddenError` | 403 | Reserved — allowed-but-not-permitted, for future gated capabilities |
| `NotFoundError` | 404 | A referenced resource/route does not resolve |
| `ConflictError` | 409 | Duplicate / conflicting state |
| `PayloadTooLargeError` | 413 | Upload exceeds `MAX_IMAGE_SIZE_BYTES` (distinct from generic validation — clients handle it differently) |
| `IntegrationError` | 502 | A wrapped external provider (Gemini, ClamAV) failed |

```ts
// core/errors/app-error.ts — the base. Never subclass inline elsewhere.
export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly errorCode: string;          // legacy machine code — preserved
  protected constructor(
    message: string,                            // developer-facing, logged, never the contract
    readonly messageKey: string,                // errors.<feature>.<key> — what the client localizes
    readonly details?: Readonly<ErrorDetails>,  // safe structured extras (e.g. field issues)
    readonly cause?: unknown,                   // original error — logged, never serialized out
  ) {
    super(message);
    this.name = new.target.name;
  }
}
```

### Which to throw

- Schema can express it? → not an error here; the `ZodValidationPipe` rejects it ([21-dto-validation.md](./21-dto-validation.md)).
- Upload too big? → `PayloadTooLargeError`, from the file chain.
- Provider call failed inside an adapter? → `IntegrationError`, raised **by the adapter**, never the raw SDK error.
- Pick by **meaning**; the status follows from the class — never set a status by hand outside the filter.

### Where each layer throws

| Layer | Throws | Never |
| --- | --- | --- |
| Controller | nothing — lets it bubble | `try/catch`, building error bodies |
| Use case / service | `ValidationError`, `NotFoundError`, `ConflictError`, `PayloadTooLargeError` | swallowing errors; setting HTTP status |
| Domain | invariant `ValidationError`s | touching HTTP |
| Adapter | `IntegrationError` wrapping a safe cause | leaking vendor error objects upward |

---

## One global filter, one envelope

The global exception filter (`core/errors`) is the **single** producer of HTTP error responses. It logs full detail server-side (with the request id) and returns the envelope — **backward-compatible with the existing `ApiErrorResponse`**: the legacy fields stay, `messageKey` is additive.

```jsonc
{
  "statusCode": 413,
  "errorCode": "PAYLOAD_TOO_LARGE",              // legacy ErrorCode — preserved for existing clients
  "message": "Image exceeds the size limit",     // safe default text; clients should prefer messageKey
  "messageKey": "errors.fileSecurity.tooLarge"   // additive — the frontend localizes this
}
```

Validation failures add safe, structured `details` (`[{ field, constraint }]` — field paths and messageKeys, never submitted values).

Mapping rules:

- `AppError` → its status + envelope; `logLevel` follows status (**4xx → warn, 5xx → error** — [22-observability-logging.md](./22-observability-logging.md)).
- Framework `HttpException` (404 route miss, 405, multipart errors) → normalized into the same envelope shape — one contract for clients.
- **Anything else → an opaque 500** with a fixed generic body (`errors.internal.unexpected`). The real error lives only in the server log, joined by request id. No detail leaks, ever.
- Map vendor exceptions **inside adapters**, not in the filter — the filter stays generic.

## Never leak internals

- No stacks, provider messages, file paths, config, or prompt/image content in any client-visible field (rule 32). If you can't prove a field is safe, it doesn't go in the envelope.
- **Adapter errors:** catch the vendor failure, log it redacted server-side, throw `IntegrationError` with a **redacted** message and the original as `cause` — provider text never becomes the `message`.
- Log once, at the filter (plus the layer-level `catch`-with-context where handling happens) — don't log-and-rethrow at every layer.

```ts
// Do — adapter wraps with context, keeps the cause private
catch (cause) {
  this.logger.error('ai.generate.failed', { stage, durationMs });
  throw new IntegrationError('AI provider failed', AI_MESSAGE_KEYS.PROVIDER_FAILED, undefined, cause);
}

// Don't
catch (e) { throw new HttpException(String(e), 502); } // ✗ leaks vendor text, bypasses the hierarchy
catch { /* ignored */ }                                 // ✗ silent failure
```

## The key catalog

`messageKey` constants live with their feature (`model/<feature>.constants.ts`); one **distinct** key per scenario (consent, size, MIME, magic bytes, decode, scan, provider-failure, safety-rejection, …) — never a generic `errors.<feature>.failed`. Keys are append-mostly; each ships with its frontend dictionary entry in the same change ([12-i18n.md](./12-i18n.md)).

---

## Checklist

- [ ] Every user-facing failure is an `AppError` subclass with a distinct `messageKey`; no raw `Error`/`HttpException` from app code
- [ ] Status from the class; `PayloadTooLargeError` used for size, `IntegrationError` for providers
- [ ] The global filter is the only error-response producer; controllers have no transport `try/catch`
- [ ] Envelope compatible: `statusCode` + legacy `errorCode` + `message` + additive `messageKey` (+ safe `details`)
- [ ] Unknown exceptions → opaque 500; full detail server-side only, joined by request id
- [ ] Adapter failures wrapped with redacted text; `cause` logged, never serialized
- [ ] Tests assert thrown class → mapped status + `messageKey` for every scenario
