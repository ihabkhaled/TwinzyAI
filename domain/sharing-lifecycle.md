---
id: domain-sharing-lifecycle
title: Sharing Lifecycle — Temporary, Image-Free, TTL-Bound
type: domain
authority: canonical
status: current
owner: repository owner
summary: The share-results lifecycle — untrusted re-validation at create, CSPRNG ids, server-clock TTL, identical 404 for missing and expired, idempotent delete, in-memory-only storage.
keywords: [share, ttl, cache, expiry, share-id, no-existence-oracle, delete, capacity, in-memory]
contextTier: 2
relatedCode: [apps/api/src/modules/share-results/application/create-share-result.use-case.ts, apps/api/src/modules/share-results/application/get-share-result.use-case.ts, apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts]
relatedTests: [apps/api/src/tests/share-results.integration.test.ts, apps/api/src/modules/share-results/tests/share-result-use-cases.test.ts, packages/shared/tests/share-result.schema.test.ts]
relatedDocs: [domain/state-machines.md, domain/image-lifecycle.md, domain/failure-semantics.md]
readWhen: You are touching share creation, reading, deletion, TTL, or the share cache driver.
---

# Sharing Lifecycle — Temporary, Image-Free, TTL-Bound

A share is a temporary public copy of one `FinalGameResult` behind an unguessable id.
Endpoints: `POST/GET/DELETE /api/v1/share-results[/:shareId]`
(`apps/api/src/modules/share-results/api/share-results.controller.ts`; every route sets
`Cache-Control: private, no-store`).

## Create

`apps/api/src/modules/share-results/application/create-share-result.use-case.ts`:

1. **Treat the payload as fresh untrusted input** even though it looks like our own result:
   - byte budget (`assertWithinPayloadBudget`; `SHARE_RESULT_MAX_PAYLOAD_BYTES`, default
     50,000 — `packages/shared/src/constants/share-result.constants.ts`),
   - every string leaf re-scanned against the same forbidden lists the AI filter uses
     (`ALL_FORBIDDEN_SHARE_PHRASES`) plus embedded-image detection
     (`EMBEDDED_IMAGE_PATTERNS`) — `application/share-result-safety.service.ts`,
     `lib/share-result-safety.util.ts`, `model/share-safety.constants.ts`,
   - the disclaimer must equal the server constant for the payload's language
     (`share-result-safety.service.ts`).
2. **Mint the id**: v4 UUID from a CSPRNG (`lib/share-id.util.ts`); validated as `z.uuid()`
   on read (`ShareIdSchema`, `packages/shared/src/schemas/share-result.schema.ts`).
3. **Compute expiry from the server clock**: `computeShareExpiry(Date.now(), ttlSeconds)`
   (`lib/share-result-expiry.util.ts`); TTL from `SHARE_RESULT_TTL_SECONDS` (default 600 s,
   bounds 60–3600 — `packages/shared/src/constants/share-result.constants.ts`).
4. **Store only the safe result JSON** (`StoredShareRecord` — never an image,
   `model/share-result.types.ts`); the payload is never logged (use-case doc comment).
5. Respond with `{shareId, shareUrl, createdAt, expiresAt, ttlSeconds}`; the URL joins the
   configured public origin with the shared `/share/<id>` path
   (`lib/share-result-url.util.ts`, `buildSharePagePath` in
   `packages/shared/src/constants/share-result.constants.ts`).

Capacity rule (the one business rule above the port): a max-active cap
(`SHARE_RESULT_MAX_ACTIVE_ITEMS`, default 1000) rejects new creates with 429
`SHARE_CAPACITY_REACHED` when full — live shares are **never evicted**
(`application/share-result-cache.service.ts`).

## Read

`application/get-share-result.use-case.ts`:

- The cache port never returns an expired record
  (`model/share-result.port.ts`); a missing OR expired id yields the **same 404** — "a direct
  visit can never tell whether an id once existed" (use-case doc comment, lines 10–16).
- `remainingSeconds` is computed from the server clock, rounded UP
  (`lib/share-result-expiry.util.ts`, lines 18–19), so the client countdown is anchored to
  authoritative expiry.

## Delete

`application/delete-share-result.use-case.ts`: idempotent — always 204, whether or not the id
existed.

## Expiry and storage driver

`infrastructure/in-memory-share-result-cache.repository.ts` (bound to the
`SHARE_RESULT_CACHE` port, `model/share-result.port.ts`):

- lazy expiry on read plus a periodic sweeper every 30 s (`SHARE_CACHE_SWEEP_INTERVAL_MS`,
  `model/share-result.constants.ts`), `unref`-ed and cleared on module destroy;
- single-instance in-memory Map — **all shares vanish on process restart**; the module doc
  records Redis/Valkey as the documented production extension of the same port
  (`share-results.module.ts`).

## Error catalog

404 `SHARE_NOT_FOUND`, 413 `SHARE_PAYLOAD_TOO_LARGE`, 400 `SHARE_RESULT_UNSAFE`,
429 `SHARE_CAPACITY_REACHED` (`lib/share-result-errors.ts`) — envelope semantics in
[failure-semantics.md](failure-semantics.md).
