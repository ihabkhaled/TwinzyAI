# 24 — Release Gate

> The final go/no-go. Everything below must pass, in order, before any release. Never mark skipped tests as passed. Never release with a weakened rule. Never bypass a hook.

## The gate sequence

1. `npm run lint` — 0 errors AND 0 warnings
2. `npm run typecheck` — shared build + all workspaces (tsgo for api)
3. `npm run test:unit`
4. `npm run test:integration`
5. `npm run test:e2e`
6. `npm run test:coverage` — 95/90/95/95 floor holds ([09-testing-coverage.md](./09-testing-coverage.md))
7. `npm run build` — shared, api, web all compile clean
8. `npm run security:scan` — **trivy gate**: HIGH/CRITICAL vulnerabilities, secrets, or misconfig fail the release (`security:scan:full` for the informational sweep); `npm run audit` clean of actionable findings
9. **Docker smoke:** `npm run docker:rebuild` → `npm run docker:up` — web and api containers healthy, `/health` answering, one full mocked analyze flow exercised against the containers → `npm run docker:down`
10. **Release smoke test** executed per [runbooks/release-smoke-test-template.md](../runbooks/release-smoke-test-template.md) and the completed run recorded
11. Manual QA checklist ([docs/manual-qa-checklist.md](../docs/manual-qa-checklist.md))
12. Security review reports current (docs/*-review-report.md)
13. **Release notes written in [release-notes/](../release-notes/README.md)** from the template — every release ships with notes covering behavior changes, new env vars, and any migration/rollback steps (rollback path per [runbooks/rollback-template.md](../runbooks/rollback-template.md))

## Release invariants

- No secrets in the frontend bundle (`NEXT_PUBLIC_*` only); `.env.example` up to date with every variable the app reads
- No forbidden wording anywhere in the UI ([14-ai-safety.md](./14-ai-safety.md)); disclaimer present
- Privacy invariants re-verified on the built artifacts: nothing image-shaped in logs during the smoke run; no persistence anywhere
- Coverage not lowered, thresholds not edited, no skipped/focused tests in main
- Husky hooks intact (pre-commit, commit-msg/commitlint, pre-push); `--no-verify` never used in the release history

A red step stops the release. Report it with the command, the failing output, and the fix plan — then restart the gate from step 1 after the fix.
