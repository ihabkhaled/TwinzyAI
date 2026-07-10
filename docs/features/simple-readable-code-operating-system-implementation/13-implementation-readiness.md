# 13 — Implementation Readiness

## Readiness checks

- Canonical governance, architecture, rules 00/28–30, cleanup skills, baselines, known pitfalls, manifests, affected code, and representative tests were reviewed.
- Existing feature record was found but contained intake only; this complete request record uses the owner-specified slug.
- Scope, acceptance criteria, architecture impact, test/coverage strategy, rollout, rollback, and risks are documented.
- Existing worktree edits are inventoried and will not be discarded.
- No database/config-secret migration is needed.

## Implementation slices

1. Add failing/updated tests for extraction-only image routing.
2. Narrow AI/game contracts and switch generation/judging to text calls.
3. Align canonical policy, prompts, docs, context, memory, and compact mirrors.
4. Resolve lint warnings without inline suppression.
5. Diagnose and fix the exact 320 px overflow.
6. Validate existing shared/config/benchmark cleanup; remove only proven dead code.

## Rollback and observability

Rollback is file/slice revert; no persisted state. Existing structured, redacted milestone logs remain. No new payload logging or image telemetry is permitted.

## Review and release readiness

Implementation may begin. Release remains NO-GO until focused tests, lint 0/0, typecheck, unit/coverage, integration/E2E as applicable, build, security scan, documentation review, and owner approval are recorded.

## Open readiness gaps

The audit subreviews and runtime DOM measurement may identify additional scoped fixes. Any expansion must remain ownership-driven and within this request's safety/maintainability goals.
