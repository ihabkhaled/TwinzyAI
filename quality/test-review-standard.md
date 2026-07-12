---
id: quality-test-review-standard
title: Test Review Standard
type: quality
authority: canonical
status: current
owner: repository owner
summary: How tests are reviewed — right layer, scenario depth over coverage totals, deterministic and mock-at-the-boundary, mapped into TEST_CASES.md, no skipped or focused tests.
keywords: [test-review, tests, coverage, scenarios, determinism, mocking, regression, standard]
contextTier: 2
relatedCode: [apps/api/src/tests/fixtures/fake-ai-adapter.ts, apps/api/src/bootstrap/create-test-app.ts]
relatedTests: [apps/api/src/tests/game-analyze.integration.test.ts]
relatedDocs: [testing/README.md, testing/coverage-policy.md, TEST_CASES.md, docs/testing-strategy.md]
readWhen: You are reviewing the tests in a change or deciding whether test coverage is adequate.
---

# Test Review Standard

The testing standards themselves are owned by [testing/](../testing/README.md) (backend/monorepo)
and [testing/frontend/](../testing/frontend/README.md); layer-by-layer expectations live in
their per-layer docs. This is the reviewer's bar.

## What the reviewer verifies

1. **Right layer** — the test sits where the pyramid puts it
   ([testing/testing-strategy.md](../testing/testing-strategy.md)); integration tests boot the
   production wiring via `createTestApp` with only the AI adapter and ClamAV faked
   ([apps/api/src/bootstrap/create-test-app.ts](../apps/api/src/bootstrap/create-test-app.ts),
   [apps/api/src/tests/fixtures/fake-ai-adapter.ts](../apps/api/src/tests/fixtures/fake-ai-adapter.ts)).
2. **Scenario depth, not totals** — tests cover the changed behavior including negative,
   boundary, permission/consent, partial-failure, and abort paths; "a high percentage with
   shallow scenarios is still inadequate" (CLAUDE.md Coverage Rules).
3. **Coverage gate** — touched modules meet 95/90/95/95
   ([testing/coverage-policy.md](../testing/coverage-policy.md)); frontend pure logic at 100%
   ([testing/frontend/coverage-policy.md](../testing/frontend/coverage-policy.md)). Shortfalls
   need a recorded waiver ([waiver-register.md](waiver-register.md)).
4. **Behavior matrix** — new externally observable behavior is a numbered case in
   [TEST_CASES.md](../TEST_CASES.md) mapped to at least one automated test.
5. **Determinism** — controlled time/randomness, no arbitrary sleeps, isolated and re-runnable
   ([testing/test-data-and-fixtures.md](../testing/test-data-and-fixtures.md); CLAUDE.md test
   design rules).
6. **Mock at the boundary** — never mock the logic under proof; providers are always mocked in
   e2e (e2e never calls real Gemini — [docs/testing-strategy.md](../docs/testing-strategy.md)).
7. **Regression for every bug fix** — the exact failure mode gets a test
   ([testing/bug-triage-and-retest.md](../testing/bug-triage-and-retest.md)).
8. **Safety-invariant tests are untouchable** — tests proving the image never reaches text-only
   steps (the FakeAiAdapter records per-step calls for exactly this) or the forbidden-wording
   filter may never be weakened to make a change pass.

## Automatic rejections

- Skipped, focused (`.only`), or snapshot-only tests
  ([docs/testing-strategy.md](../docs/testing-strategy.md)).
- Tests asserting only request acceptance where state changes (verify persisted/returned truth —
  CLAUDE.md data rules).
- Weakened thresholds or deleted assertions to get green (CLAUDE.md local-gate rules).
- Test names that do not describe scenario + expected outcome.
