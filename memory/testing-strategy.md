# Testing Strategy

- Vitest projects: shared-unit, api-unit, api-integration, web-unit; Playwright for e2e.
- Nest integration tests boot AppModule with supertest against the HTTP server.
- Gemini is always mocked via the AiProviderAdapter interface; a FakeGeminiAdapter fixture
  provides canned trait/candidate/judge responses.
- E2E mocks the backend with page.route; a documented manual mode runs against real services.
- Coverage report generated on test:coverage and enforced socially via review, not a hard
  threshold gate (documented in docs/testing-strategy.md).
