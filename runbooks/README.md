---
id: runbooks-readme
title: Runbooks — Twinzy
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Index of all operational runbooks for the Twinzy stack — development, deployment, incidents, providers, performance, and safety procedures.
keywords: [runbook, index, operations, incident, deployment, rollback, outage, oncall]
contextTier: 2
relatedCode: [docker-compose.yml]
relatedTests: []
relatedDocs: [support/README.md, docs/sdlc/company-sdlc-policy.md]
readWhen: Entry point for any operational procedure.
---

# Runbooks — Twinzy

Operational procedures an engineer or on-call owner can execute during release, incident response, rollback, recovery, or degraded service for the Twinzy stack (Docker Compose: `api` on 4000, `web` on 3000, optional `clamav` profile on 3310).

Ground truth for operations: structured pino JSON logs with request-id correlation (4xx log as `warn`, 5xx as `error`), the `ApiErrorResponse` envelope, and **no database** — rollback is always `git revert` + redeploy. Escalation and severity rules: [`docs/sdlc/company-sdlc-policy.md`](../docs/sdlc/company-sdlc-policy.md) applied via [`support/escalation-matrix.md`](../support/escalation-matrix.md).

## Development & environment

| Runbook | When to use |
| --- | --- |
| [`local-development.md`](./local-development.md) | Set up / fix local dev (incl. the `build:shared` trap) |
| [`environment-bootstrap.md`](./environment-bootstrap.md) | Create or repair a `.env` from `.env.example` |
| [`docker.md`](./docker.md) | Operate the Compose stack (up/down/logs/rebuild, ClamAV profile, healthchecks) |
| [`config-change.md`](./config-change.md) | Add/change any env var (schema → example → docs → knowledge rebuild) |
| [`secret-rotation.md`](./secret-rotation.md) | A secret was exposed or needs routine rotation (Gemini, PayPal, provider keys) |

## Release & change

| Runbook | When to use |
| --- | --- |
| [`deployment.md`](./deployment.md) | Deploy the stack (gated) |
| [`release-smoke-test.md`](./release-smoke-test.md) | Post-deploy verification of every release |
| [`rollback.md`](./rollback.md) | Undo a release; env-lever feature disablement |
| [`emergency-rollback.md`](./emergency-rollback.md) | Active SEV-1 impact, minutes matter |
| [`hotfix.md`](./hotfix.md) | Fix-forward on the compressed (never looser) track |
| [`hypercare.md`](./hypercare.md) | Post-release / post-fix observation window |

## Incidents — availability & performance

| Runbook | When to use |
| --- | --- |
| [`api-outage.md`](./api-outage.md) | The API is down or unresponsive |
| [`provider-outage.md`](./provider-outage.md) | Analyze failing with AI errors (multi-provider routing view) |
| [`ai-provider-outage.md`](./ai-provider-outage.md) | Gemini-focused provider outage detail (log signatures, rates) |
| [`provider-rate-limiting.md`](./provider-rate-limiting.md) | 429s / "busy" — our throttles vs provider quotas vs concurrency |
| [`ai-schema-failures.md`](./ai-schema-failures.md) | Sustained `AI_RESPONSE_INVALID`/`AI_RESPONSE_UNSAFE` |
| [`upload-failures.md`](./upload-failures.md) | Upload rejection spikes; ClamAV fail-closed 503s |
| [`streaming-disconnects.md`](./streaming-disconnects.md) | SSE streams stuck, cut, or rejected |
| [`latency.md`](./latency.md) | Slow analyses; capacity questions (ADR-003 boundary) |
| [`memory-growth.md`](./memory-growth.md) | Rising memory / OOM restarts |
| [`event-loop-lag.md`](./event-loop-lag.md) | Everything slow at once, health endpoint included |

## Incidents — security & privacy

| Runbook | When to use |
| --- | --- |
| [`security-incident.md`](./security-incident.md) | Any suspected attack, exposure, or abuse |
| [`privacy-incident.md`](./privacy-incident.md) | Suspected breach of a privacy promise; identity-sounding output |
| [`accidental-image-exposure.md`](./accidental-image-exposure.md) | Suspected image-byte leak — verification checklist |
| [`dependency-vulnerability.md`](./dependency-vulnerability.md) | CVE/advisory in the dependency tree |
| [`safe-diagnostics.md`](./safe-diagnostics.md) | What you may/may not log or copy while debugging (read before instrumenting) |

## Templates

| Template | Purpose |
| --- | --- |
| [`incident-response-template.md`](./incident-response-template.md) | Start a new incident runbook |
| [`rollback-template.md`](./rollback-template.md) | Document a release-specific rollback procedure |
| [`release-smoke-test-template.md`](./release-smoke-test-template.md) | Define smoke tests for a specific release |
