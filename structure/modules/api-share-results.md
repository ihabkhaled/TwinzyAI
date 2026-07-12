---
id: structure-module-api-share-results
title: Module — api share-results (Temporary Shareable Results)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The temporary share module — CRUD over a TTL cache port with safety re-scan on create, CSPRNG UUID ids, capacity caps, and identical 404s for missing and expired shares.
keywords: [share-results, share, ttl, cache, port, uuid, capacity, 404, no-database]
contextTier: 2
relatedCode: [apps/api/src/modules/share-results]
relatedTests: [apps/api/src/modules/share-results/tests, apps/api/src/tests/share-results.integration.test.ts]
relatedDocs: [structure/flows/share-flow.md, docs/privacy-and-data-retention.md]
readWhen: You are changing share endpoints, TTLs, the cache driver, or share safety validation.
---

# Module — `apps/api/src/modules/share-results`

**Responsibility.** Temporary shareable results with no DB and no images. Standalone feature
module (no other module imports it); registered by `app.module.ts`. Full flow:
[flows/share-flow.md](../flows/share-flow.md).

## Public surface (`index.ts`)

`ShareResultsModule` only.

## Endpoints (`api/share-results.controller.ts`, prefix `/api/v1/share-results`)

| Route | Throttle | Delegation |
| --- | --- | --- |
| `POST /` | 20/min | `CreateShareResultUseCase.create` (zod `CreateShareResultRequestSchema`) |
| `GET /:shareId` | 120/min | `GetShareResultUseCase.get` (`ShareIdSchema` param pipe) |
| `DELETE /:shareId` | 20/min | `DeleteShareResultUseCase.delete` (idempotent, always 204) |

Every route sets `Cache-Control: private, no-store`.

## Key files

| File | Role |
| --- | --- |
| `application/create-share-result.use-case.ts` | Payload budget + safety assertions, CSPRNG v4 UUID id, server-clock expiry, response with server-built `shareUrl` |
| `application/get-share-result.use-case.ts` | Missing OR expired ⇒ the **identical 404** (no existence oracle); `remainingSeconds` from the server clock |
| `application/share-result-cache.service.ts` | The one business rule above the port: max-active cap → 429 `ShareCapacityReached`; never evicts live shares |
| `application/share-result-safety.service.ts` | Treats create as a fresh untrusted request: server-owned disclaimer equality, forbidden-wording re-scan, embedded-image detection, byte budget |
| `model/share-result.port.ts` | `SHARE_RESULT_CACHE` symbol + `ShareResultCachePort` (`set/get/delete/size`; `get` never returns expired records) |
| `infrastructure/in-memory-share-result-cache.repository.ts` | The only built driver: Map store, lazy expiry on read, 30 s unref'd sweeper; single-instance (records gone on restart). Redis/Valkey is the documented production extension of the same port |
| `lib/share-result-errors.ts` | 404 `ShareNotFound`, 413 `SharePayloadTooLarge`, 400 `ShareResultUnsafe`, 429 `ShareCapacityReached` |

## Configuration

`SHARE_RESULT_TTL_SECONDS`, `SHARE_RESULT_MAX_PAYLOAD_BYTES`,
`SHARE_RESULT_MAX_ACTIVE_ITEMS`, `SHARE_RESULT_PUBLIC_BASE_URL` — defaults and bounds come
from `@twinzy/shared` via `apps/api/src/config/env-bounds.constants.ts`
([configuration-map.md](../configuration-map.md)).

## Invariants

- `StoredShareRecord` holds safe result JSON + epoch-ms timing only — never an image
  (`EMBEDDED_IMAGE_PATTERNS` reject base64 image payloads on create).
- Share ids are unguessable (CSPRNG UUID) and appear in URLs, hence `req.url` log redaction
  (`apps/api/src/core/logger/logger.constants.ts`).
- Missing vs expired is indistinguishable to callers.

## Tests

Unit: `tests/share-result-use-cases.test.ts`, `share-result-services.test.ts`,
`share-result-lib.test.ts`, `in-memory-share-result-cache.repository.test.ts`.
Integration: `apps/api/src/tests/share-results.integration.test.ts` (payload cap, capacity
cap, TTL, rate limit — fresh app per suite).

## Common changes and risks

- **New cache driver**: implement `ShareResultCachePort` in `infrastructure/`; the port is the
  swap surface — required before any multi-instance deployment
  ([runtime-topology.md](../runtime-topology.md)).
- **Risk**: weakening the create-time safety re-scan would let forbidden wording or embedded
  images become publicly reachable via share URLs.
