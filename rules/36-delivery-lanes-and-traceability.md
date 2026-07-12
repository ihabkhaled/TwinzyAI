---
id: rule-36-delivery-lanes-and-traceability
title: 36 — Delivery Lanes & Change Traceability
type: rule
authority: canonical
status: current
owner: repository owner
summary: Every change rides a deterministic risk lane (fast/standard/critical) that scales artifact weight — never phase existence — and stays traceable to its record.
keywords: [lanes, fast lane, critical lane, traceability, artifacts, risk]
contextTier: 2
relatedDocs: [knowledge/delivery-lanes.yaml, knowledge/risk-classification.yaml, CLAUDE.md]
readWhen: classifying a change, planning artifacts, or reviewing scope vs record
---

# 36 — Delivery Lanes & Change Traceability

1. **Every change has a lane.** [knowledge/risk-classification.yaml](../knowledge/risk-classification.yaml)
   maps touched paths and task keywords to **fast**, **standard**, or **critical**
   deterministically; the highest match wins and ambiguity escalates one lane. The resolver
   reports the lane; overriding it downward requires a recorded justification.
2. **Lanes scale weight, never existence.** Every CLAUDE.md lifecycle concern (intake,
   analysis, impact, standards, tests, validation, docs, rollback) exists in every lane — the
   fast lane compresses them into one compact task record; the critical lane keeps the full
   artifact set including threat model and specialist reviews
   ([knowledge/delivery-lanes.yaml](../knowledge/delivery-lanes.yaml)).
3. **Critical is critical.** Payments/paywall, privacy boundary, consent copy, uploads,
   prompts/AI-safety, auth, public contract breaks, persistence, infrastructure topology,
   releases, rollbacks, incidents. No fast-lane shortcuts ever apply there, and the routed
   specialist reviewers are mandatory, not advisory.
4. **Traceability is bidirectional.** A change points to its record
   (`docs/features/<slug>/` or the fast-lane task record) and the record reflects the shipped
   scope. Scope that grew beyond the record re-enters classification; a record that promises
   what did not ship is corrected in the same stream.
5. **Recorded decisions gate scope.** Owner-gated programs (like the paywall) define their own
   recorded conditions; changing such a surface outside its program's record — however small —
   is a critical-lane violation, not a shortcut.
6. **Bypasses are incidents.** Skipping a lane's gates, hooks, or reviewers without a recorded
   owner-approved exception is treated as a process incident: record it, fix forward, and feed
   the retrospective.
