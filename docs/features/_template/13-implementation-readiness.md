# 13 - Implementation Readiness

## Purpose

Prepare the team and the system to implement safely.

## Step-by-Step Workflow

1. Confirm phases `00` through `12` are complete enough to begin.
2. Prepare branch strategy and change slices.
3. Prepare flags, migrations, rollback, and observability.
4. Prepare test scaffolding and review checklists.
5. Confirm release controls and approvers are ready.

## Readiness Checklist

### Delivery Setup

- [ ] Branch strategy defined
- [ ] Work is sliced into reviewable increments
- [ ] Owners are assigned

### Flags and Configuration

- [ ] Feature flag plan documented (if any)
- [ ] Env/config changes identified (`.env` variables, config module updates)
- [ ] Secret changes identified

### Contracts and Rollback

- [ ] Shared contract changes (`packages/shared`) planned with web-client compatibility
- [ ] Rollback plan documented (`git revert` of the slice + redeploy — no DB migrations exist)

### Observability

- [ ] Log entries identified (structured, request-id correlated, redacted)
- [ ] Error codes / message keys identified
- [ ] Log inspection path confirmed (docker compose logs / pino JSON)

### Quality and Review

- [ ] Test scaffolding ready (`*.test.ts` / `*.integration.test.ts` files planned)
- [ ] Review checklist ready (`docs/sdlc/code-review-checklist.md`, `rules/23-review-checklist.md`)
- [ ] Gates known: `npm run lint` · `npm run typecheck` · `npm run test:unit` · `npm run test:coverage` · `npm run build` · `npm run security:scan`

### Release Control

- [ ] Rollout strategy documented
- [ ] Release approvers identified
- [ ] Hypercare owner identified

## Readiness Gaps

| Gap | Owner | Resolution date | Status |
| --- | --- | --- | --- |
| | | | open |

## Go / Hold Decision

- Decision: go / hold
- Reason:

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Technical owner | | approve / hold | |
| Release owner if applicable | | approve / hold | |

## Evidence And References To Attach

- branch, environment, config, or flag references
- migration and rollback references
- observability and dashboard references
- open readiness-gap owner references

## Phase Blockers

Do not close this phase if:

- rollout or rollback is still fuzzy
- observability is still undefined
- major readiness gaps have no owners
- the team would still be improvising once coding starts
