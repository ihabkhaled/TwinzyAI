# Twinzy SDLC Policy

## Purpose

This document defines the delivery operating model for the Twinzy repository. It applies to all software and system changes in this monorepo — the NestJS API (`apps/api`), the Next.js frontend (`apps/web`), the shared zod contracts (`packages/shared`), tooling, infrastructure, and documentation.

The canonical governance chain is: [`CLAUDE.md`](../../CLAUDE.md) (canonical operating policy) →
[`rules/`](../../rules/README.md) and the architecture map (engineering canon beneath it) →
[`AGENTS.md`](../../AGENTS.md) and other compact agent mirrors. Skills and ordinary docs defer to
the rules; nothing overrides `CLAUDE.md`.

## Policy Statement

- No phase may be skipped.
- Depth may scale by request size, but the gate itself never disappears.
- No implementation starts before phases `00` through `13` are documented in `docs/features/<feature-slug>/`.
- No merge happens without review, tests, updated docs, and rollout or rollback readiness.
- No release happens without QA, security validation, business validation, risk review, and release approval.
- Every phase writes artifacts into the repository.

## Operating Principles

1. Visibility beats assumption.
2. Written artifacts beat memory.
3. Tested behavior beats confidence.
4. Reviewed changes beat isolated heroics.
5. Reversible releases beat optimistic releases.
6. Organizational learning is part of delivery, not a side activity.

## Scope

This policy covers:

- features
- enhancements
- bug fixes
- refactors
- migrations (code/tooling — Twinzy has no database, so there are no DB migrations)
- API contract changes (`packages/shared` schemas and the `/api/v1` surface)
- security fixes
- performance work
- compliance and privacy changes
- infrastructure changes (Docker, CI, hooks, ESLint architecture plugin)
- workflow changes
- AI behavior changes (prompts, safety filtering, Gemini adapter, trait handling)

## Product Invariants (never in scope)

These are standing product decisions, not per-request questions:

- Twinzy is **free** — no payment logic, ever.
- No authentication, no user accounts, no database.
- No face recognition, identity matching, or biometric anything.
- Uploaded images live in memory only and are never persisted.

Any request that would violate an invariant is rejected at intake.

## Delivery Tracks

### Standard Track

Use for normal delivery. All phases run in order with standard approval timing.

### Hotfix Track

Use only for production-impacting incidents, urgent legal obligations, major security issues, or blocking business-critical defects. Hotfixes still require all phases and artifacts, but the team may compress meetings, use accelerated approvals, and complete documentation in near-real-time rather than through long planning cycles.

## Roles and Responsibility Mapping

Twinzy is delivered by a small team; one person may hold several roles, but each responsibility must have a named owner per request.

| Responsibility | Typical role |
| --- | --- |
| Request intake owner | Delivery lead / maintainer |
| Business owner | Product owner / project sponsor |
| Technical owner | Engineering lead / maintainer |
| Quality owner | QA lead (may be the maintainer wearing the QA hat, with independence preserved) |
| Security owner | Security reviewer (see [`agents/backend-security-reviewer.md`](../../agents/backend-security-reviewer.md)) |
| Operations owner | Whoever owns the Docker/CI/deploy surface for the release |
| Release approver | Release gatekeeper (see [`agents/backend-release-gatekeeper.md`](../../agents/backend-release-gatekeeper.md)) |

Document the actual mapping per request in `00-intake.md`.

## Request ID Standard

Use a globally unique request identifier. Recommended format:

```text
REQ-YYYY-TWINZY-####
```

Example:

```text
REQ-2026-TWINZY-0001
```

## Severity and Urgency

Document both severity and urgency during intake.

### Severity

- `SEV-1`: production outage, privacy or AI-safety violation, security breach, or data leak
- `SEV-2`: major feature blocked, major degradation (e.g., analyze flow failing for a class of images)
- `SEV-3`: moderate impact, workaround exists
- `SEV-4`: low impact improvement, cleanup, or planned enhancement

### Urgency

- `Immediate`: work begins now
- `This sprint`: planned urgent work
- `Planned`: normal prioritization
- `Backlog`: intentionally deferred

## Mandatory Phase Sequence

