---
id: runbook-accidental-image-exposure
title: Runbook — Accidental Image Exposure
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Verifying and responding to suspected image-byte exposure — exactly what to check (logs, disk, shares, AI calls) and how to confirm the wipe guarantees held.
keywords: [runbook, image, exposure, leak, base64, logs, wipe, buffers, verification, sev-1]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/privacy/lib/log-redaction.helpers.ts,
    apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts,
    apps/api/src/core/http/multipart-upload.parser.ts,
    apps/api/src/modules/share-results/lib/share-result-safety.util.ts,
  ]
relatedTests:
  [
    apps/api/src/modules/file-security/tests/upload-buffer-cleanup.util.test.ts,
    apps/api/src/tests/game-analyze.integration.test.ts,
  ]
relatedDocs: [runbooks/privacy-incident.md, domain/image-lifecycle.md, docs/file-upload-security.md]
readWhen: Anyone suspects an uploaded photo (or its bytes) escaped the extraction-only boundary. SEV-1, immediately.
---

# Runbook — Accidental Image Exposure

The guarantee under test: the photo exists **only** in request memory, goes **only** to trait extraction, and is zero-filled in `finally` — never logged, stored, returned, shared, or passed downstream (CLAUDE.md constraint #3; lifecycle owner: [`domain/image-lifecycle.md`](../domain/image-lifecycle.md)).

## Prerequisites

- SEV-1 declared; evidence preservation before any restart ([security-incident.md](./security-incident.md) §2). Treat captured logs as sensitive artifacts ([safe-diagnostics.md](./safe-diagnostics.md)).

## Steps — verification checklist (where bytes could and could not be)

### 1. Logs — must never contain images

Redaction replaces base64 runs of 64+ chars (the signature of leaked image bytes) and key/token/authorization values with `[REDACTED]`, capping values at 500 chars (`redactForLog`, `apps/api/src/modules/privacy/lib/log-redaction.helpers.ts`); pino additionally redacts auth/cookie headers and `req.url` (`apps/api/src/core/logger/logger.constants.ts`). Check the preserved logs:

```bash
grep -E '[A-Za-z0-9+/]{64,}' api-sec-incident-*.log | grep -v 'REDACTED' | head
grep -c '/9j/'  api-sec-incident-*.log   # JPEG base64 prefix
grep -c 'iVBOR' api-sec-incident-*.log   # PNG base64 prefix
```

Any un-redacted hit = confirmed exposure: the log file itself is now the leaked artifact — restrict access, note every place it was shipped/copied, and destroy copies after the investigation.

### 2. Disk — must be impossible

Uploads are memory-only (multipart parser buffers in memory, `apps/api/src/core/http/uploaded-image.interceptor.ts`: "never disk"); containers are `read_only` with only tmpfs `/tmp` and **no volumes** (`docker-compose.yml`). Verify no compose/Dockerfile change introduced a volume or write path in the suspect release: `git log -p docker-compose.yml Dockerfile.api`.

### 3. Share payloads — must reject image data

Share ingest scans every string leaf against embedded-image patterns (data-URI and base64 JPEG/PNG/WebP prefixes) and rejects with `SHARE_RESULT_UNSAFE` (`apps/api/src/modules/share-results/lib/share-result-safety.util.ts`). If a share record is implicated, fetch it (GET by id) and inspect; delete it (idempotent DELETE) and — if the scan missed it — that pattern gap is the defect to fix with a regression test.

### 4. AI calls — image only to extraction

Text-only steps cannot accept an image **by type**, the router dispatches photo-carrying calls only to the extraction step's vision-capable entries (`AI_IMAGE_STEPS = [extraction]`, `apps/api/src/config/gemini-step.constants.ts`), and lint forbids image-provider calls outside `trait-extraction.service.ts` (`docs/eslint-architecture.md`). Integration tests prove the image never reaches text steps (`FakeAiAdapter` records per-step calls, `apps/api/src/tests/fixtures/fake-ai-adapter.ts`). If the report claims a non-extraction provider received an image, audit the release diff for changes to these files specifically.

### 5. Wipe verification

The wipe is `buffer.fill(0)` in `finally` in both analyze use-cases (`wipeUploadedImageBuffer`, `apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts`), on every stream rejection path (`game-stream.presenter.ts`), and on any multipart parse failure (`multipart-upload.parser.ts`). Confirm the suspect release didn't remove/reorder a `finally`: `git log -p` on those files; unit + integration coverage exists (`upload-buffer-cleanup.util.test.ts`).

## If exposure is confirmed

1. Contain per [security-incident.md](./security-incident.md) (up to `docker compose down`).
2. Destroy exposed artifacts everywhere they were copied; rotate any secret that appeared alongside ([secret-rotation.md](./secret-rotation.md)).
3. Fix root cause + regression test; security review before redeploy (rules/14/15 scope).
4. Postmortem mandatory; owner decides player/stakeholder notification (`SECURITY.md`).

## Verify (closure)

- All five checklist sections re-verified clean on the fixed build.
- `npm run test:security` and `npm run test:file-security` green; smoke test green.

## Rollback

The fix itself follows [rollback.md](./rollback.md) mechanics if it regresses; there is no data cleanup dimension — nothing is stored.
