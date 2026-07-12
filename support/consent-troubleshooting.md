---
id: support-consent-troubleshooting
title: Consent Troubleshooting — CONSENT_REQUIRED and Consent Copy Questions
type: support
authority: canonical
status: current
owner: repository owner
summary: Why consent rejections happen, how consent is enforced before any file processing, and how to answer questions about what the consent covers.
keywords: [support, consent, consent-required, checkbox, multipart, privacy, copy, upload]
contextTier: 2
relatedCode:
  [
    apps/api/src/core/http/multipart-upload.parser.ts,
    apps/api/src/modules/game/lib/consent.ts,
    apps/web/src/packages/i18n/messages/en.json,
  ]
relatedTests: [apps/api/src/tests/game-analyze.integration.test.ts, apps/api/src/modules/game/tests/consent.test.ts]
relatedDocs: [support/privacy-and-data-handling.md, support/upload-troubleshooting.md]
readWhen: A player hits the consent error or asks what exactly they are consenting to.
---

# Consent Troubleshooting

## What consent covers (the exact promise)

The checkbox copy is: *"I agree that my photo is processed in memory only to extract visible traits. Matching then uses the written traits only, and my photo is never stored."* (`upload.consentLabel`, `apps/web/src/packages/i18n/messages/en.json`). This copy is a product non-negotiable — it must accurately describe the pipeline (CLAUDE.md, Twinzy constraint #2), and the pipeline really does work that way ([privacy-and-data-handling.md](./privacy-and-data-handling.md)).

## How it is enforced

- The frontend disables the analyze flow until the box is ticked (`apps/web/src/modules/game/containers/game-setup.container.tsx`).
- The backend independently requires the consent field to be a literal `"true"`/`true` (`apps/api/src/modules/game/lib/consent.ts`) and the multipart parser requires the consent field to arrive **before the file is even buffered** — consent-last or consent-missing requests are rejected without processing the image (`apps/api/src/core/http/multipart-upload.parser.ts`).
- Rejection: HTTP 400, `CONSENT_REQUIRED`, player copy "Please tick the consent box before playing." (`errors.consentRequired`). Full catalog: [error-code-catalog.md](./error-code-catalog.md).

## Triage

| Situation | Explanation |
| --- | --- |
| Player says "I ticked the box but still get the error" | Almost certainly a stale tab or a custom/scripted client. Ask them to reload the page and retry in a normal browser session. The check is a two-sided contract; the standard UI cannot send the file without consent. |
| API-level callers (curl/scripts) get 400 | They must send `consent=true` as a multipart field **before** the file part (see the smoke-test example in [`../runbooks/release-smoke-test.md`](../runbooks/release-smoke-test.md)). |
| Player asks to "skip the checkbox" | Never. Consent-first is a product constraint; there is no supported bypass. |
| Player asks whether ticking the box stores their photo | No — the consent enables in-memory trait extraction only; the photo is wiped in `finally` and never persisted ([privacy-and-data-handling.md](./privacy-and-data-handling.md)). |

## Copy-accuracy escalation

If any deployed copy is found contradicting the consent promise (e.g. implying storage, identity matching, or — on a paywall-enabled deployment — "completely free" wording), that is a recorded release-gating concern: the PayPal paywall's LIVE approval is explicitly blocked on an en+ar copy revision (`docs/features/paypal-donations-and-paid-results/22-go-no-go.md`). Log it in [known-issues.md](./known-issues.md) and escalate to the repository owner.
