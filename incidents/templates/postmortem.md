---
id: incident-postmortem-template
title: Blameless Postmortem Template
type: incident
authority: canonical
status: current
owner: repository owner
summary: Template for the blameless postmortem that follows serious incidents — root cause, contributing factors, detection review, and corrective actions with owners.
keywords: [postmortem, blameless, root-cause, corrective-actions, detection, learnings, template]
contextTier: 3
relatedCode: []
relatedTests: []
relatedDocs: [incidents/README.md, incidents/templates/incident-record.md, docs/sdlc/company-sdlc-policy.md]
readWhen: You are writing the postmortem for a resolved serious incident.
---

# Postmortem: <incident title>

<!-- Required sections mirror CLAUDE.md's 27-postmortem.md contract: incident summary, impact,
     timeline, root cause, contributing factors, detection review, corrective actions,
     policy and process changes. Blameless: systems and causes, never people. -->

## Incident summary

<!-- Two or three sentences. Link the incident record in incidents/resolved/. -->

## Impact

<!-- Duration, affected users/flows, money involved (paywall captures/refunds), data
     implications (normally none — the API persists nothing; see
     docs/privacy-and-data-retention.md). -->

## Timeline

<!-- Condensed from the incident record; keep only decision-relevant events. -->

## Root cause

<!-- The defect or condition that made the incident possible. "The symptom disappeared" is not
     a root cause (CLAUDE.md: a bug is fixed when the root cause is understood, covered, and
     regression-checked). -->

## Contributing factors

<!-- Configuration, missing observability, gaps in runbooks/tests/docs, process misses. -->

## Detection review

<!-- How was it detected, how long did detection take, and what signal was missing? Check
     against operations/observability-map.md — if the needed signal does not exist, that is a
     corrective action. -->

## Corrective actions

| # | Action | Owner | Type (fix / test / observability / runbook / policy) | Status |
| --- | --- | --- | --- | --- |
| 1 | | | | open |

<!-- Every escaped defect gets a regression test or documented reproducible validation
     (CLAUDE.md Test Design rules). -->

## Policy and process changes

<!-- What must change permanently: CLAUDE.md / rules/ updates, runbook edits, new checks.
     Recurring pitfalls also go to memory/known-pitfalls.md. Record "none" explicitly if so. -->

## Learnings-index entry

<!-- Paste the YAML entry added to incidents/learnings-index.yaml for this incident. -->
