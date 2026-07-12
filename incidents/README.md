---
id: incidents-readme
title: incidents/ — Incident Records Area
type: incident
authority: canonical
status: current
owner: repository owner
summary: How incidents are recorded — one file per incident in active/, moved to resolved/ after a blameless postmortem, with learnings indexed for the knowledge system.
keywords: [incidents, postmortem, blameless, active, resolved, learnings, severity, process]
contextTier: 3
relatedCode: []
relatedTests: []
relatedDocs: [runbooks/README.md, support/README.md, memory/known-pitfalls.md, docs/sdlc/company-sdlc-policy.md]
readWhen: An incident is happening, just ended, or you need to learn from past ones.
---

# incidents/ — Incident Records Area

Runbooks say **what to do** during a failure ([runbooks/README.md](../runbooks/README.md));
this area records **what actually happened**. The governing policy is CLAUDE.md's Hypercare
And Postmortem Rules (blameless postmortems for serious defects; learnings that change policy
update the canonical docs) and phase 27 of
[docs/sdlc/company-sdlc-policy.md](../docs/sdlc/company-sdlc-policy.md).

## Process

1. **Open** — create `active/YYYY-MM-DD-<slug>.md` from
   [templates/incident-record.md](templates/incident-record.md) as soon as an incident is
   declared. Start the timeline immediately; fill during the incident, not from memory after
   (CLAUDE.md Artifact Rules).
2. **Respond** — follow the matching runbook
   ([runbooks/api-outage.md](../runbooks/api-outage.md),
   [runbooks/ai-provider-outage.md](../runbooks/ai-provider-outage.md),
   [runbooks/secret-rotation.md](../runbooks/secret-rotation.md)); if none fits, start one from
   [runbooks/incident-response-template.md](../runbooks/incident-response-template.md).
3. **Resolve** — when service is restored, complete the record; for serious incidents add a
   blameless postmortem from [templates/postmortem.md](templates/postmortem.md) (severity
   guidance below).
4. **Close** — move the file(s) from `active/` to `resolved/`, add an entry to
   [learnings-index.yaml](learnings-index.yaml), and push durable lessons to their owners:
   recurring pitfalls → [memory/known-pitfalls.md](../memory/known-pitfalls.md); permanent
   policy changes → `CLAUDE.md` / `rules/`; feature-scoped incidents → the feature folder's
   `27-postmortem.md` ([docs/features/README.md](../docs/features/README.md)).

## Severity guidance

Use the support escalation model ([support/README.md](../support/README.md)) as the floor:
any output that reads as identity/biometric inference is **SEV-1** and escalates to
engineering immediately — never a ticket debate. Anything involving money movement
(paywall captures/refunds) is incident-worthy by default given the recorded refund-failure
path ([operations/retry-budget.md](../operations/retry-budget.md)).

## Rules

- Blameless: name causes and systems, never blame people (CLAUDE.md postmortem rules).
- Public-repo safe: no secrets, tokens, IPs of real users, or personal data in records.
- Every corrective action gets an owner and is tracked to completion.
- An empty `resolved/` folder is a fine state — do not invent history.
