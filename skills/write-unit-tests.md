# Skill: Write Unit Tests

> Applies rules/09. Behavior, not implementation.

1. Pick the project: api-unit (src/**/tests/*.test.ts), web-unit, shared-unit.
2. Arrange with factories/fixtures; instantiate classes directly with mocked collaborators.
3. Assert observable behavior (returns, thrown DomainException codes, calls to boundaries).
4. Cover: happy path, each validation failure, each mapped error.
5. Never mock the unit under test; always mock Gemini/ClamAV/network.
Gate: npm run test:unit && npm run lint && npm run typecheck
