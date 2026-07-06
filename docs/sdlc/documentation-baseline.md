# Documentation Baseline — Twinzy

## Purpose

Documentation must change with the software. This baseline defines what must be updated and when in the Twinzy repository.

## Documentation Principles

- Docs are part of the deliverable.
- Behavior changes require documentation changes.
- Operator-facing changes require runbook and support updates ([`runbooks/`](../../runbooks/README.md), [`support/`](../../support/README.md)).
- Architecture changes require architecture updates and possibly ADRs ([`architecture/adrs/`](../../architecture/adrs/README.md)).
- User-facing changes require release notes and user guidance when applicable ([`release-notes/`](../../release-notes/README.md)).

## Documentation Ownership Rules

- every changed behavior must have an identified documentation owner
- no one may defer documentation indefinitely without recorded approval
- support, operations, and onboarding documentation matter as much as engineering-facing documentation when the change affects them

## Documentation Types to Review

- [`CLAUDE.md`](../../CLAUDE.md) / [`AGENTS.md`](../../AGENTS.md) — governance entry points
- [`rules/`](../../rules/README.md) — full rule bodies (source of truth; update when a permanent rule changes)
- [`memory/`](../../memory/README.md) — recorded decisions (update when a decision is made or reversed)
- [`context/`](../../context/README.md) — orientation docs (architecture map, code map, glossary)
- [`skills/`](../../skills/README.md) — task guides
- [`testing/`](../../testing/README.md) — testing standards and coverage policy
- API contract docs (shared schemas in `packages/shared`)
- [`runbooks/`](../../runbooks/README.md) — operational procedures
- QA docs and [`test-cases/`](../../test-cases/unit/unit-test-case-template.md)
- security docs ([`security-baseline.md`](./security-baseline.md), `SECURITY.md`)
- [`support/`](../../support/README.md) — known issues, escalation guidance
- [`release-notes/`](../../release-notes/README.md)
- feature phase artifacts in `docs/features/<feature-slug>/`

## Definition of Updated

A document is updated only when it:

- reflects the new behavior accurately
- removes now-wrong old behavior
- includes new operational or support expectations
- identifies any new risks, flags, or constraints

## Minimum Documentation Review Questions

- what behavior changed
- who is affected
- what must future engineers know
- what must support know
- what must operators know
- what commands, log shapes, env variables, or runbooks changed
- what assumptions are no longer true

## Documentation Exit Rule

No change is done if a future engineer, operator, support agent, or auditor would still need tribal knowledge to understand what changed and how to work with it.

## Documentation Failure Signals

- the release notes say something different from the product
- runbooks assume old behavior (wrong endpoints, wrong log shape, wrong env vars)
- support learns about the change from player reports
- architecture docs describe a system that no longer exists
- `rules/` or `memory/` contradict what the code actually enforces
