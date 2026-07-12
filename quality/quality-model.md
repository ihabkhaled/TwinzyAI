---
id: quality-model
title: Quality Model — The Gates
type: quality
authority: canonical
status: current
owner: repository owner
summary: The consolidated gate model — exact commands for lint, typecheck, tests, coverage, build, dead-code, circular-deps, and security scans, and where each runs (local hooks and CI).
keywords: [gates, lint, typecheck, coverage, build, knip, madge, trivy, security-scan, ci, husky]
contextTier: 2
relatedCode: [package.json, .github/workflows/gate-lint.yml, .github/workflows/gate-security-scan.yml, .github/workflows/gate-coverage.yml]
relatedTests: []
relatedDocs: [testing/quality-gates.md, docs/sdlc/README.md, testing/coverage-policy.md]
readWhen: You need the exact command for a gate, or to know which checks block a change.
---

# Quality Model — The Gates

Command truth is root [package.json](../package.json); CI truth is
[.github/workflows/](../.github/workflows/). Per-gate depth (what each test layer proves) is
owned by [testing/quality-gates.md](../testing/quality-gates.md) and
[testing/frontend/quality-gates.md](../testing/frontend/quality-gates.md).

## The gates and their exact commands

| Gate | Command (root package.json) | Pass bar |
| --- | --- | --- |
| Lint | `npm run lint` | ESLint `--max-warnings 0` — zero errors AND zero warnings |
| Format | `npm run format:check` | Prettier clean |
| Dead code | `npm run quality:dead-code` | knip clean |
| Circular deps | `npm run quality:circular` | madge finds no cycles in `apps/web/src` + `apps/api/src` |
| Typecheck | `npm run typecheck` | tsc `--noEmit` clean across workspaces |
| Unit tests | `npm run test:unit` | all Vitest projects green (api-unit, web-unit, shared-unit, lint-rules) |
| Coverage | `npm run test:coverage` | ≥ 95/90/95/95 statements/branches/functions/lines ([testing/coverage-policy.md](../testing/coverage-policy.md)); frontend additionally 100% for utils/helpers/mappers/schemas/query-key builders ([testing/frontend/coverage-policy.md](../testing/frontend/coverage-policy.md)) |
| E2E | `npm run test:e2e:ci` | Playwright green (mocked backend) |
| Build | `npm run build` | shared + api + web build |
| Dependency audit | `npm run security:audit` | `npm audit --audit-level=low` — fails on any advisory |
| Security scan | `npm run security:scan` | Trivy vuln+secret+misconfig, HIGH/CRITICAL → exit 1 |
| Secret scan | `npm run security:scan:secrets` | `scripts/scan-secrets.mjs` clean |
| Image scan | `npm run security:scan:images` | Trivy on both built images, HIGH/CRITICAL → exit 1 |

`npm run validate` bundles format:check + lint + typecheck + test:coverage + build +
dead-code + circular into one command ([package.json](../package.json)).

## Where they run

- **CI** — seven required workflows, each on `pull_request`, `push` to `main`, and
  `workflow_dispatch`: Gate‑Lint (lint + format + knip + madge), Gate‑Typecheck,
  Gate‑Unit‑Tests, Gate‑Coverage, Gate‑E2E (uploads the Playwright report artifact),
  Gate‑Build, Gate‑Security‑Scan (audit + Trivy + SARIF upload to code scanning)
  ([.github/workflows/](../.github/workflows/)).
- **Local** — Husky hooks under [.husky/](../.husky/) run the same authoritative commands;
  hooks are never bypassed (`--no-verify` forbidden without a recorded emergency exception —
  CLAUDE.md pre-commit gate rules; [docs/sdlc/README.md](../docs/sdlc/README.md)).

## Architecture as a gate

Layer boundaries are lint-enforced, not advisory: the backend custom plugin
([docs/eslint-architecture.md](../docs/eslint-architecture.md)) and the 13 frontend rules
([docs/eslint/README.md](../docs/eslint/README.md)) all run at error level inside the lint gate.

## Gate failures

Fix the root cause; never silence. Inline ESLint suppression is banned with no exceptions
(CLAUDE.md Non-Negotiable Gates). Rule-level configuration changes go through
[exception-policy.md](exception-policy.md); gate waivers through
[waiver-register.md](waiver-register.md).
