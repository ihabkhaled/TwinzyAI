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
- The analyze multipart body also carries an optional `languageCode` text field; it is
  free-form at the transport edge, normalized server-side to a supported code (default `en`),
  and never trusted raw — it has no effect on the file security chain.
- The streaming (SSE) analyze route emits a `scanning` stage event immediately before the
  file security chain runs; stage names are fixed labels and carry no user data.
- Frontend mirrors size/type checks for UX only; the backend is the source of truth.
