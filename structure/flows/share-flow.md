---
id: structure-flow-share
title: Share Flow — Temporary Result Links, End to End
type: structure
authority: canonical
status: current
owner: repository owner
summary: How a result becomes a temporary share link — safety re-scan and TTL cache on the API, share modal and public countdown page on the web — with no database and no images.
keywords: [share, flow, ttl, cache, share-results, countdown, share-page, safety, no-persistence]
contextTier: 2
relatedCode: [apps/api/src/modules/share-results/application/create-share-result.use-case.ts, apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts, apps/web/src/modules/game/containers/share-page.container.tsx, apps/web/src/modules/game/gateway/share.gateway.ts]
relatedTests: [apps/api/src/tests/share-results.integration.test.ts, apps/web/e2e/share-flow.spec.ts]
relatedDocs: [structure/modules/api-share-results.md, structure/flows/analyze-flow.md, docs/privacy-and-data-retention.md]
readWhen: You are changing share creation, the share page, TTLs, or share safety validation.
---

# Share Flow — Temporary Result Links, End to End

Endpoints under `/api/v1/share-results` (`packages/shared/src/constants/share-result.constants.ts`);
every route replies with `Cache-Control: private, no-store`
(`apps/api/src/modules/share-results/api/share-results.controller.ts`).

## Create (result → link)

1. **Web** — from the result view, `ShareModal`
   (`apps/web/src/modules/game/containers/share-modal.container.tsx`) uses `useShareCreate`;
   `share.service.ts#createShareLink` delegates to `share.gateway.ts` —
   `POST /api/v1/share-results` with `{result}` (`CreateShareResultRequestSchema`,
   `packages/shared/src/schemas/share-result.schema.ts`; 15 s timeout in the gateway).
2. **API safety re-scan** — `CreateShareResultUseCase`
   (`apps/api/src/modules/share-results/application/create-share-result.use-case.ts`) treats the
   create as a FRESH untrusted request (`share-result-safety.service.ts`): the disclaimer must
   equal the server-owned `RESULT_DISCLAIMER_BY_LANGUAGE[languageCode]`; every string leaf is
   re-scanned against `ALL_FORBIDDEN_SHARE_PHRASES` (same shared wordlists as the AI safety
   filter) and against `EMBEDDED_IMAGE_PATTERNS` (base64 JPEG/PNG/WebP prefixes — **no image
   can be smuggled into a share**); the JSON byte size is bounded
   (`SHARE_RESULT_MAX_PAYLOAD_BYTES`, 413 when exceeded).
3. **Capacity + id** — `ShareResultCacheService` enforces the max-active cap (429
   `ShareCapacityReached`; live shares are never evicted); the id is a v4 UUID from CSPRNG
   (`lib/share-id.util.ts`); expiry is computed from the server clock.
4. **Storage** — only the safe result JSON + epoch-ms timing is cached
   (`StoredShareRecord`, `model/share-result.types.ts`) behind the `SHARE_RESULT_CACHE` port
   (`model/share-result.port.ts`), bound to the in-memory TTL repository
   (`infrastructure/in-memory-share-result-cache.repository.ts` — lazy expiry on read plus a
   30 s unref'd sweeper). Single-instance driver: records are gone on restart; Redis/Valkey is
   the documented production extension of the same port.
5. **Response** — `{shareId, shareUrl, createdAt, expiresAt, ttlSeconds}`; the URL is built
   server-side from `SHARE_RESULT_PUBLIC_BASE_URL` + shared `buildSharePagePath`
   (`lib/share-result-url.util.ts`). The web modal offers copy, native Web Share, and platform
   web-intents (WhatsApp/Telegram/Facebook/X — **share-link only**, built in
   `apps/web/src/modules/game/helpers/share-platform.helper.ts`).

## Read (link → public page)

6. **Route** — `/share/[shareId]` (`apps/web/src/app/share/[shareId]/page.tsx`; metadata is
   static with `robots: {index:false, follow:false}`) renders `SharePageContainer`.
7. **Fetch** — `useSharePage` → `share.service.ts#fetchSharedResult` →
   `GET /api/v1/share-results/:shareId` (`ShareIdSchema` param pipe; read throttle 120/min).
   `GetShareResultUseCase` returns missing OR expired as the **identical 404** — no existence
   oracle; `remainingSeconds` is computed from the server clock.
8. **Page** — phase switch loading/active/expired with a server-seeded per-second countdown
   (`useCountdown`) and the read-only result view; via TanStack Query with
   `staleTime: Infinity, retry: false` (`queries/share.queries.ts`).

## Delete

9. `DELETE /api/v1/share-results/:shareId` — idempotent, always 204
   (`application/delete-share-result.use-case.ts`).

## Invariants

- No database, no images, no user identity — the record is safe result JSON + timing only.
- TTL/payload/capacity are env-driven (`SHARE_RESULT_*`,
  `apps/api/src/config/env.schema.ts`); bounds come from `@twinzy/shared`.
- Share ids may appear in URLs, which is why `req.url` is in the logger redact list
  (`apps/api/src/core/logger/logger.constants.ts`).
