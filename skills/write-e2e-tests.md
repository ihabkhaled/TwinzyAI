# Skill: Write E2E Tests

> Applies rules/09. Mocked backend by default.

1. Place specs in apps/web/e2e/. Use page.route to mock /api/v1/** responses.
2. Cover the journey, not internals: land -> consent -> upload -> processing -> results.
3. Include mobile viewports (320/375), dark mode, retry, failure paths, a11y smoke (axe).
4. Keep selectors role/label-based (accessibility doubles as test stability).
Gate: npm run test:e2e
