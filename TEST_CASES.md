# TEST_CASES.md — Behavioral Test Matrix

Living checklist of behaviors under test. Every case maps to at least one automated test.

> Detailed reusable test cases live in [`test-cases/`](test-cases/) (unit / integration / e2e /
> security / business). Test standards, layers, and the coverage policy live in
> [`testing/`](testing/). This file is the compact behavioral matrix.

## File security (api-unit / api-integration)

| # | Case | Expectation |
| --- | --- | --- |
| 1 | Valid JPG | accepted |
| 2 | Valid PNG | accepted |
| 3 | Valid WebP | accepted |
| 4 | Invalid MIME (e.g. text/plain) | rejected `FILE_TYPE_NOT_ALLOWED` |
| 5 | Invalid extension (.gif/.exe) | rejected `FILE_TYPE_NOT_ALLOWED` |
| 6 | MIME/extension mismatch | rejected |
| 7 | Oversized file | rejected `FILE_TOO_LARGE` |
| 8 | Magic-byte mismatch (renamed file) | rejected `FILE_INVALID` |
| 9 | Malformed/corrupt image | rejected `FILE_INVALID` |
| 10 | Missing consent | rejected `CONSENT_REQUIRED` |
| 11 | Missing file | rejected `FILE_MISSING` |
| 12 | Multiple files | rejected `MULTIPLE_FILES_NOT_ALLOWED` |
| 13 | Cleanup after success | buffer zero-filled |
| 14 | Cleanup after failure | buffer zero-filled |
| 15 | Image never persisted | no fs writes |
| 16 | Image never logged | log output contains no image bytes |

## AI pipeline (api-unit)

| # | Case | Expectation |
| --- | --- | --- |
| 17 | Gemini timeout | mapped to safe `AI_TIMEOUT` error |
| 18 | Invalid JSON from Gemini | rejected `AI_RESPONSE_INVALID` |
| 19 | Unsafe trait response | rejected `AI_RESPONSE_UNSAFE` |
| 20 | Unsafe candidate response | rejected/sanitized |
| 21 | Unsafe judge response | rejected/sanitized |
| 22 | Candidate prompt receives no image | adapter called text-only |
| 23 | Judge prompt receives no image | adapter called text-only |
| 24 | Exactly 15 traits required | 14 or 16 rejected |
| 25 | >5 candidates | rejected by schema (documented behavior) |
| 26 | Final results capped at 4 | 5th dropped |
| 27 | Weak/should-not-display matches removed | filtered out |
| 28 | No valid candidates | fallback message returned |
| 29 | Disclaimer always present | in every success response |
| 30 | Provider error | generic safe message, no raw error leaked |

## Architecture (eslint)

| # | Case | Expectation |
| --- | --- | --- |
| 31 | Controller with logic | `architecture/controller-no-logic` error |
| 32 | Gemini SDK import outside adapter | `architecture/no-direct-sdk-imports` error |
| 33 | `process.env` outside config | `architecture/no-direct-env-access` error |
| 34 | `any` usage | `@typescript-eslint/no-explicit-any` error |
| 35 | Inline DTO/schema in controller/service | `architecture/no-inline-domain-definitions` error |

## Frontend (web-unit)

Landing renders; game page renders; privacy notice visible; consent required before analyze;
upload accessible; client-side type/size validation messages; preview object URL created and
revoked; no image in localStorage/sessionStorage/IndexedDB; loading state; results + traits render;
no forbidden wording; friendly API error; retry resets flow; disclaimer visible; share text safe.

## E2E (Playwright, mocked backend)

Happy path; invalid upload; API failure; 320px/375px mobile flows; dark mode; retry flow;
PWA manifest smoke; accessibility smoke (axe).