1. `00` Request intake and classification
2. `01` Business analysis
3. `02` Business development / commercial impact
4. `03` Product requirements
5. `04` Cross-functional refinement
6. `05` Delivery planning
7. `06` Technical refinement
8. `07` Technical roadmap
9. `08` Architecture review
10. `09` Impact analysis
11. `10` Engineering standards check
12. `11` Test strategy
13. `12` Coverage plan
14. `13` Implementation readiness
15. `14` Implementation
16. `15` Developer validation
17. `16` Internal bug loop
18. `17` QA validation
19. `18` QA defect loop
20. `19` Security review
21. `20` UAT
22. `21` Client approval
23. `22` Go / no-go
24. `23` Documentation updates
25. `24` Risk / compliance / ops review
26. `25` Release
27. `26` Hypercare
28. `27` Retrospective and postmortem

Artifacts for each phase live in `docs/features/<feature-slug>/`, copied from [`docs/features/_template/`](../features/_template/README.md). The first fully worked example is [`docs/features/engineering-os-migration/`](../features/engineering-os-migration/00-intake.md).

## Phase Exit Rules

- A phase exits only when its artifact exists, required sections are filled, risks are visible, and the named owner accepts the output.
- A later phase may refine an earlier phase, but it may not silently replace it.
- Missing information must be documented as assumptions or open questions, not ignored.

## Minimum Expectations For Every Phase

Every phase must identify:

- purpose
- owner
- inputs
- outputs
- assumptions
- open questions
- risks
- evidence or references
- exit decision

If any of these are absent for a materially important phase, the phase is incomplete.

## Hard Gates

- No coding before phases `00` through `13`
- No PR without tests
- No PR without doc updates when behavior changes
- No merge below the coverage floor (`npm run test:coverage` — statements/branches/functions/lines ≥ 95/90/95/95) without a written waiver
- No merge if automation gates fail: `npm run lint` (0 errors / 0 warnings), `npm run typecheck`, `npm run test:unit`, `npm run test:coverage`, `npm run build`, `npm run security:scan` (trivy, 0 HIGH/CRITICAL)
- No bypassing Husky hooks (`--no-verify` is forbidden); commits follow conventional commits
- No release without QA sign-off
- No release without security sign-off when applicable
- No release without rollback readiness (see [`runbooks/`](../../runbooks/README.md))
- No release without monitoring readiness (structured pino logs, request-id correlation)
- No release without required business or client sign-off
- No release without recorded go / no-go decision

## Signs The Process Is Being Bypassed

The policy is being violated when any of the following appear:

- implementation started before early artifacts exist
- acceptance criteria are vague or missing
- architecture impact was "understood verbally" but not written
- tests are justified with "we checked it manually once"
- docs are postponed until after release
- open defects are hidden in chat, not in artifacts
- support or operations first learn about the change after deployment
- rollback is described as "we can revert somehow"
- risk is described emotionally instead of concretely
- a gate was made green by weakening a rule, threshold, or config instead of fixing the cause

## Waivers and Exceptions

- Waivers are rare and time-bound.
- Every waiver must name the approver, business reason, risk, compensating controls, and expiration date.
- Waivers may reduce threshold or sequencing pressure, but may not erase traceability.
- All waivers must be recorded in the relevant phase document and in the go / no-go record.
- Product invariants (free game, no biometrics, no image persistence) are never waivable.

## Hotfix Guardrails

Hotfixes still require:

- request classification
- problem statement
- explicit risk assessment
- rollback plan
- validation evidence
- post-release documentation completion
- retrospective review

Hotfixes may move faster, but they may not become undocumented improvisation.

## Required Supporting Baselines

This repository maintains, in this folder and its siblings:

- engineering standards ([`engineering-standards.md`](./engineering-standards.md), full bodies in [`rules/`](../../rules/README.md))
- code review checklist ([`code-review-checklist.md`](./code-review-checklist.md))
- release checklist ([`release-checklist.md`](./release-checklist.md))
- security baseline ([`security-baseline.md`](./security-baseline.md))
- QA baseline ([`qa-baseline.md`](./qa-baseline.md))
- UAT baseline ([`uat-baseline.md`](./uat-baseline.md))
- risk baseline ([`risk-baseline.md`](./risk-baseline.md))
- documentation baseline ([`documentation-baseline.md`](./documentation-baseline.md))
- testing standards and coverage policy ([`testing/`](../../testing/README.md))

## Success Condition

The policy is working when no release surprises QA, security, support, operations, or the player because all relevant work was made explicit before the change shipped.

## Failure Condition

The policy has failed when the team repeatedly learns about important behavior only through production incidents, support escalation, or post-release confusion.
