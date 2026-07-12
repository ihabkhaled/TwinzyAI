---
id: structure-module-api-file-security
title: Module — api file-security (Upload Verification Chain)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The backend upload-verification chain — consent, presence, size, type allowlists, magic bytes, structural decode, optional fail-closed ClamAV — plus in-memory buffer zero-fill.
keywords: [file-security, upload, validation, magic-bytes, clamav, mime, consent, buffer, wipe]
contextTier: 2
relatedCode: [apps/api/src/modules/file-security]
relatedTests: [apps/api/src/modules/file-security/tests, apps/api/src/tests/game-analyze.integration.test.ts]
relatedDocs: [rules/15-file-upload-security.md, docs/file-upload-security.md, structure/flows/analyze-flow.md]
readWhen: You are changing upload validation, image formats, size limits, or virus scanning.
---

# Module — `apps/api/src/modules/file-security`

**Responsibility.** The backend upload-verification chain of
[rules/15-file-upload-security.md](../../rules/15-file-upload-security.md), plus the
zero-fill cleanup that guarantees uploaded images never outlive the request. No controller;
consumed by the `game` module.

## Public surface (`index.ts`)

`FileSecurityService`, `TemporaryFileCleanupService`, `FileSecurityModule`,
`wipeUploadedImageBuffer` (`lib/upload-buffer-cleanup.util.ts`), `type UploadedImageFile`.

## Key files

| File | Role |
| --- | --- |
| `application/file-security.service.ts` | `assertSafeImage(file, consent)` — orchestrates the documented order: consent → presence → size → type allowlists + extension↔MIME consistency → magic bytes → structural decode → optional virus scan |
| `application/file-validation.service.ts` | Presence / size (`maxImageSizeBytes`) / MIME+extension allowlist |
| `application/magic-byte-validation.service.ts` | Magic bytes vs declared type (incl. WebP `RIFF`+`WEBP` marker) |
| `application/image-decode-validation.service.ts` | Header-level structural decode (JPEG SOF / PNG IHDR / WebP VP8*); dimensions bounded 8–12,000 px |
| `application/virus-scan.service.ts` | Skipped when `ENABLE_CLAMAV` false; when enabled, scanner errors fail CLOSED (503), infected → 422 |
| `application/temporary-file-cleanup.service.ts` | `wipe(file)` zero-fills the memory buffer; called from use-case `finally` blocks |
| `adapters/clamav.adapter.ts` | Minimal clamd INSTREAM TCP client — the only file speaking the clamd wire protocol; ordered `CLAMAV_HOSTS`, first reachable cached, 10 s timeout |
| `model/file-security.errors.ts` | Typed HTTP errors: `UnsupportedImageTypeError` 415, `InvalidImageError` 422, `InfectedFileError` 422, `VirusScanUnavailableError` 503 |

Allowlists (`jpeg/png/webp`) are shared constants re-exported from `@twinzy/shared`
(`model/file-security.constants.ts`) so web and api can never drift.

## Invariants

- Uploads never touch disk; buffers are zero-filled on every failure and after use
  ([flows/analyze-flow.md](../flows/analyze-flow.md) steps 4 and 9).
- The validation order is a contract — cheap checks first, scan last.
- ClamAV **fails closed** in production when enabled; the compose `clamav` service is reachable
  only on the internal network ([runtime-topology.md](../runtime-topology.md)).
- Consent is validated before any file processing (consent field precedes the file on the wire,
  enforced by `apps/api/src/core/http/multipart-upload.parser.ts`).

## Tests

Unit: `apps/api/src/modules/file-security/tests/` (service chain, magic bytes, decode,
dimensions helpers, virus scan, buffer cleanup) with byte-level image fixtures from
`apps/api/src/tests/fixtures/image-fixtures.ts`. Integration:
`apps/api/src/tests/game-analyze.integration.test.ts`. Scoped run: `npm run test:file-security`.

## Common changes and risks

- **Size limit**: `MAX_IMAGE_SIZE_BYTES` env (bounded by the shared transport hard cap).
- **New image format**: requires shared allowlist change + magic bytes + decode support +
  fixtures — treat as a cross-side contract change.
- **Risk (critical lane)**: any weakening here widens the attack surface of the only
  user-controlled binary input in the system; see
  [docs/file-upload-security.md](../../docs/file-upload-security.md).
