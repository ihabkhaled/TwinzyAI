# Testing Strategy

Canonical standard: [/testing/testing-strategy.md](../testing/testing-strategy.md) ·
rule [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md). **Tests-first** is the
default cycle.

- **Vitest 4 multi-project**: `api-unit`, `api-integration`, `shared-unit`, `web-unit`,
  `lint-rules`; Playwright for e2e. The **SWC plugin is mandatory** for the api projects (Nest
  decorator metadata — esbuild strips it), and **`build:shared` is a prerequisite** before
  typecheck/tests ([known-pitfalls.md](./known-pitfalls.md)).
- **Naming**: `*.test.ts` (unit) / `*.integration.test.ts` (integration). A file whose name
  does not match a vitest project's include patterns **silently never runs** — the pattern
  check is part of review ([known-pitfalls.md](./known-pitfalls.md)).
- **Fixtures** live in `apps/api/src/tests/fixtures/`: `fake-ai-adapter.ts`,
  `image-fixtures.ts`, `stubs.ts`.
- Gemini is always mocked via the AI provider port (Symbol token); the fake AI adapter fixture
  provides canned trait/candidate/judge responses. No network in the suite.
- Nest integration tests boot AppModule against the HTTP server (Fastify). Transient-scoped
  providers need `await app.resolve()`, not `app.get()`.
- **Coverage is a hard gate** (supersedes the earlier "socially enforced" note):
  **95 stmts / 90 branches / 95 funcs / 95 lines** on the gated scope — apps/api logic-bearing
  files + `packages/shared`; **apps/web is excluded until that workstream adopts (recorded
  waiver)**. The branch floor is 90 solely because decorator downlevel emits one uncoverable
  synthetic branch per decorated class line; real branches must be covered.
  Policy: [/testing/coverage-policy.md](../testing/coverage-policy.md).
- Enforced on pre-push (`test:coverage` + `build`) via husky
  ([backend-stack.md](./backend-stack.md)).
- E2E mocks the backend with page.route; a documented manual mode runs against real services.
