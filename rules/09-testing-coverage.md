# 09 — Testing & Coverage

- Tests first for new behavior. Tests assert behavior, not implementation details.
- Projects: shared-unit, api-unit, api-integration (supertest), web-unit (Testing Library),
  e2e (Playwright).
- Always mock external providers (Gemini, ClamAV); never call real providers in CI.
- No skipped or focused tests in main. Coverage runs on pre-push; keep meaningful coverage on
  the pipeline, file-security, and safety code paths (the risk centers).
- E2E uses mocked backend routes by default; real-Gemini runs are manual and documented.
