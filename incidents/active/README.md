---
id: incidents-active-readme
title: incidents/active/
type: incident
authority: canonical
status: current
owner: repository owner
summary: Holds one record per currently open incident; empty means no incident is in progress.
keywords: [incidents, active, open, in-progress, records]
contextTier: 3
relatedCode: []
relatedTests: []
relatedDocs: [incidents/README.md, incidents/templates/incident-record.md]
readWhen: You are opening or working an in-progress incident.
---

# incidents/active/

One file per open incident, named `YYYY-MM-DD-<slug>.md`, created from
[../templates/incident-record.md](../templates/incident-record.md). On resolution, records move
to [../resolved/](../resolved/README.md) per the process in [../README.md](../README.md).
Currently empty: no open incidents.
