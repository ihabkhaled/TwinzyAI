---
id: runbook-memory-growth
title: Runbook — Memory Growth
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Diagnosing rising API memory — the inventory of deliberately bounded in-memory state, what a genuine leak looks like, and safe mitigation.
keywords: [runbook, memory, leak, heap, bounded, cache, buffers, docker-stats, restart]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts,
    apps/api/src/core/streaming/stream-registry.service.ts,
    apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts,
    docker-compose.yml,
  ]
relatedTests: [apps/api/src/modules/file-security/tests/upload-buffer-cleanup.util.test.ts]
relatedDocs: [runbooks/event-loop-lag.md, runbooks/safe-diagnostics.md, architecture/adrs/adr-003-horizontal-scaling-plan.md]
readWhen: The api container's memory climbs toward its limit or the container is OOM-restarted.
---

# Runbook — Memory Growth

The API is deliberately stateless with **every** in-memory structure bounded. Memory that grows without bound is a defect, not a tuning problem.

## The complete bounded-state inventory (what may legitimately hold memory)

| State | Bound | Cleanup |
| --- | --- | --- |
| Upload buffers (memory-only, never disk) | Transport hard cap ~10 MB/request, 1 file; business cap `MAX_IMAGE_SIZE_BYTES` (5 MB default) | Zero-filled in `finally` on success/failure/abort (`wipeUploadedImageBuffer`; parser zeroes partial buffers) |
| Share-result cache | `SHARE_RESULT_MAX_ACTIVE_ITEMS` (1000) × `SHARE_RESULT_MAX_PAYLOAD_BYTES` (50 KB) | Lazy expiry + 30 s sweeper (`in-memory-share-result-cache.repository.ts`) |
| Stream registry | ids + AbortControllers only, never image bytes | TTL sweep at `STREAM_TTL_MS` (`stream-registry.service.ts`) |
| Concurrency limiter | Counters + FIFO queue capped at `MAX_ANALYSIS_QUEUE_SIZE` (100) | Slot release / watchdog |
| AI responses in flight | `AI_MAX_RESPONSE_BYTES` (500 KB) per call | Request-scoped |
| Prompt template cache | 4 small markdown files | Permanent by design (`prompt-template.repository.ts`) |
| PayPal OAuth token | One token | Expiry-refreshed |

Container limit: 1 GB (`mem_limit`, `docker-compose.yml`).

## Prerequisites

- Trend data, not a snapshot: `docker stats` observed across load, and container restart history (`docker compose ps`, `docker inspect` restart count).

## Steps

1. **Confirm growth is monotonic** under steady load (a sawtooth that GCs back down is normal Node behavior).
2. **Correlate with traffic type**: growth tracking analyze volume → suspect upload/AI paths; tracking share creation → check cache size vs caps (the cache never evicts live shares — sustained 429 `SHARE_CAPACITY_REACHED` plus high memory means the cap itself is the ceiling working as intended).
3. **Correlate with a release** — a leak appearing after a deploy is that release's defect: revert first ([rollback.md](./rollback.md)).
4. **Mitigate**: `docker compose restart api`. State loss is acceptable by design — active runs fail with retryable errors and share links expire anyway ([`../support/known-issues.md`](../support/known-issues.md) KI-3). This is mitigation, not resolution.
5. **Investigate properly (non-production only)**: reproduce under `npm run load-test`, capture heap snapshots locally per the diagnostic limits in [safe-diagnostics.md](./safe-diagnostics.md) — heap dumps can contain image bytes and must be treated as sensitive artifacts and destroyed after use.
6. File the defect with the growth curve as evidence; per ADR-003, memory data feeds the scaling revisit trigger.

## Verify

- Memory stable under representative load for a sustained window post-fix/restart.
- No OOM restarts; smoke test green.

## Rollback

Restart + release revert are the levers; there is no memory-related config to tune beyond the documented caps ([config-change.md](./config-change.md) for cap changes).
