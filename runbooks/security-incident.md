---
id: runbook-security-incident
title: Runbook — Security Incident
type: runbook
authority: canonical
status: current
owner: repository owner
summary: The general security-incident procedure — classify, contain with the levers that exist, preserve evidence, eradicate, and close with a postmortem.
keywords: [runbook, security, incident, containment, evidence, rotation, disclosure, postmortem]
contextTier: 2
relatedCode: [docker-compose.yml, .env.example]
relatedTests: []
relatedDocs:
  [
    SECURITY.md,
    docs/security-threat-model.md,
    runbooks/privacy-incident.md,
    runbooks/secret-rotation.md,
    docs/sdlc/security-baseline.md,
  ]
readWhen: Any suspected attack, exposure, or abuse — before touching the affected system.
---

# Runbook — Security Incident

Reporting channel and product security promises are owned by `SECURITY.md`; the threat catalog by [`docs/security-threat-model.md`](../docs/security-threat-model.md); non-waivable invariants by [`docs/sdlc/security-baseline.md`](../docs/sdlc/security-baseline.md). Privacy-flavored incidents (image/data exposure) continue in [privacy-incident.md](./privacy-incident.md).

## Prerequisites

- An incident owner assigned (repository owner by default); an incident note started from [`incident-response-template.md`](./incident-response-template.md).
- Severity per [`../support/escalation-matrix.md`](../support/escalation-matrix.md) — security incidents are SEV-1 unless proven contained.

## Steps

### 1. Classify

Map to the threat model: malicious upload, log exfiltration, provider response injection, DoS, secret leakage, CORS/clickjacking, share-endpoint abuse (`docs/security-threat-model.md`); payment-specific threats per `docs/features/paypal-donations-and-paid-results/19-threat-model-paywall.md`.

### 2. Preserve evidence FIRST

```bash
docker compose logs api > api-sec-incident-$(date +%Y%m%d-%H%M).log
docker compose logs web > web-sec-incident-$(date +%Y%m%d-%H%M).log
docker compose ps > stack-state-$(date +%Y%m%d-%H%M).txt
```

Handle artifacts per [safe-diagnostics.md](./safe-diagnostics.md) — evidence files may themselves contain sensitive data.

### 3. Contain (levers that actually exist)

| Threat | Containment lever |
| --- | --- |
| Abuse from specific origins | Tighten `CORS_ALLOWED_ORIGINS` (empty = CORS fully closed, `apps/api/src/bootstrap/configure-security.ts`) |
| Request flooding | Lower `RATE_LIMIT_MAX` / concurrency caps (env + restart) |
| Compromised credential | Revoke + rotate immediately — [secret-rotation.md](./secret-rotation.md) |
| Payment abuse | Blank both PayPal credentials → paid gate off instantly ([rollback.md](./rollback.md) lever table) |
| Malicious model/provider behavior | Remove the provider key / clear `AI_ROUTE_*` |
| Vulnerable running release | Revert it — [emergency-rollback.md](./emergency-rollback.md) |
| Active harm with no precise lever | `docker compose down` — a down game is safer than a harmful one |

Note the attack-surface facts working for you: no database, no accounts, read-only containers with dropped capabilities, no upload volumes (`docker-compose.yml`), backend-only API keys, sanitized error envelope.

### 4. Eradicate and recover

Root-cause the entry path; fix via the defect workflow (fix + regression test + review — CLAUDE.md); redeploy; re-run `npm run security:audit`, `npm run security:scan`, and `npm run security:scan:secrets`; run the full [release-smoke-test.md](./release-smoke-test.md).

### 5. Close

Blameless postmortem for serious incidents (`27-postmortem.md`); update the threat model and this runbook set with what was learned; brief support ([`../support/known-issues.md`](../support/known-issues.md)); external disclosure decisions per `SECURITY.md` and the repository owner.

## Verify

Containment lever confirmed effective in logs; scanners clean; smoke test green; monitoring window agreed ([hypercare.md](./hypercare.md) applies after incident fixes too).

## Rollback

Containment levers are env-only and reversible once the threat is eradicated; restoring them without the fix redeployed re-opens the incident — verify eradication first.
