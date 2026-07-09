# Quality Gates

> The complete set of automated gates that block delivery, the exact scripts behind them, and how Husky and CI enforce them. Implements the canon: [/context/stack-and-toolchain.md](../context/stack-and-toolchain.md), [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md), [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md), and the release gate in [/rules/24-release-gate.md](../rules/24-release-gate.md).

A gate is **binary**: it passes or it blocks. There is no "mostly passes," no "passes with caveats," no "we'll fix it after launch." A red gate blocks merge and release until it turns green and is re-verified. Every gate exists because a specific class of defect escapes without it.

## The six gates

| # | Gate | Command | Proves | Blocks |
| --- | --- | --- | --- | --- |
| 1 | Lint + architecture | `npm run lint` | 0 errors AND 0 warnings; layer/boundary/inline rules upheld | commit, push, merge |
| 2 | Type check | `npm run typecheck` | `tsc --noEmit` clean in every workspace under full strict TS | commit, push, merge |
| 3 | Unit tests | `npm run test:unit` | `api-unit` + `web-unit` + `shared-unit` + `lint-rules` green, 0 failures, 0 stray skips | push, merge |
| 4 | Coverage | `npm run test:coverage` | full suite (incl. `api-integration`) green **and** thresholds met (95/90/95/95) | push, merge |
| 5 | Build | `npm run build` | shared + api + web compile clean — the production artifacts are valid | push, merge, deploy |
| 6 | Security scan | `npm run security:scan` | trivy over the tree: **0 HIGH/CRITICAL** vuln/secret/misconfig findings | merge, deploy |

All six run identically locally and in CI. Root test scripts chain `npm run build:shared` first because `@twinzy/shared` is consumed as built `dist` — never bypass the scripts with a bare `npx vitest` and test a stale contract. `npm run validate` bundles gates 1, 2, 4, and 5 in one command.

## What each gate proves

### Gate 1 — Lint + architecture (`npm run lint`)

```bash
npm run lint        # 0 errors AND 0 warnings
npm run lint:fix    # auto-fix what is mechanically fixable
```

The ESLint flat config bundles the strict type-checked presets, security/sonarjs/unicorn/promise plugins, framework plugins per workspace, **and the custom architecture plugin** (`eslint/architecture-plugin`, itself tested by the `lint-rules` Vitest project). A red lint means one of:

- a banned token (`any`, `eslint-disable`, `@ts-ignore`, non-null `!`, `console.*`, the `enum` keyword);
- an inline domain type/interface/constant/schema outside its dedicated folder;
- a forbidden cross-layer import (controller bypassing the application layer (use-case / service), raw SDK/`fetch`/storage outside an adapter, `process.env` outside the config module);
- a violation of the frontend TSX-purity or backend layering rules ([/rules/01-architecture.md](../rules/01-architecture.md), [/rules/16-backend-architecture.md](../rules/16-backend-architecture.md)).

**Pass criteria:** exit 0 with zero errors and zero warnings. Warnings are not "acceptable noise" here — the floor is zero. Fix the root cause; never suppress. See [/skills/fix-eslint-typecheck.md](../skills/fix-eslint-typecheck.md).

### Gate 2 — Type check (`npm run typecheck`)

```bash
npm run typecheck   # build:shared, then tsc --noEmit in every workspace
```

Project-wide type check with every strict flag on. A failure means a contract between layers is broken: a DTO no longer matches its consumer, a shared schema changed under the API, a nullable was not handled, an `as const` union lost a member a `switch` depended on.

**Pass criteria:** zero type errors across `packages/shared`, `apps/api`, and `apps/web`.

### Gate 3 — Unit tests (`npm run test:unit`)

```bash
npm run test:unit   # vitest run --project api-unit --project web-unit --project shared-unit --project lint-rules
```

Every unit project must pass. Zero failures and zero unexpected skips. A failure means a behavior contract regressed or new code shipped without adequate coverage of its branches. Write or adjust tests **first**; see [/testing/testing-strategy.md](./testing-strategy.md).

### Gate 4 — Coverage (`npm run test:coverage`)

```bash
npm run test:coverage   # vitest run --coverage (v8 provider) across all projects
```

Runs the **entire** Vitest suite — including `api-integration` — with thresholds statements 95 / branches 90 / functions 95 / lines 95 on the gated scope (`apps/api` logic-bearing files + `packages/shared/src`; `apps/web` under the recorded waiver). A high global average never excuses a thin patch on changed code — read the per-file table. Full policy and waiver process: [/testing/coverage-policy.md](./coverage-policy.md).

**Pass criteria:** all four metrics meet or exceed the thresholds; the command exits 0.

### Gate 5 — Build (`npm run build`)

```bash
npm run build       # build:shared → build:api → build:web
```

Produces the deployable artifacts. Catches problems type-check and tests can miss: a broken runtime import, a circular dependency, a misconfigured module, a Next.js build-time failure, a dependency missing from `dependencies`. The artifact that builds clean is the artifact promoted through Docker ([docker-compose.yml](../docker-compose.yml)).

### Gate 6 — Security scan (`npm run security:scan`)

```bash
npm run security:scan        # trivy fs — vuln + secret + misconfig, HIGH/CRITICAL fail the run
npm run security:scan:full   # informational pass, all severities
```

Trivy scans the tree (dependencies included, `node_modules`/`dist`/`coverage` skipped) for vulnerabilities, committed secrets, and misconfigurations, and exits non-zero on any **HIGH or CRITICAL** finding. This is the mechanical half; the judgment half is the structured review in [/skills/security-review.md](../skills/security-review.md) — mandatory whenever a change touches uploads, AI prompts/outputs, error handling, config, or an external boundary, with sign-off per [/agents/backend-security-reviewer.md](../agents/backend-security-reviewer.md).

