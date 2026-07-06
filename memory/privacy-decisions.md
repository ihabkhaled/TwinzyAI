# Privacy Decisions

The product-defining invariants. Rule: [/rules/14-ai-safety.md](../rules/14-ai-safety.md);
policy doc: [/docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md).

- **No persistence, by design**: no database, cache, queue, or file storage anywhere
  ([database-decisions.md](./database-decisions.md)). Nothing survives the request.
- **Images**: processed in memory, sent to exactly one AI call (trait extraction), zero-filled
  in `finally` on success AND failure. Never written to disk, logged, cached, persisted, or
  returned. The `@fastify/multipart` pipeline keeps parsing in memory — no temp files.
- **Structural enforcement**: the AI provider port splits the image-capable method from the
  text-only methods — only the trait-extraction call can receive an image; candidate
  generation and judging are text-only **by interface shape**, not by convention
  ([ai-safety-decisions.md](./ai-safety-decisions.md)).
- **Never**: face recognition, identity matching, biometric anything (no embeddings, no
  templates), image storage, image URLs, analytics on photos. Not revisitable by ADR
  ([database-decisions.md](./database-decisions.md) Decision 3).
- Traits are 15 **visible, non-identifying** style/vibe attributes as text; trait text and
  results are transient per-request and never stored server-side.
- No accounts; the game is free — **never add payment logic** (payments would create identity
  and financial data).
- Logs carry identifiers and outcomes only — nothing derived from the image is loggable
  ([observability-decisions.md](./observability-decisions.md)).
- Frontend (web workstream): the image never enters localStorage/sessionStorage/IndexedDB;
  preview uses an object URL revoked on cleanup.
