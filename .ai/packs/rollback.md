<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Rolling back a release or change

Task type: `rollback` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Roll back first, diagnose second when user impact is active.
- The API is stateless — rollback is image/config revert; no data migrations to unwind.
- Record what was rolled back, why, and the follow-up owner.

## Must-read docs

- runbooks/rollback-template.md — Template for documenting a release-specific rollback procedure; the canonical rollback mechanics live in runbooks/rollback.md. (~454 tokens)
- docs/release-checklist.md — 1. npm run validate (lint + typecheck + coverage + build) green. (~185 tokens)

## Rules

- rules/24-release-gate.md — > The final go/no-go. Everything below must pass, in order, before any release. Never mark skipped tests as passed. Never release with a weakened rule. Never bypass a hook. (~577 tokens)

## Skills

- skills/migration-plan.md

## Reviewers

- agents/backend-release-gatekeeper.md

## Validation before done

- `npm run validate`

## Notes

Use runbooks/rollback.md; verify /health and a smoke analyze run after.
