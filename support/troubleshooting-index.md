---
id: support-troubleshooting-index
title: Troubleshooting Index — Symptom to Owning Doc/Runbook
type: support
authority: canonical
status: current
owner: repository owner
summary: One routing table from any reported symptom to its likely cause and the owning troubleshooting doc or runbook.
keywords: [support, troubleshooting, index, symptoms, routing, runbooks, errors, triage]
contextTier: 2
relatedCode: []
relatedTests: []
relatedDocs: [support/escalation-matrix.md, support/error-code-catalog.md, runbooks/README.md]
readWhen: First stop for any support report — route from here.
---

# Troubleshooting Index

Severity/escalation rules: [escalation-matrix.md](./escalation-matrix.md). Error-code lookup: [error-code-catalog.md](./error-code-catalog.md).

| Symptom (player report) | Likely cause | Owning doc / runbook |
| --- | --- | --- |
| Site won't load / everything erroring | API or web outage | [`../runbooks/api-outage.md`](../runbooks/api-outage.md) |
| "The vibe engine is unavailable…" on analyze, site otherwise fine | AI provider outage/timeouts | [provider-outage-messaging.md](./provider-outage-messaging.md) → [`../runbooks/provider-outage.md`](../runbooks/provider-outage.md) |
| "Too many tries in a short time…" | Our throttle or provider quota | [`../runbooks/provider-rate-limiting.md`](../runbooks/provider-rate-limiting.md) |
| "The vibe engine is busy right now…" | Concurrency capacity (SERVER_BUSY) | [provider-outage-messaging.md](./provider-outage-messaging.md); many at once → [`../runbooks/latency.md`](../runbooks/latency.md) |
| Photo refused (any wording) | Upload validation chain | [upload-troubleshooting.md](./upload-troubleshooting.md) |
| Everyone's uploads failing with the scan message | ClamAV fail-closed | [`../runbooks/upload-failures.md`](../runbooks/upload-failures.md) |
| "Please tick the consent box…" | Consent enforcement | [consent-troubleshooting.md](./consent-troubleshooting.md) |
| Progress stuck / stream cut off mid-analysis | SSE disconnect, proxy buffering, watchdog | [`../runbooks/streaming-disconnects.md`](../runbooks/streaming-disconnects.md) |
| Analyses very slow for everyone | Provider latency / overload | [`../runbooks/latency.md`](../runbooks/latency.md) |
| Weird/garbled result, or repeated "could not read" errors | AI schema/validation failures | [`../runbooks/ai-schema-failures.md`](../runbooks/ai-schema-failures.md) |
| Result sounds like identity/face matching | Safety filter concern — **SEV-1** | [AI-result-expectations.md](./AI-result-expectations.md) → [escalation-matrix.md](./escalation-matrix.md) |
| "What does my score/no-match mean?" | Expected behavior | [AI-result-expectations.md](./AI-result-expectations.md) |
| Share link expired / dead / won't copy | TTL, restart, clipboard | [sharing-troubleshooting.md](./sharing-troubleshooting.md) |
| Wrong language, RTL glitch, translation failed | Locale cookie / translate endpoint | [localization-troubleshooting.md](./localization-troubleshooting.md) |
| Camera won't start | Browser permission | [product-behavior-guide.md](./product-behavior-guide.md) §2 (`game.cameraError`) |
| "Is this free?" / payment step appeared | Env-gated paywall state | [feature-catalog.md](./feature-catalog.md), [FAQ.md](./FAQ.md) |
| Charged but no result (paywall deployments) | Capture/refund path — **SEV-1 if no refund** | [escalation-matrix.md](./escalation-matrix.md) |
| Donate link missing/present unexpectedly | `NEXT_PUBLIC_PAYPAL_ME_USERNAME` | [feature-catalog.md](./feature-catalog.md) |
| Privacy/data questions | — | [privacy-and-data-handling.md](./privacy-and-data-handling.md), [FAQ.md](./FAQ.md) |
| Suspected image/secret in logs or output | Privacy incident — **SEV-1** | [`../runbooks/accidental-image-exposure.md`](../runbooks/accidental-image-exposure.md) |
| Anything right after a release | Release regression until proven otherwise | [release-support-checklist.md](./release-support-checklist.md) → [`../runbooks/rollback.md`](../runbooks/rollback.md) |
| Report matches something familiar | Known issue | [known-issues.md](./known-issues.md) |
