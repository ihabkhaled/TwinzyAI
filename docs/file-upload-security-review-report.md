# File Upload Security Review Report

Date: 2026-07-05 · Scope: upload chain · Method: rules/15 checklist + TEST_CASES 1-16

Chain order verified in FileSecurityService: consent → presence → size → MIME allowlist →
extension allowlist → MIME/extension consistency → magic bytes → structural decode →
optional virus scan (fail closed).

| Case | Result |
| --- | --- |
| Valid JPG/PNG/WebP accepted | PASS (unit + integration) |
| text/plain MIME rejected 415 | PASS |
| .gif extension rejected 415 | PASS |
| PNG bytes named .jpg rejected 422 (magic bytes) | PASS |
| Corrupt JPEG (no SOF) rejected 422 (decode) | PASS |
| 1x1 px absurd dimensions rejected 422 | PASS |
| >5MB rejected 413 (config cap); >10MB rejected 413 (multer hard cap) | PASS |
| Missing consent rejected 400 before any processing | PASS |
| Missing file rejected 400 | PASS |
| Second file rejected 400 (multer files:1 → mapped envelope) | PASS |
| Buffer wiped after success and failure | PASS |
| No fs writes during analyze | PASS |
| No image bytes in logs | PASS |
| ClamAV enabled + infected → 422; enabled + unreachable → 503 fail closed | PASS |

HEIC/HEIF: rejected by design (no safe pure-JS decoder). Documented in
docs/file-upload-security.md and docs/package-decisions.md.
