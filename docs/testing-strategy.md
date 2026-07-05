# Testing Strategy

Projects: shared-unit (schema contracts), api-unit (services/adapters with mocks),
api-integration (AppModule + supertest), web-unit (Testing Library + jsdom), e2e (Playwright,
mocked backend). TEST_CASES.md is the behavior matrix; every numbered case maps to a test.

Conventions: tests first for new behavior; mock external providers always; factories/fixtures in
tests/ folders; no snapshot-only tests; no skipped/focused tests in main. Coverage: v8 reports
on test:coverage (pre-push); the risk centers (file-security, ai, game pipeline) must stay
well covered — reviewed per PR rather than a blanket numeric gate (see memory/testing-strategy.md).
E2E never calls real Gemini; a manual mode with real credentials is documented in
docs/docker-local-dev.md.
