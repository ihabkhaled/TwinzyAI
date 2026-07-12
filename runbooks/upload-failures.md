---
id: runbook-upload-failures
title: Runbook — Upload Failures (Including ClamAV Fail-Closed)
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Operational diagnosis of upload rejections — distinguishing designed per-player rejections from systemic failures like a ClamAV outage failing closed.
keywords: [runbook, upload, clamav, fail-closed, 503, virus-scan, 413, 415, file-security]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/file-security/application/virus-scan.service.ts,
    apps/api/src/modules/file-security/adapters/clamav.adapter.ts,
    apps/api/src/modules/file-security/model/file-security.errors.ts,
  ]
relatedTests: [apps/api/src/modules/file-security/tests/virus-scan.service.test.ts, apps/api/src/tests/game-analyze.integration.test.ts]
relatedDocs: [docs/file-upload-security.md, support/upload-troubleshooting.md, runbooks/docker.md]
readWhen: Upload rejection rates spike, or all uploads start failing at once.
---

# Runbook — Upload Failures

Per-player rejections are safety features working as designed — the player-facing guide is [`../support/upload-troubleshooting.md`](../support/upload-troubleshooting.md). This runbook is for the **operational** patterns. The chain and its order are owned by `docs/file-upload-security.md` (rules/15).

## Triage by log pattern

All upload rejections are 4xx → logged at `warn` with their errorCode and messageKey; only 5xx log at `error` (`apps/api/src/core/logger/http-logging.options.ts`).

| Pattern | Meaning | Action |
| --- | --- | --- |
| Scattered `warn` 400/413/415/422 across users | Normal rejection traffic | Nothing; support handles individuals |
| Spike of one code after a release | The release changed a limit or check | Compare against the release diff; revert if unintended ([rollback.md](./rollback.md)) |
| **Every upload failing 503 `VIRUS_SCAN_FAILED`** | ClamAV enabled but unreachable — **fail-closed by design** | Go to "ClamAV outage" below |
| 413s at unusual sizes | `MAX_IMAGE_SIZE_BYTES` misconfigured | [config-change.md](./config-change.md); default 5 242 880 |
| 422 `VIRUS_SCAN_FAILED` (not 503) | Genuinely infected file detected | No action; the scan worked |

## ClamAV outage (fail-closed 503s)

When `ENABLE_CLAMAV=true`, a scanner error or unreachable clamd rejects the upload with 503 `VirusScanUnavailableError` — it never "fails open" and never crashes the API (`apps/api/src/modules/file-security/application/virus-scan.service.ts`).

1. Confirm scanner state:
   ```bash
   docker compose --profile clamav ps          # clamav container up?
   docker compose logs --tail=100 clamav
   ```
2. The adapter tries the ordered `CLAMAV_HOSTS` list and caches the first reachable host, 10 s timeout (`apps/api/src/modules/file-security/adapters/clamav.adapter.ts`, `CLAMAV_TIMEOUT_MS`). Check the list matches the topology: `clamav` inside compose, `127.0.0.1` from the host (`.env.example`).
3. Bring clamd back: `docker compose --profile clamav up -d clamav` (allow its startup time — signature loading).
4. If the scanner cannot be restored quickly, the **only** sanctioned relief is consciously setting `ENABLE_CLAMAV=false` via change control, with the risk recorded — never patch the fail-closed behavior itself. In production the default expectation is fail-closed (rules/15; CLAUDE.md Twinzy constraint #9).
5. Brief support: this is the "everyone's uploads failing with the scan message" row in [`../support/troubleshooting-index.md`](../support/troubleshooting-index.md).

## Verify

- Fixture-image analyze happy path passes ([release-smoke-test.md](./release-smoke-test.md) §3), and the oversize + missing-consent failure envelopes still behave (§4).
- 503 count returns to zero: `docker compose logs --since 10m api | grep -c '"VIRUS_SCAN_FAILED"'`.
- Buffers wiped as always — no cleanup needed after failures: rejection paths zero-fill the in-memory buffer (`apps/api/src/core/http/multipart-upload.parser.ts`; nothing ever touches disk).

## Rollback

Limit/flag changes are env-only rollbacks. Any change to the validation chain itself is a security-review-gated code change, not an ops action.
