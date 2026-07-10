# Privacy Decisions

The product-defining invariants. Rule: [/rules/14-ai-safety.md](../rules/14-ai-safety.md);
policy doc: [/docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md).

- **No durable persistence, by design**: no database, queue, or file storage
  ([database-decisions.md](./database-decisions.md)). The only cache is the bounded, short-lived
  safe-result share cache documented below; it can never contain an image.
- **Images**: processed in memory, sent to exactly one AI call (trait extraction), zero-filled
  in `finally` immediately after extraction on success AND failure. Never written to disk, logged, cached, persisted, or
  returned. The `@fastify/multipart` pipeline keeps parsing in memory — no temp files.
- **Structural enforcement**: the AI provider port splits the image-capable method from the
  text-only methods — only the trait-extraction call can receive an image; candidate
  generation and judging are text-only **by interface shape**, not by convention
  ([ai-safety-decisions.md](./ai-safety-decisions.md)).
- **Never**: face recognition, identity matching, biometric anything (no embeddings, no
  templates), image storage, image URLs, analytics on photos. Not revisitable by ADR
  ([database-decisions.md](./database-decisions.md) Decision 3).
- Traits use the shared 221-field **visible, non-identifying** taxonomy (targeting 100+ populated
  written values when image quality allows); analyze results are transient unless the user
  explicitly creates the bounded temporary share described below.
- No accounts; the game is free — **never add payment logic** (payments would create identity
  and financial data).
- Logs carry identifiers and outcomes only — nothing derived from the image is loggable
  ([observability-decisions.md](./observability-decisions.md)).
- Frontend (web workstream): the image never enters localStorage/sessionStorage/IndexedDB;
  preview uses an object URL revoked on cleanup.

## Temporary shared results (TWZ-SHARE-001)

- Shared result pages are **public-by-link and ephemeral**: viewable by anyone holding the
  crypto-random UUID URL until a short TTL (default 10 min) expires, then gone. Intentional —
  no accounts, no auth by product invariant; the page is `noindex/nofollow` and never identifies
  the user.
- **Never a database**: the shared record lives only in the API's in-memory TTL cache (no DB, file,
  or queue) and may also clear on restart/redeploy. Nothing is persisted.
- **The image is never shared**: the create request reuses the strict `FinalGameResult` contract
  (no file slot) and ingest rejects any `data:`/base64/embedded-image string — no image
  bytes/url/hash/metadata/embeddings can enter the cache, and the page never renders it.
- **No existence oracle**: a missing and an expired share id return the identical safe 404
  (`SHARE_NOT_FOUND`).
- **Server-config link origin**: the `/share/<uuid>` URL is built from `SHARE_RESULT_PUBLIC_BASE_URL`
  (server config only, never user input), so links can't be attacker-shaped or an open redirect. All
  page text is escaped (no `dangerouslySetInnerHTML`).
