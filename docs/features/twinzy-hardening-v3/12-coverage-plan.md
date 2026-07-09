# 12-coverage-plan.md — TwinzyAI Hardening v3

## Touched modules

- `packages/shared/src/constants/**/*.ts`
- `packages/shared/src/schemas/**/*.ts`
- `packages/shared/src/enums/**/*.ts`
- `packages/shared/src/types/` (renamed from `interfaces/`)
- `packages/shared/src/utils/**/*.ts`
- `apps/api/src/modules/game/api/**/*.ts`
- `apps/api/src/modules/game/application/**/*.ts`
- `apps/api/src/modules/game/domain/**/*.ts` (if any)
- `apps/api/src/modules/game/lib/**/*.ts`
- `apps/api/src/modules/ai/application/**/*.ts`
- `apps/api/src/modules/ai/adapters/**/*.ts`
- `apps/api/src/modules/ai/lib/**/*.ts`
- `apps/api/src/modules/ai/model/*.ts` (prompt constants)
- `apps/api/src/modules/result-aggregation/**/*.ts`
- `apps/api/src/modules/file-security/**/*.ts`
- `apps/api/src/core/http/sse-writer.ts`
- `apps/web/src/modules/game/**/*.ts*`
- `apps/web/src/packages/i18n/**/*.ts`
- `apps/web/e2e/**/*.ts`
- `eslint/frontend-architecture-plugin/**/*.mjs`
- `eslint/architecture-plugin/**/*.mjs`

## Required thresholds

- Touched modules per file: `statements 95%, branches 90%, functions 95%, lines 95%`.
- Enable `perFile: true` in `vitest.config.ts` so the threshold is mechanical, not eyeballed.
- Add `packages/shared/src/schemas/**/*.ts` to `coverage.include`.
- Add `apps/api/src/core/http/sse-writer.ts` to `coverage.include`.
- Add `game-stream.presenter.ts` (or its moved location) to `coverage.include`.
- Frontend coverage must be gated; either create the promised `apps/web/vitest.config.mts` or update `testing/frontend/coverage-policy.md`.

## Critical scenario areas

- Result-count validation (frontend, backend, shared schema).
- Prompt v3 version echo and fixture compatibility.
- Trait extraction response parsing and safety filter.
- Candidate generation count and pool sizing.
- Judge scoring, sorting, and requested-count enforcement.
- Result aggregation, disclaimer injection, score capping.
- Translation preserving canonical fields.
- Image upload security (MIME, magic bytes, decode, ClamAV).
- Buffer wipe and no image persistence.
- Streaming cancellation and SSE message protocol.
- `AiSafetyService` and forbidden-wording guard.
- Error mapping and localized error envelopes.
- ESLint rule correctness (RuleTester).
- Playwright core business flows (35+ scenarios).

## Evidence plan

- Vitest coverage report (HTML + terminal summary).
- Per-file coverage table exported from Vitest.
- Playwright report with pass/fail per scenario.
- RuleTester test output showing all rules have valid/invalid cases.
- Manual test log for scenarios not covered by automation.

## Waiver status

- No waivers requested. If any touched module cannot reach 95/90/95/95, the code must be refactored or an explicit waiver must be approved by the request owner and QA lead before merge.
