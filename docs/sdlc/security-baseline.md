# Security Baseline — Twinzy

## Purpose

This document defines the minimum security **and privacy** bar for any shipped change in the Twinzy repository. Twinzy's core promise is privacy-safety: a player uploads one photo, the backend derives 15 non-identifying appearance traits as text, and everything downstream is text-only. That promise is enforced here, in [`rules/06-security.md`](../../rules/06-security.md), [`rules/14-ai-safety.md`](../../rules/14-ai-safety.md), and [`rules/15-file-upload-security.md`](../../rules/15-file-upload-security.md) — the rule files win any conflict.

## Twinzy Privacy and AI-Safety Baseline (non-waivable)

These are product invariants. No waiver, no exception, no "temporary" version of any of them:

- **No image persistence.** Uploaded images are processed in memory only. No disk writes, no object storage, no cache, no volumes on the api container (the compose file deliberately mounts none), no image bytes in logs or error payloads.
- **No biometrics, ever.** No face recognition, no identity matching, no face embeddings, no biometric templates, no exact-lookalike claims. The product describes style/vibe similarity from written traits only.
- **Image reaches exactly one prompt.** Only the trait-extraction prompt may receive the image. Candidate and judge prompts are text-only (traits JSON / candidates JSON). Any change that routes image bytes anywhere else is an automatic security rejection.
- **Forbidden-wording filtering.** Every AI response is zod-validated and safety-filtered before use. Outputs containing forbidden wording (identity/biometric framing — see `packages/shared/src/constants/safety.constants.ts`) are rejected or sanitized; unsafe responses map to the `AI_RESPONSE_UNSAFE` error code, never to the player verbatim.
- **The upload security chain is mandatory and ordered.** Backend is the source of truth: consent flag required first, exactly one file, size cap (`MAX_IMAGE_SIZE_BYTES`), MIME allow-list, extension check, extension/MIME consistency, magic-byte verification, decode check, then optional ClamAV scan.
- **ClamAV fails closed.** When virus scanning is enabled (`ENABLE_CLAMAV`, mandatory posture in production), a scanner error or timeout rejects the upload (`VIRUS_SCAN_FAILED`); it never falls through to "assume clean."
- **Redacted logs.** Structured logs never contain image bytes, base64 payloads, raw multipart bodies, secrets, or API keys. Log the decision (accepted/rejected, error code, sizes, request id), never the content.
- **Free product.** No payment logic, so no payment data, ever.

## Baseline Requirements

### Access Model

Twinzy has no authentication, no accounts, and no tenants — every endpoint is public by design. The compensating controls are therefore mandatory:

- Consent is the permission boundary: `POST /api/v1/game/analyze` requires an explicit consent flag; missing consent is a 400 (`CONSENT_REQUIRED`) before any file processing.
- Rate limiting protects the expensive AI path from abuse (`RATE_LIMITED`, 429).
- CORS is restricted to configured origins (`CORS_ALLOWED_ORIGINS`); methods limited to GET/POST.
- Helmet security headers are applied on every response (e.g., `x-content-type-options: nosniff`).

### Secrets and Configuration

- Secrets live in `.env` and are read only through the config module — `process.env` is banned outside `apps/api/src/config` and `apps/web/src/lib/config`.
- `GEMINI_API_KEY` is never logged, never sent to the client, never committed.
- `GEMINI_MODEL` comes from `.env` — never hardcoded.
- Config is validated fail-fast at boot: a misconfigured service refuses to start rather than limping.

### Input, Output, and Abuse Resistance

- Validate input on every trust boundary with zod — HTTP DTOs, multipart fields, and every AI provider response.
- Review injection, XSS, SSRF, path traversal, deserialization, and business-logic abuse risk for each changed path; `eslint-plugin-security` and sonarjs do the mechanical pass in the lint gate.
- The upload endpoint is the highest-abuse surface: hostile files, polyglot files, oversize payloads, and multi-file smuggling are standing test cases (see [`test-cases/security/`](../../test-cases/security/security-test-case-template.md)).
- Error responses always use the `ApiErrorResponse` envelope — no stack traces, no provider internals, no library error strings.

### Data Protection

- Data handled: one in-memory image (transient), derived trait text (non-identifying by construction), and result text. Nothing else.
- Retention: zero for images (request lifetime only). No trait-to-person linkage exists because there are no accounts.
- Trait wording must stay non-identifying — traits describe visible style attributes, never identity.
- TLS termination and transport protection are deployment requirements for any public environment.

### Logging and Auditability

- Security-relevant decisions (upload rejected, scan failed, AI response rejected as unsafe, rate limit hit) must be visible in structured pino logs with request-id correlation.
- 4xx outcomes log as `warn` with their error code / message key; 5xx as `error`.
- Logs must support investigation without leaking protected data — see the redaction invariant above.

### Dependencies and Supply Chain

- Review new dependencies before adoption; every library is wrapped behind an adapter/lib module ([`rules/10-library-modularization.md`](../../rules/10-library-modularization.md)).
- `npm run security:scan` (trivy: vuln, secret, misconfig) must report 0 HIGH/CRITICAL findings before merge/release; `npm run audit` covers production deps.
- Husky-enforced hooks and conventional commits keep the change history traceable; never `--no-verify`.

### Infrastructure and Deployment

- Docker images are built from the repo Dockerfiles; the api service runs with no volumes (upload non-persistence by construction).
- Review exposed ports and ingress on any deployment change (api 4000, web 3000, clamav 3310 internal).
- Validate rollback safety (git revert + redeploy — no data migrations exist) and secret handling during release.

## Security Evidence Expectations

Security review (`19-security-review.md`) should leave evidence of:

- what was reviewed
- which threat scenarios were considered
- what findings were raised
- what was fixed
- what remains open
- who accepted any residual risk

## Threat Modeling Trigger Conditions

Threat modeling (`19-threat-model.md`) is mandatory when a change touches:

- the upload pipeline or any file handling
- consent handling or request validation order
- the AI provider adapter, prompts, or safety filtering
- trait extraction, trait wording, or result content
- rate limiting, CORS, or security headers
- logging, error envelopes, or anything that could leak data
- external integrations
- infrastructure exposure (ports, containers, CI/CD)
- any workflow with abuse potential

## Validation Methods

Depending on risk, validation may include:

- secure design review
- consent and validation-order testing
- abuse-case walkthroughs (hostile files, oversize, forbidden-wording injection via crafted images)
- dependency and container scanning (`npm run security:scan`)
- secret and config review
- logging and data-leakage review
- dynamic security testing / penetration-style testing (`19-pentest-report.md`)
- the automated security suites: `npm run test:security` and `npm run test:file-security`

## Exit Rule

No unresolved critical or high security issue may ship without an explicit written waiver from the authorized approver — and privacy/AI-safety invariants can never be waived.

## Common Security Failure Modes To Watch

- assuming a "fun" product lowers the privacy bar — it does not; the photo is the most sensitive input possible
- leaking image bytes or provider payloads through logs or error messages
- reordering the upload chain so expensive or unsafe work happens before consent/validation
- letting ClamAV failures fall open instead of closed
- trusting client-side validation as the security boundary
- prompt or filter changes that reintroduce identity/biometric wording
- introducing any storage "just for debugging"
