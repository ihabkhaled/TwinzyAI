---
id: contracts-api-share-results
title: Share Results Endpoints Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: Contract for POST/GET/DELETE /api/v1/share-results — temporary TTL-cached shareable results with no database, no images, and no existence oracle.
keywords: [share, share-results, ttl, shareid, cache, temporary, 404, capacity, contract]
contextTier: 2
relatedCode: [apps/api/src/modules/share-results/api/share-results.controller.ts, packages/shared/src/schemas/share-result.schema.ts, packages/shared/src/constants/share-result.constants.ts]
relatedTests: [apps/api/src/tests/share-results.integration.test.ts, packages/shared/tests/share-result.schema.test.ts]
relatedDocs: [contracts/api/error-envelope.md, docs/privacy-and-data-retention.md]
readWhen: You are building or changing anything that creates, reads, or deletes shared results.
---

# Share Results Endpoints Contract

Controller: `apps/api/src/modules/share-results/api/share-results.controller.ts`
(`@Controller('share-results')` → `/api/v1/share-results`). Schemas:
`packages/shared/src/schemas/share-result.schema.ts`. Every route sets
`Cache-Control: private, no-store` (`apps/api/src/modules/share-results/model/share-result.constants.ts`).
Storage is an in-memory TTL cache behind the `SHARE_RESULT_CACHE` port — no database, records
are gone on restart (`apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts`).

## POST /api/v1/share-results — create

Throttle 20/min. Request: `CreateShareResultRequestSchema` — strict `{ result }` where
`result` is a full `FinalGameResult` (its `languageCode` travels inside the result). The
server treats every create as a **fresh untrusted payload**
(`apps/api/src/modules/share-results/application/share-result-safety.service.ts`):

- JSON byte size ≤ `SHARE_RESULT_MAX_PAYLOAD_BYTES` (default 50,000), else **413**
  `SHARE_PAYLOAD_TOO_LARGE`;
- the disclaimer must equal the server constant for the result's language, every string leaf
  is re-scanned against the forbidden-wording lists, and embedded base64 image data is
  rejected, else **400** `SHARE_RESULT_UNSAFE`;
- at the active-items cap (`SHARE_RESULT_MAX_ACTIVE_ITEMS`, default 1,000) new creates get
  **429** `SHARE_CAPACITY_REACHED` — live shares are never evicted
  (`apps/api/src/modules/share-results/application/share-result-cache.service.ts`).

Response 200: `CreateShareResultResponseSchema` —
`{ shareId, shareUrl, createdAt, expiresAt, ttlSeconds }`. `shareId` is a v4 UUID minted from
a CSPRNG; `shareUrl` = configured `SHARE_RESULT_PUBLIC_BASE_URL` + `/share/<shareId>`
(`buildSharePagePath` in `packages/shared/src/constants/share-result.constants.ts`);
timestamps are ISO datetimes from the server clock; TTL is `SHARE_RESULT_TTL_SECONDS`
(default 600, bounds 60–3600).

## GET /api/v1/share-results/:shareId — read

Throttle 120/min. `shareId` param is validated as a UUID (`ShareIdSchema`); a malformed id is
a 400 `VALIDATION_FAILED`. Response 200: `ShareResultResponseSchema` — adds `languageCode`,
`result`, and `remainingSeconds` (≥ 0, computed from the server clock, rounded up). **Missing
and expired ids return an identical 404** `SHARE_NOT_FOUND` — deliberately no existence
oracle (`apps/api/src/modules/share-results/application/get-share-result.use-case.ts`).

## DELETE /api/v1/share-results/:shareId — delete

Throttle 20/min. Idempotent: always **204 No Content**, whether or not the record existed
(`apps/api/src/modules/share-results/application/delete-share-result.use-case.ts`).

## Error codes

`SHARE_NOT_FOUND` (404), `SHARE_PAYLOAD_TOO_LARGE` (413), `SHARE_RESULT_UNSAFE` (400),
`SHARE_CAPACITY_REACHED` (429) — built in
`apps/api/src/modules/share-results/lib/share-result-errors.ts`, delivered through the shared
[error envelope](error-envelope.md).

## Consumers

Web gateway `apps/web/src/modules/game/gateway/share.gateway.ts`; share page container
`apps/web/src/modules/game/containers/share-page.container.tsx`. Records never contain images
— privacy detail is owned by [docs/privacy-and-data-retention.md](../../docs/privacy-and-data-retention.md).
