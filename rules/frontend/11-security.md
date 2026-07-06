# 11 — Security

Security is enforced by code owned inside the repository, not by convention. Every control below maps
to a real file. Violations block merge via [19-release-gates.md](19-release-gates.md). These controls
sit alongside the Twinzy product non-negotiables in [CLAUDE.md](../../CLAUDE.md) — no image
persistence, text-only candidate/judge prompts, `.env`-driven model, Zod + safety filtering — which
the frontend must never undermine.

## Content Security Policy: per-request nonce in `apps/web/src/proxy.ts`

- The CSP MUST come from `apps/web/src/proxy.ts` (Next 16 proxy convention). It generates a fresh
  nonce per request and sets `script-src 'self' 'nonce-…' 'strict-dynamic'` in production
  (`'unsafe-eval'` is added only when `NODE_ENV !== 'production'`, for Turbopack dev).
- Never move the CSP into `next.config.ts` as a static header — a static CSP cannot carry a nonce.
- Never add a host, `'unsafe-inline'`, or `'unsafe-eval'` to the production `script-src`. Any CSP
  change requires a security review ([skills/security-review.md](../../skills/security-review.md)).

## Static security headers: `apps/web/next.config.ts`

All non-CSP headers are static and live in [apps/web/next.config.ts](../../apps/web/next.config.ts):
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/microphone/geolocation
denied), `Cross-Origin-Opener-Policy: same-origin`, and HSTS with `includeSubDomains; preload`.
`poweredByHeader` MUST stay `false`. Removing or weakening any of these requires a documented exception
in [docs/exceptions/](../../docs/exceptions/).

## Environment split and `server-only`

- Client-safe values are read only through `publicEnv` (`apps/web/src/packages/env/public-env.ts`).
  `NEXT_PUBLIC_*` values MUST never contain secrets.
- Server secrets are read only through `getServerEnv()` from `@/packages/env/server`
  (`apps/web/src/packages/env/server.ts`), which imports the `server-only` marker so any accidental
  client import fails at build time.
- Raw `process.env` access anywhere else is banned by the
  [no-process-env-outside-config](../../docs/eslint/no-process-env-outside-config.md) rule. See
  [17-configuration-environment.md](17-configuration-environment.md).

## No sensitive client state: token-free, image-free client

- Auth tokens and secrets MUST never be stored in `localStorage`, `sessionStorage`, Zustand, or React
  state. Any session is cookie-based; the client holds only a non-sensitive snapshot.
- Uploaded images are never persisted, cached, embedded, logged, or held in client state — per the
  Twinzy product non-negotiables in [CLAUDE.md](../../CLAUDE.md), image bytes exist only in memory for
  the duration of the upload request and are wiped afterward.
- Client code only calls the same-origin BFF gateway (`/api/gateway/[...path]`) via `httpClient` +
  `buildGatewayPath` — upstream URLs and credentials stay on the server.

## Output and link safety

- `dangerouslySetInnerHTML` is banned everywhere. There are zero occurrences in `apps/web/src/` and
  none may be introduced without an exception document.
- External links MUST use `ExternalLink` from `apps/web/src/packages/link`, which applies safe `rel`
  attributes. URL values from data MUST be checked with `isSafeExternalUrl`
  (`apps/web/src/shared/security/external-url.helper.ts`), which allows only `https:` and `mailto:` —
  `javascript:`, `data:`, and plain `http:` are rejected.

## Storage is schema-validated

Web storage is only reachable through the facade in `apps/web/src/packages/storage`. `readStorageJson`
validates every value against a Zod schema and returns `null` for anything malformed — persisted data
is untrusted input and MUST never flow into the app unvalidated.

## Error sanitization

Raw vendor or backend error text MUST never reach the user. All failures resolve to a translatable key
from `ERROR_MESSAGE_KEYS` via `mapErrorToMessageKey`
(`apps/web/src/shared/errors/http-error-to-message-key.mapper.ts`). Full chain:
[18-error-handling.md](18-error-handling.md).

## Dependency and scan policy: zero unhandled findings

- `npm run audit` (`npm audit`) and `npm run security:scan` (Trivy over vuln + secret + misconfig)
  MUST pass with zero unhandled findings.
- Transitive vulnerabilities are fixed with an `overrides` entry in [package.json](../../package.json)
  — the current `fastify`/platform override is the reference example. Suppressing a finding instead of
  fixing it requires an exception per
  [docs/exceptions/exception-template.md](../../docs/exceptions/exception-template.md).

Decisions log: [memory/frontend/security-decisions.md](../../memory/frontend/security-decisions.md).
Baseline policy: [docs/sdlc/security-baseline.md](../../docs/sdlc/security-baseline.md).
Reviewer agent: [agents/frontend-security-reviewer.md](../../agents/frontend-security-reviewer.md).
