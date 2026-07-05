# File Upload Security

Normative rules: rules/15-file-upload-security.md. Implementation:

- Multer memory storage; no file ever touches disk. Buffer zero-filled in finally.
- Checks in order: consent, single file, size, MIME allowlist, extension allowlist,
  MIME/extension consistency, magic bytes (JPEG FF D8 FF, PNG 89 50 4E 47..., WebP RIFF....WEBP),
  structural decode (dimension parse, sane bounds), optional ClamAV INSTREAM scan.
- ClamAV: ENABLE_CLAMAV=true activates the adapter; production fails closed if the scanner is
  unreachable or errors; development default is disabled.
- HEIC/HEIF is rejected: no safe pure-JS decoder; revisit only with a documented sandboxed
  decoder (docs/package-decisions.md).
- Frontend mirrors size/type checks for UX only; the backend is the source of truth.
