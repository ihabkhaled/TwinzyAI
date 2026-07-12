---
id: support-escalation-matrix
title: Escalation Matrix — Severity, Owners, and Runbooks
type: support
authority: canonical
status: current
owner: repository owner
summary: Severity definitions and the symptom-to-runbook escalation contract between support and engineering.
keywords: [support, escalation, severity, sev-1, runbooks, incident, safety, privacy, payments]
contextTier: 2
relatedCode: []
relatedTests: []
relatedDocs:
  [
    support/README.md,
    support/troubleshooting-index.md,
    runbooks/README.md,
    docs/sdlc/company-sdlc-policy.md,
  ]
readWhen: Deciding whether and where to escalate a support report.
---

# Escalation Matrix

Severity and process rules are owned by [`docs/sdlc/company-sdlc-policy.md`](../docs/sdlc/company-sdlc-policy.md); this matrix applies them to Twinzy's actual failure surface. Evidence to attach before escalating: [evidence-collection.md](./evidence-collection.md). The repository owner is the single accountable owner for every lane (solo-maintained repository — `owner: repository owner` throughout the SDLC artifacts).

## SEV-1 — escalate immediately, page the owner

| Symptom | Runbook / procedure |
| --- | --- |
| Site or API down / erroring broadly | [`../runbooks/api-outage.md`](../runbooks/api-outage.md) |
| Result wording that sounds like identity/biometric matching or sensitive inference | Safety escalation — capture exact wording; [`../runbooks/privacy-incident.md`](../runbooks/privacy-incident.md); never a ticket wording debate (`support/README.md`) |
| Any suspicion of image bytes/base64 in logs, responses, or share payloads | [`../runbooks/accidental-image-exposure.md`](../runbooks/accidental-image-exposure.md) |
| Secret exposed (API key, PayPal credential) | [`../runbooks/secret-rotation.md`](../runbooks/secret-rotation.md) + [`../runbooks/security-incident.md`](../runbooks/security-incident.md) |
| Paywall deployment: player charged, no result, and no automatic refund (look for "REFUND FAILED" in API logs) | [`../runbooks/security-incident.md`](../runbooks/security-incident.md) triage + PayPal dashboard reconciliation (`payment-gate.service.ts`) |
| Anything broken immediately after a release | [`../runbooks/release-smoke-test.md`](../runbooks/release-smoke-test.md) verify, then [`../runbooks/rollback.md`](../runbooks/rollback.md) / [`../runbooks/emergency-rollback.md`](../runbooks/emergency-rollback.md) |

## SEV-2 — same business day

| Symptom | Runbook / doc |
| --- | --- |
| Analyze failing while the site is fine (AI provider trouble) | [`../runbooks/provider-outage.md`](../runbooks/provider-outage.md) (Gemini-specific detail: [`../runbooks/ai-provider-outage.md`](../runbooks/ai-provider-outage.md)) |
| Widespread 429s / "busy" errors | [`../runbooks/provider-rate-limiting.md`](../runbooks/provider-rate-limiting.md) |
| All uploads rejected with the scan-failure message (503) | [`../runbooks/upload-failures.md`](../runbooks/upload-failures.md) — ClamAV fail-closed |
| Streams disconnecting / progress stuck for many players | [`../runbooks/streaming-disconnects.md`](../runbooks/streaming-disconnects.md) |
| Sustained `AI_RESPONSE_INVALID`/`AI_RESPONSE_UNSAFE` rate | [`../runbooks/ai-schema-failures.md`](../runbooks/ai-schema-failures.md) |
| Noticeably slow analyses across players | [`../runbooks/latency.md`](../runbooks/latency.md) |

## SEV-3 — normal queue

| Symptom | Doc |
| --- | --- |
| Individual upload rejections | [upload-troubleshooting.md](./upload-troubleshooting.md) |
| Individual share-link expiry/copy issues | [sharing-troubleshooting.md](./sharing-troubleshooting.md) |
| Language/RTL/translation questions | [localization-troubleshooting.md](./localization-troubleshooting.md) |
| "What does my result mean?" | [AI-result-expectations.md](./AI-result-expectations.md) |
| Feature-enablement confusion (donate link, payment step) | [feature-catalog.md](./feature-catalog.md) |

## Rules

1. When in doubt between two severities, pick the higher one.
2. Safety and privacy symptoms are never downgraded regardless of player count.
3. Every SEV-1/SEV-2 gets a known-issue entry while active ([known-issues.md](./known-issues.md)) and player wording from [communication-templates.md](./communication-templates.md).
