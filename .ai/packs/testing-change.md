<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Adding/repairing tests, fixtures, harnesses

Task type: `testing-change` · Lane: **fast** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Tests are deterministic — control time/randomness; no arbitrary sleeps.
- Mock at boundaries (adapters/gateways), never the logic under test.
- Touched-module coverage stays ≥95% lines/branches/functions/statements.

## Must-read docs

- testing/testing-strategy.md — > The house test strategy for this monorepo: the pyramid mapped to the real Vitest projects, what each layer proves, the doubles each layer allows, and the evidence a change must leave behind. This implements the testing canon — [/rules/... (~4954 tokens)
- rules/09-testing-coverage.md — > Tests are the proof a change is safe — written **first**, run at every gate, enforced by a coverage floor. Runner: **Vitest** (multi-project) + `@nestjs/testing` + supertest (api) + Testing Library (web) + Playwright (e2e). **Never Jes... (~1746 tokens)

## Rules

- rules/09-testing-coverage.md — > Tests are the proof a change is safe — written **first**, run at every gate, enforced by a coverage floor. Runner: **Vitest** (multi-project) + `@nestjs/testing` + supertest (api) + Testing Library (web) + Playwright (e2e). **Never Jes... (~1746 tokens)
- rules/frontend/15-testing-and-coverage.md — Testing here is TDD-shaped and gate-enforced. The full standards live under (~947 tokens)

## Skills

- skills/write-unit-tests.md
- skills/write-integration-tests.md
- skills/write-e2e-tests.md

## Reviewers

- agents/backend-test-engineer.md
- agents/frontend-test-engineer.md

## Code entrypoints

- `apps/api/src/tests/`
- `apps/web/e2e/`
- `testing/`

## Validation before done

- `npm run test:coverage`

## Notes

Vitest projects: api-unit, api-integration, web-unit, shared-unit, lint-rules; Playwright for e2e. Fixtures live in module tests/ dirs and apps/api/src/tests.
