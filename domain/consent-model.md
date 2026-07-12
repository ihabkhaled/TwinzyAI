---
id: domain-consent-model
title: Consent Model — Literal-True, Checked First, Copy-Accurate
type: domain
authority: canonical
status: current
owner: repository owner
summary: How consent works — the literal 'true' flag, its first-in-chain enforcement on the backend, the frontend submit gate, and the accuracy contract between the checkbox copy and the pipeline.
keywords: [consent, privacy, checkbox, literal-true, first-gate, copy-accuracy, upload, i18n]
contextTier: 2
relatedCode: [apps/api/src/modules/game/lib/consent.ts, apps/api/src/modules/game/api/dto/analyze-request.dto.ts, apps/api/src/modules/file-security/application/file-security.service.ts]
relatedTests: [apps/api/src/modules/game/tests/consent.test.ts, apps/api/src/modules/file-security/tests/file-security.service.test.ts]
relatedDocs: [domain/image-lifecycle.md, rules/15-file-upload-security.md, docs/privacy-and-data-retention.md]
readWhen: You are touching the consent flag, the upload flow, or any copy that describes what happens to the photo.
---

# Consent Model — Literal-True, Checked First, Copy-Accurate

Twinzy is consent-first (`CLAUDE.md`, Twinzy constraint #2): the photo is processed only after
explicit consent whose copy accurately describes the pipeline.

## What counts as consent

- The multipart `consent` field must be the **literal string `"true"`** (or boolean `true`
  from JSON clients) — `AnalyzeRequestBodySchema`:
  `z.union([z.literal('true'), z.literal(true)]).optional()`
  (`apps/api/src/modules/game/api/dto/analyze-request.dto.ts`, line 19). Anything else —
  `"yes"`, `"1"`, absent — is not consent.
- `isConsentGiven(body)` is the single reader
  (`apps/api/src/modules/game/lib/consent.ts`).
- Wire constants: `UPLOAD_CONSENT_FIELD_NAME = 'consent'`,
  `UPLOAD_CONSENT_GRANTED_VALUE = 'true'`; the consent field must precede the file part
  (`packages/shared/src/constants/upload.constants.ts`).

## Where it is checked

1. **Backend, first in the chain.** `FileSecurityService.assertSafeImage(file, consent)`
   asserts consent BEFORE presence, size, type, magic-byte, decode, and virus checks
   (`apps/api/src/modules/file-security/application/file-security.service.ts`, lines 33–47).
   Missing consent throws a typed `ConsentRequired` validation error
   ([failure-semantics.md](failure-semantics.md)).
2. **Before any AI or payment work.** Both analyze use-cases run the consent+file chain
   before payment capture and before extraction
   (`apps/api/src/modules/game/application/analyze-game-stream.use-case.ts`, lines 108–110;
   `analyze-game.use-case.ts`).
3. **Frontend submit gate.** The analyze action is disabled until the checkbox is ticked —
   `canAnalyze` requires `consentGiven`
   (`apps/web/src/modules/game/hooks/useGame.hook.ts`, lines 49–61; checkbox in
   `apps/web/src/modules/game/components/upload-consent.component.tsx`). The frontend gate is
   UX only; the backend check is authoritative.

## The copy-accuracy contract

The checkbox copy must describe the actual pipeline. Current copy
(`apps/web/src/packages/i18n/messages/en.json`, line 71; Arabic parity in `ar.json`):

> "I agree that my photo is processed in memory only to extract visible traits. Matching then
> uses the written traits only, and my photo is never stored."

This matches the enforced behavior exactly: memory-only image, extraction-only, text-only
matching, no persistence — the enforcement is owned by
[image-lifecycle.md](image-lifecycle.md).

**Recorded open caveat (not silent):** before the paywall may go LIVE, the owner must sign off
revised consent/privacy copy in both languages — open condition 3 in
[docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md).
Until then the paywall stays sandbox/off and the current copy remains accurate for the
default (free) configuration.

## Consent does not persist

There is no consent record, cookie, or audit store — consistent with the no-persistence
design (`apps/api/src/modules/privacy/privacy.module.ts`). Consent is asserted per request
and forgotten with the request.