**Pass criteria:** exit 0 — zero unresolved HIGH/CRITICAL findings; no waiver without a written, approved record.

## How enforcement works — Husky

Hooks run the **same scripts** as CI, so a clean local pass predicts a clean pipeline.

| Hook | Runs | Why here |
| --- | --- | --- |
| `pre-commit` | `lint-staged` (eslint `--fix` on staged files) + `npm run typecheck` | catch violations before they enter history; fast feedback |
| `commit-msg` | `commitlint` (Conventional Commits) | enforce machine-readable, traceable history |
| `pre-push` | `npm run test:coverage` + `npm run build` | nothing reaches the remote without green tests, thresholds, and valid artifacts |

The split is deliberate: cheap checks gate every commit; the slower full suite + coverage + build gate the push. The project-wide `typecheck` runs even on small commits because a staged change can break an unstaged file.

```jsonc
// Conceptual hook flow — do NOT bypass with --no-verify
// pre-commit  : npx lint-staged  &&  npm run typecheck
// commit-msg  : commitlint --edit "$1"
// pre-push    : npm run test:coverage  &&  npm run build
```

Hooks install on `npm install` (Husky `prepare`). If a fresh clone shows no enforcement, run the install step before committing.

## How enforcement works — CI

CI reproduces the authoritative scripts in a clean environment — never a divergent shadow set of steps. Required jobs are version-controlled and enforced; none is marked optional or allow-failure.

The gates are intentionally split into separate GitHub Actions workflows so branch protection can require each check independently:

| Workflow | Required check | Command |
| --- | --- | --- |
| `.github/workflows/gate-lint.yml` | `lint` | `npm run lint` |
| `.github/workflows/gate-typecheck.yml` | `typecheck` | `npm run typecheck` |
| `.github/workflows/gate-unit-tests.yml` | `test:unit` | `npm run test:unit` |
| `.github/workflows/gate-coverage.yml` | `test:coverage` | `npm run test:coverage` |
| `.github/workflows/gate-build.yml` | `build` | `npm run build` |
| `.github/workflows/gate-security-scan.yml` | `security:scan` | `npm run security:scan` |

Do not combine these gates into one workflow job or one aggregate check. CI is the source of truth for merge eligibility: a pull request merges only when every required job is green. A flaky pipeline is a defect — fix the root cause; do not rerun until green.

## Do / Don't

Do — fix at the root and re-run the full gate set:

```bash
npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
```

Don't — bypass, suppress, or weaken a gate:

```bash
git commit --no-verify          # bans the safety net entirely
git push   --no-verify          # ships unverified code
# // eslint-disable-next-line  -> fix the rule violation instead
# lowering a coverage threshold to make a patch "pass"
# adding a HIGH finding to an ignore file instead of upgrading the dependency
```

`--no-verify` and rule suppression are prohibited. The only exception is a recorded, approved emergency (see [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) and [/docs/sdlc/company-sdlc-policy.md](../docs/sdlc/company-sdlc-policy.md)); even then, the skipped gates must be restored and re-run within the documented window.

## Blocker severity

| Severity | Definition | Action |
| --- | --- | --- |
| CRITICAL | privacy breach (image persisted/logged), safety-filter bypass, consent bypass, secret leak, HIGH/CRITICAL scan finding | no merge, no deploy; fix now |
| HIGH | any red automated gate (lint/typecheck/test/coverage/build/scan); core game path broken | no merge until green |
| MEDIUM | degraded behavior with a workaround, no privacy/safety impact | fix before release |
| LOW | cosmetic or wording issue, no functional impact | track as follow-up; non-blocking |

Any red automated gate is at least HIGH by definition. CRITICAL findings block regardless of deadline or business pressure.

## Re-run protocol

When a gate fails:

1. Identify the failing gate and the precise reason.
2. Distinguish a real defect from a transient (flaky test, registry hiccup) — flakiness is itself a defect to fix, not to ignore.
3. Fix the root cause through the normal flow — no shortcuts, no `--no-verify`.
4. Re-run the **entire** gate set, not just the one that failed. Partial passes stitched from multiple runs are not valid.
5. Record what failed and how it was resolved in the change's artifacts ([15-dev-validation-report.md](../docs/features/_template/15-dev-validation-report.md)).

A change is gate-approved only when all gates are green in a single, uninterrupted evaluation.

## Definition of done (automated gates)

- [ ] `npm run lint` — 0 errors AND 0 warnings
- [ ] `npm run typecheck` — 0 errors, every workspace
- [ ] `npm run test:unit` — all unit projects pass, 0 failures, 0 stray skips
- [ ] `npm run test:coverage` — full suite green; thresholds 95/90/95/95 met; touched files higher
- [ ] `npm run build` — shared + api + web compile clean
- [ ] `npm run security:scan` — 0 HIGH/CRITICAL findings
- [ ] Husky hooks ran (no `--no-verify`); CI required jobs green
- [ ] Tests and docs updated in the same change; behavior changes called out

## Related

[/testing/README.md](./README.md) · [/testing/testing-strategy.md](./testing-strategy.md) · [/testing/coverage-policy.md](./coverage-policy.md) · [/testing/bug-triage-and-retest.md](./bug-triage-and-retest.md) · [/skills/final-validation.md](../skills/final-validation.md) · [/skills/fix-eslint-typecheck.md](../skills/fix-eslint-typecheck.md) · [/rules/23-review-checklist.md](../rules/23-review-checklist.md) · [/rules/24-release-gate.md](../rules/24-release-gate.md) · [/agents/backend-release-gatekeeper.md](../agents/backend-release-gatekeeper.md) · [/context/stack-and-toolchain.md](../context/stack-and-toolchain.md)
