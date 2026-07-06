# Frontend Quality Gates (`apps/web`)

Every gate below maps to one npm script in `apps/web/package.json`, runs in a defined place, and has
a defined blocking status. "Blocking" means a red result stops the commit, push, or merge — no
overrides, no "merge now, fix later". Exceptions require a documented, reviewed waiver (recorded in
the feature's QA/security artifact or an ADR under
[architecture/adrs/](../../architecture/adrs/README.md)).

## Gate table

| Gate                                                      | Script                                                          | Runs in                                       | Blocking |
| --------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------- | -------- |
| Formatting                                                | `npm run format:check`                                         | pre-commit (via `lint-staged`); CI            | Yes      |
| Lint (zero warnings)                                      | `npm run lint` (`eslint . --max-warnings=0`)                   | pre-commit (staged scope); CI (full)          | Yes      |
| Typecheck (strict, tsgo)                                  | `npm run typecheck` (tsgo over app + test + node tsconfigs)    | pre-push; CI                                  | Yes      |
| Unit + integration tests with coverage thresholds         | `npm run test:coverage` ([coverage-policy.md](coverage-policy.md)) | pre-push (`npm run test`); CI (with coverage) | Yes      |
| Production build                                          | `npm run build`                                                | CI; also implied by the e2e webServer         | Yes      |
| End-to-end                                                | `npm run test:e2e`                                             | CI (e2e workflow)                             | Yes      |
| Accessibility (axe serious/critical = 0 + keyboard specs) | `npm run test:a11y`                                            | CI (e2e workflow)                             | Yes      |
| Visual regression (`maxDiffPixelRatio: 0.02`)             | `npm run test:visual`                                          | CI (e2e workflow)                             | Yes      |
| Dependency vulnerabilities                                | `npm run security:audit` (`npm audit`)                         | CI (security workflow)                        | Yes — zero unhandled findings; fixes use a pinned `overrides` entry + a note in `apps/web/package.json` |
| Vuln + secret + misconfig scan                            | `npm run security:scan` (Trivy fs scan)                        | CI (security workflow)                        | Yes      |
| Dead code                                                 | `npm run quality:dead-code` (knip)                             | CI                                            | Yes      |
| Circular dependencies                                     | `npm run quality:circular` (madge over `src`)                  | CI                                            | Yes      |
| Commit message convention                                 | commitlint (conventional)                                      | commit-msg hook                               | Yes      |

## Local enforcement: git hooks

- `pre-commit` → `lint-staged` (format + lint on staged files only, keeping commits fast).
- `commit-msg` → commitlint with the conventional config.
- `pre-push` → `npm run typecheck && npm run test`.

Hooks are the fast local echo of CI, not a substitute for it — CI always runs the full, unscoped
gate set. Bypassing hooks (`--no-verify`) is never acceptable; if a hook is wrong, fix the hook.

## Composite scripts

- `npm run quality` = lint → typecheck → test:coverage → build. Run it before opening a PR.
- `npm run validate` = `quality` + e2e + a11y + visual + security:audit + security:scan + dead-code
  + circular. This is the full frontend release gate — the same bar CI applies — runnable on one
  machine. The [frontend-release-gatekeeper](../../agents/frontend-release-gatekeeper.md) executes
  it via [skills/final-validation.md](../../skills/final-validation.md).

## Merge and release

- A PR merges only when the CI, security, and e2e workflows are green and review passes the checklist
  in [rules/frontend/20-review-checklist.md](../../rules/frontend/20-review-checklist.md).
- Release additionally follows
  [rules/frontend/19-release-gates.md](../../rules/frontend/19-release-gates.md) and
  [docs/sdlc/release-checklist.md](../../docs/sdlc/release-checklist.md), including the manual
  accessibility pass from [accessibility-testing-standard.md](accessibility-testing-standard.md) and
  the Twinzy release invariants (no monetization, no image persistence, no biometric/identity
  claims, `en`/`ar` catalog parity, PWA installability).
- Flaky-test policy: a test that fails intermittently is treated as failing. Quarantining it (skip)
  requires a documented exception with an owner and a fix-by date.
