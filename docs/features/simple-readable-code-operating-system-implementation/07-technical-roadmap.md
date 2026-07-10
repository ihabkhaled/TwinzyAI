# 07 — Technical Roadmap

## Engineering slices

1. Safety regression tests: provider-call modality, prompt contents, buffer cleanup, and route capability.
2. AI boundary implementation: types, services, game use cases, step constants, benchmarks, prompts.
3. Canonical documentation and mirror alignment.
4. Static-enforcement warning cleanup and lint-rule tests/config evidence where applicable.
5. Frontend 320 px diagnosis, minimal fix, focused Playwright rerun.
6. Shared/config/dead-code cleanup validation and full gates.

## Branch and merge strategy

Use the current branch and preserve all pre-existing worktree edits. No commit or push without explicit user request. Changes remain logically separable in the diff even if uncommitted.

## Schema and compatibility plan

The HTTP envelope and result shape stay stable, but the required `promptVersion` literal moves from
`visual-similarity-v4` to `written-traits-v5`. That is an intentional contract-version change:
stale cached/client-crafted v4 payloads fail validation instead of being mislabeled as text-only.
Deploy API and web together. Internal generation/judge inputs also narrow by removing image fields.
There is no durable data migration.

## Rollout sequence

Build shared → deploy API/web together → smoke health/analyze mocked flow → verify no image-bearing calls after extraction → verify 320 px result flow.

## Rollback sequence

Revert this request's files as one delivery or by slice. No migration rollback is needed. Do not restore the superseded multimodal behavior without a new explicit owner decision and updated privacy copy/security review.

## Flags and compatibility

No feature flag. Provider route configuration remains env-driven; generation/judge routes become text-capable rather than vision-required.
