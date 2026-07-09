# SECURITY.md

## Reporting

Report suspected vulnerabilities privately to the maintainers. Do not open public issues with
exploit details.

## Data handling promises

- Uploaded images are processed **in memory only**, sent to exactly one AI call (trait
  extraction), then the buffer is zero-filled and released in a `finally` block.
- No image bytes are ever written to disk, logged, cached, or returned in responses.
- No face embeddings, biometric templates, or identity data are created or stored.
- The AI candidate/judge steps receive **text only** (trait JSON / candidate JSON).

## Upload hardening (backend is source of truth)

- Consent flag required; exactly one file; size cap (`MAX_IMAGE_SIZE_BYTES`).
- MIME allowlist, extension allowlist, extension↔MIME consistency, magic-byte check,
  structural decode validation; malformed/polyglot files rejected.
- Optional ClamAV scanning (`ENABLE_CLAMAV=true`); in production a failing or unreachable
  scanner **fails closed** (upload rejected).

## Platform hardening

- Helmet security headers + strict CORS allowlist on the API; security headers on the web app.
- Global rate limiting on the API.
- Errors are mapped to a safe envelope — no stack traces or provider errors leak.
- `GEMINI_API_KEY` is backend-only; the frontend bundle contains no secrets.
- Docker containers run as non-root, with health checks and **no persistent upload volumes**.

## Secrets

- Never commit `.env` (only `.env.example`).
- Never bake secrets into Docker images; pass them at runtime.
- Rotate any secret that has been exposed in an audit, a transcript, or shared history.
- Trivy scans for vulnerabilities and misconfigurations. A custom `npm run security:scan:secrets` scanner complements Trivy by looking for common plaintext patterns (Google API keys, AWS access keys, high-entropy secret assignments). Trivy alone may not catch every secret pattern; use both scanners before releasing.
