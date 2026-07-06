# Skill: Write Unit Tests

> Applies rules/09 and testing/unit-testing-standard.md. Behavior, not implementation.

1. Pick the Vitest project: `api-unit` (apps/api/src/**/tests/*.test.ts), `web-unit`,
   `shared-unit`, or `lint-rules`. Naming: `*.test.ts`, colocated in the module's `tests/`
   folder.
2. Arrange with factories/fixtures — shared backend fixtures live in
   `apps/api/src/tests/fixtures/`. Instantiate classes directly with mocked collaborators
   (no Nest testing module for unit tests).
3. Assert observable behavior: return values, thrown `AppError` subclass + `messageKey`,
   and calls to boundaries — never private internals.
4. Cover: happy path, each validation failure, each mapped error. Floors are 95/90/95/95
   per touched file (testing/coverage-policy.md); critical paths near 100%.
5. Never mock the unit under test; always mock Gemini/ClamAV/network — no unit test may
   touch a real external system.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
