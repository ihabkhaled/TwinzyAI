# Skill: Final Validation

> Applies rules/24. Output: docs/final-validation-report.md.

Run in order; fix failures at the source; never skip:
1. npm run lint  2. npm run typecheck  3. npm run test:unit  4. npm run test:integration
5. npm run test:e2e  6. npm run test:coverage  7. npm run build
8. npm run docker:rebuild && npm run docker:up -> verify both healthchecks -> docker:down
9. Walk docs/manual-qa-checklist.md. 10. Write the report with real command outputs.
