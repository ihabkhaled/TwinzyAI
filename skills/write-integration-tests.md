# Skill: Write Integration Tests

> Applies rules/09 and testing/integration-testing-standard.md. Boot the real module graph.

1. File: `apps/api/src/tests/NAME.integration.test.ts` (`api-integration` Vitest project) —
   the `*.integration.test.ts` suffix is what routes it to that project.
2. Boot the FULL app: `Test.createTestingModule({ imports: [AppModule] })` with
   `overrideProvider(...)` for external adapters only (Gemini, ClamAV) — everything else is
   real.
3. Fastify adapter: after `app.init()`, `await app.getHttpAdapter().getInstance().ready()`
   before the first request — without `.ready()` Fastify has not registered the routes yet.
4. Drive through HTTP; assert status, headers, and the envelope: the `ApiErrorResponse`
   fields (`statusCode`, `errorCode`, `message`) plus the additive `messageKey`.
5. Cover the analyze flow end-to-end with a fake Gemini adapter and the REAL file-security
   validation chain; fixtures live in `apps/api/src/tests/fixtures/`.
6. Run the suite directly while iterating: `npm run test:integration`.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
