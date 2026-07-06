# Integration Test Case Template

## Metadata

| Field | Value |
| --- | --- |
| Test case ID | |
| Related request ID | |
| Boundary under test | e.g. HTTP route → controller → manager → services (`/api/v1/game/analyze`), module-to-module contract, error filter envelope |
| Systems involved | `apps/api` modules; AI provider always stubbed — no live Gemini calls in tests |
| Automated equivalent | `*.integration.test.ts` (Vitest api-integration project) — run via `npm run test:integration` |
| Owner | |

## Objective

[What interaction or contract is being validated. Standard: `testing/integration-testing-standard.md`. Typical subjects: validation order (consent before file checks), status codes, the `ApiErrorResponse` envelope, upload-chain behavior against crafted buffers.]

## Preconditions

- [Precondition 1 — e.g. Nest testing module bootstrapped; fixture image built via `apps/api/src/tests/fixtures/image-fixtures.ts`]

## Steps

1. [Step 1 — e.g. POST multipart with consent field and JPEG fixture]
2. [Step 2]

## Expected Result

[Expected end state: status code, envelope fields (`statusCode`, `errorCode`, `message`, `messageKey`), and response body shape validated against the shared zod contract.]

## Evidence

- Response status and body:
- Logs (structured entry, request-id, warn/error level as expected):
- Contract check (shared schema parse succeeds):
