---
id: incident-record-template
title: Incident Record Template
type: incident
authority: canonical
status: current
owner: repository owner
summary: Copy this template to incidents/active/YYYY-MM-DD-slug.md when an incident is declared; fill it during the incident, not afterwards.
keywords: [incident, template, record, timeline, severity, impact, mitigation, response]
contextTier: 3
relatedCode: []
relatedTests: []
relatedDocs: [incidents/README.md, runbooks/incident-response-template.md, incidents/templates/postmortem.md]
readWhen: You are opening a new incident record.
---

# Incident: <short title>

<!-- Copy to incidents/active/YYYY-MM-DD-<slug>.md. Fill in real time. -->

## Summary

| Field | Value |
| --- | --- |
| Incident ID | INC-YYYY-NNN |
| Declared (UTC) | |
| Resolved (UTC) | |
| Severity | SEV-1 / SEV-2 / SEV-3 (see [incidents/README.md](../README.md) severity guidance) |
| Status | active / mitigated / resolved |
| Incident lead | |
| Affected surface | api / web / clamav / AI provider / payments / share links |
| Runbook used | link into [runbooks/](../../runbooks/README.md), or "none — new scenario" |
| Related release / commit | |

## Impact

<!-- Who/what was affected, for how long, and how it was observed (logs, healthcheck,
     user report). Cite errorCodes and request ids where useful — never personal data. -->

## Timeline (UTC)

| Time | Event / action | Actor |
| --- | --- | --- |
| | detected via … | |
| | … | |

## Mitigation

<!-- What restored service (restart, rollback via git revert + redeploy, config change,
     provider recovery). Note whether the rollback path in
     operations/graceful-shutdown.md assumptions held. -->

## Open questions during the incident

<!-- Unknowns tracked to resolution or explicit acceptance (CLAUDE.md cross-phase rules). -->

## Follow-ups

- [ ] Postmortem required? (serious defect / failed release / money involved → yes; use
      [templates/postmortem.md](postmortem.md))
- [ ] Corrective actions filed with owners
- [ ] Entry added to [learnings-index.yaml](../learnings-index.yaml) on close
- [ ] Record moved to `incidents/resolved/`
