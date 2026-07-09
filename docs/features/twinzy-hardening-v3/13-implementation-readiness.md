# 13-implementation-readiness.md — TwinzyAI Hardening v3

## Pre-implementation gate check

Per `CLAUDE.md`, the following must be true before phase 14 starts:

- [x] Root `CLAUDE.md` reviewed.
- [x] Related feature folder created (`docs/features/twinzy-hardening-v3/`).
- [x] Business, product, architecture, impact, standards, test, and coverage phases documented.
- [x] Related code read and understood (via subagent audits and direct file inspection).
- [x] Related tests read and understood.
- [x] Rollout and rollback approach documented.
- [x] Observability needs identified (per-stage timing metrics, request-id correlation).
- [x] Documentation scope identified.
- [x] Major risks identified (secret exposure, prompt quality, test gaps, magic-number enforcement).
- [x] Owners assigned (intake, business, technical, QA, security, DevOps).

## Branch strategy

- Primary branch: `feat/twinzy-hardening-v3`.
- Reviewable stacked slices (optional but recommended):
  - `feat/twinzy-hardening-v3-contracts`
  - `feat/twinzy-hardening-v3-backend`
  - `feat/twinzy-hardening-v3-prompts`
  - `feat/twinzy-hardening-v3-frontend`
  - `feat/twinzy-hardening-v3-security`
  - `feat/twinzy-hardening-v3-tests`
  - `feat/twinzy-hardening-v3-docs`

## Slices

1. Shared contracts and schema hardening.
2. Backend pipeline and integration tests.
3. Prompt vNext and prompt tests.
4. Frontend UI and i18n.
5. Security scan and dependency audit.
6. Expanded testing and lint governance.
7. Documentation and ADRs.

## Feature flags and config changes

- No feature flags.
- New/updated config values in `.env.example`:
  - Existing limits remain (`MAX_GLOBAL_ACTIVE_ANALYSES`, etc.).
  - No new required env values for this feature.
- `GAME_PROMPT_VERSION` will be bumped in shared constants.

## Migration plan

- No database migration.
- Update test fixtures to emit v3 and correct result counts.
- Update frontend locale constants to import from shared.
- Update docs to reflect new default count and score semantics.

## Rollback plan

- Revert to the previous deployment artifact or Docker image.
- If shared schema changes cause issues, revert both `apps/api` and `apps/web` together because they consume the same package.
- Keep rollback feasible until hypercare confirms stability.

## Observability plan

- Add structured logs for pipeline milestones with `requestId`, `stage`, and `duration`.
- Track result-count distribution and score distribution.
- Add metrics/alerts for model timeout rate and cancellation rate.
- Inspect logs after validation and after release for critical errors.

## Review readiness

- Architecture review: `08-architecture-review.md` documents boundary changes and ADRs.
- Security review: `19-security-review.md` and `19-threat-model.md` will be created during phase 19.
- QA review: `11-test-strategy.md` and `12-coverage-plan.md` define the validation scope.

## Release readiness

- Release notes will be drafted in `release-notes/`.
- Runbook updates for secret rotation, Trivy, and incident response.
- Go/no-go criteria in `22-go-no-go.md`.
- Hypercare window and owner in `26-hypercare-report.md`.

## Open readiness gaps

1. Plaintext `GEMINI_API_KEY` in `.env` is accepted as a local-dev risk but should be rotated before production exposure.
2. Trivy secret detection reliability is unproven; a fallback scanner must be added.
3. `game-stream.presenter.ts` boundary exception needs an ADR or a move to `application/`.
4. Web test folder is `test/` (singular) while the standard says `tests/` (plural); reconcile before expanding coverage.
5. Frontend coverage is ungated; either create the missing config or update the policy doc.

## Decision

**Implementation may proceed** once the open readiness gaps above are either closed or explicitly accepted by the relevant owners. The most critical acceptance is the `.env` key exposure, which the request owner has already accepted for the local-dev phase.
