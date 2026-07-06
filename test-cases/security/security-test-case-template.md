# Security Test Case Template

## Metadata

| Field | Value |
| --- | --- |
| Test case ID | |
| Related request ID | |
| Control area | consent gate / upload chain (size, MIME, extension, magic bytes, decode, ClamAV fail-closed) / AI safety filter / log redaction / rate limiting / headers-CORS / secrets |
| Automated equivalent | `npm run test:security` and `npm run test:file-security` (Vitest, file-security + privacy + common suites); dependency posture via `npm run security:scan` |
| Owner | |

## Objective

[What security control or abuse case is being validated. Baseline: `docs/sdlc/security-baseline.md`; rule bodies: `rules/06-security.md`, `rules/14-ai-safety.md`, `rules/15-file-upload-security.md`.]

## Preconditions

- [Precondition 1 — e.g. crafted hostile buffer (wrong magic bytes, polyglot, oversize) built in-test; never a real malware sample in the repo]

## Steps

1. [Step 1]
2. [Step 2]

## Expected Result

[What must be blocked, rejected, redacted, or logged — e.g. request rejected with the correct 4xx envelope (`CONSENT_REQUIRED`, `FILE_TOO_LARGE`, `FILE_TYPE_NOT_ALLOWED`, `VIRUS_SCAN_FAILED`); no image bytes or provider internals in any log line; scanner failure rejects (fail closed), never passes.]

## Evidence

- Response behavior (status, error code, envelope):
- Logs (warn/error level, redaction verified):
- Non-persistence check (nothing written to disk):
