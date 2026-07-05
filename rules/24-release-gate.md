# 24 — Release Gate

All must pass before release:
1. npm run lint
2. npm run typecheck
3. npm run test:unit
4. npm run test:integration
5. npm run test:e2e
6. npm run test:coverage
7. npm run build
8. npm run docker:rebuild, npm run docker:up (web and api healthy), npm run docker:down
9. Manual QA checklist (docs/manual-qa-checklist.md)
10. Security review reports current (docs/*-review-report.md)
11. No secrets in the frontend bundle; .env.example up to date; no forbidden wording in the UI.

Never mark skipped tests as passed. Never release with a weakened rule.
