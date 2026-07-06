# Skill: Security Review (Frontend)

Run this review on every web feature branch before requesting merge. The binding policy is
[rules/frontend/11-security.md](../rules/frontend/11-security.md) and
[docs/sdlc/security-baseline.md](../docs/sdlc/security-baseline.md).

> The backend AppSec review (uploads, prompt injection, AI safety) is
> [security-review.md](./security-review.md). This one covers the `apps/web` client + BFF surface.

## Steps

1. **New environment variables.** Any new variable MUST be Zod-validated in
   `apps/web/src/packages/env` (public schema for `NEXT_PUBLIC_*`, server schema — guarded by
   `server-only` — for the rest), documented in `.env.example`, and read only through the typed
   `publicEnv` / `getServerEnv` getters. Grep the diff for `process.env`: outside
   `apps/web/src/packages/env/`, test setup, and middleware it is an ESLint error. Confirm no secret
   was added under a `NEXT_PUBLIC_` prefix.
2. **New dependencies.** Every third-party package MUST have exactly one owning wrapper under
   `apps/web/src/packages/<capability>` registered in
   [eslint/package-boundaries.config.mjs](../eslint/package-boundaries.config.mjs)
   (see [skills/create-package-wrapper.md](./create-package-wrapper.md)). A raw vendor import in
   feature code is a boundary breach, not a style issue. Check `package.json` for the dependency and
   whether it needed a transitive-vuln override (the `multer` override is the reference example).
3. **CSP + security headers.** The static security headers (nonce/CSP, `X-Content-Type-Options`,
   frame policy, referrer/permissions policy, HSTS) live in `apps/web/next.config.ts` and the app
   middleware. Anything that would require loosening CSP — inline scripts, external
   script/font/image origins, embeds — is rejected by default; a genuine need goes through a
   documented, approved waiver. Verify the diff does not remove or weaken any header.
4. **No credentials, ever.** Twinzy has no accounts, login, session tokens, or payment — do not
   introduce any. Browser storage (`@/packages/storage`) MUST never hold credentials or PII. Flag
   any `document.cookie` write or any attempt to add auth/session state.
5. **Image-privacy invariant.** The uploaded photo lives in memory for the in-flight submission
   only: it is never written to a store, cache, `localStorage`, analytics, or logs, and is dropped
   after the mutation settles. Flag any code that persists, embeds, or logs the `File`/`Blob` or its
   bytes. No client-side face-detection/biometric library may be added.
6. **Links and navigation.** External links go through `ExternalLink` (`@/packages/link`), which
   applies safe `rel` attributes; user- or API-supplied URLs MUST pass `isSafeExternalUrl`
   (`apps/web/src/shared/security/external-url.helper.ts`), which allows only `https:`/`mailto:` and
   rejects `javascript:`, `data:`, and plain `http:`. Internal navigation uses `AppLink` typed
   routes — reject string-built hrefs.
7. **Error sanitization.** Raw error objects and server messages MUST never reach the UI. Errors are
   normalized and rendered via message keys through `mapErrorToMessageKey`
   (`apps/web/src/shared/errors/http-error-to-message-key.mapper.ts`). Flag any component or toast
   that prints `error.message` directly.
8. **Injection surface.** `dangerouslySetInnerHTML` MUST NOT be introduced. Grep the diff for it,
   for `eval`, and for `new Function`.
9. **Run the automated gates** and require both to pass clean:

   ```sh
   npm run audit            # npm audit --omit dev
   npm run security:scan    # trivy fs: vuln + secret + misconfig, exit-code 1 on HIGH/CRITICAL
   ```

   Zero unhandled findings is the policy ([rules/frontend/19-release-gates.md](../rules/frontend/19-release-gates.md)).
   A finding is handled only by upgrading, by a documented `overrides` entry in `package.json`, or
   by a documented, approved waiver.

## Done when

Every checklist item has an explicit yes/no answer in the review notes, both scan commands exit 0,
and any deviation is captured as an approved waiver.

## Validation (gate)

```bash
npm run lint                # boundary + no-process-env + jsx-a11y rules, 0 warnings
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global
npm run build               # next build — env validation + CSP wiring
npm run audit               # npm audit --omit dev
npm run security:scan       # trivy vuln + secret + misconfig
```
