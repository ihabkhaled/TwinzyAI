# 11 - Test Strategy

## Purpose

Design quality before implementation starts.

## Step-by-Step Workflow

1. Map requirements to test layers.
2. Define happy paths, unhappy paths, edge cases, race conditions, and rollback validation.
3. Identify which test cases must exist in `test-cases/`.
4. Define environments, data, evidence, and ownership.

## Requirement-to-Test Matrix

| Requirement or risk | Unit | Integration | E2E | Security | Business / UAT |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Test Layers

### Unit

[Describe the logic units, validation rules, guards, or helpers that need direct tests. Vitest, colocated `*.test.ts`, run via `npm run test:unit`. Standard: `testing/unit-testing-standard.md`.]

### Integration / API

[Describe API flow, module-boundary, and contract tests. Vitest `*.integration.test.ts` (api-integration project), run via `npm run test:integration`. Standard: `testing/integration-testing-standard.md`.]

### UI / UX

[Describe component, state, accessibility, and workflow tests in `apps/web` (Testing Library under Vitest).]

### End-to-End

[Describe real user flows from entry point to outcome. Playwright in `apps/web`, run via `npm run test:e2e`. Standard: `testing/e2e-testing-standard.md`.]

### Security

[Describe consent, upload-chain, abuse, validation, forbidden-wording, and data-leakage test needs. Automated suites: `npm run test:security` and `npm run test:file-security`.]

### Regression

[Describe adjacent flows that must be re-tested.]

### Rollback

[Describe rollback triggers and post-rollback checks. There are no DB migrations in this repository — rollback is `git revert` + redeploy, validated by the release smoke test (`runbooks/release-smoke-test.md`).]

## Environment and Data Needs

- Test environments needed (local dev, `docker compose up --build`):
- Fixture data needed (synthetic image fixtures — see `apps/api/src/tests/fixtures/` and `testing/test-data-and-fixtures.md`; never real people's photos):
- External dependency stubs needed (the AI provider adapter is always stubbed in unit/integration tests — no live Gemini calls in CI):
- Monitoring evidence needed (structured log entries, request-id correlation):

## Linked Test Case Files

- `test-cases/unit/`
- `test-cases/integration/`
- `test-cases/e2e/`
- `test-cases/security/`
- `test-cases/business/`

## Exit Checklist

- [ ] Requirements mapped to tests
- [ ] Negative and edge cases included
- [ ] Security and permissions covered
- [ ] Migration and rollback covered when applicable
- [ ] Test-case locations identified

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| QA lead | | approve / revise | |
| Technical owner | | approve / revise | |

## Evidence And References To Attach

- links to test-case files or test management entries
- environment notes and seed-data notes
- requirement references used to derive tests

## Phase Blockers

Do not close this phase if:

- only happy paths are covered
- requirements are not mapped to test layers
- security, consent, or rollback tests are omitted without explanation
- the team still cannot say what evidence will prove the change works
