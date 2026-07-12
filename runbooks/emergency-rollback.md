---
id: runbook-emergency-rollback
title: Runbook — Emergency Rollback
type: runbook
authority: canonical
status: current
owner: repository owner
summary: The compressed rollback sequence for active SEV-1 impact — mitigate first with env levers or full revert, verify, then backfill the paper trail.
keywords: [runbook, emergency, rollback, sev-1, mitigation, incident, revert, hotfix]
contextTier: 2
relatedCode: [docker-compose.yml]
relatedTests: []
relatedDocs: [runbooks/rollback.md, runbooks/hotfix.md, runbooks/incident-response-template.md]
readWhen: Players are actively harmed by the running release and minutes matter.
---

# Runbook — Emergency Rollback

Hotfix-track rule: faster, **not looser** — analysis may be compressed, traceability may not be erased (CLAUDE.md Hotfix Rules). Standard procedure with full context: [rollback.md](./rollback.md).

## Trigger

Active SEV-1: sustained 5xx, privacy/AI-safety regression, payment misbehavior, or a broken core flow — attributable to the current release.

## Steps (in order, no detours)

1. **Snapshot evidence (30 seconds, do not skip):**
   ```bash
   docker compose logs api > api-emergency-$(date +%Y%m%d-%H%M).log
   ```
2. **Cheapest effective mitigation first — env levers** (see the lever table in [rollback.md](./rollback.md)): blanking PayPal credentials kills the paywall; clearing `AI_ROUTE_*` restores default routing; removing a provider key disables it. Apply + `docker compose up -d --build` (frontend `NEXT_PUBLIC_*` levers need the web image rebuilt).
3. **If no lever covers it — full revert:**
   ```bash
   git revert <release-slice-shas>
   docker compose up -d --build
   ```
   Never force-push; never bypass hooks. If a clean revert is impossible (conflicts), redeploy the last known-good revision instead and record that deviation.
4. **Total outage variant:** if the running release is actively leaking or charging wrongly and a rebuild will take time, `docker compose down` is a legitimate stopgap — a down game is safer than a harmful one (consent/privacy/payments are product-defining constraints, CLAUDE.md).

## Verify

Minimum bar before standing down:

- [ ] `curl -i http://localhost:4000/api/v1/health` → 200 + `x-content-type-options: nosniff`
- [ ] Analyze happy path once ([release-smoke-test.md](./release-smoke-test.md) §3)
- [ ] The triggering symptom is gone from live logs

Then run the full smoke test.

## Rollback (of this action)

Reverts and env changes are reversible by the same mechanisms; nothing destructive is performed in this runbook (no data exists to destroy).

## Backfill (same day — mandatory)

1. Incident notes from [`incident-response-template.md`](./incident-response-template.md); timeline from the evidence snapshot.
2. Support brief + known-issue entry ([`../support/known-issues.md`](../support/known-issues.md), templates in [`../support/communication-templates.md`](../support/communication-templates.md)).
3. Record what was skipped and why; emergency bypasses of process require written record (CLAUDE.md pre-commit/gate rules).
4. Defect workflow for the root cause; postmortem (`27-postmortem.md`) for material impact; retrospective is mandatory for hotfix tracks.
