---
id: summary-privacy
title: Privacy Summary — Consent, Image Lifecycle, Redaction, Logging, Share TTL
type: summary
authority: canonical
status: current
owner: repository owner
generated: false
summary: Routing digest of the privacy posture — consent-first enforcement, the exact image lifecycle, log redaction on both sides, and the ephemeral share model.
keywords: [privacy, consent, image lifecycle, buffer wipe, redaction, logging, share ttl, no persistence, data retention, dsr]
contextTier: 1
relatedCode: [apps/api/src/modules/file-security/application/temporary-file-cleanup.service.ts, apps/api/src/modules/privacy/lib/log-redaction.helpers.ts, apps/api/src/modules/game/application/analyze-game.use-case.ts, apps/api/src/core/logger/logger.constants.ts]
relatedTests: [apps/api/src/modules/file-security/tests/upload-buffer-cleanup.util.test.ts, apps/api/src/tests/game-analyze.integration.test.ts]
relatedDocs: [docs/privacy-and-data-retention.md, rules/14-ai-safety.md, memory/privacy-decisions.md]
readWhen: You are touching anything that receives, logs, stores, or transmits user data — especially the photo path.
---

# Privacy Summary — Consent, Image Lifecycle, Redaction, Logging, Share TTL

Posture (owner: `docs/privacy-and-data-retention.md`): no accounts, no database, nothing durable server-side — "nothing to delete for DSRs". The only cache is the bounded ephemeral share cache.

## Consent-first (verified invariant)

- Backend requires the literal `'true'` consent multipart field (`apps/api/src/modules/game/api/dto/analyze-request.dto.ts`; `modules/game/lib/consent.ts`), and the multipart parser demands the consent field arrive **before** the file is buffered (`core/http/multipart-upload.parser.ts`).
- `FileSecurityService.assertSafeImage` checks consent FIRST in the chain (`modules/file-security/application/file-security.service.ts`); both use-cases gate on it before any AI work. Payment capture also happens only after the consent+file chain passes.
- Frontend blocks submit without the checkbox (`useGame.hook.ts` `canAnalyze`); the consent copy (`apps/web/src/packages/i18n/messages/en.json` key ~71, ar parity) accurately describes in-memory extraction + text-only matching. Open recorded caveat: an en+ar copy revision is a paywall LIVE condition (`docs/features/paypal-donations-and-paid-results/22-go-no-go.md`).

## Image lifecycle (exact, verified)

1. Parsed into memory only — never disk (`core/http/multipart-upload.parser.ts`; `UploadedImageInterceptor`). Partial buffers are zero-filled on any parse failure.
2. Validated by the file-security chain (`knowledge/summaries/security.md`).
3. Sent to exactly one AI step — trait extraction (typed + lint + routing fail-closed boundary; `knowledge/summaries/ai-pipeline.md`).
4. Zero-filled in `finally` on success, failure, and abort in **both** use-cases (`analyze-game.use-case.ts`, `analyze-game-stream.use-case.ts` → `TemporaryFileCleanupService.wipe` → `lib/upload-buffer-cleanup.util.ts` `buffer.fill(0)`).
5. Candidates/judge/translation/share/display receive no image, URL, hash, crop, embedding, or raw metadata — contracts have no image slot by construction (`packages/shared/src/schemas/translate-result.schema.ts` etc.).
6. Never logged: extraction logs trait counts only; the stream registry holds only ids + AbortController; frontend keeps the image as in-memory `File` + revoked object URL, never browser storage (`useImageUpload.hook.ts`).

## Redaction and logging rules

- HTTP logs (pino): redact `authorization`, `cookie`, `req.url` (may carry share ids), body `password|token|secret`, `set-cookie` (`core/logger/logger.constants.ts`); 4xx→warn, 5xx→error.
- App-level: `modules/privacy` `redactForLog` caps values at 500 chars and replaces 64+ char base64 runs (the signature of leaked image bytes) and key/token/authorization secrets with `[REDACTED]`; used by the Gemini adapter on provider error text.
- Validation failures log field/constraint pairs only, never submitted values (`core/validation/validation-exception.factory.ts`).
- Error responses are the sanitized envelope only — no stacks, provider errors, or file contents (`core/errors/error-body.mapper.ts`).
- PayPal diagnostics are PII-free (name/issue/debug_id/description only — `paypal.adapter.ts`).
- Frontend: `packages/logger` is the only console; never image bytes/tokens (`rules/frontend/16-observability-analytics.md`).

## Share links (ephemeral by design)

- TTL default 600 s (60–3600 bounds), payload ≤50 KB, ≤1000 active items (`packages/shared/src/constants/share-result.constants.ts`; env-tunable — `knowledge/summaries/configuration.md`).
- CSPRNG UUID ids; missing and expired ids return the **identical 404** (no existence oracle); create re-validates the payload as untrusted — server-owned disclaimer equality, forbidden-wording re-scan, embedded-image (base64 data:) rejection (`modules/share-results/application/share-result-safety.service.ts`).
- In-memory driver only; records vanish on restart; `Cache-Control: private, no-store` on every share route. Share URL origin comes from server config `SHARE_RESULT_PUBLIC_BASE_URL`, never user input.

## Never-relaxable prohibitions

Images/biometrics/traits-tied-to-a-person are **not persistable and not ADR-able** (`memory/database-decisions.md` Decision 3, `memory/privacy-decisions.md`, `rules/20-repositories-database.md`). No identification of the user, ever (`CLAUDE.md` Twinzy constraints; safety chain in `knowledge/summaries/ai-pipeline.md`).
