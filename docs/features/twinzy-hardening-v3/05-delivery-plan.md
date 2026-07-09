# 05-delivery-plan.md — TwinzyAI Hardening v3

## Workstreams and milestones

### Workstream A — Shared contracts and schemas
- Define `ResultCountSchema`, `MIN_RESULT_COUNT`, `MAX_RESULT_COUNT`, `DEFAULT_RESULT_COUNT`.
- Update candidate/judge/final-result schemas for 1–10 count and cross-field refinements.
- Add `ApiErrorResponseSchema`, judge `safetyCheck`, score-band mapping.
- Remove duplicate constants and rename `interfaces/` to `types/`.

### Workstream B — Backend pipeline
- Update DTOs, use cases, services, and aggregation for `resultCount`.
- Update prompt rendering to inject count.
- Add direct unit tests for untested application/lib files.
- Add integration tests for rate limiter, ClamAV fail-closed, cancel-during-stream, CORS disallowlist.

### Workstream C — Prompts vNext
- Rewrite prompts 1–3 and translation prompt.
- Bump `GAME_PROMPT_VERSION` to v3.
- Update fixtures and prompt tests.

### Workstream D — Frontend
- Add result-count dropdown and update flow/hooks/services/gateways.
- Update result cards, score explanation, uncertainty/mismatch display.
- Update i18n dictionaries and remove duplicate locale constants.
- Add frontend fixture builders.

### Workstream E — Security and DevOps
- Run `npm audit` and remediate/document findings.
- Verify Trivy and add fallback secret scanning.
- Review helmet, CORS, rate limits, upload caps.
- Create horizontal-scaling ADR.

### Workstream F — Testing and quality gates
- Add RuleTester tests for all frontend rules and missing backend rule.
- Enable magic-number enforcement and fix violations.
- Expand Playwright coverage (35+ scenarios, mobile device projects, visual regression).
- Convert real-time watchdog tests to fake timers.
- Add per-file coverage thresholds.

### Workstream G — Documentation
- Update README, SECURITY, TEST_CASES, runbooks, governance docs.
- Update `testing/frontend/coverage-policy.md` or create the missing `apps/web/vitest.config.mts`.
- Add ADRs for prompt vNext and scaling plan.

## Sequence and dependencies

1. SDLC artifacts (this plan) → shared contracts → backend DTOs/services → prompt vNext.
2. Frontend UI/hooks can be built in parallel once the shared contract is stable.
3. Tests and ESLint rule tests should be written alongside the code they validate (tests first where possible).
4. Security/dependency audit can run in parallel with development.
5. Documentation updates happen in the same delivery stream as behavior changes.

## Blockers and approvals

- **Blocker:** Plaintext `.env` key is a security risk; mitigated by request-owner acceptance for local dev only.
- **Approval needed:** Product owner for score-band and fallback semantics.
- **Approval needed:** Architecture owner for moving `game-stream.presenter.ts` or documenting it as an exception.
- **Approval needed:** QA lead for expanded Playwright scope and evidence acceptance.
- **Approval needed:** Security owner for Trivy/fallback scanner configuration.

## Rollout strategy

- Single release after all gates pass.
- No dark launch or feature flag needed; the change is additive and replaces a hardcoded 5 with a user choice (default 10).
- Monitor error rates, model latency, and cancellation rates during hypercare.

## Risk list

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Prompt v3 increases model latency or cost | Medium | Medium | Timeout, cancellation, staged prompt testing |
| Magic-number enforcement surfaces many violations | High | Low | Fix incrementally; do not weaken the rule |
| Playwright mobile device projects reveal layout bugs | Medium | Medium | Fix responsive issues before release |
| Trivy secret scanning stays unreliable | Medium | High | Add fallback scanner and rotate key |
| Shared schema changes break existing tests | Medium | Medium | Update fixtures and tests in the same stream |
