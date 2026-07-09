# 07-technical-roadmap.md — TwinzyAI Hardening v3

## Engineering milestones

1. **M0 — Hygiene:** Clean lockfile, remove stale node_modules content, verify `.env` is gitignored.
2. **M1 — Shared contracts:** Result-count schema, score-band constants, error envelope schema, judge safety check, trait-count refinement, rename `interfaces/` to `types/`, remove duplicates.
3. **M2 — Backend:** DTOs, use cases, services, prompt rendering, aggregation, translation, integration tests.
4. **M3 — Prompts vNext:** Rewrite prompt files, bump version, update fixtures/tests.
5. **M4 — Frontend:** Result-count UI, hooks, services, gateways, i18n, result cards, error states.
6. **M5 — Security/perf:** Dependency audit, Trivy verification, fallback scanner, scaling ADR, timing metrics.
7. **M6 — Testing:** RuleTester tests, magic-number enforcement, Playwright expansion, unit/integration tests, per-file coverage.
8. **M7 — Docs:** README, SECURITY, TEST_CASES, runbooks, coverage policy, ADRs.
9. **M8 — Validation:** Run all gates, fix, report evidence.

## Branch and merge strategy

- Single feature branch `feat/twinzy-hardening-v3` or reviewable stacked PRs:
  - `feat/twinzy-hardening-v3-contracts`
  - `feat/twinzy-hardening-v3-backend`
  - `feat/twinzy-hardening-v3-prompts`
  - `feat/twinzy-hardening-v3-frontend`
  - `feat/twinzy-hardening-v3-security`
  - `feat/twinzy-hardening-v3-tests`
  - `feat/twinzy-hardening-v3-docs`
- Each slice includes its own tests and docs.
- Conventional commits; no `--no-verify`.

## Schema evolution plan

- Shared schemas are additive: `resultCount` has a default, so existing API clients that omit it continue to work.
- `MAX_CANDIDATES` and `MAX_FINAL_RESULTS` are renamed/replaced by `MAX_RESULT_COUNT` where they represent the user-facing limit.
- Internal candidate-pool cap is introduced as a separate constant.
- Prompt version is bumped to v3; old fixtures and tests must be updated in the same stream.

## Rollout sequence

1. Merge contracts slice first (no runtime impact).
2. Merge backend + prompts slices (runtime logic changes).
3. Merge frontend slice (UI changes).
4. Merge tests/security/docs slices.
5. Run full validation gate and release.

## Rollback sequence

- Rollback to the previous Docker image / deployment artifact.
- If only the frontend is problematic, rollback frontend slice independently.
- If shared schema changes cause issues, full rollback is required because both apps depend on shared.

## Feature flags and compatibility

- No feature flags needed.
- Backward compatibility: omitting `resultCount` defaults to 10; previous API consumers get 10 instead of 5.
- Mobile/desktop compatibility is unchanged.
