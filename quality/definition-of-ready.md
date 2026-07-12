---
id: quality-definition-of-ready
title: Definition of Ready
type: quality
authority: canonical
status: current
owner: repository owner
summary: Work may start implementation only when the CLAUDE.md pre-implementation gate is satisfied — phases 00–13 documented, code and tests read, rollback and observability planned.
keywords: [definition-of-ready, ready, pre-implementation, gate, phases, intake, readiness]
contextTier: 2
relatedCode: []
relatedTests: []
relatedDocs: [docs/features/README.md, docs/sdlc/company-sdlc-policy.md, skills/README.md]
readWhen: You are about to start implementing and need to confirm the work is actually ready.
---

# Definition of Ready

Owned by CLAUDE.md ("Mandatory Pre-Implementation Gate" — this doc routes to it and does not
alter it). Implementation (phase 14) may not start until **all** of the following are true:

- [ ] Root `CLAUDE.md` reviewed.
- [ ] The feature folder exists or is updated under
      [docs/features/](../docs/features/README.md) with the phase-00–13 artifacts (intake,
      business, product, architecture, impact, standards, test strategy, coverage plan,
      readiness) at a depth proportional to the request — depth may scale, phase existence may
      not (CLAUDE.md Cross-Phase Rules).
- [ ] The code to be modified has been read; the existing tests for the area have been read.
- [ ] Rollout and rollback approach documented (for this stateless stack the default rollback
      is `git revert` + redeploy — [runbooks/README.md](../runbooks/README.md)).
- [ ] Observability needs identified ([operations/observability-map.md](../operations/observability-map.md)).
- [ ] Documentation scope identified (which docs/ADRs/runbooks change with the behavior).
- [ ] Major risks identified; new durable risks added to [risk-register.md](risk-register.md).
- [ ] Owners assigned.

## Engineering-OS entry ramp

Before backend implementation, additionally read
[context/architecture-map.md](../context/architecture-map.md),
[rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md), the layer rules being
touched, and the matching skill in [skills/](../skills/README.md) — then write tests first
(CLAUDE.md, "Before NestJS implementation").

## Not ready, by definition

- A request with no classification or owners (phase 00 missing).
- "We'll figure out rollback later."
- Requirements that are not testable (phase 03 exit criteria).
- Anything that would touch the product non-negotiables (free-by-default, consent-first,
  no image persistence, no identity/sensitive inference — CLAUDE.md Twinzy Product
  Constraints) without a recorded owner decision.
