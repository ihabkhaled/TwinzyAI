# 15 — File Upload Security

> Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rules 33, 44, 47) · [06-security.md](./06-security.md) · [08-reliability-durability.md](./08-reliability-durability.md) (fail-closed, wipe in finally) · [26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md) (PayloadTooLargeError 413) · [/skills/secure-file-upload.md](../skills/secure-file-upload.md) · [/memory/privacy-decisions.md](../memory/privacy-decisions.md)

Order of checks (FileSecurityService orchestration):
1. consent flag is true
2. exactly one file
3. size within MAX_IMAGE_SIZE_BYTES
4. MIME allowlist
5. extension allowlist
6. extension and MIME consistency
7. magic bytes match the declared type
8. structural decode validation (image header parses with sane dimensions)
9. optional ClamAV scan (ENABLE_CLAMAV; production fails closed on scanner errors)

Allowed types: jpg/jpeg/png/webp. HEIC/HEIF rejected — no safe pure-JS decoder (documented).
Handling: multer memory storage only; no disk writes; buffer zero-filled in finally;
never logged; never returned; nothing persisted anywhere.
