# 15 — Dev Validation Report: AI Knowledge Operating System

Validated 2026-07-12 on Windows 11, Node 22 workspace, working tree at the ai-knowledge-os
delivery stream (post-writers, post-lint-hardening).

## Commands run and results

| Command | Result |
| --- | --- |
| `npm run knowledge:build` | ok in ~800ms — 643 source files, 660+ documents, 1,335 symbols, 163 tests, 9 API endpoints + 7 web routes, 81 contracts, 79 errors, 68 env keys (0 undocumented), 6 prompts, 26 packs, 13 summaries, 2,300+ relationships; bootstrap 1,32x/1,500 tokens, hot memory 879/1,500 |
| `npm run knowledge:validate` | all six validators green: frontmatter ok (≈468 legacy docs pending progressive adoption), links ok (0 strict broken), source references ok, generated files match inputs, packs present + within budget, 0 contradiction check findings / 3 recorded open registry entries |
| `npm run knowledge:benchmark` | 21/21 golden tasks green; p50 ≈3ms, p95 ≈4ms (targets 300ms/1,000ms); max 6 initial docs (target <15); all 11 golden-question sources verified |
| `npm run knowledge:context -- --task="..."` | manual spot checks: upload-copy task → localization-change/standard with runners-up listed; PayPal refund task → payments-change/critical (confidence 0.86) with the go/no-go record in must-read |
| `npm run lint` | exit 0 (0 errors / 0 warnings, whole repo incl. 35 compiler scripts) |
| `npm run format:check` | all files pass |
| `npm run typecheck` | exit 0 |
| `npm run quality:dead-code` (knip) | exit 0 after wiring `knowledge:tokens` and pruning unused exports |
| `npm run quality:circular` | no circular dependency |
| `npm run test:coverage` / `npm run build` | executed by the pre-push hook on push (no app source touched) |

## Defects found and fixed during validation

1. Route scanner initially missed constant-argument decorators (`@Post(GAME_ROUTE_ANALYZE)`) —
   4 endpoints instead of 9; fixed by resolving identifiers through the repo constant map.
2. Contradiction check `no-eslint-suppression` matched prose in `eslint/index.mjs`; pattern
   narrowed to directive comments only.
3. Real `.env.example` inconsistencies surfaced by the checker (price mirror 0.01 vs 0.50,
   `PAYPAL_ENV=live` example, stale "paid gating forbidden" comment) — reconciled.
4. `sort→toSorted` codemod created three discarded-result bugs (symbols/errors/broken-links
   ordering) — caught by `unicorn/no-unused-array-method-return` + review, fixed properly.
5. Five writer docs cited `apps/web/e2e/playwright.config.ts` (actual:
   `apps/web/playwright.config.ts`) — fixed; validator now proves all references resolve.
6. Vocabulary synonym `402` parsed as a YAML number and crashed index building — classifier
   made type-tolerant.

## Verdict

Green across every applicable gate; no known blocking defect. Open items are recorded in
09-impact-analysis (follow-ups) and the contradiction registry — none block merge.
