# 10-engineering-standards-check.md — TwinzyAI Hardening v3

## Standards review matrix

| Standard | Status | Notes |
| --- | --- | --- |
| No `any`, no `@ts-ignore`, no `!` | Enforced | Base tsconfig and ESLint rules are strict. |
| No TS `enum`; use `as const` + derived types | Enforced | Repository convention is consistent. |
| No inline domain definitions | Enforced (backend), untested (frontend) | Backend plugin has RuleTester tests; frontend plugin has zero. |
| TSX pure composition | Enforced | `no-hooks-in-components`, `no-inline-component-logic`. |
| Backend one-way layers | Mostly | `game-stream.presenter.ts` exception. |
| Zod validation only | Enforced | class-validator is forbidden. |
| Vendor ownership / adapters | Enforced | No raw SDK imports outside adapters. |
| No `process.env` outside config/bootstrap | Enforced | Playwright config is allowed. |
| AppLogger only, no `console.*` | Enforced | `no-console` rule. |
| AppError with `messageKey` | Enforced | One hardcoded `GENERIC_PROMPT_ERROR` remains. |
| No magic numbers/strings | Documented but not enforced | `@typescript-eslint/no-magic-numbers` not enabled in production. |
| Tests first, 95/90/95/95 coverage | Partial | Per-file thresholds not enforced; web ungated. |
| Conventional commits, Husky | Enforced | Do not bypass. |

## Request-specific rules

- `resultCount` must be a validated integer 1–10 in shared schema, backend DTO, and frontend form.
- Scores must be calibrated evidence, never inflated to 90+.
- No identity/recognition/biometric/exact-lookalike language in prompts or outputs.
- Image remains memory-only; buffer wiped in `finally`.
- All 13 frontend architecture rules must have RuleTester tests.
- Magic-number enforcement must be enabled in production code.

## Permanent-rule update check

If the result-count feature or score-calibration introduces a new lasting pattern, `CLAUDE.md`, `AGENTS.md`, `CODEX.md`, `cursor.md`, `.cursorrules`, and `.cursor/rules/*.mdc` must be updated in the same delivery stream. Potential new rules:
- Result-count constants must live in `packages/shared`.
- Score bands must be defined in shared constants.
- Every AI pipeline stage must be timed and logged with `requestId`.

## Implementation constraints

- No weakening of ESLint rules to pass gates.
- No skipped tests or skipped docs.
- No raw SDK or direct browser/storage imports outside wrappers.
- No new dependencies without security and maintenance review.
