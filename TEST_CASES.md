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

## Shared contracts — advanced-global-traits-v3 (shared-unit)

| # | Case | Expectation |
| --- | --- | --- |
| 17 | Trait taxonomy size | 16 nested categories, 221 named trait fields (asserted ≥100) |
| 18 | `promptVersion` literal | anything but `advanced-global-traits-v3` rejected |
| 19 | `languageCode` | `en`/`ar` accepted; unknown code or missing field rejected |
| 20 | Missing trait category | rejected (strict schema) |
| 21 | Missing single category field | rejected |
| 22 | Extra field smuggled into a category | rejected (`strictObject`) |
| 23 | Trait value over 300 chars | rejected |
| 24 | `compactTraitSummary` bounds | 1–35 entries; 36th rejected |
| 25 | `uncertaintyNotes` bounds | 4 fixed lists, each ≤10 entries; 11th rejected |
| 26 | `traitCount` matches populated fields | rejected when count ≠ actual fields |
| 27 | `candidateCount` consistency | count ≠ candidates list length rejected |
| 28 | Candidate pool bounds | empty list and >20 candidates rejected |
| 29 | `resultCount` bounds | 1–10 accepted; 0 and 11 rejected |
| 30 | Judge results bound | up to 10 accepted; 11th rejected; results must not exceed `resultCount` |
| 31 | `removedCandidates` bound | ≤20; 21st rejected; missing disclaimer rejected |
| 32 | Final results bound | 10 accepted, 11 rejected; empty list + fallback message accepted; `resultCount` required |
| 33 | Final result safety check | missing `safetyCheck.meetsMinimumEvidence` rejected |
| 34 | Translate request strictness | unknown keys (e.g. an `image` slot) rejected; unsupported target language rejected |

## AI pipeline (api-unit)

| # | Case | Expectation |
| --- | --- | --- |
| 33 | Gemini timeout | mapped to safe `AI_TIMEOUT` error |
| 34 | Invalid JSON from Gemini | rejected `AI_RESPONSE_INVALID` |
| 35 | Unsafe trait response | rejected `AI_RESPONSE_UNSAFE` |
| 36 | Unsafe candidate response | rejected/sanitized (unsafe candidates dropped) |
| 37 | Unsafe judge response | rejected/sanitized (unsafe judged results dropped) |
| 38 | Candidate prompt receives no image | adapter called text-only (traits + summary embedded as text) |
| 39 | Judge prompt receives no image | adapter called text-only |
| 40 | Full advanced taxonomy required | missing category/field or smuggled extra field rejected |
| 41 | Prompt–taxonomy lock-step | every taxonomy field appears in the Prompt 1 template |
| 42 | Requested `languageCode` injected | language placeholder replaced in the prompt |
| 43 | Wrong-language response | rejected |
| 44 | Model self-reports a safety violation | rejected |
| 45 | Candidate pool larger than requested count | generated pool ≥ resultCount when safe |
| 46 | Final results capped at requested count | re-ranked by score; extras dropped; never exceeds `resultCount` |
| 47 | Weak/should-not-display matches removed | weak verdicts, low scores, non-displayable filtered out |
| 48 | No valid candidates | localized server-side fallback message returned |
| 49 | Disclaimer always present | fixed server-side disclaimer in the requested language, never model text |
| 50 | `removedCandidates` never public | judge removal list dropped from the aggregated payload |
| 51 | Trait payload carried through | traits + `compactTraitSummary` + `traitCount` + `resultCount` on the final response |
| 52 | Provider error | generic safe message, no raw error leaked |

## Translate result (api-integration) — `POST /api/v1/game/translate-result`

| # | Case | Expectation |
| --- | --- | --- |
| 53 | Text-only proof | translation never touches the image pipeline; no file slot exists |
| 54 | Canonical fields preserved | names, scores, ranks, verdicts restored from the original even if the model changed them |
| 55 | Renamed candidate | rejected `AI_RESPONSE_INVALID` (no new matching possible) |
| 56 | Server disclaimer enforced | localized fixed disclaimer overwrites model text |
| 57 | Unsupported target language / unknown keys | strict 400 |
| 58 | Result payload off-contract | strict 400 |
| 59 | Prompt version echoed | `advanced-global-traits-v3` on the translated payload |
| 60 | Result count preserved | `resultCount` unchanged on the translated payload |

## Architecture (eslint)

| # | Case | Expectation |
| --- | --- | --- |
| 60 | Controller with logic | `architecture/controller-no-logic` error |
| 61 | Gemini SDK import outside adapter | `architecture/no-direct-sdk-imports` error |
| 62 | `process.env` outside config | `architecture/no-direct-env-access` error |
| 63 | `any` usage | `@typescript-eslint/no-explicit-any` error |
| 64 | Inline DTO/schema in controller/service | `architecture/no-inline-domain-definitions` error |

## Frontend (web-unit)

Landing renders; game page renders; privacy notice visible; consent required before analyze;
result-count dropdown defaults to 10, offers 1–10, and is accessible; selected count is sent with
analyze and analyze-stream requests; upload accessible; client-side type/size validation messages;
preview object URL created and revoked; no image in localStorage/sessionStorage/IndexedDB; loading
state; result view renders compact summary chips + localized trait count; accordion maps the 15
detail categories (imageQuality has its own section) with translated titles and field rows; only
non-empty uncertainty groups shown with translated labels; up to the selected number of result
cards render score, verdict, confidence, and category labels; live processing shows the streamed
trait summary and candidate names; language switch translates the existing result through the
text-only endpoint — never re-uploading or re-analyzing the image; translation preserves
`resultCount`, canonical names, scores, ranks; translation exposes a loading state and a failure
keeps the previous result visible with an error message; no forbidden wording; friendly API error;
retry resets flow; disclaimer visible; share text safe.

## E2E (Playwright, mocked backend)

Home page loads on mobile and desktop; English flow; Arabic RTL flow; upload valid image; consent
required; result-count dropdown defaults to 10; select 1, 5, 10; analyze sends selected count;
streaming progress shows all stages; successful result renders requested count; top result card
shows score/reason/traits/disclaimer; trait summary displayed; uncertainty notes displayed;
mismatch warnings displayed if present; retry after recoverable failure; cancel during streaming;
translate result without re-upload; Arabic translation preserves canonical names/ranks/scores;
invalid file type; oversized file; backend validation error; model timeout; safety-filtered output;
network failure; refresh does not leak image data; no image persists after reset; accessibility scan
(axe); keyboard navigation; screen reader labels; mobile viewport layout; visual regression for
main screens; privacy/disclaimer always visible near results.
