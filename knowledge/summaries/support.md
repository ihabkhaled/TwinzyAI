---
id: summary-support
title: Support Summary — User-Visible Errors, Troubleshooting, Known Issues
type: summary
authority: canonical
status: current
owner: repository owner
generated: false
summary: Routing digest for support — the error-code-to-copy chain, recurring support themes with the never-bypass stance, troubleshooting entry points, and where known issues are recorded.
keywords: [support, errors, error codes, troubleshooting, known issues, escalation, upload rejection, ai unavailable, messagekey, i18n copy]
contextTier: 1
relatedCode: [packages/shared/src/constants/error-code.constants.ts, apps/web/src/modules/game/model/game.constants.ts, apps/api/src/core/errors/error.constants.ts, apps/web/src/packages/i18n/messages/en.json]
relatedTests: [apps/api/src/core/errors/tests/error-body.mapper.test.ts]
relatedDocs: [support/README.md, runbooks/README.md, docs/manual-qa-checklist.md]
readWhen: You are handling a user-visible failure, writing support guidance, or mapping an error code to its copy.
---

# Support Summary — User-Visible Errors, Troubleshooting, Known Issues

## Support model (`support/README.md`)

No accounts, no stored data, and (by default) no payments to support. Recurring themes:
1. **Upload rejections** — safety working as designed; support explains, **never bypasses** (chain in `knowledge/summaries/security.md`).
2. **AI unavailability** — transient provider failure; the user retries; runbook `runbooks/ai-provider-outage.md`.
3. **Wording concerns** — any output that reads as identity/biometric is a **SEV-1 escalation to engineering**, never a ticket debate.
An escalation table in `support/README.md` maps symptoms to runbooks.

## How a user sees an error (the full chain)

1. Backend throws a typed `AppError`; the global filter emits the sanitized envelope `{statusCode, errorCode, message, messageKey}` (`apps/api/src/core/errors/`). Streamed failures reuse the same mapper so SSE error frames carry identical codes.
2. `ErrorCode` is the frozen 24-code cross-side catalog (`packages/shared/src/constants/error-code.constants.ts`): internal/validation/rateLimited, 6 upload codes (ConsentRequired, FileMissing, FileTooLarge, FileTypeNotAllowed, FileInvalid, MultipleFilesNotAllowed, VirusScanFailed), 5 AI codes (AiProviderUnavailable, AiRateLimited, AiResponseInvalid, AiResponseUnsafe, AiTimeout), ServerBusy, AnalysisCancelled, 3 payment codes, 4 share codes. Codes may be added, never renamed/removed.
3. Frontend maps codes to friendly i18n keys via `GAME_ERROR_KEY_BY_CODE` (`apps/web/src/modules/game/model/game.constants.ts`); `TRANSIENT_ERROR_CODES` drive the same-photo retry offer (`useRunRecovery`); cancel is classified as cancel, not error (`helpers/game-error.helper.ts`). Copy lives in `apps/web/src/packages/i18n/messages/{en,ar}.json`.
4. Status mapping cheat sheet: 400 consent/validation · 402 payment · 404 share not found/expired (identical) · 413 too large ("under 5 MB") · 415 type · 422 invalid/infected image · 429 rate limit or share capacity · 502 AI/payment provider down · 503 virus scanner unavailable.

## Troubleshooting entry points

- **Analyze fails with 502**: `runbooks/ai-provider-outage.md`; check provider chain env (`knowledge/summaries/ai-pipeline.md`) and pino logs by request id.
- **API down**: `runbooks/api-outage.md`; `GET /api/v1/health` proves liveness only (no dependency I/O).
- **Endless/stuck stream**: cannot happen by design — watchdog (`ANALYSIS_TIMEOUT_MS`) and stream TTL sweep guarantee terminal states; ServerBusy is an in-band rejection when concurrency caps are hit.
- **Uploads rejected with ClamAV enabled**: scanner errors fail closed (503) — check clamav container reachability (`CLAMAV_HOSTS`).
- **Share link "not found"**: expired, deleted, or restarted server (in-memory cache) — the 404 is deliberately identical for missing vs expired.
- **Payment step visible/invisible unexpectedly**: paywall is env-gated — both `PAYPAL_CLIENT_ID/SECRET` (server) and `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (UI) must be set; blank = free flow (`knowledge/summaries/product.md`).
- Manual verification pass: `docs/manual-qa-checklist.md` (device matrix, consent gating, friendly rejections, no photo in devtools storage).

## Known issues — where they live

- Per-release known-issues guidance: `support/known-issues-template.md` instances (e.g. `support/simple-readable-code-operating-system-implementation.md` — FAQ: photo used only for written-trait extraction, never stored; ranking changes are intentional privacy hardening).
- User-visible behavior changes per release: `release-notes/` (one file per release).
- Open cross-cutting risks/staleness: `knowledge/summaries/current-risks.md`.

## Help content in-app

`/help` renders a 5-question FAQ from the `help.*` i18n namespace; `/privacy` reuses the game module's `PrivacyNotice` (`apps/web/src/app/help/page.tsx`, `apps/web/src/app/privacy/page.tsx`).
