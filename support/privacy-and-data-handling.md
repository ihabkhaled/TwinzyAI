---
id: support-privacy-and-data-handling
title: Privacy and Data Handling — Support-Facing Answers
type: support
authority: canonical
status: current
owner: repository owner
summary: Verified support answers about photos, storage, logs, sharing, and payments data, with pointers to the owning privacy documents.
keywords: [support, privacy, data-handling, image-lifecycle, retention, dsr, logs, redaction, gdpr]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/file-security/application/temporary-file-cleanup.service.ts,
    apps/api/src/modules/privacy/lib/log-redaction.helpers.ts,
    apps/api/src/modules/payments/model/payment.types.ts,
  ]
relatedTests: [apps/api/src/tests/game-analyze.integration.test.ts, apps/api/src/modules/privacy/tests/log-redaction.helpers.test.ts]
relatedDocs:
  [
    docs/privacy-and-data-retention.md,
    domain/image-lifecycle.md,
    docs/ai-safety.md,
    support/FAQ.md,
  ]
readWhen: Any player or stakeholder question about what Twinzy knows, stores, or shares.
---

# Privacy and Data Handling — Support-Facing Answers

Canonical owners: retention posture in [`docs/privacy-and-data-retention.md`](../docs/privacy-and-data-retention.md); the photo's full lifecycle in [`domain/image-lifecycle.md`](../domain/image-lifecycle.md); AI-safety guarantees in [`docs/ai-safety.md`](../docs/ai-safety.md). This page condenses them into support-ready answers.

## The photo

- Lives **only in server request memory** for one analysis; the buffer is zero-filled in a `finally` block on success, failure, or abort (`apps/api/src/modules/file-security/application/temporary-file-cleanup.service.ts`); the multipart parser zero-fills even partially-buffered files on any parse failure (`apps/api/src/core/http/multipart-upload.parser.ts`).
- Never written to disk — uploads use memory storage, the containers run with read-only filesystems and deliberately **no volumes** ("uploads must never persist", `docker-compose.yml`).
- Seen by exactly one pipeline step: trait extraction. Candidate generation, judging, translation, sharing, and display are text-only by construction and by lint enforcement (`docs/ai-safety.md`).
- Never logged: log values are capped and base64 runs (the signature of image bytes) are replaced with `[REDACTED]` (`apps/api/src/modules/privacy/lib/log-redaction.helpers.ts`).
- In the browser: the selected photo is an in-memory `File` + object URL only, never written to any browser storage (`apps/web/src/modules/game/hooks/useImageUpload.hook.ts`).

## Everything else

| Question | Grounded answer |
| --- | --- |
| Accounts / profiles? | None exist. The game is anonymous (`SECURITY.md`). |
| Results stored? | No. A result exists in the response and optionally in a short-lived in-memory share record (default 10 min TTL, text-only) — nothing else (`docs/privacy-and-data-retention.md`). |
| Data-deletion (DSR/GDPR-style) requests? | There is nothing to delete — no database, no stored images, no stored results. Answer honestly and point to the privacy page copy (`apps/web/src/app/privacy/page.tsx`). |
| Share links | Text-only safe result JSON; share ingest re-runs the safety filter and rejects any embedded image data ([sharing-troubleshooting.md](./sharing-troubleshooting.md)). |
| What third parties see | The AI provider(s) receive the photo for trait extraction only (Gemini; the privacy page discloses this — `privacy.geminiNote`) and written traits for the text-only steps. Model/route selection is env-driven (`docs/provider-routing.md`). |
| Payment data (paywall-enabled deployments only) | Twinzy stores no orders, card data, or payer identity; capture verification keeps only in-memory order/capture ids for the life of the request (`PaymentCaptureRecord` — "never persisted", `apps/api/src/modules/payments/model/payment.types.ts`). PayPal is the ledger; disputes are resolved in the PayPal dashboard. |
| Biometrics / face templates | Never created or kept (`privacy.noTemplates` copy; enforced pipeline — [AI-result-expectations.md](./AI-result-expectations.md)). |

## Escalation triggers (do not debate in-ticket)

- Any suspicion an image byte, base64 blob, or secret appeared in a log, response, or share payload → **SEV-1 privacy incident**: [../runbooks/privacy-incident.md](../runbooks/privacy-incident.md) / [../runbooks/accidental-image-exposure.md](../runbooks/accidental-image-exposure.md).
- Identity/biometric-sounding result wording → SEV-1 safety escalation ([escalation-matrix.md](./escalation-matrix.md)).
