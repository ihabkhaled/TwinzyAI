# Skill: Final Validation (Frontend)

The last step before declaring any piece of web work done — feature, refactor, or dependency bump.
It mirrors what CI and the pre-push hook enforce, so nothing here should ever fail "only in CI".
Gate policy: [rules/frontend/19-release-gates.md](../rules/frontend/19-release-gates.md) and
[testing/quality-gates.md](../testing/quality-gates.md).

> The backend/full-stack final gate (+ docker + manual QA report) is
> [final-validation.md](./final-validation.md). Run that too for full-stack changes; this one is the
> `apps/web` sequence.

## Gate sequence

Run in this order and stop at the first failure (fix via
[skills/fix-eslint-typecheck-frontend.md](./fix-eslint-typecheck-frontend.md) or the relevant
testing skill, then restart from the failed step):

```sh
npm install                 # 1. lockfile-consistent install (npm ci in CI)
npm run lint                # 2. ESLint flat config, --max-warnings=0
npm run typecheck           # 3. tsgo (tsc cross-check)
npm run test:coverage       # 4. Vitest + thresholds: 95% global, 100% pure-logic layers
npm run build               # 5. next build (typedRoutes, env validation)
npm run test:e2e            # 6. Playwright e2e (builds + starts the app itself)
npm run audit               # 7. npm audit --omit dev
npm run security:scan       # 8. trivy vuln + secret + misconfig (HIGH/CRITICAL)
npm run quality:dead-code   # 9. knip
npm run quality:circular    # 10. madge --circular
```

Add `npm run test:a11y` / `npm run test:visual` whenever the change touched any UI.

## Forbidden-pattern greps

Belt-and-suspenders on top of ESLint — run from the repo root against `apps/web/src`; every hit
outside the noted owners is a failure:

```sh
grep -rn "dangerouslySetInnerHTML" apps/web/src/                                 # zero hits, no exceptions
grep -rn "eslint-disable" apps/web/src/                                          # each hit must cite an approved waiver
grep -rnE "\.only\(|\.skip\(" apps/web/src/                                      # no focused/skipped tests
grep -rn "process.env" apps/web/src/ | grep -v "packages/env\|tests/setup\|middleware"
grep -rnE "from '(axios|zustand|sonner|zod|@tanstack/react-query|react-hook-form|next-intl)'" apps/web/src/ | grep -v "apps/web/src/packages/"
grep -rn "localStorage\|sessionStorage" apps/web/src/ | grep -v "packages/storage\|packages/browser"
```

Twinzy-specific: also confirm the uploaded image is never persisted, logged, or stored —
`grep -rn "localStorage\|indexedDB\|FileReader" apps/web/src/` should show no path that keeps the
photo bytes beyond the in-flight submission.

## Link and docs audit

If the change touched documentation: verify every repo-relative link resolves to a real file, and
that any renamed source file is re-pointed in `rules/`, `skills/`, `docs/`, and the context maps.
New env vars must appear in `.env.example`; new scripts in `package.json` must be reflected in
[rules/frontend/19-release-gates.md](../rules/frontend/19-release-gates.md).

## Report format

Close out with this block in the PR description or task hand-off:

```
## Final validation (web) — <branch> @ <short sha>, <date>

| #  | Gate            | Command                    | Result           |
|----|-----------------|----------------------------|------------------|
| 1  | Install         | npm install                | pass             |
| 2  | Lint            | npm run lint               | pass (0 warn)    |
| 3  | Typecheck       | npm run typecheck          | pass             |
| 4  | Unit + coverage | npm run test:coverage      | pass (<x>% lines)|
| 5  | Build           | npm run build              | pass             |
| 6  | E2E             | npm run test:e2e           | pass (<n> specs) |
| 7  | Audit           | npm run audit              | pass             |
| 8  | Trivy           | npm run security:scan      | pass             |
| 9  | Dead code       | npm run quality:dead-code  | pass             |
| 10 | Circular deps   | npm run quality:circular   | pass             |

Forbidden-pattern greps: clean / <findings + waiver links>
Extra suites run: <test:a11y / test:visual / none — why>
Waivers touched: <approved-waiver-ref or none>
```

A gate marked anything other than `pass` means the work is not done — there is no "known failure"
state outside an approved waiver.
