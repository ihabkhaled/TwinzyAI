---
id: contracts-integrations-clamav
title: ClamAV Integration Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: The clamd INSTREAM TCP wire contract used for upload virus scanning, its host-fallback and timeout behavior, and the fail-closed policy when scanning is enabled.
keywords: [clamav, clamd, instream, virus-scan, tcp, fail-closed, upload, 503, 422]
contextTier: 2
relatedCode: [apps/api/src/modules/file-security/adapters/clamav.adapter.ts, apps/api/src/modules/file-security/application/virus-scan.service.ts, apps/api/src/modules/file-security/model/file-security.constants.ts]
relatedTests: [apps/api/src/modules/file-security/tests/virus-scan.service.test.ts]
relatedDocs: [docs/file-upload-security.md, contracts/api/analyze.md, contracts/configuration/env-contract.md]
readWhen: You are changing virus scanning, ClamAV deployment, or diagnosing scan failures.
---

# ClamAV Integration Contract

`apps/api/src/modules/file-security/adapters/clamav.adapter.ts` is the only file speaking the
clamd wire protocol. Policy (enable/fail-closed) lives one layer up in
`apps/api/src/modules/file-security/application/virus-scan.service.ts`. The full upload
validation chain is owned by [docs/file-upload-security.md](../../docs/file-upload-security.md).

## Wire protocol (INSTREAM over TCP)

Constants in `apps/api/src/modules/file-security/model/file-security.constants.ts`:

1. Connect to `host:CLAMAV_PORT` (default 3310) and write `zINSTREAM\0`.
2. Stream the in-memory upload buffer in chunks of ≤ 65,536 bytes
   (`CLAMAV_CHUNK_SIZE_BYTES`), each prefixed with a 4-byte big-endian length.
3. Terminate with a zero-length (4 zero bytes) chunk and half-close.
4. Read the UTF-8 verdict: a response containing `OK` and not `FOUND` is clean; anything
   with `FOUND` is infected (the raw verdict is kept as the signature). An empty response is
   an error ("closed without a verdict").
5. Socket timeout: `CLAMAV_TIMEOUT_MS` = 10 s.

## Host fallback

`CLAMAV_HOSTS` is an ordered comma list (default `127.0.0.1,clamav`) so the same config works
on the host and inside the docker-compose network. Hosts are tried in order; the first
reachable one is cached and tried first next time; on failure the cache resets and the next
host is tried. All hosts failing throws `ClamAV unreachable (…)`.

## Fail-closed semantics

Owned by `VirusScanService.assertClean`:

| Condition | Outcome |
| --- | --- |
| `ENABLE_CLAMAV` = false (default) | Scan skipped entirely — dev/test convenience; disabled via env, never via code |
| Scanner reachable, verdict clean | Upload proceeds |
| Scanner reachable, verdict infected | **422** `VIRUS_SCAN_FAILED` (`InfectedFileError`) |
| Scanner unreachable / errors / timeout, scanning enabled | **fail CLOSED**: **503** `VIRUS_SCAN_FAILED` (`VirusScanUnavailableError`) — the upload is rejected, never waved through |

Error classes: `apps/api/src/modules/file-security/model/file-security.errors.ts`; both codes
surface through the shared [error envelope](../api/error-envelope.md). Integration tests stub
the adapter with an always-clean double so suites never depend on a live scanner
(`apps/api/src/tests/fixtures/stubs.ts`).

## Data handling

The scanned buffer is the in-memory upload only — it never touches disk, and it is
zero-filled in `finally` after the pipeline regardless of scan outcome
(`apps/api/src/modules/file-security/application/temporary-file-cleanup.service.ts`).
