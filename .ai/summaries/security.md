<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/summaries/security.md -->

# Security Summary — Upload Chain, CSP, Rate Limits, Secrets, Scans

## Upload verification chain (rules/15 — order is law, verified in code)

`FileSecurityService.assertSafeImage` (`apps/api/src/modules/file-security/application/file-security.service.ts`):
1. consent flag literal `'true'` → 2. presence + exactly one file (multipart pipeline; consent must precede the file part) → 3. size ≤ `MAX_IMAGE_SIZE_BYTES` (default 5 MiB; 10 MiB transport hard cap) → 4. MIME allowlist (jpeg/png/webp) → 5. extension allowlist → 6. extension↔MIME consistency → 7. magic bytes (incl. WebP RIFF marker) → 8. structural decode (JPEG SOF/PNG IHDR/WebP headers; dimensions 8–12,000 px) → 9. optional ClamAV INSTREAM TCP scan — **fails closed on any scanner error whenever `ENABLE_CLAMAV=true`** (`virus-scan.service.ts`; stricter than rules/15's "production" phrasing — strictest wins). HEIC rejected (no safe pure-JS decoder). Errors: 400 consent/missing, 413 too large, 415 type, 422 invalid/infected, 503 scanner down. Memory-only buffers zero-filled in `finally` (`knowledge/summaries/privacy.md`).

## CSP and headers (two layers)

- **Web CSP** — `apps/web/src/proxy.ts` mints a per-request nonce; `shared/security/content-security-policy.ts` builds `strict-dynamic` + nonce script-src, `'unsafe-eval'` dev-only, `connect-src 'self' <apiBaseUrl>`; **PayPal origins + `font-src data:` appended ONLY when `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is configured** — the free game's policy is never loosened. Static headers (nosniff, X-Frame-Options DENY, Permissions-Policy `camera=(self)`, HSTS) in `apps/web/next.config.ts`. CSP changes require security review (`rules/frontend/11-security.md`).
- **API edge** — `@fastify/helmet` defaults, CORS **closed by default** (`origin: false` when `CORS_ALLOWED_ORIGINS` empty; methods GET/POST/DELETE), hardened cookies, per-route JSON body caps (cancel 8 KiB / translate 256 KiB / payments orders 4 KiB), `TRUST_PROXY` off by default so a directly exposed container cannot spoof client IPs (`apps/api/src/bootstrap/configure-security.ts`, `fastify-adapter.ts`).

## Rate limits and admission control

Global throttle `RATE_LIMIT_TTL_MS`/`RATE_LIMIT_MAX` (60 s / 30). Per-route: analyze + analyze/stream 10/min, translate 10/min, cancel 60/min, payments orders 10/min, share create/read/delete 20/120/20 per min (module `model/*.constants.ts`). Streaming admission: 50 global / 3 per-IP / 1 per-tab active analyses, queue ≤100, watchdog 120 s (`core/streaming/concurrency-limiter.service.ts`). Duplicate in-flight requestIds rejected; cancel needs the exact 3-id match.

## Secrets handling

Secrets live in env only, validated at boot (`apps/api/src/config/env.schema.ts`); `process.env` readable only in config/bootstrap (lint `architecture/no-direct-env-access`); only `NEXT_PUBLIC_*` reaches the client via the zod-validated `publicEnv` facade (`apps/web/src/packages/env/public-env.ts`). Gemini/PayPal secrets are backend-only. Pino redaction + `redactForLog` prevent log leakage. Rotation runbook: `runbooks/secret-rotation.md`.

## Payments security (env-gated; program record `docs/features/paypal-donations-and-paid-results/19-threat-model-paywall.md`)

Server-authoritative price; order id pattern `^[A-Z0-9-]{8,64}$` + `encodeURIComponent` (no smuggling); capture verifies status/amount/currency/`custom_id === requestId`; idempotency header; 15 s timeouts; replay fails `ORDER_ALREADY_CAPTURED`; PayPal SDK loaded only from the official origin with scoped CSP additions. Donate link: hardcoded `https://paypal.me` base + strict handle regex; `ExternalLink` allows https:/mailto: only (`shared/security/external-url.helper.ts`).

## Scans and gates

- `npm run security:audit` — fails on any npm advisory.
- `npm run security:scan` — Trivy vuln + **secret** + misconfig at HIGH/CRITICAL (root `package.json`); SARIF uploaded in CI (`.github/workflows/gate-security-scan.yml`).
- `security:scan:secrets` complements Trivy (added by twinzy-hardening-v3; `SECURITY.md`).
- Lint-level: `eslint/security.config.mjs` family; sonarjs password rule off by recorded exception EXC-0001 (Trivy owns secret detection — `docs/exceptions/README.md`).

## Threat models and reviews

Product threat model: `docs/security-threat-model.md` (uploads, log exfiltration, provider injection, DoS, secret leakage, clickjacking, share enumeration/no-oracle). Reviews: `docs/security-review-report.md`, `docs/file-upload-security-review-report.md`, `docs/ai-safety-review-report.md`. Standing rule: any identity/auth feature requires an ADR + designed guard chain before code (`rules/06-security.md`).
