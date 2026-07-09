# Security Threat Model

Assets: user photo (in transit/memory), Gemini API key, service availability.

Threats and mitigations:
- Malicious upload (polyglot, decompression bomb, malware): full validation chain + size cap +
  structural decode bounds + optional ClamAV (fail closed in prod).
- Data exfiltration via logs: LoggerService policy — no image bytes, no keys; redaction helpers.
- Provider error/response injection: Zod schema validation + forbidden-wording filter; raw
  provider errors never reach clients (mapped to a typed AppError; the global filter emits only
  the sanitized `{ statusCode, errorCode, message, messageKey }` envelope).
- Abuse/DoS: global throttling + stricter analyze route limit + upload size cap + timeouts.
- Secret leakage: keys only in backend env; images built without secrets; frontend bundle
  contains only NEXT_PUBLIC_* values.
- CORS/clickjacking/MIME sniffing: strict CORS allowlist, X-Frame-Options DENY, nosniff,
  referrer policy, helmet defaults.

Share endpoints (temporary shareable results — POST/GET/DELETE `/api/v1/share-results`):
- Share-link enumeration/guessing: crypto-random UUID share ids (unguessable) + per-route rate
  limits (create 20/min, read 120/min) + short TTL; ids are UUID-validated.
- Payload abuse / memory exhaustion: per-record byte cap (`SHARE_RESULT_MAX_PAYLOAD_BYTES`, 413) +
  max-active-items cap (`SHARE_RESULT_MAX_ACTIVE_ITEMS`, 429 at capacity) + TTL sweeper +
  OnModuleDestroy cleanup — the in-memory cache cannot grow unbounded.
- Forbidden-wording / image smuggling on ingest: create re-runs the safety filter and rejects any
  `data:`/base64/embedded-image string; the reused strict `FinalGameResult` schema has no file slot
  and rejects unknown/oversized keys — no image can enter the cache.
- Open redirect / attacker-shaped link: the `/share/<uuid>` URL is built from the server-config
  `SHARE_RESULT_PUBLIC_BASE_URL` only, never user input.
- Existence oracle: missing and expired share ids return the identical safe 404 (`SHARE_NOT_FOUND`) —
  the response never reveals whether an id ever existed.
- Public-page leakage/indexing: the page escapes all text (no dangerouslySetInnerHTML), never renders
  the uploaded image, and ships `noindex/nofollow` with generic Open Graph (no per-user data); no
  stack traces, provider errors, or raw payloads are logged.
