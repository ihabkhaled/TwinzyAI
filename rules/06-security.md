# 06 — Security

> The house standard for securing a privacy-first, anonymous, stateless product. Twinzy has **no accounts, no auth, no database** — the attack surface is the upload pipeline, the AI boundary, and the HTTP edge. Implements rules 30–35 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

Related: [15-file-upload-security.md](./15-file-upload-security.md) · [14-ai-safety.md](./14-ai-safety.md) · [26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md) · [25-configuration-and-environment.md](./25-configuration-and-environment.md) · [/memory/security-decisions.md](../memory/security-decisions.md)

---

## 1. Never trust the client

- The backend validates **everything**: body, params, query, headers-read-as-data, and files — via zod DTOs at the boundary ([21-dto-validation.md](./21-dto-validation.md)). Strict object schemas reject unknown keys, closing mass-assignment holes.
- External **integration responses are boundaries too**: every AI response is zod-parsed and safety-filtered before use ([14-ai-safety.md](./14-ai-safety.md)).
- The consent flag is enforced server-side, first, before any file work — a missing/false flag rejects the request with a typed error. Client-side consent UI is UX, not enforcement.

## 2. The HTTP edge: helmet, CORS, cookies, body limits

- **Helmet** applied at bootstrap with an explicit policy (restrictive CSP, `nosniff`, frameguard deny, strict referrer policy) — never bare defaults.
- **CORS is an explicit allowlist read from typed config** — never `origin: '*'` in production. The allowlist is per-environment config, not code.
- **Cookies** (if any) are `HttpOnly`, `Secure` in production, `SameSite` strict/lax by decision — wired in `src/bootstrap` via the cookie plugin, nowhere else.
- **Request size is bounded**: small JSON body limit; the image upload has its own `MAX_IMAGE_SIZE_BYTES` cap enforced inside the upload chain.

## 3. Rate limiting

Global throttling via `@nestjs/throttler`, owned by `core/rate-limit`, with limits from typed config — never inline numbers. The analyze endpoint (expensive: AI calls) gets the tightest limiter. Health endpoints are skipped. Set trust-proxy correctly at bootstrap so the client IP key is real behind a proxy.

## 4. The upload pipeline is the front line

The ordered, fail-closed chain — consent → single file → size → MIME → extension → consistency → magic bytes → structural decode → ClamAV (production fails closed on scanner errors) — is specified in [15-file-upload-security.md](./15-file-upload-security.md). Never reorder, skip, or soften a link. Memory storage only; buffer wiped in `finally`; nothing persisted.

## 5. AI boundary

Prompt/data isolation (image only in trait extraction), sensitive-inference bans, zod validation of every model response, and the forbidden-wording guard are specified in [14-ai-safety.md](./14-ai-safety.md). The Gemini SDK lives only in `modules/ai/adapters`; provider errors are mapped to `IntegrationError` with redacted text ([26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md)).

## 6. Secrets

- Secrets live in typed config only (`src/config`, zod-validated at startup); never hardcoded, never committed (`.env` git-ignored; `.env.example` tracked with placeholders).
- The frontend receives `NEXT_PUBLIC_*` values only — no server secret ever reaches the bundle.
- Never log secrets: the logger redacts `authorization`/`cookie`/`token`/`secret`/api-key paths and never sees image bytes ([22-observability-logging.md](./22-observability-logging.md)).
- Any secret comparison (if one is ever added) is timing-safe (`crypto.timingSafeEqual`), never `===`; randomness from `node:crypto`, never `Math.random()`.

## 7. Sanitized errors

The global exception filter is the only producer of error bodies: clients get the sanitized `ApiErrorResponse` envelope (`statusCode`, `errorCode`, `message`, additive `messageKey`) — never stacks, provider messages, file paths, or internals. Full detail is logged server-side, keyed by request id. See [26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md).

## 8. Supply chain

- Dependencies audited (`npm run audit`) and Trivy-scanned (`npm run security:scan` — HIGH/CRITICAL fail the gate).
- No unmaintained security-relevant packages; every new dependency needs a [docs/package-decisions.md](../docs/package-decisions.md) entry and an owning adapter ([10-library-modularization.md](./10-library-modularization.md)).

## 9. If identity ever arrives (standing rule)

Twinzy is anonymous **by design decision** — there is no auth today, and none may be added casually. Any feature that introduces identity, accounts, or per-user data requires, **before code**:

1. An ADR in [/memory/architecture-decisions.md](../memory/architecture-decisions.md) justifying the privacy trade-off.
2. A designed guard chain: **authentication guard → authorization (permissions) guard → ownership check** on every protected route — three distinct controls, chained in that order, with identity read only from the verified token, never the client body.
3. A central permission catalog (as-const map in `packages/shared`) — no raw permission literals at call sites.
4. Rate limiting + lockout on any credential-shaped route; timing-safe compares; strong KDF for any stored credential.

---

## Checklist

- [ ] Every boundary zod-validated; unknown keys rejected; consent enforced server-side first
- [ ] Helmet explicit; CORS allowlist from config; cookies hardened; body size bounded
- [ ] Throttler limits from config; analyze endpoint tightest; trust-proxy correct
- [ ] Upload chain intact, ordered, fail-closed ([15](./15-file-upload-security.md)); AI boundary intact ([14](./14-ai-safety.md))
- [ ] Secrets in typed config only; frontend gets `NEXT_PUBLIC_*` only; logs redacted
- [ ] Errors sanitized via the global filter; nothing internal leaks
- [ ] `npm run audit` + `npm run security:scan` clean; new deps documented + wrapped
- [ ] No identity feature without ADR + full guard-chain design
