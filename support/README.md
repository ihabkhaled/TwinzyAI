# Support — Twinzy

Use this folder for support enablement, escalation guidance, FAQs, known issues, and player-facing operational notes linked to shipped changes.

## What support deals with in this product

Twinzy has no accounts, no payments, and stores nothing — so there are no password resets, billing disputes, or data-deletion requests (there is no data to delete; images live in memory for the request only). The recurring support themes are:

- **Upload rejections** — the photo is refused: missing consent (400), too large (413, over the 5 MB default), wrong or inconsistent file type, multiple files, or a failed virus scan. These are safety features working as designed; support explains, never bypasses.
- **AI unavailability** — the analyze step fails with a "try again later" style error (502) because the AI provider is timing out or erroring. Nothing is lost; the player just retries later.
- **Wording concerns** — a player reads a result as identity/biometric matching. This is always a `SEV-1`-grade escalation to engineering (AI-safety filter review), never a wording debate in a ticket.

## Escalation

Support escalates through the runbooks — that is the contract with engineering:

| Symptom | Runbook |
| --- | --- |
| Site/API down or erroring broadly | [`runbooks/api-outage.md`](../runbooks/api-outage.md) |
| Analyze failing, site otherwise fine | [`runbooks/ai-provider-outage.md`](../runbooks/ai-provider-outage.md) |
| Anything right after a release | [`runbooks/release-smoke-test.md`](../runbooks/release-smoke-test.md) (verify) then rollback per [`runbooks/rollback-template.md`](../runbooks/rollback-template.md) |

Evidence to gather before escalating: timestamp, approximate error message the player saw, and (if available from the client) the request id — engineering correlates it directly in the structured logs.

## Templates

- [`known-issues-template.md`](./known-issues-template.md) — one file per known issue during a release/hypercare window
- [`support-readiness-template.md`](./support-readiness-template.md) — filled per release as part of the release checklist ([`docs/sdlc/release-checklist.md`](../docs/sdlc/release-checklist.md))
