---
id: quality-waiver-register
title: Waiver Register
type: quality
authority: canonical
status: current
owner: repository owner
summary: The single place gate waivers would be recorded — currently empty; policy for granting, scoping, and expiring waivers.
keywords: [waiver, register, gates, coverage, approval, expiry, exceptions, blockers]
contextTier: 2
relatedCode: []
relatedTests: []
relatedDocs: [quality/exception-policy.md, testing/coverage-policy.md, docs/exceptions/README.md]
readWhen: You believe a gate cannot be met and need to know how (and whether) a waiver is possible.
---

# Waiver Register

A **waiver** is a recorded, owner-approved, time-boxed decision to ship despite a red gate
(e.g. a coverage shortfall on a touched module). It differs from an **exception**
(a standing rule/configuration adjustment — see [exception-policy.md](exception-policy.md) and
[docs/exceptions/README.md](../docs/exceptions/README.md)).

## Active waivers

| ID | Gate waived | Scope | Reason | Approver | Granted | Expires | Restoration plan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — | — | — |

**No waivers have ever been granted.** The historical validation record shows gates met
without waivers (e.g. [docs/final-validation-report.md](../docs/final-validation-report.md):
coverage 99.05/97.14/100/99.03 against 95/90/95/95).

## Policy

1. Only the repository owner (the authorized leadership role in CLAUDE.md's "Testing
   Blockers … unless explicitly waived by authorized leadership") can grant a waiver.
2. Every waiver is scoped (module/gate), justified, time-boxed with an expiry, and carries a
   restoration plan. Open-ended waivers are not waivers; they are policy changes and belong in
   the owning rule doc.
3. Waivers are recorded here **before** merge, and referenced from the feature folder's
   `12-coverage-plan.md` / `22-go-no-go.md` as applicable (CLAUDE.md artifact contents).
4. Expired waivers block release exactly like expired exceptions
   ([docs/exceptions/README.md](../docs/exceptions/README.md) precedent).
5. Never waivable, per CLAUDE.md and the security baseline
   ([docs/sdlc/security-baseline.md](../docs/sdlc/security-baseline.md)):
   inline lint suppression, hook/CI bypass without a recorded emergency exception, and the
   Twinzy product invariants (consent-first, no image persistence, no identity/sensitive
   inference, free-by-default paywall lever).
