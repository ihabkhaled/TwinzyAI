# Unit Test Case Template

## Metadata

| Field | Value |
| --- | --- |
| Test case ID | |
| Related request ID | |
| Layer | backend manager / service / adapter / util — frontend hook / service / gateway / lib — shared schema / util |
| Module / function | e.g. `apps/api/src/modules/file-security/...`, `apps/web/src/features/...`, `packages/shared/src/...` |
| Automated equivalent | colocated `*.test.ts` (Vitest), e.g. in the module's `tests/` folder — run via `npm run test:unit` |
| Owner | |

## Objective

[What logic is being validated. Standard: `testing/unit-testing-standard.md`. Unit tests isolate one unit — external boundaries (AI provider adapter, HTTP, storage wrappers) are always stubbed.]

## Preconditions

- [Precondition 1 — e.g. fixture builders from `apps/api/src/tests/fixtures/`; never real photos]

## Test Steps

1. [Step 1]
2. [Step 2]

## Expected Result

[Expected behavior, including thrown domain exceptions, error codes, or returned values.]

## Assertions

- [Assertion 1]
- [Assertion 2]

## Edge / Negative Variant

[Describe the failure or boundary variant linked to this unit — e.g. size exactly at the cap, malformed AI response rejected by the zod schema, forbidden wording caught by the safety filter.]

## Coverage Note

This case counts toward the coverage gate (`npm run test:coverage`: statements/branches/functions/lines ≥ 95/90/95/95). Name the branches this case closes.
