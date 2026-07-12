---
id: support-upload-troubleshooting
title: Upload Troubleshooting — Photo Rejections Explained
type: support
authority: canonical
status: current
owner: repository owner
summary: Symptom-by-symptom guide to every upload rejection in the file-security chain, with the exact copy shown and the safe player guidance.
keywords: [support, upload, rejection, file-size, mime, heic, magic-bytes, clamav, virus-scan, consent]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/file-security/application/file-security.service.ts,
    apps/api/src/modules/file-security/model/file-security.constants.ts,
    apps/api/src/core/http/multipart-upload.parser.ts,
  ]
relatedTests: [apps/api/src/tests/game-analyze.integration.test.ts, apps/api/src/modules/file-security/tests/file-security.service.test.ts]
relatedDocs: [docs/file-upload-security.md, support/error-code-catalog.md, runbooks/upload-failures.md]
readWhen: A player's photo is being refused and you need to explain why and what to do instead.
---

# Upload Troubleshooting — Photo Rejections Explained

The backend validates every upload in a fixed order (`apps/api/src/modules/file-security/application/file-security.service.ts`, per rules/15): **consent → presence → size → MIME/extension allowlist + consistency → magic bytes → structural decode → optional virus scan**. Rejections are safety features working as designed — support explains, never bypasses (`support/README.md`).

| What the player sees | errorCode / HTTP | Real cause | Safe guidance |
| --- | --- | --- | --- |
| "Please tick the consent box before playing." | `CONSENT_REQUIRED` 400 | Consent flag missing or not literal true; the multipart parser requires consent to arrive **before** the file (`apps/api/src/core/http/multipart-upload.parser.ts`) | Tick the checkbox, retry. See [consent-troubleshooting.md](./consent-troubleshooting.md) |
| "Please choose a photo first." | `FILE_MISSING` 400 | No file, or the file arrived on the wrong form field | Pick a photo and retry |
| "That photo is too big. Please pick one under 5 MB." | `FILE_TOO_LARGE` 413 | Over `MAX_IMAGE_SIZE_BYTES` (default 5 242 880) | Smaller photo, or reduce camera quality/resolution |
| "Please use a JPG, PNG, or WebP photo." | `FILE_TYPE_NOT_ALLOWED` 415 | Not JPG/PNG/WebP, or the extension and MIME type disagree. **HEIC/HEIF (iPhone default) is deliberately rejected** — no safe pure-JS decoder exists (`docs/file-upload-security.md`) | iPhone players: set camera format to "Most Compatible", or export/share as JPEG |
| "That file does not look like a valid photo. Please try another one." | `FILE_INVALID` 422 | Magic bytes or image structure don't match the declared type (corrupt, renamed, or crafted file); dimensions outside 8–12 000 px (`apps/api/src/modules/file-security/model/file-security.constants.ts`) | Re-export the photo as a plain JPG/PNG and retry |
| "Please upload just one photo." | `MULTIPLE_FILES_NOT_ALLOWED` 400 | More than one file in the request | Send exactly one photo |
| "We could not safely check that file. Please try again later." | `VIRUS_SCAN_FAILED` 422 | ClamAV flagged the file as infected | Do not retry the same file; player should use a different photo |
| Same copy, but everyone is affected | `VIRUS_SCAN_FAILED` 503 | ClamAV enabled but unreachable — scanning **fails closed** by design (`apps/api/src/modules/file-security/application/virus-scan.service.ts`) | This is an operational incident, not a player problem — escalate via [../runbooks/upload-failures.md](../runbooks/upload-failures.md) |

## Client-side pre-checks

The web app validates file type/size before uploading (`apps/web/src/modules/game/helpers/game-validation.helper.ts` via `game.service.ts`), so most players see instant local feedback with the same copy; the backend re-enforces everything regardless.

## Patterns worth recognizing

- **One player, repeated 415/422** → almost always HEIC or a screenshot/exotic format. Guide to JPG/PNG/WebP.
- **Many players, sudden 503s on upload** → ClamAV outage while `ENABLE_CLAMAV=true`; escalate immediately ([../runbooks/upload-failures.md](../runbooks/upload-failures.md)).
- **Many players, 413s** → check whether `MAX_IMAGE_SIZE_BYTES` changed in a recent release.

Never suggest disabling consent, validation, or scanning — the privacy model depends on this chain (`docs/file-upload-security.md`).
