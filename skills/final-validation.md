# Skill: Final Validation

> Applies rules/23, 24 and the standards in testing/ (quality-gates.md, coverage-policy.md,
> testing-strategy.md). Output: docs/final-validation-report.md.

1. Review the full diff first: no debug leftovers, no unrelated churn, no banned tokens
   (`any`, `eslint-disable`, `@ts-ignore`, non-null `!`, `console.*`).
2. Run the authoritative gates; fix failures at the source; never weaken a rule or threshold:
   1. `npm run format:check`
   2. `npm run lint`            — 0 errors AND 0 warnings
   3. `npm run typecheck`       — strict app + E2E TypeScript
   4. `npm run test:unit`
   5. `npm run test:coverage`   — floors 95/90/95/95 per testing/coverage-policy.md
   6. `npm run build`
   7. `npm run quality:dead-code && npm run quality:circular`
   8. `npm run security:scan`
3. If routes, flows, or uploads changed, also run:
   `npm run test:integration && npm run test:e2e`.
4. Docker: `npm run docker:rebuild && npm run docker:up` -> verify both healthchecks ->
   `npm run docker:down`.
5. Walk docs/manual-qa-checklist.md for every touched flow.
6. Commit with a conventional message THROUGH the hooks (pre-commit, commit-msg, pre-push).
   `--no-verify` is forbidden — a change that cannot pass the hooks is not done.
7. Write the report with real command outputs, findings, and accepted risks.

Gate: `npm run validate && npm run test:unit && npm run test:e2e:ci && npm run security:scan`
