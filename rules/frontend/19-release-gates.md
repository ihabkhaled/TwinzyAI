# 19 — Release Gates

A release candidate is a commit on `main` with every gate green. Gates are executable — each maps to an
npm script in [package.json](../../package.json) and runs in CI. Locally, `npm run validate` is the core
pipeline in one command. These gates operate under the shared SDLC governance and Go/No-Go phase in
[CLAUDE.md](../../CLAUDE.md); a green gate stack is necessary, not sufficient — the governance approvals
still apply.

## The gate list

| #   | Gate                                    | Command                                              | Where it runs                                            |
| --- | --------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| 1   | Lint (zero warnings)                    | `npm run lint`                                        | CI, `.husky/pre-commit` (staged via lint-staged)         |
| 2   | Formatting                              | `npm run format:check`                               | CI, `.husky/pre-commit` (staged)                         |
| 3   | Typecheck (strict TypeScript + E2E)     | `npm run typecheck`                                  | CI, `.husky/pre-push`                                    |
| 4   | Unit + integration with coverage 95/100 | `npm run test:coverage`                              | CI, `.husky/pre-push`                                    |
| 5   | Production build                        | `npm run build` (or `npm run build:web`)             | CI                                                       |
| 6   | E2E                                     | `npm run test:e2e`                                   | CI (Playwright, `apps/web`)                              |
| 7   | Accessibility (axe, zero violations)    | `npm run test:e2e` (a11y specs)                      | CI                                                       |
| 8   | Visual regression                       | `npm run test:e2e` (visual specs)                    | CI                                                       |
| 9   | Dependency audit                        | `npm run audit`                                      | CI                                                       |
| 10  | Trivy scan (vuln + secret + misconfig)  | `npm run security:scan`                              | CI                                                       |
| 11  | Conventional commits                    | commitlint (`commitlint.config.cjs`)                 | `.husky/commit-msg`                                      |

`npm run validate` = gates 1, 3, 4, 5 (`lint && typecheck && test:coverage && build`). The E2E,
security, and commit-message gates run through their own scripts and hooks.

## What blocks a release

Any of the following is an automatic no-go — there is no severity triage on gates:

- Any red gate above, including a single ESLint warning, a coverage threshold miss in
  [vitest.config.ts](../../vitest.config.ts), one axe violation, or one Trivy finding at the enforced
  severity.
- A `.only` or undocumented skipped test ([15-testing-and-coverage.md](15-testing-and-coverage.md)).
- Any inline ESLint or TypeScript suppression directive.
- An unresolved item on the [docs/sdlc/release-checklist.md](../../docs/sdlc/release-checklist.md) or the
  release smoke test under [runbooks/](../../runbooks/README.md).

## Exception process

Inline suppression, skipped required tests, lowered thresholds, hook bypasses, and force-merges have
no exception path. Repository-level vendor false-positive configuration or accepted third-party
vulnerabilities still require a dated, owned decision record, compensating control, and security
approval; they never authorize source suppression comments.

## Ownership

- The release decision follows
  [agents/frontend-release-gatekeeper.md](../../agents/frontend-release-gatekeeper.md)
  and is executed via [skills/final-validation.md](../../skills/final-validation.md).
- Gate definitions and rationale: [testing/frontend/quality-gates.md](../../testing/frontend/quality-gates.md)
  and [docs/sdlc/qa-baseline.md](../../docs/sdlc/qa-baseline.md).
- Per-feature readiness lives in the SDLC feature template under
  [docs/features/_template/](../../docs/features/_template/) (`13-implementation-readiness.md`,
  `22-go-no-go.md`).
