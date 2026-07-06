# Skill: Write E2E Tests

> Applies rules/09 and testing/e2e-testing-standard.md. Browser e2e = Playwright, and it
> lives in apps/web. Mocked backend by default.

1. Place specs in `apps/web/e2e/*.spec.ts`. Use `page.route` to mock `/api/v1/**` responses
   so runs are deterministic and no real AI call ever happens in CI.
2. Cover the journey, not internals: land -> consent -> upload -> processing -> results.
3. Include mobile viewports (320/375), dark mode, retry, failure paths (rate-limit, AI
   unavailable), and the a11y smoke (axe).
4. Keep selectors role/label-based — accessibility doubles as test stability.
5. Run the suite directly while iterating: `npm run test:e2e`.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
