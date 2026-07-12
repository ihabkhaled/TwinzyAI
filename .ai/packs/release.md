<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Preparing/executing a release

Task type: `release` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- No release without green validate, security scans, e2e, and the release checklist.
- Rollback stays feasible; smoke tests run immediately after deploy.
- Docker images scanned (security:scan:images) before promotion.

## Must-read docs

- docs/release-checklist.md — 1. npm run validate (lint + typecheck + coverage + build) green. (~185 tokens)
- rules/24-release-gate.md — > The final go/no-go. Everything below must pass, in order, before any release. Never mark skipped tests as passed. Never release with a weakened rule. Never bypass a hook. (~577 tokens)
- docs/sdlc/release-checklist.md — This checklist is the minimum release gate for any deployment of Twinzy that matters to players, operators, or the project sponsor. It pairs with [`rules/24-release-gate.md`](../../rules/24-release-gate.md) and the runbooks in [`runbooks... (~971 tokens)

## Rules

- rules/24-release-gate.md — > The final go/no-go. Everything below must pass, in order, before any release. Never mark skipped tests as passed. Never release with a weakened rule. Never bypass a hook. (~577 tokens)
- rules/frontend/19-release-gates.md — A release candidate is a commit on `main` with every gate green. Gates are executable — each maps to an (~1093 tokens)

## Skills

- skills/final-validation.md
- skills/final-validation-frontend.md

## Reviewers

- agents/backend-release-gatekeeper.md
- agents/frontend-release-gatekeeper.md

## Code entrypoints

- `docker-compose.yml`
- `Dockerfile.api`
- `Dockerfile.web`
- `.github/workflows/`

## Validation before done

- `npm run validate`
- `npm run security:scan`
- `npm run test:e2e:ci`

## Notes

Follow docs/release-checklist.md + rules/24. The paywall env block deserves explicit review at every release: blank credentials unless the owner has recorded LIVE approval.
