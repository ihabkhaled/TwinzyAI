---
id: support-readme
title: Support — Twinzy
type: support
authority: canonical
status: current
owner: repository owner
summary: The support model for Twinzy and the index of all support enablement docs, FAQs, troubleshooting guides, and templates.
keywords: [support, index, escalation, upload, ai, wording, known-issues, readiness]
contextTier: 2
relatedCode: []
relatedTests: []
relatedDocs: [support/escalation-matrix.md, support/troubleshooting-index.md, runbooks/README.md]
readWhen: Entry point for anything support-related.
---

# Support — Twinzy

Use this folder for support enablement, escalation guidance, FAQs, known issues, and player-facing operational notes linked to shipped changes.

## What support deals with in this product

Twinzy has no accounts and stores nothing — so there are no password resets or data-deletion requests (there is no data to delete; images live in memory for the request only). Payments are **off by default**: with no PayPal credentials configured the game is fully free and no payment code runs; an owner-approved, env-gated PayPal paywall exists but is approved for sandbox only (see [feature-catalog.md](./feature-catalog.md)). The recurring support themes are:

- **Upload rejections** — the photo is refused: missing consent (400), too large (413, over the 5 MB default), wrong or inconsistent file type, multiple files, or a failed virus scan. These are safety features working as designed; support explains, never bypasses. → [upload-troubleshooting.md](./upload-troubleshooting.md)
- **AI unavailability** — the analyze step fails with a "try again later" style error (502) because the AI provider is timing out or erroring. Nothing is lost; the player just retries later. → [provider-outage-messaging.md](./provider-outage-messaging.md)
- **Wording concerns** — a player reads a result as identity/biometric matching. This is always a `SEV-1`-grade escalation to engineering (AI-safety filter review), never a wording debate in a ticket. → [AI-result-expectations.md](./AI-result-expectations.md)

## Doc index

| Question | Doc |
| --- | --- |
| What should the player be seeing right now? | [product-behavior-guide.md](./product-behavior-guide.md) |
| Is feature X enabled here? | [feature-catalog.md](./feature-catalog.md) |
| Standard answers to player questions | [FAQ.md](./FAQ.md) |
| Route any symptom to its owner | [troubleshooting-index.md](./troubleshooting-index.md) |
| What does this error code mean? | [error-code-catalog.md](./error-code-catalog.md) |
| What copy does the UI show per error? | [user-visible-error-guide.md](./user-visible-error-guide.md) |
| What do results claim / not claim? | [AI-result-expectations.md](./AI-result-expectations.md) |
| Uploads / consent / sharing / language issues | [upload-troubleshooting.md](./upload-troubleshooting.md) · [consent-troubleshooting.md](./consent-troubleshooting.md) · [sharing-troubleshooting.md](./sharing-troubleshooting.md) · [localization-troubleshooting.md](./localization-troubleshooting.md) |
| What players see during AI incidents | [provider-outage-messaging.md](./provider-outage-messaging.md) |
| Privacy answers | [privacy-and-data-handling.md](./privacy-and-data-handling.md) |
| Current known issues | [known-issues.md](./known-issues.md) |
| When and where to escalate | [escalation-matrix.md](./escalation-matrix.md) |
| What evidence to gather | [evidence-collection.md](./evidence-collection.md) |
| Ready-made player replies | [communication-templates.md](./communication-templates.md) |
| Release-time support duties | [release-support-checklist.md](./release-support-checklist.md) |

## Escalation

Support escalates through the runbooks — that is the contract with engineering. The full severity/symptom matrix is [escalation-matrix.md](./escalation-matrix.md); the quick version:

| Symptom | Runbook |
| --- | --- |
| Site/API down or erroring broadly | [`runbooks/api-outage.md`](../runbooks/api-outage.md) |
| Analyze failing, site otherwise fine | [`runbooks/provider-outage.md`](../runbooks/provider-outage.md) (Gemini detail: [`runbooks/ai-provider-outage.md`](../runbooks/ai-provider-outage.md)) |
| Anything right after a release | [`runbooks/release-smoke-test.md`](../runbooks/release-smoke-test.md) (verify) then rollback per [`runbooks/rollback.md`](../runbooks/rollback.md) |

Evidence to gather before escalating: timestamp, approximate error message the player saw, and (if available from the client) the request id — engineering correlates it directly in the structured logs. Full list: [evidence-collection.md](./evidence-collection.md).

## Templates

- [`known-issues-template.md`](./known-issues-template.md) — one file per known issue during a release/hypercare window (live register: [known-issues.md](./known-issues.md))
- [`support-readiness-template.md`](./support-readiness-template.md) — filled per release as part of the release checklist ([`docs/sdlc/release-checklist.md`](../docs/sdlc/release-checklist.md)); see [release-support-checklist.md](./release-support-checklist.md)
