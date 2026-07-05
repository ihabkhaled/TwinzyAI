# Release Checklist

1. npm run validate (lint + typecheck + coverage + build) green.
2. npm run test:integration and npm run test:e2e green.
3. npm run docker:rebuild && npm run docker:up — web and api healthchecks pass — docker:down.
4. docs/manual-qa-checklist.md walked on a real phone viewport.
5. Security/AI-safety/upload review reports up to date (docs/*-review-report.md).
6. Trivy scan clean or accepted (docs/security-review-report.md documents exceptions).
7. .env.example matches docs/env-vars.md; no secrets in repo or images.
8. No forbidden wording anywhere in UI or copy (shared FORBIDDEN_RESULT_PHRASES list).
9. Confirm: game is free, no payment code, no image persistence, prompts file-loaded,
   GEMINI_MODEL from env.
