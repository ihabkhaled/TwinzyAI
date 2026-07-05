# Skill: Write Integration Tests

> Applies rules/09. Boot the real module graph.

1. File: apps/api/src/tests/NAME.integration.test.ts (api-integration project).
2. Test.createTestingModule({ imports: [AppModule] }) + overrideProvider for external adapters.
3. Drive through HTTP with supertest; assert status, envelope shape, headers.
4. Cover the analyze flow end-to-end with a fake Gemini adapter and real validation chain.
Gate: npm run test:integration && npm run lint && npm run typecheck
