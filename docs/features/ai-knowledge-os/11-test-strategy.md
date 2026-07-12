# 11 — Test Strategy & Coverage: AI Knowledge Operating System

(Phase 12 coverage plan merged here per the standard-lane compression rule.)

## What is validated, and how

| Surface | Validation | Gate |
| --- | --- | --- |
| Compiler correctness | Full build over the real repo (643 source files, 660+ docs) — every scanner/builder exercised end-to-end; deterministic re-run yields no diff | `npm run knowledge:build` + CI `git diff --exit-code .ai` |
| Routing precision | 21 golden tasks asserting task type, lane, and mustInclude context | `npm run knowledge:benchmark` (hard fail) |
| Resolver performance | p50/p95 across the golden suite vs policy targets (300ms/1s) | same — measured p50 ~3ms, p95 ~4ms |
| Knowledge integrity | frontmatter completeness + unique ids; strict-link resolution; routing/pack/frontmatter path references; pack presence + budgets; generated-file drift; contradiction checks | `npm run knowledge:validate` (6 validators, all hard-fail) |
| Knowledge regression | 11 golden questions with recorded answers + canonical sources + code evidence; sources existence machine-checked | benchmark step |
| Repo gates unaffected | lint 0/0, format:check, typecheck, knip, madge — all green after the change; unit/integration/e2e run in pre-push (`test:coverage`) and CI | hooks + existing gates |

## Touched-module coverage (95% rule)

No `apps/*`/`packages/shared` module was touched, so the 95% vitest thresholds apply to an
empty set; the compiler's equivalent behavioral gate is the full-repo build + golden suite
above, which executes every script (35/35) on every build. A vitest `knowledge` project for
unit-testing classifier edge cases is a recorded follow-up, not a waiver of app coverage.

## Negative and edge cases exercised during development (evidence in 15)

- Budget overrun → build fails (observed while sizing the bootstrap).
- Contradiction check finding → build fails (observed twice: suppression-pattern false
  positive on `eslint/index.mjs` prose → pattern refined to directive-only; real
  `.env.example` price-mirror mismatch → reconciled).
- Broken strict link / unresolved reference → validate fails (observed: template-relative
  links, wrong `playwright.config.ts` path in 5 writer docs — fixed).
- Missing indexes → resolver fails with "run knowledge:build" guidance.
- Wrong classification → benchmark fails (observed: performance-vs-pipeline tie — keyword
  tuning recorded in routing-map).
