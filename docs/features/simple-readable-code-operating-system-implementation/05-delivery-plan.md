# 05 — Delivery Plan

## Workstreams and sequence

1. Audit repository, worktree, safety boundaries, static enforcement, and Playwright failure.
2. Complete phases 00–13 under this request slug.
3. Align existing governance owners and remove contradictory wording.
4. Add/adjust regression tests for the text-only post-extraction boundary.
5. Refactor AI orchestration, prompts, route capabilities, benchmarks, and fixtures.
6. Fix lint warnings and the 320 px overflow at their actual owners.
7. Validate shared/config/benchmark cleanup already present in the worktree.
8. Run focused and full gates; update validation, bug, QA, security, and documentation records.

## Milestones and owners

- M1 audit/readiness — engineering
- M2 policy and test lock — product + engineering
- M3 backend/shared/frontend implementation — engineering
- M4 independent automated validation — QA role
- M5 release decision — product/release owner

## Dependencies and blockers

Node 22/npm workspaces, built `@twinzy/shared`, Playwright browser installation, and local Trivy availability. Definitive missing tooling will be recorded rather than bypassed.

## Rollout strategy

One reviewable worktree delivery; no database or feature-flag migration. Deploy normally after approval. Privacy hardening is enabled by code shape, not an optional flag.

## Risk list

AI quality shift, stale docs/tests, accidental alteration of user changes, coverage loss, and false-positive security lint around trusted CLI filesystem paths.
